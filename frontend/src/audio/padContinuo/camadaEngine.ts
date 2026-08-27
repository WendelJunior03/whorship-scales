import { getAudioContext } from '../audioContext';

/**
 * Uma "voz" tocando nessa camada — uma nota específica, do início ao fim (inclusive o
 * fade de saída). Cadeia: fonte → filtro (cutoff da voz) → envelope (fade de entrada/
 * saída) → `ganhoEfetivo` da camada (persistente, compartilhado entre vozes).
 *
 * Por que "voz" e não um nó fixo por camada: ao trocar de nota (D-06.6 revisado — nota
 * agora é global, mas cada camada ainda é monofônica dentro de si), a nota antiga precisa
 * desaparecer com fade de saída ENQUANTO a nova already sobe com fade de entrada — as
 * duas tocando ao mesmo tempo por um instante (crossfade de verdade). Se as duas notas
 * dividissem o mesmo `GainNode`, uma rampa cancelaria a outra. Cada voz tem seu próprio
 * filtro+envelope; a antiga se desliga sozinha (com o próprio fade) sem afetar a nova.
 */
interface Voz {
  filtro: BiquadFilterNode;
  envelope: GainNode;
  fontesAtivas: AudioBufferSourceNode[];
  agendadorId: ReturnType<typeof setInterval> | null;
}

/** Nós persistentes de UMA camada — sobrevivem entre notas (a voz é que é efêmera). */
export interface NodosCamada {
  ganhoEfetivo: GainNode;
  /** Cutoff normalizado (0-1), lembrado pra aplicar em toda voz nova que nascer. */
  cutoffAtual: number;
  vozAtual: Voz | null;
}

const FADE_ENTRADA_SEGUNDOS = 5;
const FADE_SAIDA_SEGUNDOS = 1.2;

// Loop com crossfade: em vez do `.loop = true` nativo (que só reinicia, sem disfarçar
// descompasso de forma de onda na emenda), cada repetição é uma instância própria, que
// começa um pouco ANTES da anterior terminar.
const DURACAO_CROSSFADE_SEGUNDOS = 1;
const JANELA_AGENDAMENTO_SEGUNDOS = 2;
const INTERVALO_VERIFICACAO_MS = 500;

// Cutoff normalizado (0-1) → Hz, escala logarítmica (sensação de "brilho" mais natural
// que linear). 1 = totalmente aberto (sem filtragem audível).
const CUTOFF_HZ_MIN = 200;
const CUTOFF_HZ_MAX = 20000;

export function cutoffNormalizadoParaHz(normalizado: number): number {
  const n = Math.min(1, Math.max(0, normalizado));
  return CUTOFF_HZ_MIN * Math.pow(CUTOFF_HZ_MAX / CUTOFF_HZ_MIN, n);
}

export function criarNodosCamada(destino: AudioNode): NodosCamada {
  const ganhoEfetivo = getAudioContext().createGain();
  ganhoEfetivo.connect(destino);
  return { ganhoEfetivo, cutoffAtual: 1, vozAtual: null };
}

function criarVoz(nodos: NodosCamada): Voz {
  const ctx = getAudioContext();
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = cutoffNormalizadoParaHz(nodos.cutoffAtual);

  const envelope = ctx.createGain();
  envelope.gain.value = 0;

  filtro.connect(envelope);
  envelope.connect(nodos.ganhoEfetivo);

  return { filtro, envelope, fontesAtivas: [], agendadorId: null };
}

function agendarInstancia(voz: Voz, buffer: AudioBuffer, tempoDeInicio: number) {
  const ctx = getAudioContext();
  const duracaoBuffer = buffer.duration;

  const fonte = ctx.createBufferSource();
  fonte.buffer = buffer;

  // Envelope da PRÓPRIA instância (sobe, segura, desce) — a sobreposição entre
  // instâncias vizinhas é o que faz o crossfade da emenda do loop.
  const envelopeInstancia = ctx.createGain();
  envelopeInstancia.gain.setValueAtTime(0, tempoDeInicio);
  envelopeInstancia.gain.linearRampToValueAtTime(1, tempoDeInicio + DURACAO_CROSSFADE_SEGUNDOS);
  envelopeInstancia.gain.setValueAtTime(1, tempoDeInicio + duracaoBuffer - DURACAO_CROSSFADE_SEGUNDOS);
  envelopeInstancia.gain.linearRampToValueAtTime(0, tempoDeInicio + duracaoBuffer);

  fonte.connect(envelopeInstancia);
  envelopeInstancia.connect(voz.filtro);
  fonte.start(tempoDeInicio);
  fonte.stop(tempoDeInicio + duracaoBuffer);

  voz.fontesAtivas.push(fonte);
  fonte.onended = () => {
    voz.fontesAtivas = voz.fontesAtivas.filter((f) => f !== fonte);
  };
}

function iniciarLoopComCrossfade(voz: Voz, buffer: AudioBuffer, tempoInicio: number): ReturnType<typeof setInterval> {
  const periodo = buffer.duration - DURACAO_CROSSFADE_SEGUNDOS;
  let proximaRepeticao = 0;

  function agendarProximas() {
    const ctx = getAudioContext();
    const limite = ctx.currentTime + JANELA_AGENDAMENTO_SEGUNDOS;
    while (tempoInicio + proximaRepeticao * periodo <= limite) {
      agendarInstancia(voz, buffer, tempoInicio + proximaRepeticao * periodo);
      proximaRepeticao++;
    }
  }

  agendarProximas();
  return setInterval(agendarProximas, INTERVALO_VERIFICACAO_MS);
}

/** Desliga uma voz com fade de saída — some sozinha, sem afetar nenhuma outra voz. */
function desligarVoz(voz: Voz) {
  const ctx = getAudioContext();

  if (voz.agendadorId !== null) {
    clearInterval(voz.agendadorId);
    voz.agendadorId = null;
  }

  voz.envelope.gain.cancelScheduledValues(ctx.currentTime);
  voz.envelope.gain.setValueAtTime(voz.envelope.gain.value, ctx.currentTime);
  voz.envelope.gain.linearRampToValueAtTime(0, ctx.currentTime + FADE_SAIDA_SEGUNDOS);

  const tempoParada = ctx.currentTime + FADE_SAIDA_SEGUNDOS;
  voz.fontesAtivas.forEach((f) => f.stop(tempoParada));
  voz.fontesAtivas = [];

  // Desconecta só depois que o fade termina de verdade — desconectar na hora cortaria
  // a rampa que acabou de ser agendada.
  setTimeout(
    () => {
      try {
        voz.envelope.disconnect();
        voz.filtro.disconnect();
      } catch {
        // já desconectado — sem problema
      }
    },
    FADE_SAIDA_SEGUNDOS * 1000 + 100,
  );
}

/**
 * Começa a tocar `buffer` em loop nessa camada, com fade de entrada. Se já tinha uma
 * nota tocando ali, ela ganha sua PRÓPRIA voz de saída (fade some sozinho) — as duas
 * ficam audíveis ao mesmo tempo durante a transição (crossfade de verdade entre notas).
 */
export function tocarNaCamada(nodos: NodosCamada, buffer: AudioBuffer) {
  const ctx = getAudioContext();

  if (nodos.vozAtual) {
    desligarVoz(nodos.vozAtual);
  }

  const voz = criarVoz(nodos);
  voz.envelope.gain.setValueAtTime(0, ctx.currentTime);
  voz.envelope.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE_ENTRADA_SEGUNDOS);
  voz.agendadorId = iniciarLoopComCrossfade(voz, buffer, ctx.currentTime);

  nodos.vozAtual = voz;
}

/** Para a voz ativa dessa camada, com fade de saída. */
export function pararCamada(nodos: NodosCamada) {
  if (!nodos.vozAtual) return;
  desligarVoz(nodos.vozAtual);
  nodos.vozAtual = null;
}

/** Cutoff (0-1) da camada — aplicado direto na voz atual (se tiver uma tocando). */
export function definirCutoff(nodos: NodosCamada, normalizado: number) {
  nodos.cutoffAtual = normalizado;
  if (nodos.vozAtual) {
    nodos.vozAtual.filtro.frequency.value = cutoffNormalizadoParaHz(normalizado);
  }
}

/** Ganho efetivo (volume já considerando mute/solo) — pequena rampa evita "zipper noise". */
export function definirGanhoEfetivo(nodos: NodosCamada, valor: number) {
  const ctx = getAudioContext();
  nodos.ganhoEfetivo.gain.cancelScheduledValues(ctx.currentTime);
  nodos.ganhoEfetivo.gain.linearRampToValueAtTime(valor, ctx.currentTime + 0.05);
}
