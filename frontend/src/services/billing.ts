import { api } from './api';

export interface PlanoInfo {
  plano: 'free' | 'pro';
  status: string | null;
  ciclo: 'mensal' | 'anual' | null;
  expiraEm: string | null;
  temAssinatura: boolean;
  billingConfigurado: boolean;
}

/** Estado do plano da organização (pra tela "Meu plano"). */
export async function getPlano(): Promise<PlanoInfo> {
  const { data } = await api.get<PlanoInfo>('/billing');
  return data;
}

/** Inicia a assinatura PRO e devolve a URL do Checkout do Stripe (pra redirecionar). */
export async function iniciarCheckout(ciclo: 'mensal' | 'anual'): Promise<string> {
  const { data } = await api.post<{ url: string }>('/billing/checkout', { ciclo });
  return data.url;
}

/** Abre o Portal de Cobrança (gerenciar/cancelar) e devolve a URL. */
export async function abrirPortal(): Promise<string> {
  const { data } = await api.post<{ url: string }>('/billing/portal', {});
  return data.url;
}
