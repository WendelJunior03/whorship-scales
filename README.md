# 🎵 Deep Scales — Sistema de Gerenciamento de Escalas de Louvor

Sistema para organizar e automatizar as escalas do ministério de louvor de uma igreja, substituindo o processo manual em planilha Excel enviada por foto.

> Projeto pessoal desenvolvido para resolver um problema real do meu próprio ministério de louvor, aplicando conceitos de back-end, front-end, modelagem de dados e integrações externas — do zero até em produção.

**🔗 App em produção:** [deep-scales.vercel.app](https://deep-scales.vercel.app) (instalável como PWA, direto do navegador)

---

## 📋 Sobre o Projeto

Hoje as escalas são feitas em Excel e enviadas por foto em grupo — processo estático, difícil de atualizar e sem visão individual para cada membro.

Este sistema resolve isso com três modelos de escala, todos vinculados a um culto específico:

- **Escala fixa**: instrumentistas e ministros com dia da semana fixo (quarta, sábado, domingo), com suporte a exceções e substituições pontuais por data.
- **Escala de vocais**: grupo rotativo por culto, com sugestão automática de rodízio baseada em quem cantou menos recentemente.
- **Escala avulsa**: vínculo pontual (membro + culto + função) pra cobrir cultos fora da rotina fixa ou qualquer necessidade extra.

Cada membro acessa e visualiza apenas sua própria agenda (ou, se for admin/ministro, a escala completa), recebendo notificações automáticas — por e-mail e dentro do próprio app — quando a escala é publicada ou alterada.

---

## ✨ Funcionalidades

- 🔐 Autenticação com JWT e papéis (admin, ministro, vocal, membro)
- 📅 Cadastro de escala fixa por instrumento e dia da semana, com "Instrumentos" e "Vozes" separados visualmente
- 🔄 Geração de escala de vocais direto nos detalhes do culto, com sugestão automática de rodízio balanceado (exclui quem já está escalado naquele culto)
- 🎤 Escala avulsa pra cultos fora da rotina fixa
- ✅ Confirmação de presença pelo próprio membro (Agenda pessoal)
- 🔁 Registro de exceções e substituições, sem afetar a recorrência semanal inteira
- 🎶 Repertório por culto (música, tom, link de referência)
- 👥 Gestão de membros (cadastro, edição, papel, desativação)
- 🔔 Notificações automáticas por e-mail (Resend) e dentro do app, com indicador de não lidas
- 📱 PWA instalável (mobile e desktop), com navegação integrada ao histórico do navegador
- 👤 Perfil pessoal com troca de senha e visualização das próprias informações

---

## 🛠️ Stack Técnica

**Back-end**
- Node.js + Express 5
- TypeScript
- PostgreSQL (via `pg`, sem ORM)
- JWT + bcrypt para autenticação
- Arquitetura MVC
- CORS restrito ao domínio de produção do front-end

**Front-end**
- React Native + Expo (SDK 54), rodando como app nativo (Expo Go) e como PWA web
- TypeScript
- React Navigation (stack + bottom tabs), com deep linking e persistência de estado de navegação
- Axios + AsyncStorage / SecureStore (token cross-platform)

**Integrações**
- Resend (notificações por e-mail)

**Deploy (produção)**
- [Neon](https://neon.tech) — PostgreSQL serverless
- [Render](https://render.com) — back-end (Web Service, free tier)
- [Vercel](https://vercel.com) — front-end (PWA, export estático via `expo export -p web`)

---

## 🗄️ Modelagem do Banco de Dados

| Tabela | Descrição |
|---|---|
| `membros` | Cadastro de todos os participantes (dados, papel, instrumento, ativo/inativo) |
| `escala_fixa` | Vínculo fixo membro → dia da semana → função |
| `cultos` | Cultos cadastrados (data/hora, tipo) |
| `escala_vocal` | Escala rotativa de vocais por culto |
| `escala_avulsa` | Vínculo pontual membro + culto + função, fora da rotina fixa |
| `excecoes` | Faltas pontuais na escala fixa (e seus substitutos), por data específica |
| `repertorio` | Músicas de cada culto, com tom e link de referência |
| `notificacoes` | Notificações internas de cada membro (lida/não lida) |

Modelagem detalhada disponível em [`docs/escalas-louvor-spec.md`](./docs/escalas-louvor-spec.md).

---

## 📁 Estrutura do Projeto

```
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── services/       # envio de e-mail (Resend)
│   │   └── config/
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
│   │   ├── theme/
│   │   └── utils/
│   ├── public/              # manifest.json e ícones do PWA
│   ├── scripts/             # pós-processamento do build web (tags do PWA)
│   ├── App.tsx
│   ├── app.json
│   ├── tsconfig.json
│   ├── babel.config.js
│   ├── .env.example
│   └── package.json
├── docs/
│   └── escalas-louvor-spec.md
├── TASKS.md
└── README.md
```

---

## 🚀 Como Rodar o Projeto Localmente

### Pré-requisitos
- Node.js 18+
- PostgreSQL instalado e rodando (ou uma connection string do [Neon](https://neon.tech), gratuito)

### Back-end

```bash
cd backend
npm install

cp .env.example .env
# preencha DB_HOST/DB_USER/DB_PASSWORD/DB_NAME (Postgres local)
# ou DATABASE_URL (Postgres na nuvem, ex: Neon) — o projeto aceita qualquer um dos dois
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

Abre o app **Expo Go** no seu celular e escaneia o QR code que aparece no terminal (ou roda num emulador Android/iOS).

Pra rodar como PWA no navegador:

```bash
npm run build:web   # exporta pra frontend/dist
npx serve dist      # serve localmente pra testar como app instalável
```

---

## 🔑 Variáveis de Ambiente

**Back-end** (`backend/.env`)
```env
# opção 1: banco local
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=escalas_louvor

# opção 2: banco na nuvem (Neon, Render, etc) — tem prioridade se estiver setado
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

## 🗺️ Roadmap

- [x] Modelagem do banco de dados
- [x] Autenticação (JWT + papéis)
- [x] CRUD de membros e escala fixa
- [x] Escala de vocais com rodízio automático
- [x] Escala avulsa
- [x] Confirmação de presença
- [x] Repertório por culto
- [x] Notificações via Resend (e-mail) e dentro do app
- [x] Front-end mobile-first completo
- [x] Deploy em produção (Neon + Render + Vercel)
- [x] PWA instalável
- [ ] Fluxo de "esqueci minha senha"
- [ ] Service worker (suporte offline)
- [ ] Domínio próprio verificado no Resend (hoje limitado ao e-mail do dono da conta)

---

## 👤 Autor

**João Victor Batista**
- GitHub: [@jvrbatista](https://github.com/jvrbatista)

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.
