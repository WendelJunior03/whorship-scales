import { api } from './api';

export interface Vinculo {
  provedor: string;
  provedor_uid: string | null;
  email: string | null;
  created_at?: string;
}

export async function getStatus(): Promise<{ google: boolean }> {
  const { data } = await api.get<{ google: boolean }>('/integracoes/status');
  return data;
}

export async function listarVinculos(): Promise<Vinculo[]> {
  const { data } = await api.get<Vinculo[]>('/integracoes');
  return data;
}

/** Login social: troca o code do Google pelo nosso token. */
export async function loginGoogle(code: string): Promise<string> {
  const { data } = await api.post<{ token: string }>('/membros/login-google', { code });
  return data.token;
}

export async function conectarGoogle(code: string): Promise<{ email: string }> {
  const { data } = await api.post<{ email: string }>('/integracoes/google/conectar', { code });
  return data;
}

export async function desconectarGoogle(): Promise<void> {
  await api.delete('/integracoes/google');
}

export async function sincronizarAgenda(): Promise<{ total: number; message: string }> {
  const { data } = await api.post<{ total: number; message: string }>(
    '/integracoes/google/agenda/sincronizar',
  );
  return data;
}
