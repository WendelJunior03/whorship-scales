/**
 * Engine do metrônomo (spec 10). Web Audio scheduling com lookahead ("A Tale of Two
 * Clocks", D-10.2): agenda cada clique à frente no relógio do AudioContext pra manter a
 * batida estável (sem derivar como `setInterval` puro). Timbres sintetizados por oscilador
 * (D-10.5), com acento no tempo 1 e subdivisões. Web-first; no nativo, `audioSuportado()`
 * é false e a tela degrada.
 *
 * Tipos mínimos do Web Audio declarados localmente (tsconfig sem a lib "dom"; sem `any`).
 */

type ParamLike = {
  value: number;
  setValueAtTime(valor: number, tempo: number): void;
  exponentialRampToValueAtTime(valor: number, tempo: number): void;
};
interface OscLike {
  type: string;
  frequency: { value: number };
  connect(destino: unknown): void;
  start(tempo: number): void;
  stop(tempo: number): void;
}
interface GainLike {
  gain: ParamLike;
  connect(destino: unknown): void;
}
interface CtxLike {
  readonly currentTime: number;
  readonly state: string;
  readonly destination: unknown;
  resume(): Promise<void>;
  close(): Promise<void>;
  createOscillator(): OscLike;
  createGain(): GainLike;
}
type CtxCtor = new () => CtxLike;
interface GlobalAudio {
  AudioContext?: CtxCtor;
  webkitAudioContext?: CtxCtor;
}

export interface Timbre {
  id: string;
  nome: string;
  onda: 'sine' | 'square' | 'triangle';
  /** Frequências (Hz) do acento (tempo 1), do tempo principal e da subdivisão. */
  acento: number;
  principal: number;
  sub: number;
}

export const TIMBRES: Timbre[] = [
  { id: 'classico', nome: 'Clássico', onda: 'sine', acento: 1500, principal: 1000, sub: 800 },
  { id: 'woodblock', nome: 'Woodblock', onda: 'triangle', acento: 1200, principal: 880, sub: 660 },
  { id: 'bip', nome: 'Bip', onda: 'square', acento: 2000, principal: 1500, sub: 1200 },
];

export interface ConfigMetronomo {
  bpm: number;
  compasso: number; // tempos por compasso (acento no tempo 1)
  subdivisao: number; // 1 semínima, 2 colcheias, 3 tercinas, 4 semicolcheias
  volume: number; // 0..1
  timbre: Timbre;
}

export interface NotaVisual {
  beat: number;
  sub: number;
  acento: boolean;
}

export interface Metronomo {
  iniciar(): Promise<void>;
  parar(): void;
  /** Atualiza a config em tempo real (bpm/volume/timbre etc. valem no próximo clique). */
  atualizar(parcial: Partial<ConfigMetronomo>): void;
  /** Nota que acabou de soar (pra sincronizar o visual). Chamar a cada frame. */
  estadoVisual(): NotaVisual | null;
  encerrar(): void;
}

export function audioSuportado(): boolean {
  const g = globalThis as unknown as GlobalAudio;
  return typeof (g.AudioContext ?? g.webkitAudioContext) !== 'undefined';
}

const LOOKAHEAD_MS = 25;
const AGENDA_S = 0.12;

export function criarMetronomo(inicial: ConfigMetronomo): Metronomo {
  const cfg: ConfigMetronomo = { ...inicial };
  let ctx: CtxLike | null = null;
  let intervalo: number | null = null;
  let beat = 0;
  let sub = 0;
  let proximaNota = 0;
  const fila: { nota: NotaVisual; tempo: number }[] = [];

  const segundosPorNota = () => 60 / cfg.bpm / cfg.subdivisao;

  const agendarNota = (tempo: number) => {
    if (!ctx) {
      return;
    }
    const acento = beat === 0 && sub === 0;
    const principal = sub === 0;
    const freq = acento ? cfg.timbre.acento : principal ? cfg.timbre.principal : cfg.timbre.sub;
    const pico = Math.max(0.0001, cfg.volume * (principal ? 1 : 0.55) * (acento ? 1 : 0.9));

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = cfg.timbre.onda;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(pico, tempo);
    gain.gain.exponentialRampToValueAtTime(0.0001, tempo + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(tempo);
    osc.stop(tempo + 0.06);

    fila.push({ nota: { beat, sub, acento }, tempo });
  };

  const avancar = () => {
    proximaNota += segundosPorNota();
    sub += 1;
    if (sub >= cfg.subdivisao) {
      sub = 0;
      beat = (beat + 1) % cfg.compasso;
    }
  };

  const agendador = () => {
    if (!ctx) {
      return;
    }
    while (proximaNota < ctx.currentTime + AGENDA_S) {
      agendarNota(proximaNota);
      avancar();
    }
  };

  const pararInterno = () => {
    if (intervalo !== null) {
      globalThis.clearInterval(intervalo);
      intervalo = null;
    }
    fila.length = 0;
  };

  return {
    async iniciar() {
      const g = globalThis as unknown as GlobalAudio;
      const Ctor = g.AudioContext ?? g.webkitAudioContext;
      if (!Ctor) {
        return;
      }
      if (!ctx) {
        ctx = new Ctor();
      }
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      beat = 0;
      sub = 0;
      fila.length = 0;
      proximaNota = ctx.currentTime + 0.1;
      if (intervalo === null) {
        intervalo = globalThis.setInterval(agendador, LOOKAHEAD_MS) as unknown as number;
      }
    },
    parar() {
      pararInterno();
    },
    atualizar(parcial) {
      Object.assign(cfg, parcial);
    },
    estadoVisual() {
      if (!ctx) {
        return null;
      }
      let atual: NotaVisual | null = null;
      while (fila.length > 0 && fila[0].tempo <= ctx.currentTime) {
        const item = fila.shift();
        if (item) {
          atual = item.nota;
        }
      }
      return atual;
    },
    encerrar() {
      pararInterno();
      ctx?.close();
      ctx = null;
    },
  };
}
