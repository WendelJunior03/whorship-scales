import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { PitchDetector } from 'pitchy';

/**
 * Afinador via microfone (spec 09). Web-first: usa getUserMedia + Web Audio API +
 * pitchy (McLeod). No nativo, retorna 'indisponivel' (fase posterior).
 *
 * Suaviza a leitura com mediana móvel e só aceita pitch com clareza alta — evita a
 * nota "tremer" (T-09.2). Referência de conversão fica em utils/notas.ts.
 */
export type EstadoAfinador =
  | 'inativo'
  | 'pedindo'
  | 'ativo'
  | 'negado'
  | 'indisponivel'
  | 'erro';

// Tipos mínimos do Web Audio (o tsconfig não inclui a lib "dom"; só declaramos o que usamos).
type Track = { stop(): void };
type MediaStreamLike = { getTracks(): Track[] };
type AnalyserLike = { fftSize: number; getFloatTimeDomainData(buffer: Float32Array): void };
type SourceLike = { connect(destino: AnalyserLike): void };
type AudioContextLike = {
  sampleRate: number;
  createMediaStreamSource(stream: MediaStreamLike): SourceLike;
  createAnalyser(): AnalyserLike;
  close(): void;
};
type AudioContextCtor = new () => AudioContextLike;

interface GlobalWeb {
  AudioContext?: AudioContextCtor;
  webkitAudioContext?: AudioContextCtor;
  navigator?: { mediaDevices?: { getUserMedia(constraints: { audio: unknown }): Promise<MediaStreamLike> } };
  requestAnimationFrame(cb: () => void): number;
  cancelAnimationFrame(id: number): void;
}

interface RefsAudio {
  stream?: MediaStreamLike;
  audioContext?: AudioContextLike;
  analyser?: AnalyserLike;
  detector?: PitchDetector<Float32Array>;
  buffer?: Float32Array;
  rafId?: number;
}

const CLAREZA_MINIMA = 0.9;
const FREQ_MIN = 30;
const FREQ_MAX = 1500;
const JANELA_MEDIANA = 8;

export function useAfinador() {
  const [estado, setEstado] = useState<EstadoAfinador>('inativo');
  const [freq, setFreq] = useState<number | null>(null);

  const ref = useRef<RefsAudio>({});
  const historico = useRef<number[]>([]);

  const parar = useCallback(() => {
    const g = globalThis as unknown as GlobalWeb;
    const r = ref.current;
    if (r.rafId) {
      g.cancelAnimationFrame?.(r.rafId);
    }
    r.stream?.getTracks().forEach((t) => t.stop());
    r.audioContext?.close();
    ref.current = {};
    historico.current = [];
    setFreq(null);
    setEstado('inativo');
  }, []);

  const iniciar = useCallback(async () => {
    if (Platform.OS !== 'web') {
      setEstado('indisponivel');
      return;
    }
    const g = globalThis as unknown as GlobalWeb;
    const AudioCtx = g.AudioContext ?? g.webkitAudioContext;
    if (!AudioCtx || !g.navigator?.mediaDevices?.getUserMedia) {
      setEstado('indisponivel');
      return;
    }

    setEstado('pedindo');
    try {
      // Desliga processamentos que distorcem o pitch (AGC/ruído).
      const stream = await g.navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const audioContext = new AudioCtx();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const detector = PitchDetector.forFloat32Array(analyser.fftSize);
      const buffer = new Float32Array(detector.inputLength);
      ref.current = { stream, audioContext, analyser, detector, buffer, rafId: 0 };
      setEstado('ativo');

      const loop = () => {
        const r = ref.current;
        if (!r.analyser || !r.detector || !r.buffer || !r.audioContext) {
          return;
        }
        r.analyser.getFloatTimeDomainData(r.buffer);
        const [pitch, clareza] = r.detector.findPitch(r.buffer, r.audioContext.sampleRate);
        if (clareza > CLAREZA_MINIMA && pitch > FREQ_MIN && pitch < FREQ_MAX) {
          const hist = historico.current;
          hist.push(pitch);
          if (hist.length > JANELA_MEDIANA) {
            hist.shift();
          }
          const ordenado = [...hist].sort((a, b) => a - b);
          setFreq(ordenado[Math.floor(ordenado.length / 2)]);
        }
        r.rafId = g.requestAnimationFrame(loop);
      };
      ref.current.rafId = g.requestAnimationFrame(loop);
    } catch (e) {
      const nome = (e as { name?: string })?.name;
      setEstado(nome === 'NotAllowedError' || nome === 'PermissionDeniedError' ? 'negado' : 'erro');
    }
  }, []);

  // Encerra o microfone ao desmontar a tela.
  useEffect(() => () => parar(), [parar]);

  return { estado, freq, iniciar, parar };
}
