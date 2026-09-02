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

// === Holyrics (integração por ministério — T-11.33) ===

export interface HolyricsConfig {
  host: string;
  porta: number;
  /** Backend nunca devolve o token em claro; só indica se há um salvo. */
  temToken: boolean;
  ativo: boolean;
}

export async function getHolyrics(ministerioId: number): Promise<HolyricsConfig | null> {
  const { data } = await api.get<HolyricsConfig | null>(`/ministerios/${ministerioId}/holyrics`);
  return data;
}

export async function salvarHolyrics(
  ministerioId: number,
  dados: { host: string; porta: number; token?: string; ativo?: boolean },
): Promise<HolyricsConfig> {
  const { data } = await api.put<HolyricsConfig>(`/ministerios/${ministerioId}/holyrics`, dados);
  return data;
}

export async function removerHolyrics(ministerioId: number): Promise<void> {
  await api.delete(`/ministerios/${ministerioId}/holyrics`);
}

export async function testarHolyrics(ministerioId: number): Promise<{ ok: boolean; message: string }> {
  const { data } = await api.post<{ ok: boolean; message: string }>(
    `/ministerios/${ministerioId}/holyrics/testar`,
  );
  return data;
}

// === Tokens de API (leitura, escopo da org — T-11.33) ===

export interface ApiToken {
  id: number;
  nome: string;
  prefixo: string;
  ministerio_id: number | null;
  ultimo_uso_em: string | null;
  created_at: string;
}

export async function listarApiTokens(): Promise<ApiToken[]> {
  const { data } = await api.get<ApiToken[]>('/api-tokens');
  return data;
}

/** Cria um token; o valor em claro (`token`) só vem NESTA resposta. */
export async function criarApiToken(nome: string): Promise<ApiToken & { token: string }> {
  const { data } = await api.post<ApiToken & { token: string }>('/api-tokens', { nome });
  return data;
}

export async function revogarApiToken(id: number): Promise<void> {
  await api.delete(`/api-tokens/${id}`);
}
