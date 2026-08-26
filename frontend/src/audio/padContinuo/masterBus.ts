import { getAudioContext } from '../audioContext';

let entradaMaster: GainNode | undefined;
let limiter: DynamicsCompressorNode | undefined;

/**
 * Limiter de segurança — sempre ativo, não é um controle de usuário. Evita clipping
 * quando várias camadas tocam juntas no volume máximo (D-06.6). Parâmetros são um ponto
 * de partida razoável pra um limiter (ataque rápido, release curto, ratio alto); ajustar
 * por ouvido com as 6 camadas reais, não é um valor exato exigido pela spec.
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

/** Entrada do bus master — todas as camadas conectam aqui (soma única antes do limiter). */
export function obterEntradaMaster(): GainNode {
  if (!entradaMaster) {
    entradaMaster = getAudioContext().createGain();
    entradaMaster.connect(obterLimiter());
  }
  return entradaMaster;
}

export function definirVolumeMaster(valor: number) {
  obterEntradaMaster().gain.value = valor;
}
