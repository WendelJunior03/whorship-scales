import { PlanoOrg } from '@/types';

/**
 * Espelho (parcial) do catálogo de recursos do backend (spec 03). O backend é a
 * FONTE DA VERDADE (barra com 403); aqui é só pra UX — esconder/mostrar e exibir
 * o selo "PRO" / CTA de upgrade. Mantenha em sincronia com backend/src/config/recursos.ts.
 */

interface RecursoPlano {
  planoMinimo: PlanoOrg;
  flagAtiva: boolean;
}

/** Enquanto true, o gating POR PLANO fica dormente (v1 libera tudo). Espelha o backend. */
export const LIBERAR_TUDO_V1 = true;

const ordemPlanos: Record<PlanoOrg, number> = { free: 0, pro: 1 };

export const recursos: Record<string, RecursoPlano> = {
  'offline.download': { planoMinimo: 'pro', flagAtiva: true },
  'pads.pack_premium': { planoMinimo: 'pro', flagAtiva: true },
  'biblioteca.premium': { planoMinimo: 'pro', flagAtiva: true },
  'samples.upload': { planoMinimo: 'pro', flagAtiva: true },
  'afinador.avancado': { planoMinimo: 'pro', flagAtiva: true },
  'playlists': { planoMinimo: 'pro', flagAtiva: true },
  'estatisticas': { planoMinimo: 'pro', flagAtiva: true },
  'lideranca.recursos_avancados': { planoMinimo: 'pro', flagAtiva: true },
  'conteudos.exclusivos': { planoMinimo: 'pro', flagAtiva: true },
  'videos.playlist': { planoMinimo: 'pro', flagAtiva: true },
  'videos.upload': { planoMinimo: 'pro', flagAtiva: true },
  'videos.privado': { planoMinimo: 'pro', flagAtiva: true },
  // Ainda não lançado (flag desligada) — some da UI mesmo em quem teria plano.
  'backup.automatico': { planoMinimo: 'pro', flagAtiva: false },
};

function planoAtendeMinimo(plano: PlanoOrg, minimo: PlanoOrg): boolean {
  return ordemPlanos[plano] >= ordemPlanos[minimo];
}

function planoPermite(plano: PlanoOrg, minimo: PlanoOrg): boolean {
  return LIBERAR_TUDO_V1 || planoAtendeMinimo(plano, minimo);
}

/** O recurso está acessível pra essa org? (flag ligada E plano permite). */
export function recursoLiberado(plano: PlanoOrg, chave: string): boolean {
  const regra = recursos[chave];
  if (!regra) {
    return false;
  }
  return regra.flagAtiva && planoPermite(plano, regra.planoMinimo);
}

/** O recurso é marcado como PRO? (pra decidir se mostra o selo). */
export function recursoEhPro(chave: string): boolean {
  return recursos[chave]?.planoMinimo === 'pro';
}
