# 🗺️ Roteiro de Aprendizado — Sistema de Escalas de Louvor

Este documento é o seu guia do início ao fim do projeto. Ele **não contém código** — cada
tarefa traz o objetivo, os conceitos que você vai precisar pesquisar/entender e uma
definição de "pronto". A ideia é você programar tudo, e usar isso como mapa.

Regra de ouro: **não avance de fase sem conseguir explicar em voz alta o que a fase
anterior faz e por quê.** Se não conseguir explicar, ainda não aprendeu — só copiou.

---

## Fase 0 — Planejamento e ambiente

**Objetivo:** ter o ambiente pronto e o escopo claro antes de escrever qualquer linha de código.

> **Decisão de stack:** o projeto vai usar **TypeScript** no back-end e no front-end
> (em vez de JavaScript puro), para você estudar tipagem estática junto com o resto.
> Isso muda alguns comandos das Fases 2 e 11 mais adiante — já vêm ajustados.

### 0.1 — O que baixar e como (uma vez só, vale para o projeto todo)

| Ferramenta | Para quê | Onde baixar | Como confirmar que instalou |
|---|---|---|---|
| **Node.js LTS** (18+) | Rodar JS/TS fora do navegador; `npm` vem junto | [nodejs.org](https://nodejs.org) → botão "LTS" | `node -v` e `npm -v` no terminal |
| **PostgreSQL** | Banco de dados do projeto | [postgresql.org/download](https://www.postgresql.org/download/) → instalador Windows | Abrir "SQL Shell (psql)" no menu iniciar e conseguir conectar |
| **DBeaver** (opcional, recomendado) | Cliente gráfico pra ver tabelas/dados sem decorar comando SQL | [dbeaver.io](https://dbeaver.io/download/) | Abrir e criar uma conexão com o Postgres local |
| **Insomnia** (ou extensão Thunder Client no VS Code) | Testar os endpoints da API antes de ter front-end pronto — vai precisar já na Fase 3 | [insomnia.rest](https://insomnia.rest/download) ou aba de Extensões do VS Code | Abrir e enviar uma requisição de teste |
| **Git** | Você já tem — foi usado pra clonar o repo | — | `git -v` |

Extensões de VS Code que valem instalar agora (`Ctrl+Shift+X`):
- **ESLint** — aponta erros de estilo/lint enquanto você digita
- **Prettier** — formata o código automaticamente
- **PostgreSQL** (Chris Kolkman) — autocomplete e navegação de schema dentro do editor

TypeScript em si **não é algo que se baixa separado** — ele é instalado como
dependência de cada projeto (back-end e front-end) via `npm`, o que acontece nas
Fases 2 e 11.

### 0.2 — Primeiros passos, em ordem

- [x] Instalar Node.js LTS e confirmar com `node -v` — feito (v25.4.0)
- [x] Instalar PostgreSQL e confirmar que consegue abrir o `psql` — feito (PostgreSQL 18, serviço rodando)
- [x] Criar um banco de dados vazio local, ex: `escalas_louvor` — feito
- [x] Instalar Insomnia (ou a extensão Thunder Client) — feito (Insomnia já instalado)
- [x] Escrever a especificação de papéis em `docs/escalas-louvor-spec.md` — feito
- [x] Desenhar o fluxo principal — feito (diagrama Mermaid no mesmo arquivo)

### 0.3 — Primeira estrutura de pastas do repositório

Ainda sem código — só a organização que vai receber o back-end e o front-end nas
próximas fases:

```
Gerenciador_escalas/
├── backend/          ← vai nascer na Fase 2 (Node + Express + TypeScript)
├── frontend/          ← vai nascer na Fase 11 (React + Vite + TypeScript)
├── docs/
│   └── escalas-louvor-spec.md
├── README.md
└── TASKS.md
```

> O README original menciona `src/` direto na raiz. Como agora back-end e front-end
> vão ter configs de TypeScript/build separadas, faz mais sentido isolar cada um na
> própria pasta (`backend/`, `frontend/`). Ajuste o README quando chegar na Fase 2,
> se concordar com a mudança.

- [x] Criar as pastas `backend/` e `frontend/` vazias na raiz do repositório — feito

**Pergunta-guia:** se eu explicasse este sistema para alguém do seu ministério em 3 frases, quais seriam?

**Pronto quando:** as ferramentas da tabela acima estão instaladas e confirmadas, o banco vazio existe, e as pastas `backend/`/`frontend/` foram criadas.

---

## Fase 1 — Modelagem do banco de dados

**Objetivo:** entender profundamente as entidades e relações antes de tocar em Express.

- [x] Para cada tabela do README (`membros`, `escala_fixa`, `cultos`, `escala_vocal`, `excecoes`, `repertorio`), listar manualmente as colunas, tipos e chaves (PK/FK) — feito, as 6 tabelas modeladas
- [ ] Desenhar um diagrama ER (papel ou ferramenta como dbdiagram.io) — pulado por ora; as relações já estão implementadas via `FOREIGN KEY`, mas vale desenhar em algum momento pra visualizar tudo junto
- [x] Decidir as relações: 1:N? N:N? Onde precisa de tabela associativa? — todas as relações são 1:N (chave estrangeira sempre no lado "muitos")
- [x] Pensar em constraints: o que nunca pode ser nulo? O que precisa ser único (ex: e-mail de membro)? — feito: `UNIQUE` em `email` e em `(membro_id, culto_id)`, `CHECK` em `papel` e `dia_semana`, `NOT NULL` revisado campo a campo
- [x] Escrever à mão os `CREATE TABLE` em SQL puro (sem ORM, como o projeto pede) — feito, as 6 tabelas
- [x] Rodar os `CREATE TABLE` no banco local e conferir com `\d nome_tabela` no psql — feito
- [x] Popular manualmente 2-3 linhas de teste em cada tabela com `INSERT` para validar que as constraints fazem sentido — feito em todas as 6 tabelas

### Schema final da Fase 1

```sql
CREATE TABLE membros (
    id SERIAL PRIMARY KEY,
    nome VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    telefone VARCHAR,
    senha VARCHAR NOT NULL,
    papel VARCHAR(20) NOT NULL CHECK (papel IN ('admin', 'ministro', 'vocal', 'membro')),
    instrumento VARCHAR
);

CREATE TABLE cultos (
    id SERIAL PRIMARY KEY,
    data_hora TIMESTAMP NOT NULL,
    tipo VARCHAR
);

CREATE TABLE escala_fixa (
    id SERIAL PRIMARY KEY,
    membro_id INTEGER REFERENCES membros(id) NOT NULL,
    dia_semana VARCHAR(20) CHECK (dia_semana IN ('quarta', 'sabado', 'domingo')) NOT NULL,
    funcao VARCHAR NOT NULL
);

CREATE TABLE excecoes (
    id SERIAL PRIMARY KEY,
    escala_fixa_id INTEGER REFERENCES escala_fixa(id) NOT NULL,
    data DATE NOT NULL,
    substituto_id INTEGER REFERENCES membros(id)
);

CREATE TABLE escala_vocal (
    id SERIAL PRIMARY KEY,
    membro_id INTEGER REFERENCES membros(id) NOT NULL,
    culto_id INTEGER REFERENCES cultos(id) NOT NULL,
    UNIQUE (membro_id, culto_id)
);

CREATE TABLE repertorio (
    id SERIAL PRIMARY KEY,
    culto_id INTEGER REFERENCES cultos(id) NOT NULL,
    nome VARCHAR NOT NULL,
    tom VARCHAR NOT NULL,
    link_musica VARCHAR NOT NULL
);
```

**Decisões registradas:**
- `excecoes` não duplica `membro`/`função` — referencia `escala_fixa_id` e evita redundância
- `escala_fixa.funcao` é independente de `membros.instrumento` (pode ser diferente do instrumento principal em casos de substituição)
- Sem tabela de instrumentos secundários — mantido simples por decisão consciente
- Pendência de regra de negócio pra Fase 5: nada impede hoje o mesmo membro aparecer 2x no mesmo `dia_semana` em `escala_fixa`

**Conceitos para pesquisar:** normalização (1FN/2FN/3FN), chave estrangeira e `ON DELETE CASCADE` vs `RESTRICT`, tipos de dado do Postgres (`SERIAL`, `TIMESTAMP`, `ENUM` ou `CHECK` para papéis).

**Pronto quando:** você consegue rodar uma query manual que junta (`JOIN`) pelo menos 3 tabelas e o resultado faz sentido.

---

## Fase 2 — Esqueleto do back-end (Node + Express + TypeScript, arquitetura MVC)

**Objetivo:** montar a estrutura do projeto sem nenhuma lógica de negócio ainda — só o "hello world" organizado, já em TypeScript.

- [x] Inicializar o projeto dentro de `backend/` (`npm init`) e instalar dependências de runtime: `express`, `pg`, `dotenv`
- [x] Instalar dependências de desenvolvimento do TypeScript: `typescript`, `@types/node`, `@types/express`, `@types/pg`, e um executor tipo `tsx` (ou `ts-node-dev`) pra rodar `.ts` direto sem compilar toda hora
- [x] Gerar o `tsconfig.json` (`npx tsc --init`) e entender pelo menos estas opções: `target`, `module`, `strict`, `outDir`, `rootDir`
- [x] Criar a estrutura de pastas do README, agora em `.ts`: `src/controllers`, `src/models`, `src/routes`, `src/middlewares`, `src/config`
- [x] Configurar a conexão com o Postgres via `pg` em `src/config` usando variáveis de ambiente (`.env` + `.env.example`)
- [x] Criar uma rota de teste (`GET /health`) que consulta o banco e retorna algo simples — testado e funcionando
- [ ] Entender e aplicar o padrão MVC: o que é responsabilidade de rota, controller e model nesse projeto? — ainda não aplicado na prática (rota está direto no `index.ts`); vai ficar concreto na Fase 3/4, quando surgir o primeiro controller de verdade
- [x] Configurar os scripts no `package.json`: `dev` (hot-reload via `tsx watch`/`ts-node-dev`) e `build`/`start` (compila com `tsc` e roda o JS gerado)

**Conceitos para pesquisar:** middleware do Express, pool de conexões (`pg.Pool`), variáveis de ambiente com `dotenv`, por que este projeto evita ORM (trade-offs de SQL puro vs Prisma/Sequelize), diferença entre `strict: true` e `false` no TypeScript, o que são pacotes `@types/*` e por que ficam em `devDependencies`, diferença entre rodar TS direto (dev) e compilar pra JS (produção).

**Pronto quando:** `npm run dev` sobe o servidor, `GET /health` responde, `npm run build` compila sem erro de tipo, e você consegue explicar o caminho da requisição (rota → controller → model → banco → resposta) apontando os tipos usados em cada camada.

---

## Fase 3 — Autenticação (JWT + bcrypt + papéis)

**Objetivo:** qualquer pessoa só acessa o que seu papel permite.

- [x] Model + controller de `membros`: cadastro básico (nome, e-mail, senha, papel) — `membroModel.ts` (`createMembers`) + `membroController.ts` (`cadastrarUser`), rota `POST /membros/cadastro`
- [x] Hash de senha com `bcrypt` no cadastro — nunca salvar senha em texto puro — testado, hash confirmado no banco
- [x] Rota de login: validar credenciais e gerar um token JWT — `loginUser`, testado com senha certa (200 + token) e errada (400)
- [x] Middleware de autenticação: extrair e validar o token do header `Authorization` — `authMiddleware.ts`, testado (401 sem token, 200 com token válido via rota `/membros/me`)
- [x] Middleware de autorização por papel: bloquear rotas de admin para quem não é admin — `roleMiddleware.ts` (`autorizator`), testado (403 com membro comum, 200 com admin em `/membros/admin-teste`)
- [x] Testar manualmente com Insomnia: cadastro, login e rota protegida — feito, fluxo completo (401 sem token → login → 200 com token → 403 sem permissão → 200 com admin)

**Conceitos para pesquisar:** diferença entre autenticação e autorização, como funciona um JWT (header/payload/signature), tempo de expiração de token, por que salvar hash e não senha crua, salt rounds do bcrypt.

**Pronto quando:** você consegue, sem token, receber 401; com token errado de papel, receber 403; com token certo, acessar normalmente.

---

## Fase 4 — CRUD de membros

**Objetivo:** primeiro CRUD completo do zero, sem ajuda de ORM.

- [x] Listar membros — `GET /membros`, só admin, sem paginação por ora
- [x] Buscar membro por id — `GET /membros/:id`, admin e ministro
- [x] Atualizar dados de um membro (quem pode: o próprio ou admin?) — decidido: o próprio OU admin; `PUT /membros/:id`, checagem de permissão dentro do controller (regra condicional, não cabia no `roleMiddleware` genérico)
- [x] Remover/inativar membro (pense: delete físico ou campo `ativo`?) — decidido: inativação lógica (coluna `ativo BOOLEAN DEFAULT true`), só admin; `DELETE /membros/:id`
- [x] Validação de entrada — feita nos controllers (campos obrigatórios no update, e-mail duplicado verificado antes de salvar)
- [x] Tratamento de erros consistente — `400`/`401`/`403` usados de forma consistente entre as rotas

**Decisões registradas:**
- Cadastro (`POST /membros/cadastro`) deixou de ser público na Fase 4 — virou admin-only, fechando uma falha de segurança onde qualquer um podia se auto-nomear `admin` no cadastro
- `senha` nunca mais sai da API: `findById`/`findAllMembers` selecionam colunas explícitas, sem `SELECT *`
- Atualização é "completa" (cliente reenvia todos os campos), não parcial — atualização parcial (`PATCH`) fica como melhoria futura
- `papel` não é editável pela rota de update (nem por admin, nem pelo próprio) — promover alguém de papel exige uma rota própria, ainda não construída
- `findById`/`findAllMembers` agora filtram `WHERE ativo = true`, escondendo membros desativados das buscas normais

**Conceitos para pesquisar:** SQL injection e por que usar queries parametrizadas (`$1, $2` no `pg`), soft delete vs hard delete, padrões de resposta de API (status codes corretos: 200, 201, 400, 404, 409).

**Pronto quando:** você tem um CRUD completo testável via Postman, com autorização aplicada (ex: só admin cadastra membro).

---

## Fase 5 — Escala fixa

**Objetivo:** modelar e expor a escala que não muda toda semana.

- [x] CRUD de `escala_fixa`: vincular membro → dia da semana → função/instrumento — `POST /escala-fixa`, admin e ministro
- [x] Regra de negócio: um membro pode ter mais de uma função no mesmo dia? Pode estar em dois dias? — decidido: pode ter mais de uma função no mesmo dia, mas não pode repetir a mesma combinação; `UNIQUE (membro_id, dia_semana, funcao)` via `ALTER TABLE`
- [x] Endpoint que retorna a escala fixa "montada" (join de membro + dia + função) de forma legível — `GET /escala-fixa`, com `JOIN` em `membros`, admin e ministro
- [x] Endpoint "minha agenda": membro autenticado vê só a própria escala fixa — `GET /escala-fixa/me`, qualquer papel logado

**Decisões registradas:**
- Criar/editar escala fixa: só `admin` e `ministro`
- CRUD de `escala_fixa` ficou restrito a criação e leitura nessa fase — update/delete de vínculos individuais não foram pedidos no roteiro original; avaliar se vale adicionar depois

**Conceitos para pesquisar:** queries com múltiplos `JOIN`, como modelar "dia da semana" (enum, número, string?), filtragem por usuário logado (`req.user` vindo do middleware de auth).

**Pronto quando:** um membro de teste, autenticado, bate no endpoint "minha agenda" e vê só o que é dele.

---

## Fase 6 — Exceções e substituições

**Objetivo:** lidar com o caso real de "essa semana eu não vou, fulano vai no meu lugar".

- [x] CRUD de `excecoes`: vincular a um registro de `escala_fixa` (ou a uma data específica), com motivo e substituto opcional — `POST /excecoes`; sem campo `motivo` (decisão da Fase 1, mantida); permissão: admin OU dono do vínculo de escala fixa
- [x] Regra: como a "escala montada" da Fase 5 deve mudar quando existe uma exceção para aquela data? — resolvida via `LEFT JOIN` + `COALESCE`, sem alterar `escala_fixa`
- [x] Endpoint que retorna a escala já considerando exceções (a visão "efetiva" da semana) — `GET /escala-fixa/efetiva?data=AAAA-MM-DD`, aberto a qualquer papel logado

**Conceitos para pesquisar:** como sobrepor dados (override) sem duplicar lógica, diferença entre alterar a fonte da verdade vs. calcular por cima dela.

**Pronto quando:** você cria uma exceção para uma data e o endpoint de escala efetiva reflete a substituição automaticamente.

---

## Fase 7 — Escala de vocais (rodízio automático)

**Objetivo:** a parte mais interessante do projeto — um algoritmo de sugestão.

- [x] CRUD básico de `escala_vocal` (vincular vocal a um culto) — `POST /escala-vocal`, admin e ministro, protegido pela `UNIQUE (membro_id, culto_id)` já existente
- [x] Pensar no algoritmo de rodízio: "sugerir quem cantou menos recentemente"
  - Critério escolhido: baseado em **quando foi escalado** (não em confirmação de presença, que ainda não existe — Fase 8)
  - Empates (nunca cantaram) resolvidos com `LEFT JOIN` + `ORDER BY ultima_vez ASC NULLS FIRST` — quem nunca cantou aparece primeiro
  - Quantidade fixada em 2 vocais por culto (decisão do projeto)
- [x] Implementar o endpoint de sugestão (ele sugere, não decide sozinho — quem confirma é o admin/ministro) — `GET /escala-vocal/sugestao`, admin e ministro, só consulta, não grava nada
- [x] Endpoint para o admin aceitar/ajustar a sugestão e gravar a escala definitiva — reaproveita o `POST /escala-vocal` do CRUD básico (admin decide manualmente após ver a sugestão)

**Conceitos para pesquisar:** ordenação por data (`ORDER BY`), `LEFT JOIN` para incluir vocais que nunca cantaram, diferença entre "sugestão" (cálculo) e "estado persistido" (o que foi de fato escalado).

**Pronto quando:** você consegue explicar, com uma massa de dados de teste, por que o algoritmo sugeriu exatamente aquelas pessoas.

---

## Fase 8 — Confirmação de presença

**Objetivo:** o membro interage com o sistema, não só recebe informação.

- [x] Campo de status de confirmação (pendente/confirmado/recusado) na escala fixa e/ou vocal — só em `escala_vocal` (`VARCHAR` + `CHECK`, `DEFAULT 'pendente'`); decidido não duplicar em `escala_fixa`
- [x] Endpoint para o próprio membro confirmar ou recusar sua participação — `PUT /escala-vocal/:id/status`, só o dono do registro
- [x] Regra: o que acontece quando alguém recusa? — decisão diferente da hipótese original: pra `escala_fixa`, "recusar" já é o `POST /excecoes` da Fase 6 (não precisa de status próprio); pra `escala_vocal`, recusar só muda o `status` — cabe ao admin/ministro perceber e escalar outra pessoa manualmente (sem automação ainda). Notificação automática fica pra Fase 10.

**Conceitos para pesquisar:** máquina de estados simples (quais transições de status são válidas), idempotência (confirmar duas vezes não deve quebrar nada).

**Pronto quando:** confirmar/recusar presença em `escala_vocal` funciona ponta a ponta, e recusar uma `escala_fixa` numa data específica já funciona via `excecoes` (Fase 6).

---

## Fase 9 — Repertório por culto

**Objetivo:** CRUD simples, mas conectado ao culto certo.

- [x] CRUD de `repertorio` vinculado a um `culto` (música, tom, link de referência) — `POST /repertorio`, admin e ministro
- [x] Endpoint que retorna o culto com escala + repertório juntos (visão completa do "meu próximo culto") — `GET /repertorio/meu-proximo-culto`, qualquer papel logado

**Decisão registrada:** a versão implementada busca o próximo culto via `escala_vocal` (já ligada a um `culto_id` específico). A variante baseada em `escala_fixa` (que exigiria calcular a próxima ocorrência de um dia da semana) ficou de fora por complexidade/tempo — melhoria futura.

**Conceitos para pesquisar:** agregação de dados de várias tabelas numa única resposta de API (moldar o JSON pensando em quem consome, não só no banco).

**Pronto quando:** o endpoint "meu próximo culto" devolve, numa resposta só, o culto e o repertório (repertório vazio é um estado válido, não erro).

---

## Fase 10 — Notificações (Meta WhatsApp Cloud API + Resend)

**Objetivo:** integração com serviços externos.

> **Decisão de stack (revisada):** trocamos Twilio por **Meta WhatsApp Cloud API** (WhatsApp) e **Resend** (e-mail) — ambos com camada gratuita mais duradoura que o trial do Twilio. Railway também saiu do plano de deploy (ver Fase 13).

- [x] Criar conta no [Resend](https://resend.com/) e pegar a API key
- [x] Isolar a lógica de envio numa camada própria (`src/services/emailService.ts`) — e-mail feito; WhatsApp pendente (ver abaixo)
- [x] Disparar notificação quando alguém é colocado como substituto (Fase 6) — feito via e-mail, em `createExcecoesController`
- [x] Tratar falha de envio sem derrubar a operação principal — `try/catch` isolado em volta do envio, `console.error` no lugar de interromper a resposta de sucesso
- [ ] Disparar notificação quando uma escala é publicada ou alterada — ainda não implementado (só o gatilho de substituto foi feito)
- [ ] **WhatsApp (Meta Cloud API) — pausado, retomar depois.** App criado no Meta for Developers, Business Portfolio "Ministério de Louvor" criado, token e Phone Number ID obtidos e configurados no `.env`. Travou no teste de envio (`Etapa 1. Experimente`): erro `131030 - Recipient phone number not in allowed list`, mesmo com o número aparentemente verificado na lista de destinatários de teste (tentado com e sem o 9º dígito do celular brasileiro, sem sucesso). Provável causa: alguma etapa de verificação do número não finalizou corretamente do lado do Meta — investigar o painel com calma numa próxima sessão antes de tentar de novo.

**Conceitos para pesquisar:** chamadas assíncronas a APIs externas, variáveis de ambiente sensíveis (nunca commitar `META_WHATSAPP_TOKEN`/`RESEND_API_KEY`), como isolar efeitos colaterais (side effects) do resto da aplicação.

**Pronto quando:** alterar uma escala de teste dispara uma mensagem real (ou no console/log, se preferir simular antes de configurar as contas de verdade).

---

## Fase 11 — Front-end (React + Vite + TypeScript + Tailwind, mobile-first)

**Objetivo:** interface para os quatro papéis de usuário, já tipada.

- [ ] Criar o projeto com o template TypeScript do Vite (`npm create vite@latest frontend -- --template react-ts`) e instalar/configurar o Tailwind
- [ ] Definir tipos/interfaces para as entidades que vêm da API (`Membro`, `EscalaFixa`, `Culto`, etc.) — devem espelhar o que o back-end retorna
- [ ] Tela de login e armazenamento do token (pense onde: localStorage? cookie?)
- [ ] Tela "minha agenda" consumindo os endpoints das Fases 5–9
- [ ] Fluxo de confirmação de presença na UI
- [ ] Telas de admin: CRUD de membros, escala fixa, geração/ajuste da escala de vocais
- [ ] Responsividade mobile-first (comece pelo layout mobile, depois expanda pro desktop)
- [ ] Tratamento de estados de carregamento e erro na UI (loading, erro de rede, sem permissão)

**Conceitos para pesquisar:** hooks do React tipados (`useState<T>`, `useEffect`), organização em `components/pages/services`, chamada de API centralizada (uma camada `services` em vez de `fetch` espalhado) com tipos de retorno explícitos, proteção de rotas no front baseada no papel do usuário, `interface` vs `type` no TypeScript.

**Pronto quando:** você consegue logar como cada um dos 4 papéis, ver uma experiência coerente com o que cada um deveria enxergar, e `npm run build` do front compila sem erro de tipo.

---

## Fase 12 — Testes e qualidade

**Objetivo:** confiar que o sistema funciona sem testar tudo manualmente sempre.

- [ ] Escolher uma ferramenta de teste (ex: Jest ou Vitest) e escrever testes para o algoritmo de rodízio (Fase 7) — é a lógica mais arriscada
- [ ] Testes de integração básicos para autenticação (login válido/inválido, acesso negado)
- [ ] Revisar tratamento de erros em toda a API (respostas consistentes)

**Conceitos para pesquisar:** diferença entre teste unitário e de integração, mocks para não depender das APIs externas (Meta WhatsApp/Resend) reais nos testes.

**Pronto quando:** rodar a suíte de testes te dá confiança para mexer no algoritmo de rodízio sem medo de quebrar algo.

---

## Fase 13 — Deploy (Neon + Render + Vercel)

**Objetivo:** sistema acessível fora da sua máquina.

- [ ] Criar projeto no [Neon](https://neon.tech/) e provisionar um Postgres serverless
- [ ] Criar serviço web no [Render](https://render.com/) pro back-end
- [ ] Criar projeto no [Vercel](https://vercel.com/) pro front-end
- [ ] Configurar variáveis de ambiente de produção (nunca reaproveitar segredo local)
- [ ] Rodar as migrations em produção (contra o banco do Neon)
- [ ] Deploy do back-end (Render) e do front-end (Vercel), cada um na sua plataforma
- [ ] Testar o fluxo completo em produção com um usuário de teste real

**Conceitos para pesquisar:** diferença entre ambiente local/produção, migrations vs. rodar SQL manualmente em prod, CORS entre front e back em domínios diferentes.

**Pronto quando:** alguém do seu ministério, fora da sua rede, consegue logar e ver a própria escala pelo celular.

---

## Como usar este arquivo

- Marque os checkboxes conforme avança (`- [x]`)
- Não pule fases — cada uma assume que a anterior já funciona
- Quando travar, primeiro tente formular a pergunta certa antes de pesquisar a resposta pronta
- Volte para a Fase 0 sempre que a spec mudar — é normal o entendimento evoluir
