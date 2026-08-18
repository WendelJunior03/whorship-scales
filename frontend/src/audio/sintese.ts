/**
 * Síntese de percussão em AudioBuffer (spec 05, D-05.3). Kit "embarcado" da v1 gerado
 * por código — zero assets, offline. A engine é baseada em buffers, então dá pra trocar
 * por samples reais (arquivos decodificados) na spec 06 sem mudar nada aqui.
 */
import { BufferAudio, ContextoAudio } from './motor';

function criar(ctx: ContextoAudio, dur: number, preencher: (t: number) => number): BufferAudio {
  const sr = ctx.sampleRate;
  const n = Math.floor(sr * dur);
  const buffer = ctx.createBuffer(1, n, sr);
  const dados = buffer.getChannelData(0);
  for (let i = 0; i < n; i++) {
    dados[i] = preencher(i / sr);
  }
  return buffer;
}

const ruido = () => Math.random() * 2 - 1;

// Bumbo: seno com envelope de altura (150→50 Hz) e de amplitude. Fase = integral da freq.
export function bumbo(ctx: ContextoAudio): BufferAudio {
  return criar(ctx, 0.5, (t) => {
    const fase = 2 * Math.PI * (50 * t + 4 * (1 - Math.exp(-25 * t)));
    return Math.sin(fase) * Math.exp(-6 * t) * 0.9;
  });
}

// Caixa: ruído + um tom curto.
export function caixa(ctx: ContextoAudio): BufferAudio {
  return criar(ctx, 0.2, (t) => {
    const n = ruido() * Math.exp(-22 * t);
    const tom = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-30 * t);
    return (n * 0.7 + tom * 0.3) * 0.9;
  });
}

// Chimbal fechado: ruído com decaimento bem rápido.
export function chimbal(ctx: ContextoAudio): BufferAudio {
  return criar(ctx, 0.05, (t) => ruido() * Math.exp(-60 * t) * 0.5);
}

// Chimbal aberto: ruído com cauda maior.
export function chimbalAberto(ctx: ContextoAudio): BufferAudio {
  return criar(ctx, 0.35, (t) => ruido() * Math.exp(-10 * t) * 0.4);
}

// Tom: seno com envelope de altura (130→90 Hz).
export function tom(ctx: ContextoAudio): BufferAudio {
  return criar(ctx, 0.4, (t) => {
    const fase = 2 * Math.PI * (90 * t + (40 / 12) * (1 - Math.exp(-12 * t)));
    return Math.sin(fase) * Math.exp(-7 * t) * 0.8;
  });
}

// Clap: rajada de ruído com um ataque repicado + cauda.
export function clap(ctx: ContextoAudio): BufferAudio {
  return criar(ctx, 0.2, (t) => {
    const env = t < 0.05 ? Math.exp(-((t % 0.012) * 400)) : Math.exp(-30 * (t - 0.05));
    return ruido() * env * 0.6;
  });
}

// Clave: tom agudo curtíssimo.
export function clave(ctx: ContextoAudio): BufferAudio {
  return criar(ctx, 0.06, (t) => Math.sin(2 * Math.PI * 2500 * t) * Math.exp(-40 * t) * 0.7);
}

// Cowbell: duas ondas quadradas dissonantes com decaimento.
export function cowbell(ctx: ContextoAudio): BufferAudio {
  return criar(ctx, 0.3, (t) => {
    const a = Math.sign(Math.sin(2 * Math.PI * 560 * t));
    const b = Math.sign(Math.sin(2 * Math.PI * 845 * t));
    return (a + b) * 0.5 * Math.exp(-9 * t) * 0.35;
  });
}
