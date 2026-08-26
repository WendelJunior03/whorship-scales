import {
  criarNodosCamada,
  tocarNaCamada,
  pararCamada as pararNaCamada,
  definirCutoff as definirCutoffDoGrafo,
  definirGanhoEfetivo,
  NodosCamada,
} from './camadaEngine';
import {
  obterEntradaMaster,
  definirVolumeMaster as definirVolumeDoMasterBus,
  definirCutoffMaster as definirCutoffDoMasterBus,
  definirLoFilterMaster as definirLoFilterDoMasterBus,
} from './masterBus';
import { carregar } from './carregador';
import { definicaoDaCamada } from './catalogo';
import { CamadaId, Note } from './tipos';

export * from './tipos';
export { CAMADAS, camadasDisponiveis, definicaoDaCamada } from './catalogo';
export { jaCarregado } from './carregador';

/**
 * API pública do motor do Pad Contínuo. O estado de controle (nota ativa, volume,
 * cutoff, mute, solo) mora no hook (`usePadContinuo`), não aqui — este módulo só
 * conhece os nós de áudio e aplica o que o hook manda. Padrão "controller-mediated":
 * a tela nunca importa nada daqui direto, só via hook.
 */

const nodosPorCamada = new Map<CamadaId, NodosCamada>();

function garantirNodos(camada: CamadaId): NodosCamada {
  let nodos = nodosPorCamada.get(camada);
  if (!nodos) {
    nodos = criarNodosCamada(obterEntradaMaster());
    // Nasce já no volume padrão da camada (catálogo) — sem isso, o `GainNode` recém-criado
    // ficaria no default do Web Audio (1.0) até a primeira chamada de `recalcularGanhos`,
    // uma janela onde a camada tocaria mais alto que o esperado.
    nodos.ganhoEfetivo.gain.value = definicaoDaCamada(camada).volumePadrao;
    nodosPorCamada.set(camada, nodos);
  }
  return nodos;
}

/**
 * Busca (lazy — só se ainda não estiver em cache) e toca a nota na camada. Lança se o
 * arquivo não existir (o hook decide como tratar: manter a camada desligada, avisar etc).
 */
export async function tocar(camada: CamadaId, nota: Note): Promise<void> {
  const buffer = await carregar(camada, nota);
  tocarNaCamada(garantirNodos(camada), buffer);
}

export function pararCamada(camada: CamadaId): void {
  const nodos = nodosPorCamada.get(camada);
  if (nodos) pararNaCamada(nodos);
}

export function pararTodasAsCamadas(camadas: CamadaId[]): void {
  camadas.forEach(pararCamada);
}

export function definirCutoffDaCamada(camada: CamadaId, normalizado: number): void {
  definirCutoffDoGrafo(garantirNodos(camada), normalizado);
}

interface EstadoParaGanho {
  volume: number;
  mudo: boolean;
  solo: boolean;
}

/**
 * Recalcula e aplica o ganho efetivo de TODAS as camadas informadas. Precisa do
 * conjunto inteiro (não só a camada que mudou) porque solo é uma regra GLOBAL entre
 * camadas — se qualquer uma está em solo, todas as não-soloadas ficam mudas (D-06.6).
 * Chamar sempre que volume/mute/solo de qualquer camada mudar.
 */
export function recalcularGanhos(estados: Partial<Record<CamadaId, EstadoParaGanho>>): void {
  const algumSolo = Object.values(estados).some((estado) => estado?.solo);
  for (const [camada, estado] of Object.entries(estados) as [CamadaId, EstadoParaGanho | undefined][]) {
    if (!estado) continue;
    const efetivo = estado.mudo || (algumSolo && !estado.solo) ? 0 : estado.volume;
    definirGanhoEfetivo(garantirNodos(camada), efetivo);
  }
}

export function definirVolumeMaster(valor: number): void {
  definirVolumeDoMasterBus(valor);
}

export function definirCutoffMaster(valor: number): void {
  definirCutoffDoMasterBus(valor);
}

export function definirLoFilterMaster(valor: number): void {
  definirLoFilterDoMasterBus(valor);
}
