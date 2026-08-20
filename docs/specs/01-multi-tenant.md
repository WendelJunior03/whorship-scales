# 01 — Multi-Tenant (Organizações / Igrejas)

## Objetivo

Transformar o sistema de "uma única igreja" para **múltiplas igrejas (organizações)
isoladas**. Cada organização tem seus próprios usuários, músicas, escalas, cultos,
reuniões, vídeos, configurações e permissões. **Nenhuma organização enxerga dados de
outra.**

Fluxo de entrada:
- Ao criar conta, o usuário **cria uma nova organização** _ou_ **entra em uma existente via código** (ex.: `QG-83HF92`).
- Após entrar, todos os dados do usuário passam a pertencer àquela organização.

Esta é a **frente mais estrutural** do roadmap: toca praticamente todas as tabelas e todas
as queries existentes.

---

## Contexto atual

- Todas as tabelas (`membros`, `cultos`, `escala_fixa`, `escala_vocal`, `escala_avulsa`,
  `excecoes`, `repertorio`, `notificacoes`) hoje pertencem implicitamente a **uma** igreja.
- Auth via JWT carrega o `membro` logado (`req.user`). O token **não** tem noção de organização.
- Não há tabela de organização, nem código de convite, nem escopo por igreja nas queries.

---

## Decisões-chave

### D-01.1 — Estratégia de isolamento no Postgres (a decisão central)

| Opção | Como funciona | Prós | Contras |
|-------|---------------|------|---------|
| **A. Shared DB + `org_id` em cada tabela** (discriminator column) | Uma coluna `org_id` em toda tabela; todo `WHERE` filtra por ela | Simples; barato; 1 banco; fácil migrar; ideal pra começar | Isolamento depende de disciplina no código (esquecer um `WHERE` vaza dados) |
| **B. Shared DB + `org_id` + Row-Level Security (RLS)** | Igual A, mas o Postgres **força** o filtro via políticas RLS por `org_id` de sessão | Isolamento garantido pelo banco, não pelo dev; defesa em profundidade | Mais complexo de configurar; precisa setar `SET app.current_org` por request |
| **C. Schema por tenant** | Cada igreja em um schema Postgres separado | Isolamento forte; fácil exportar/apagar uma igreja | Migrations em N schemas; complexidade operacional cresce com nº de igrejas |
| **D. Banco por tenant** | Um banco por igreja | Isolamento máximo | Inviável no free tier (Neon); over-engineering total agora |

> **Recomendação:** **A** para a v1 (simplicidade e custo), com o **código já preparado**
> para evoluir para **B (RLS)** quando houver dados sensíveis de muitas igrejas. C/D são
> over-engineering para o momento. A chave para migrar de A→B depois é **centralizar o
> acesso a dados** (repositórios) desde já, nunca espalhar SQL cru sem escopo.

**Decisão: ✅ A — `org_id` em cada tabela** (shared DB + discriminator column).
Requisito de implementação: **centralizar o acesso a dados em repositórios** para poder
evoluir para **B (RLS)** no futuro sem reescrever queries. C e D descartados (custo/complexidade).

---

### D-01.2 — Como o `org_id` chega às queries

| Opção | Prós | Contras |
|-------|------|---------|
| **Do JWT** (org fixa no token) | Zero query extra; simples | Trocar de organização exige novo login/refresh token |
| **Do JWT + endpoint de "trocar organização"** | Suporta usuário em várias igrejas no futuro | Um pouco mais de lógica |

> **Recomendação:** guardar `org_id` no JWT (junto com `user_id` e papel). Um usuário =
> uma organização ativa por sessão na v1. Suporte a "múltiplas igrejas por usuário" fica
> como evolução (a spec de multi-igreja em reuniões já aponta pra isso).

**Decisão: ✅ `org_id` fixo no JWT** (1 organização ativa por sessão). Sem endpoint de
troca de organização na v1 — trocar de igreja exige novo login. Alinhado com D-01.4 abaixo.

---

### D-01.3 — Formato do código da organização

Exemplos da spec: `QG-83HF92`, `ADCENTRAL-92AB`.

- **Prefixo** derivado do nome (sigla) + **sufixo aleatório** (base32/sem caracteres ambíguos: sem `0/O`, `1/I`).
- Precisa ser **único**, **curto**, **fácil de digitar/ditar** e **não sequencial** (não expõe quantidade de igrejas).
- Decidir: o prefixo é editável pelo admin ou 100% gerado? (Sugestão: sugerido a partir do nome, editável, com validação de unicidade.)

**Decisão: ✅ Prefixo sugerido (editável) + sufixo aleatório.**
- **Prefixo:** sugerido a partir do nome da igreja (sigla em maiúsculas, sem acentos/espaços),
  **editável** pelo admin na criação.
- **Sufixo:** aleatório de **6 caracteres**, alfabeto **sem ambíguos** (excluir `0 O 1 I`),
  em maiúsculas.
- **Formato final:** `PREFIXO-XXXXXX` (ex.: `QG-83HF92`). **Unicidade validada** no banco
  (regenerar o sufixo em caso de colisão).

---

### D-01.5 — Fluxo de aprovação da entrada (solicitação de ingresso)

Entrar via código **não** vincula o usuário na hora: gera uma **solicitação de ingresso
pendente** que precisa ser **aprovada dentro do APP** antes de o integrante virar membro
efetivo da organização/ministério.

**Comportamento pedido (dono):**

- **Estado pendente (lado do integrante):** enquanto a solicitação não é aprovada, o app
  fica numa **tela de "solicitação pendente de aprovação"**, exibindo:
  - o **nome da organização/igreja** para a qual pediu entrada;
  - um botão **"Cancelar solicitação"**.
- **Cancelamento:** ao cancelar, o app **pergunta o motivo** ("por que está cancelando a
  solicitação?"). O motivo é **obrigatório** registrar e **fica visível para o admin**.
- **Notificação ao admin:** quando o integrante cancela, o **admin recebe uma notificação**
  de que a solicitação foi cancelada, **com o motivo informado**.

**Decisão: ✅ Quem aprova — Administrador OU Líder.** A aprovação/recusa da solicitação
pode ser feita pelo **Administrador** ou delegada a um **Líder** do ministério (não-admin).
Modelar como capacidade `ingresso.aprovar` na spec 02 (RBAC), concedida a Administrador e Líder.

**Decisão: ✅ Escopo — entrada em um ministério específico.** A solicitação já é
**direcionada a um ministério** (ex.: louvor), não à organização de forma genérica — coerente
com "integrantes do ministério". Logo `solicitacoes_ingresso.ministerio_id` é **obrigatório**,
e a tela de pendente exibe o ministério além do nome da organização.

---

## Modelo de dados (esboço)

```
organizacoes
  id            PK
  nome          text        -- "Quadrangular Guarani"
  codigo        text UNIQUE  -- "QG-83HF92"  (código de convite/entrada)
  slug          text UNIQUE  -- identificador interno url-safe
  criado_por    FK -> membros.id
  plano         text         -- 'free' | 'pro'  (ver spec 03)
  created_at    timestamptz

-- Nova coluna em TODAS as tabelas de dados:
membros        + org_id FK -> organizacoes.id
cultos         + org_id
escala_fixa    + org_id
escala_vocal   + org_id
escala_avulsa  + org_id
excecoes       + org_id
repertorio     + org_id
notificacoes   + org_id
-- (e todas as tabelas dos módulos futuros nascem com org_id)

-- Solicitação de ingresso (fluxo de aprovação — D-01.5):
solicitacoes_ingresso
  id                    PK
  org_id                FK -> organizacoes.id   -- org alvo (resolvida pelo código)
  membro_id             FK -> membros.id        -- quem solicitou
  status                text   -- 'pendente' | 'aprovada' | 'recusada' | 'cancelada'
  motivo_cancelamento   text   -- preenchido quando status = 'cancelada' (obrigatório no cancelamento)
  aprovada_por          FK -> membros.id  NULL  -- quem aprovou (Administrador ou Líder — D-01.5)
  ministerio_id         FK  NOT NULL            -- ministério alvo da solicitação (entrada por ministério — D-01.5)
  created_at            timestamptz
  updated_at            timestamptz
```

Observações:
- Índice em `org_id` em cada tabela (todas as queries filtram por ele).
- `membros.papel` continua existindo, mas o papel passa a ser **por organização** (ver spec 02 — RBAC).
- Um `membro` pertence a **uma** `org_id` na v1. (Modelo N:N usuário↔organização é evolução futura → exigiria tabela `membros_organizacoes`.)

**Decisão: ✅ D-01.4 — 1 organização por usuário na v1.** Um `membro` tem exatamente um
`org_id`. O modelo N:N (`membros_organizacoes`) fica como evolução futura, se surgir a
necessidade real (ex.: músico que serve em duas igrejas).

---

## Impacto no que já existe (grande)

- **Migration** adicionando `org_id` a todas as tabelas + criando `organizacoes`. Para os
  dados atuais (a igreja do autor), criar uma organização "seed" e vincular os registros existentes a ela.
- **Auth:** `loginUser` e `cadastrarUser` passam a incluir `org_id` no JWT. Cadastro ganha
  dois fluxos: "criar org" e "entrar via código".
- **Todos os models** precisam receber e filtrar por `org_id`. É aqui que compensa a
  **camada de repositório** (spec 00): centralizar o escopo por organização num único lugar
  em vez de espalhar `WHERE org_id = $x` em dezenas de funções.
- **Middleware novo:** resolver `req.orgId` a partir do token e disponibilizar pra toda rota.
- **Sugestão de rodízio de vocais** (`sugerirVocais`) e demais queries com JOIN precisam do
  filtro por `org_id` em cada tabela do JOIN.
- **Frontend:** telas de "Criar organização" e "Entrar em organização" no fluxo de cadastro;
  exibir nome/código da igreja; tela de admin pra ver/compartilhar o código de convite.

---

## Tarefas

- [x] **T-01.1** — ~~Fechar D-01.1, D-01.2, D-01.3 e o dilema 1-org-vs-N-orgs.~~ ✅ **Decidido:**
  isolamento por `org_id` (A); `org_id` no JWT; 1 org por usuário; código `PREFIXO-XXXXXX`
  (prefixo editável + sufixo 6 chars sem ambíguos); dados atuais migrados para uma org "seed".
- [x] **T-01.2** — Migration: tabela `organizacoes` + `org_id` em todas as tabelas + índices. ✅ (Passo 2)
  _Pronto quando:_ schema criado do zero já nasce multi-tenant.
- [x] **T-01.3** — Migration de dados: criar org "seed" e vincular registros atuais. ✅ (Passo 2)
  _Pronto quando:_ dados existentes pertencem a uma organização e nada quebra.
- [x] **T-01.4** — Geração de código único de organização (com unicidade garantida). ✅ (Passo 3)
  _Pronto quando:_ criar org gera um código no formato definido e colisão é impossível.
- [~] **T-01.5** — Fluxo de cadastro: "criar organização" (vira admin dela) e "entrar via código".
  ✅ (Passo 3) fluxos e tokens com `org_id` distintos prontos; o "não veem dados um do outro"
  depende do escopo por `org_id` nas queries (T-01.7 / Passo 4).
- [x] **T-01.6** — `org_id` no JWT + middleware `resolveOrg`. ✅ (Passo 3) `req.orgId` disponível
  em toda rota autenticada. _Pronto quando:_ toda rota autenticada tem `req.orgId` disponível.
- [ ] **T-01.7** — Escopar **todas** as queries existentes por `org_id` (idealmente via
  camada de repositório). _Pronto quando:_ teste manual com 2 orgs confirma zero vazamento.
- [ ] **T-01.8** — Telas de front: criar/entrar em organização; exibir código de convite pro admin.
- [ ] **T-01.9** — Teste de isolamento (checklist ou teste automatizado) cobrindo cada endpoint.
  _Pronto quando:_ um usuário da org A não consegue ler/alterar nada da org B (403/404).
- [ ] **T-01.10** — Fluxo de aprovação de ingresso (D-01.5): entrar via código cria
  `solicitacoes_ingresso` com status `pendente` (não vincula na hora); endpoints de
  aprovar/recusar e de cancelar (com `motivo_cancelamento` obrigatório).
  _Pronto quando:_ o integrante só vira membro efetivo após aprovação; cancelar exige motivo.
- [ ] **T-01.11** — Front do integrante: tela de "solicitação pendente" mostrando o **nome
  da organização** + botão **Cancelar**; ao cancelar, prompt de **motivo** obrigatório.
  _Pronto quando:_ integrante com solicitação pendente vê a tela e consegue cancelar informando o motivo.
- [ ] **T-01.12** — Notificação ao admin quando o integrante cancela, **exibindo o motivo**
  informado. _Pronto quando:_ o admin recebe a notificação de cancelamento com o texto do motivo.
- [x] **T-01.13** — ✅ Fechar D-01.5: **Administrador ou Líder** aprovam (capacidade
  `ingresso.aprovar`); entrada é **por ministério** (`ministerio_id` obrigatório). Refletir na spec 02.

---

## Dependências & riscos

- **Depende de:** 00 (migrations — T-00.2).
- **Bloqueia:** praticamente todos os módulos novos nascem com `org_id`. Fazer isto **antes** deles evita reescrever cada módulo.
- **Risco alto:** vazamento entre organizações por esquecer um filtro. **Mitigação:**
  centralizar acesso a dados (repositório) + teste de isolamento (T-01.9) + considerar RLS
  (opção B) como rede de segurança.
- **Risco:** migration de dados existentes. **Mitigação:** backup antes; rodar primeiro num banco de teste.
