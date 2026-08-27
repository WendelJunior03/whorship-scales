# Worship Stage — Gestão de Escalas de Louvor

Plataforma **multi-igreja** para organizar as escalas do ministério de louvor, substituindo a
planilha manual enviada por foto. Cada membro passa a ter visão individual da própria agenda,
com confirmação de presença, comunicados e notificações a cada publicação ou alteração.
---

## Visão Geral

Cada **organização** (igreja) é isolada das demais — os dados de uma nunca vazam para outra
(isolamento por linha no banco, via Row-Level Security). Dentro da organização, o acesso é
controlado por papéis em dois eixos:

- **Organizacional** — `administrador`, `líder`, `membro` (permissões de gestão).
- **Ministério** — `ministro`, `vocal`, `instrumentista` (papel musical na escala).

As escalas são sempre vinculadas a um culto específico, em dois modelos:

- **Escala de vocais** — grupo rotativo por culto, com sugestão automática de rodízio que
  prioriza quem cantou menos recentemente e respeita as indisponibilidades marcadas.
- **Escala avulsa** — vínculo pontual (membro + culto + função) para cobrir qualquer culto
  ou necessidade extra.

Membros comuns veem apenas a própria agenda; administradores, líderes e ministros têm visão
da escala completa e das ferramentas de gestão.

---

## Funcionalidades

**Organização & acesso**
- Multi-igreja com isolamento total por organização (RLS por `org_id`).
- Entrada por **código de convite**; papéis em dois eixos (organizacional + ministério).
- Planos **Free/PRO** com feature flags (base para a evolução comercial).

**Escalas**
- Escala de vocais com **rodízio automático** (exclui quem já está no culto e quem está
  indisponível na data/período).
- Escala avulsa para cultos fora da rotina.
- **Confirmação de presença** e **registro de faltas** pelo próprio membro.
- **Panorama** mensal — matriz função × data com quem está escalado.

**Culto**
- **Repertório** por culto (música, tom, link de referência).
- **Roteiro** cronometrado (setlist com músicas/momentos, duração e ordem).
- **Comentários** por escala e **histórico de alterações** (audit log com expiração).
- **Ensaios** vinculados ao culto, com confirmação dos participantes.

**Ministérios & membros**
- Ministérios com **equipes, funções e classificações**.
- Gestão de membros (cadastro, edição, papel, ativação/desativação, data de nascimento).
- **Indisponibilidades** (calendário de datas/períodos que o membro não pode servir).
- **Aniversariantes** do mês (seção na Home + tela dedicada por mês).

**Comunicação**
- **Comunicados** da organização (mural com detalhe e controle de leitura).
- Notificações internas (com indicador de não lidas) e por **e-mail** (Resend).
- Fluxo de **esqueci/redefinir senha** por e-mail.

**Ferramentas do músico**
- Afinador, Metrônomo, Octapad, Pads Contínuos e Biblioteca de vídeos das músicas.

**Aplicativo**
- **PWA** instalável (mobile e desktop), com deep-linking e persistência de navegação.
- Layout responsivo: **sidebar fixa** no desktop, bottom tabs no mobile.
- Tema claro/escuro via design tokens.

---

## Stack Técnica

**Back-end**
- Node.js + Express 5 · TypeScript
- PostgreSQL via `pg` (sem ORM); migrations com `node-pg-migrate`
- **Multi-tenant com Row-Level Security** — duas conexões: role admin (migrations/seed) e
  role `deepscales_app` (aplicação, sujeita a RLS por organização)
- Autenticação JWT + bcrypt; RBAC por capacidades (dois eixos de papel)
- Testes com Vitest + Supertest (integração real com o banco)

**Front-end**
- React Native + Expo (SDK 54) — app nativo (Expo Go) e PWA web
- TypeScript
- React Navigation (stack + bottom tabs / sidebar), com deep linking e persistência
- Axios + AsyncStorage / SecureStore (token cross-platform)

**Integrações**
- Resend (notificações por e-mail)

**Infraestrutura (produção)**
- [Neon](https://neon.tech) — PostgreSQL serverless
- [Render](https://render.com) — back-end (Web Service)
- [Vercel](https://vercel.com) — front-end (PWA, `expo export -p web`)

---

## Modelagem do Banco de Dados

| Tabela | Descrição |
|---|---|
| `organizacoes` | Igrejas/tenants; plano Free/PRO. Raiz do isolamento (RLS por `org_id`) |
| `membros` | Participantes (dados, papéis org/ministério, instrumentos, nascimento, ativo) |
| `cultos` | Cultos cadastrados (data/hora, tipo) |
| `escala_vocal` | Escala rotativa de vocais por culto (status de confirmação/falta) |
| `escala_avulsa` | Vínculo pontual membro + culto + função |
| `repertorio` | Músicas de cada culto (tom, link de referência) |
| `roteiro_itens` | Roteiro/setlist cronometrado do culto (músicas e momentos) |
| `escala_comentarios` | Thread de comentários por escala/culto |
| `escala_historico` | Histórico de alterações (audit log) |
| `ensaios` / `ensaio_participantes` | Ensaios vinculados ao culto e seus participantes |
| `indisponibilidades` | Datas/períodos em que o membro não pode servir |
| `avisos` / `aviso_leituras` | Comunicados da organização e controle de lidos |
| `ministerios` | Ministérios da organização (vagas Free/extras) |
| `ministerio_membros` | Vínculo membro ↔ ministério (com papel no ministério) |
| `equipes` / `equipe_membros` | Equipes dentro do ministério e seus membros |
| `funcoes` / `membro_funcoes` | Funções do ministério e atribuição por membro |
| `classificacoes` / `membro_classificacao` | Classificações e atribuição por membro |
| `musicas` / `videos` | Catálogo de músicas e vídeos (biblioteca) |
| `notificacoes` | Notificações internas de cada membro (lida/não lida) |

O roadmap de evolução (multi-tenant, RBAC, planos e novos módulos) está documentado em
[`docs/specs/`](./docs/specs/README.md).

---

## Estrutura do Projeto

```
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middlewares/     # auth, RBAC por capacidade
│   │   ├── services/        # envio de e-mail (Resend)
│   │   ├── config/          # banco (RLS), capacidades, feature flags
│   │   └── integration/     # testes de segurança (isolamento + autorização)
│   ├── migrations/          # node-pg-migrate
│   ├── tsconfig.json
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── navigation/      # stack, tabs/sidebar, linking e persistência
│   │   ├── services/
│   │   ├── contexts/        # auth, tema
│   │   ├── types/
│   │   ├── theme/           # design tokens
│   │   └── utils/
│   ├── public/              # manifest.json e ícones do PWA
│   ├── scripts/             # pós-processamento do build web
│   ├── App.tsx
│   ├── app.json
│   └── package.json
├── docs/
│   └── specs/               # roadmap de evolução
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
# preencha DATABASE_URL (admin, p/ migrations/seed) e APP_DATABASE_URL (role
# deepscales_app, usada pela aplicação com RLS), além de JWT_SECRET e RESEND_API_KEY

npm run migrate:up   # aplica as migrations
npm run seed         # (opcional) dados de exemplo
npm run dev          # sobe a API (tsx watch)
npm test             # roda os testes (Vitest)
```

### Front-end (React Native + Expo)

```bash
cd frontend
npm install
cp .env.example .env
# preencha EXPO_PUBLIC_API_URL com o endereço do back-end

npm run web          # PWA no navegador
# ou: npx expo start  → Expo Go no celular (QR code) / emulador
```

Para gerar o build web instalável:

```bash
npm run build:web    # exporta para frontend/dist
npx serve dist       # serve localmente para testar como PWA
```

---

## Variáveis de Ambiente

**Back-end** (`backend/.env`) — ver `backend/.env.example` para a lista completa
```env
# Conexão admin — usada por migrations e seed
DATABASE_URL=postgresql://admin:senha@host/db?sslmode=require
# Conexão da aplicação — role dedicada com RLS ativa (isolamento por organização)
APP_DATABASE_URL=postgresql://deepscales_app:senha@host/db?sslmode=require

JWT_SECRET=alguma_string_bem_grande_e_aleatoria
RESEND_API_KEY=
FRONTEND_URL=http://localhost:8081   # usado no link de redefinição de senha
```

**Front-end** (`frontend/.env`)
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

## Roadmap

Fundação e escalas já em produção; a spec 11 (novos módulos) está em andamento.

- [x] Multi-tenant (isolamento por organização, RLS)
- [x] RBAC por capacidades (papéis organizacional + ministério)
- [x] Escala de vocais com rodízio automático + escala avulsa
- [x] Confirmação de presença e registro de faltas
- [x] Repertório, roteiro, comentários, histórico e ensaios por culto
- [x] Ministérios (equipes, funções, classificações)
- [x] Panorama de escalas (matriz função × data)
- [x] Indisponibilidades (com filtro na sugestão de escala)
- [x] Aniversariantes do mês
- [x] Comunicados da organização
- [x] Notificações (app + e-mail via Resend) e esqueci/redefinir senha
- [x] Ferramentas do músico (afinador, metrônomo, octapad, pads, biblioteca)
- [x] PWA instalável + deploy (Neon + Render + Vercel)
- [ ] Repertório+ (pastas, artistas e mídia da música) — spec 11 / módulo 10
- [ ] Integrações e login social (Google/Apple) — spec 11 / módulo 11
- [ ] Vagas e assinaturas (monetização por ministério) — spec 11 / módulo 12
- [ ] Service worker (suporte offline)

Detalhes e decisões de produto em [`docs/specs/`](./docs/specs/README.md).

---

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](./LICENSE) para mais detalhes.
