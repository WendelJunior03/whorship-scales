import { getAudioContext } from '../audioContext';

/**
 * Nós persistentes de UMA camada. Cadeia: fonte → filtro (cutoff) → envelopeNota (fade
 * de entrada/saída ao ligar/desligar a nota) → ganhoEfetivo (volume final, já
 * considerando mute/solo — recalculado externamente por `index.ts`) → bus master.
 *
 * `envelopeNota` e `ganhoEfetivo` são dois `GainNode`s separados (não um só) de propósito:
 * o primeiro só muda quando o usuário liga/desliga uma nota (rampa de alguns segundos); o
 * segundo muda toda vez que volume/mute/solo de QUALQUER camada muda. Misturar os dois
 * concerns num nó só faria uma coisa cancelar a rampa da outra.
 */
export interface NodosCamada {
  filtro: BiquadFilterNode;
  envelopeNota: GainNode;
  ganhoEfetivo: GainNode;
  fontesAtivas: AudioBufferSourceNode[];
  agendadorId: ReturnType<typeof setInterval> | null;
}

const FADE_ENTRADA_SEGUNDOS = 5;
const FADE_SAIDA_SEGUNDOS = 1.2;

// Loop com crossfade: em vez do `.loop = true` nativo (que só reinicia, sem disfarçar
// descompasso de forma de onda na emenda), cada repetição é uma instância própria, que
// começa um pouco ANTES da anterior terminar — mesma técnica já usada no Pad Contínuo de
// 1 camada, agora com um agendador independente por camada.
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
  const ctx = getAudioContext();
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = CUTOFF_HZ_MAX; // aberto por padrão

  const envelopeNota = ctx.createGain();
  envelopeNota.gain.value = 0; // sem nota ativa ainda

  const ganhoEfetivo = ctx.createGain();

  filtro.connect(envelopeNota);
  envelopeNota.connect(ganhoEfetivo);
  ganhoEfetivo.connect(destino);

  return { filtro, envelopeNota, ganhoEfetivo, fontesAtivas: [], agendadorId: null };
}

function agendarInstancia(nodos: NodosCamada, buffer: AudioBuffer, tempoDeInicio: number) {
  const ctx = getAudioContext();
  const duracaoBuffer = buffer.duration;

  const fonte = ctx.createBufferSource();
  fonte.buffer = buffer;

  // Envelope da PRÓPRIA instância (sobe, segura, desce) — a sobreposição entre
  // instâncias vizinhas é o que faz o crossfade.
  const envelopeInstancia = ctx.createGain();
  envelopeInstancia.gain.setValueAtTime(0, tempoDeInicio);
  envelopeInstancia.gain.linearRampToValueAtTime(1, tempoDeInicio + DURACAO_CROSSFADE_SEGUNDOS);
  envelopeInstancia.gain.setValueAtTime(1, tempoDeInicio + duracaoBuffer - DURACAO_CROSSFADE_SEGUNDOS);
  envelopeInstancia.gain.linearRampToValueAtTime(0, tempoDeInicio + duracaoBuffer);

  fonte.connect(envelopeInstancia);
  envelopeInstancia.connect(nodos.filtro);
  fonte.start(tempoDeInicio);
  fonte.stop(tempoDeInicio + duracaoBuffer);

  nodos.fontesAtivas.push(fonte);
  fonte.onended = () => {
    nodos.fontesAtivas = nodos.fontesAtivas.filter((f) => f !== fonte);
  };
}

function iniciarLoopComCrossfade(
  nodos: NodosCamada,
  buffer: AudioBuffer,
  tempoInicio: number,
): ReturnType<typeof setInterval> {
  const periodo = buffer.duration - DURACAO_CROSSFADE_SEGUNDOS;
  let proximaRepeticao = 0;

  function agendarProximas() {
    const ctx = getAudioContext();
    const limite = ctx.currentTime + JANELA_AGENDAMENTO_SEGUNDOS;
    while (tempoInicio + proximaRepeticao * periodo <= limite) {
      agendarInstancia(nodos, buffer, tempoInicio + proximaRepeticao * periodo);
      proximaRepeticao++;
    }
  }

  agendarProximas();
  return setInterval(agendarProximas, INTERVALO_VERIFICACAO_MS);
}

/** Começa a tocar `buffer` em loop nessa camada, com fade de entrada. Para qualquer nota já tocando ali antes. */
export function tocarNaCamada(nodos: NodosCamada, buffer: AudioBuffer) {
  const ctx = getAudioContext();

  if (nodos.agendadorId !== null) {
    clearInterval(nodos.agendadorId);
  }
  nodos.fontesAtivas.forEach((f) => f.stop());
  nodos.fontesAtivas = [];

  nodos.envelopeNota.gain.cancelScheduledValues(ctx.currentTime);
  nodos.envelopeNota.gain.setValueAtTime(0, ctx.currentTime);
  nodos.envelopeNota.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE_ENTRADA_SEGUNDOS);

  const tempoInicio = ctx.currentTime;
  nodos.agendadorId = iniciarLoopComCrossfade(nodos, buffer, tempoInicio);
}

/** Para a nota ativa dessa camada, com fade de saída. */
export function pararCamada(nodos: NodosCamada) {
  if (nodos.fontesAtivas.length === 0 && nodos.agendadorId === null) return;

  if (nodos.agendadorId !== null) {
    clearInterval(nodos.agendadorId);
    nodos.agendadorId = null;
  }

  const ctx = getAudioContext();
  nodos.envelopeNota.gain.cancelScheduledValues(ctx.currentTime);
  nodos.envelopeNota.gain.setValueAtTime(nodos.envelopeNota.gain.value, ctx.currentTime);
  nodos.envelopeNota.gain.linearRampToValueAtTime(0, ctx.currentTime + FADE_SAIDA_SEGUNDOS);

  const tempoParada = ctx.currentTime + FADE_SAIDA_SEGUNDOS;
  nodos.fontesAtivas.forEach((f) => f.stop(tempoParada));
  nodos.fontesAtivas = [];
}

/** Cutoff (0-1) da camada — aplicado direto, sem rampa (movimento de knob é contínuo). */
export function definirCutoff(nodos: NodosCamada, normalizado: number) {
  nodos.filtro.frequency.value = cutoffNormalizadoParaHz(normalizado);
}

/** Ganho efetivo (volume já considerando mute/solo) — pequena rampa evita "zipper noise". */
export function definirGanhoEfetivo(nodos: NodosCamada, valor: number) {
  const ctx = getAudioContext();
  nodos.ganhoEfetivo.gain.cancelScheduledValues(ctx.currentTime);
  nodos.ganhoEfetivo.gain.linearRampToValueAtTime(valor, ctx.currentTime + 0.05);
}
