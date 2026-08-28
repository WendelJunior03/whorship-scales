// Helper web-only pro fluxo OAuth do Google (Google Identity Services). Abre um
// popup de consentimento e devolve o "authorization code" que o backend troca por
// tokens. Escopos: identidade (login) + Google Agenda (calendar.events).

const ESCOPO = 'openid email profile https://www.googleapis.com/auth/calendar.events';
const GSI_SRC = 'https://accounts.google.com/gsi/client';

let carregando: Promise<void> | null = null;

function carregarGsi(): Promise<void> {
  if (carregando) return carregando;
  carregando = new Promise((resolve, reject) => {
    if ((window as unknown as { google?: unknown }).google) return resolve();
    const s = document.createElement('script');
    s.src = GSI_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Falha ao carregar o Google.'));
    document.head.appendChild(s);
  });
  return carregando;
}

interface CodeClient {
  requestCode: () => void;
}
interface RespostaCode {
  code?: string;
  error?: string;
}

/** Abre o consentimento do Google e resolve com o authorization code. */
export async function obterCodigoGoogle(clientId: string): Promise<string> {
  await carregarGsi();
  const g = (window as unknown as {
    google: { accounts: { oauth2: { initCodeClient: (cfg: object) => CodeClient } } };
  }).google;
  return new Promise((resolve, reject) => {
    const client = g.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: ESCOPO,
      ux_mode: 'popup',
      callback: (resp: RespostaCode) =>
        resp.code ? resolve(resp.code) : reject(new Error(resp.error || 'Consentimento cancelado.')),
    });
    client.requestCode();
  });
}

export function googleClientId(): string | null {
  return process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || null;
}
