/**
 * Motor de áudio reutilizável (specs 05 Octapad e 06 Banco de Pads). Web-first:
 * Web Audio API puro — `AudioBuffer` pré-decodificado + `start()` para latência mínima
 * (D-05.2). Abstraído atrás da interface `MotorAudio` pra receber implementação nativa
 * depois (D-05.1). No nativo v1, `audioSuportado()` é false e a tela degrada.
 *
 * Tipos mínimos do Web Audio declarados localmente (o tsconfig não inclui a lib "dom";
 * declaramos só o que usamos, sem `any`).
 */

export interface BufferAudio {
  getChannelData(canal: number): Float32Array;
  length: number;
  sampleRate: number;
}
interface GainLike {
  gain: { value: number };
  connect(destino: unknown): void;
}
interface SourceLike {
  buffer: BufferAudio | null;
  connect(destino: GainLike): void;
  start(quando?: number): void;
}
export interface ContextoAudio {
  readonly state: string;
  readonly sampleRate: number;
  readonly currentTime: number;
  readonly destination: unknown;
  resume(): Promise<void>;
  close(): Promise<void>;
  createBuffer(canais: number, tamanho: number, sampleRate: number): BufferAudio;
  createBufferSource(): SourceLike;
  createGain(): GainLike;
}
type ContextoCtor = new () => ContextoAudio;
interface GlobalAudio {
  AudioContext?: ContextoCtor;
  webkitAudioContext?: ContextoCtor;
}

/** Uma amostra tocável: um id e como renderizar seu buffer (sintetizado ou, no futuro, decodificado de um arquivo). */
export interface Amostra {
  id: string;
  render: (ctx: ContextoAudio) => BufferAudio;
}

export interface MotorAudio {
  /** Cria/retoma o AudioContext. DEVE ser chamado dentro de um gesto do usuário (iOS). */
  iniciar(): Promise<void>;
  /** Registra as amostras (renderiza os buffers assim que houver contexto). */
  carregar(amostras: Amostra[]): void;
  /** Dispara uma amostra já carregada (latência mínima). */
  tocar(id: string, volume?: number): void;
  encerrar(): void;
}

export function audioSuportado(): boolean {
  const g = globalThis as unknown as GlobalAudio;
  return typeof (g.AudioContext ?? g.webkitAudioContext) !== 'undefined';
}

export function criarMotorWeb(): MotorAudio {
  let ctx: ContextoAudio | null = null;
  const buffers = new Map<string, BufferAudio>();
  let pendentes: Amostra[] = [];

  const renderizar = (amostras: Amostra[]) => {
    if (!ctx) {
      return;
    }
    for (const a of amostras) {
      buffers.set(a.id, a.render(ctx));
    }
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
      if (pendentes.length > 0) {
        renderizar(pendentes);
        pendentes = [];
      }
    },
    carregar(amostras) {
      if (ctx) {
        renderizar(amostras);
      } else {
        pendentes = amostras;
      }
    },
    tocar(id, volume = 1) {
      if (!ctx) {
        return;
      }
      const buffer = buffers.get(id);
      if (!buffer) {
        return;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
    },
    encerrar() {
      ctx?.close();
      ctx = null;
      buffers.clear();
      pendentes = [];
    },
  };
}
