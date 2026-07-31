import { api } from './api';
import { Notificacao } from '@/types';

/**
 * Todas as notificações do usuário logado, mais recentes primeiro.
 */
export async function getMinhasNotificacoes(): Promise<Notificacao[]> {
  const response = await api.get<Notificacao[]>('/notificacoes/me');
  return response.data;
}

/**
 * Marca uma notificação como lida. Só o dono dela.
 */
export async function marcarComoLida(id: number): Promise<void> {
  await api.put(`/notificacoes/${id}/lida`, {});
}
