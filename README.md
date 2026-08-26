# Worship Stage — Gestão de Escalas de Louvor

Plataforma para organizar e automatizar as escalas do ministério de louvor de uma igreja,
substituindo o processo manual em planilha enviada por foto. Cada membro passa a ter visão
individual da própria agenda, com notificações automáticas a cada publicação ou alteração.

**App em produção:** [deep-scales.vercel.app](https://deep-scales.vercel.app) — instalável
como PWA diretamente do navegador.

---

## Visão Geral

As escalas tradicionais feitas em planilha são estáticas, difíceis de atualizar e não
oferecem visão individual para cada membro. O Worship Stage resolve isso com três modelos de
escala, todos vinculados a um culto específico:

- **Escala fixa** — instrumentistas e ministros com dia da semana fixo (quarta, sábado,
  domingo), com suporte a exceções e substituições pontuais por data.
- **Escala de vocais** — grupo rotativo por culto, com sugestão automática de rodízio
  baseada em quem cantou menos recentemente.
- **Escala avulsa** — vínculo pontual (membro + culto + função) para cobrir cultos fora da
  rotina fixa ou qualquer necessidade extra.

Cada membro acessa apenas a própria agenda; administradores e ministros têm visão da escala
completa. As notificações são entregues por e-mail e dentro do aplicativo.

---

## Funcionalidades

- Autenticação com JWT e papéis (admin, ministro, vocal, membro).
- Cadastro de escala fixa por instrumento e dia da semana, com "Instrumentos" e "Vozes"
  separados visualmente.
- Geração da escala de vocais a partir dos detalhes do culto, com sugestão automática de
  rodízio balanceado (exclui quem já está escalado no culto).
- Escala avulsa para cultos fora da rotina fixa.
- Confirmação de presença pelo próprio membro (agenda pessoal).
- Registro de exceções e substituições sem afetar a recorrência semanal.
- Repertório por culto (música, tom, link de referência).
- Gestão de membros (cadastro, edição, papel, ativação/desativação).
- Notificações automáticas por e-mail (Resend) e no aplicativo, com indicador de não lidas.
- PWA instalável (mobile e desktop), integrada ao histórico de navegação.
- Perfil pessoal com troca de senha e visualização dos próprios dados.

---

## Stack Técnica

**Back-end**
- Node.js + Express 5
- TypeScript
- PostgreSQL (via `pg`, sem ORM)
- Autenticação com JWT + bcrypt
- Arquitetura em camadas (MVC)
- CORS restrito ao domínio de produção do front-end

**Front-end**
- React Native + Expo (SDK 54) — app nativo (Expo Go) e PWA web
- TypeScript
- React Navigation (stack + bottom tabs), com deep linking e persistência de navegação
- Axios + AsyncStorage / SecureStore (token cross-platform)

**Integrações**
- Resend (notificações por e-mail)

**Infraestrutura (produção)**
- [Neon](https://neon.tech) — PostgreSQL serverless
- [Render](https://render.com) — back-end (Web Service)
- [Vercel](https://vercel.com) — front-end (PWA, export estático via `expo export -p web`)

---

## Modelagem do Banco de Dados

| Tabela | Descrição |
|---|---|
| `membros` | Cadastro de participantes (dados, papel, instrumento, ativo/inativo) |
| `escala_fixa` | Vínculo fixo membro → dia da semana → função |
| `cultos` | Cultos cadastrados (data/hora, tipo) |
| `escala_vocal` | Escala rotativa de vocais por culto |
| `escala_avulsa` | Vínculo pontual membro + culto + função, fora da rotina fixa |
| `excecoes` | Faltas pontuais na escala fixa (e substitutos), por data específica |
| `repertorio` | Músicas de cada culto, com tom e link de referência |
| `notificacoes` | Notificações internas de cada membro (lida/não lida) |

O roadmap de evolução da plataforma (multi-tenant, RBAC, planos e novos módulos) está
documentado em [`docs/specs/`](./docs/specs/README.md).

---

## Estrutura do Projeto

```
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── services/       # envio de e-mail (Resend)
│   │   └── config/
│   ├── migrations/         # node-pg-migrate
│   ├── tsconfig.json
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── navigation/     # stack, tabs, linking e persistência
│   │   ├── services/
│   │   ├── contexts/
│   │   ├── types/
│   │   ├── theme/          # design tokens
│   │   └── utils/
│   ├── public/             # manifest.json e ícones do PWA
│   ├── scripts/            # pós-processamento do build web
│   ├── App.tsx
│   ├── app.json
│   ├── tsconfig.json
│   ├── babel.config.js
│   ├── .env.example
│   └── package.json
├── docs/
│   └── specs/              # roadmap de evolução
└── README.md
```

---

## Executando Localmente

### Pré-requisitos
- Node.js 18+
- PostgreSQL em execução (ou uma connection string do [Neon](https://neon.tech))

### Back-end

```bash
cd backend
npm install

cp .env.example .env
# preencha DB_HOST/DB_USER/DB_PASSWORD/DB_NAME (Postgres local)
# ou DATABASE_URL (Postgres na nuvem, ex.: Neon) — qualquer um dos dois é aceito
# preencha também JWT_SECRET e, opcionalmente, RESEND_API_KEY

npm run dev
```

### Front-end (React Native + Expo)

```bash
cd frontend
npm install
cp .env.example .env
# preencha EXPO_PUBLIC_API_URL com o endereço do back-end

npx expo start
```

Abra o **Expo Go** no celular e escaneie o QR code exibido no terminal (ou utilize um
emulador Android/iOS).

Para rodar como PWA no navegador:

```bash
npm run build:web   # exporta para frontend/dist
npx serve dist      # serve localmente para testar como app instalável
```

---

## Variáveis de Ambiente

**Back-end** (`backend/.env`)
```env
# opção 1: banco local
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=escalas_louvor

# opção 2: banco na nuvem (Neon, Render, etc.) — tem prioridade se estiver definido
DATABASE_URL=postgresql://usuario:senha@host.neon.tech/neondb?sslmode=require

PORT=3000
JWT_SECRET=alguma_string_bem_grande_e_aleatoria
RESEND_API_KEY=
```

**Front-end** (`frontend/.env`)
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

## Roadmap

- [x] Modelagem do banco de dados
- [x] Autenticação (JWT + papéis)
- [x] CRUD de membros e escala fixa
- [x] Escala de vocais com rodízio automático
- [x] Escala avulsa
- [x] Confirmação de presença
- [x] Repertório por culto
- [x] Notificações via Resend (e-mail) e no aplicativo
- [x] Front-end mobile-first completo
- [x] Deploy em produção (Neon + Render + Vercel)
- [x] PWA instalável
- [ ] Fluxo de "esqueci minha senha"
- [ ] Service worker (suporte offline)
- [ ] Domínio próprio verificado no Resend
- [ ] Evolução para plataforma multi-igreja (ver [`docs/specs/`](./docs/specs/README.md))

---

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](./LICENSE) para mais detalhes.
