# Integração Google — Login social + Google Agenda (módulo 11)

Guia rápido para **ligar** a integração. Enquanto as variáveis abaixo não estiverem
preenchidas, o app funciona normal e os botões de Google ficam **escondidos**
(o endpoint `GET /integracoes/status` retorna `{ "google": false }`).

## 1. Criar o OAuth Client no Google Cloud (uma vez, ~5 min)

1. Acesse <https://console.cloud.google.com/> e crie (ou escolha) um projeto.
2. **APIs & Services → Enabled APIs** → ative a **Google Calendar API**.
3. **APIs & Services → OAuth consent screen** → tipo **External** → preencha nome do
   app (Worship Stage), e-mail de suporte. Em **Scopes**, adicione
   `.../auth/calendar.events`. Enquanto estiver em "Testing", adicione seu e-mail em
   **Test users**.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Tipo: **Web application**.
   - **Authorized JavaScript origins**: as URLs de onde o app roda, ex.:
     - `http://localhost:8081` (dev)
     - `https://SEU-DOMINIO` (produção, ex.: `https://deep-scales.vercel.app`)
   - (Não precisa de "Authorized redirect URIs" — o fluxo usa popup/`postmessage`.)
5. Copie o **Client ID** e o **Client secret**.

## 2. Preencher as variáveis de ambiente

**Backend** (`backend/.env`)
```env
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxx
APP_ENC_KEY=uma_string_longa_e_aleatoria   # cifra os tokens em repouso
```

**Frontend** (`frontend/.env`)
```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com   # o MESMO Client ID
```

Reinicie os dois servidores (`npm run dev` / `npm run web`) para pegar as variáveis.

## 3. Como funciona

- **Entrar com Google** (tela de login, web): abre o consentimento do Google, o
  backend troca o código por tokens, **casa pelo e-mail** com um membro que **já
  existe** (senão, 403 pedindo convite) e emite o nosso JWT.
- **Perfil → Contas vinculadas**: conectar/desconectar o Google e
  **Sincronizar com o Google Agenda** — empurra as escalas futuras do membro
  (vocal/avulsa/ensaios) pro Google Agenda (uma via; re-sincronizar atualiza, não
  duplica).
- **Segurança**: o refresh token é guardado **cifrado** (AES-256-GCM, chave
  `APP_ENC_KEY`). Nada de segredo em claro.

## Observações

- É **web/PWA** por enquanto (o fluxo usa a lib do Google no navegador). Nativo
  (Expo Go/standalone) fica para depois.
- O **refresh token** (necessário pra sincronizar a agenda) é concedido no primeiro
  consentimento com acesso offline. Se a sincronização reclamar de "conecte sua
  conta", desconecte e conecte de novo aceitando as permissões de Agenda.
- Login com **Apple** entra numa próxima leva (mesma tabela `contas_vinculadas`).
