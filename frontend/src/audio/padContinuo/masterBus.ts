import { getAudioContext } from '../audioContext';

let entradaMaster: GainNode | undefined;
let filtroLoMaster: BiquadFilterNode | undefined; // "Lo Filter" — highpass, corta graves
let filtroCutoffMaster: BiquadFilterNode | undefined; // "Cutoff" — lowpass, corta agudos
let limiter: DynamicsCompressorNode | undefined;

// Mesma escala log usada no cutoff por camada (200Hz–20000Hz) — sensação de "brilho"
// mais natural que uma escala linear.
const CUTOFF_HZ_MIN = 200;
const CUTOFF_HZ_MAX = 20000;
// Lo Filter (highpass): 20Hz (aberto, sem corte perceptível) até 800Hz (corte pesado).
const LO_FILTER_HZ_MIN = 20;
const LO_FILTER_HZ_MAX = 800;

function cutoffNormalizadoParaHz(normalizado: number): number {
  const n = Math.min(1, Math.max(0, normalizado));
  return CUTOFF_HZ_MIN * Math.pow(CUTOFF_HZ_MAX / CUTOFF_HZ_MIN, n);
}

function loFilterNormalizadoParaHz(normalizado: number): number {
  const n = Math.min(1, Math.max(0, normalizado));
  return LO_FILTER_HZ_MIN * Math.pow(LO_FILTER_HZ_MAX / LO_FILTER_HZ_MIN, n);
}

/**
 * Limiter de segurança — sempre ativo, não é um controle de usuário. Evita clipping
 * quando várias camadas tocam juntas no volume máximo. Parâmetros são um ponto de
 * partida razoável pra um limiter; ajustar por ouvido com as camadas reais.
 */
function obterLimiter(): DynamicsCompressorNode {
  if (!limiter) {
    const ctx = getAudioContext();
    limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 6;
    limiter.ratio.value = 16;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.1;
    limiter.connect(ctx.destination);
  }
  return limiter;
}

function obterFiltroCutoffMaster(): BiquadFilterNode {
  if (!filtroCutoffMaster) {
    const ctx = getAudioContext();
    filtroCutoffMaster = ctx.createBiquadFilter();
    filtroCutoffMaster.type = 'lowpass';
    filtroCutoffMaster.frequency.value = CUTOFF_HZ_MAX; // aberto por padrão
    filtroCutoffMaster.connect(obterLimiter());
  }
  return filtroCutoffMaster;
}

function obterFiltroLoMaster(): BiquadFilterNode {
  if (!filtroLoMaster) {
    const ctx = getAudioContext();
    filtroLoMaster = ctx.createBiquadFilter();
    filtroLoMaster.type = 'highpass';
    filtroLoMaster.frequency.value = LO_FILTER_HZ_MIN; // aberto por padrão (sem corte)
    filtroLoMaster.connect(obterFiltroCutoffMaster());
  }
  return filtroLoMaster;
}

/** Entrada do bus master — todas as camadas conectam aqui (soma única antes dos filtros/limiter). */
export function obterEntradaMaster(): GainNode {
  if (!entradaMaster) {
    entradaMaster = getAudioContext().createGain();
    entradaMaster.connect(obterFiltroLoMaster());
  }
  return entradaMaster;
}

export function definirVolumeMaster(valor: number) {
  obterEntradaMaster().gain.value = valor;
}

export function definirCutoffMaster(normalizado: number) {
  obterFiltroCutoffMaster().frequency.value = cutoffNormalizadoParaHz(normalizado);
}

export function definirLoFilterMaster(normalizado: number) {
  obterFiltroLoMaster().frequency.value = loFilterNormalizadoParaHz(normalizado);
}
