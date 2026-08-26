import { api } from './api';
import { HistoricoItem } from '@/types';

export async function listarHistorico(cultoId: number): Promise<HistoricoItem[]> {
  const { data } = await api.get<HistoricoItem[]>(`/historico/culto/${cultoId}`);
  return data;
}
