# 🎵 Sistema de Gerenciamento de Escalas — Louvor

Sistema para organizar e automatizar as escalas do ministério de louvor de uma igreja, substituindo o processo manual em planilha Excel enviada por foto.

> Projeto pessoal desenvolvido para resolver um problema real do meu próprio ministério de louvor, aplicando conceitos de back-end, modelagem de dados e integrações externas.

---

## 📋 Sobre o Projeto

Hoje as escalas são feitas em Excel e enviadas por foto em grupo — processo estático, difícil de atualizar e sem visão individual para cada membro.

Este sistema resolve isso com dois modelos de escala:

- **Escala fixa**: instrumentistas e ministros com dia da semana fixo (quarta, sábado, domingo), com suporte a exceções e substituições pontuais.
- **Escala de vocais**: grupo rotativo, com sugestão automática de rodízio baseada em quem cantou menos recentemente.

Cada membro acessa e visualiza apenas sua própria agenda, recebendo notificações automáticas quando a escala é publicada ou alterada.

---

## ✨ Funcionalidades

- 🔐 Autenticação com JWT e papéis (admin, ministro, vocal, membro)
- 📅 Cadastro de escala fixa por instrumento e dia da semana
- 🔄 Geração/sugestão automática de escala de vocais (rodízio balanceado)
- ✅ Confirmação de presença pelo próprio membro
- 🔁 Registro de exceções e substituições
- 🎶 Repertório por culto (música, tom, link de referência)
- 📱 Visão individual da agenda (mobile-first)
- 🔔 Notificações automáticas (WhatsApp/e-mail) em criação ou mudança de escala

---

## 🛠️ Stack Técnica

**Back-end**
- Node.js + Express 5
- PostgreSQL (via `pg`, sem ORM)
- JWT + bcrypt para autenticação
- Arquitetura MVC

**Front-end**
- React + Vite
- Tailwind CSS

**Integrações**
- Twilio (notificações via WhatsApp/SMS)

**Deploy**
- Railway

---

## 🗄️ Modelagem do Banco de Dados

| Tabela | Descrição |
|---|---|
| `membros` | Cadastro de todos os participantes (dados, papel, instrumento) |
| `escala_fixa` | Vínculo fixo membro → dia da semana → função |
| `cultos` | Datas dos cultos (quarta, sábado, domingo) |
| `escala_vocal` | Escala rotativa de vocais por culto |
| `excecoes` | Faltas pontuais na escala fixa e seus substitutos |
| `repertorio` | Músicas de cada culto, com tom e link de referência |

Modelagem detalhada disponível em [`docs/escalas-louvor-spec.md`](./docs/escalas-louvor-spec.md).

---

## 📁 Estrutura do Projeto

```
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   └── config/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
├── docs/
│   └── escalas-louvor-spec.md
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js 18+
- PostgreSQL instalado e rodando

### Instalação

```bash
# Clone o repositório
git clone https://github.com/jvrbatista/Gerenciador_escalas.git
cd Gerenciador_escalas

# Instale as dependências do back-end
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# preencha DATABASE_URL, JWT_SECRET, etc.

# Rode as migrations
npm run migrate

# Inicie o servidor
npm run dev
```

### Front-end

```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Variáveis de Ambiente

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/escalas_louvor
JWT_SECRET=sua_chave_secreta
PORT=3000
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

---

## 🗺️ Roadmap

- [ ] Modelagem do banco de dados
- [ ] Autenticação (JWT + papéis)
- [ ] CRUD de membros e escala fixa
- [ ] Escala de vocais com rodízio automático
- [ ] Confirmação de presença
- [ ] Repertório por culto
- [ ] Notificações via Twilio
- [ ] Front-end mobile-first completo

---

## 👤 Autor

**João Victor Batista**
- GitHub: [@jvrbatista](https://github.com/jvrbatista)

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.
