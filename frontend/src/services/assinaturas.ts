import { api } from './api';
import { Assinatura, AssinaturasResposta, Ministerio } from '@/types';

export async function getAssinaturas(): Promise<AssinaturasResposta> {
  const { data } = await api.get<AssinaturasResposta>('/assinaturas');
  return data;
}

export async function comprarPacote(vagasTotal: number, ciclo: 'mensal' | 'anual' = 'mensal'): Promise<Assinatura> {
  const { data } = await api.post<Assinatura>('/assinaturas', { vagasTotal, ciclo });
  return data;
}

export async function cancelarAssinatura(id: number): Promise<void> {
  await api.delete(`/assinaturas/${id}`);
}

export async function distribuirVagas(ministerioId: number, vagasExtras: number): Promise<Ministerio> {
  const { data } = await api.put<Ministerio>(`/ministerios/${ministerioId}/vagas`, { vagasExtras });
  return data;
}
