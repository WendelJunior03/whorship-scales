// Integração com o Google OAuth (login + Google Agenda). Web-first: o front usa
// o fluxo de "authorization code" com popup (redirect_uri = 'postmessage'); aqui
// trocamos o código pelos tokens e buscamos o perfil. Credenciais no .env:
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET.

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

export interface TokensGoogle {
  accessToken: string;
  refreshToken: string | null;
  expiraEm: number; // epoch ms
  escopo: string;
}

export interface PerfilGoogle {
  sub: string;
  email: string;
  emailVerificado: boolean;
  nome: string | null;
}

function credenciais() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados.');
  }
  return { clientId, clientSecret };
}

export function googleConfigurado(): boolean {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
}

/** Troca o `code` (fluxo popup) pelos tokens. `redirectUri` = 'postmessage' no web. */
export async function trocarCodigo(code: string, redirectUri: string): Promise<TokensGoogle> {
  const { clientId, clientSecret } = credenciais();
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  });
  if (!resp.ok) {
    throw new Error(`Falha ao trocar código no Google (${resp.status}).`);
  }
  const d = (await resp.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  };
  return {
    accessToken: d.access_token,
    refreshToken: d.refresh_token ?? null,
    expiraEm: Date.now() + d.expires_in * 1000,
    escopo: d.scope,
  };
}

/** Renova o access token a partir do refresh token guardado. */
export async function renovarAccessToken(refreshToken: string): Promise<{ accessToken: string; expiraEm: number }> {
  const { clientId, clientSecret } = credenciais();
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });
  if (!resp.ok) {
    throw new Error(`Falha ao renovar token do Google (${resp.status}).`);
  }
  const d = (await resp.json()) as { access_token: string; expires_in: number };
  return { accessToken: d.access_token, expiraEm: Date.now() + d.expires_in * 1000 };
}

/** Busca o perfil do usuário com o access token. */
export async function buscarPerfil(accessToken: string): Promise<PerfilGoogle> {
  const resp = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!resp.ok) {
    throw new Error(`Falha ao buscar perfil do Google (${resp.status}).`);
  }
  const d = (await resp.json()) as { sub: string; email: string; email_verified?: boolean; name?: string };
  return {
    sub: d.sub,
    email: d.email,
    emailVerificado: d.email_verified ?? false,
    nome: d.name ?? null,
  };
}
