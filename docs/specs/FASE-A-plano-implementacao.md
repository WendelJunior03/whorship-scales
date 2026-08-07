# Fase A — Plano de Implementação (Fundação)

Plano de execução da **Fase A** (fundação) do roadmap de evolução, cobrindo as specs
[00 Arquitetura](./00-arquitetura-geral.md), [01 Multi-Tenant](./01-multi-tenant.md),
[02 RBAC](./02-rbac.md) e [03 Plano PRO](./03-plano-pro-feature-flags.md).

Os passos estão em **ordem de execução** — cada um destrava o próximo. Cada milestone traz
*o que muda*, *arquivos afetados* e *definição de pronto*.

> Baseado no código atual do backend (Express 5 + TS + `pg` sem ORM; auth JWT em
> `membroController.ts` / `authMiddleware.ts`; acesso a dados via helper `query` global em
> `config/database.ts`).

---

## Passo 0 — Infra de migrations (spec 00) · *destrava tudo*

- Adicionar **`node-pg-migrate`** ao backend; scripts `migrate:up` / `migrate:down` no `package.json`.
- Configurar a conexão reusando `DATABASE_URL`/vars atuais (o `config/database.ts` já cobre banco local e nuvem).
- **Arquivos:** `backend/package.json`, nova pasta `backend/migrations/`.
- **Pronto quando:** `npm run migrate:up` roda num banco vazio sem erro.

## Passo 1 — Baseline do schema atual (spec 00)

- Primeira migration recriando **o schema que já existe hoje**: `membros`, `cultos`,
  `escala_fixa`, `escala_vocal`, `escala_avulsa`, `excecoes`, `repertorio`, `notificacoes`.
- ⚠️ **Dependência externa:** o schema não está versionado no repo. É preciso extrair as
  colunas reais (ex.: `pg_dump --schema-only` do banco em produção) para escrever o baseline fiel.
- **Pronto quando:** um banco criado só com as migrations é idêntico ao atual.

## Passo 2 — Schema multi-tenant (spec 01)

- Migration: criar `organizacoes` (`id, nome, codigo, slug, plano, criado_por, created_at`).
- Migration: adicionar `org_id` + índice em **todas** as tabelas de dados.
- Migration de dados: criar org **"seed"**, vincular todos os registros atuais a ela e então
  tornar `org_id` `NOT NULL`.
- Gerador do código `PREFIXO-XXXXXX` (sufixo de 6 chars sem `0/O/1/I`, unicidade validada).
- **Arquivos:** novas migrations + `backend/src/utils/orgCode.ts`.
- **Pronto quando:** dados atuais pertencem à org seed e nada quebra.

## Passo 3 — Auth + fluxo de organização (spec 01)

- `loginUser`: incluir `org_id` (e, no Passo 5, `papel_org`) no JWT — hoje assina só
  `{ id, papel }` (`membroController.ts`).
- `authMiddleware`: expor `req.orgId` além de `req.user`; atualizar `types/express.d.ts`.
- Cadastro em dois fluxos: **criar organização** (usuário vira admin dela) e **entrar via código**.
- **Arquivos:** `controllers/membroController.ts`, `middlewares/authMiddleware.ts`,
  novo `controllers/organizacaoController.ts` + `routes/organizacaoRoutes.ts`.
- **Pronto quando:** dois usuários de orgs diferentes recebem tokens com `org_id` distintos.

## Passo 4 — Escopar os dados por organização (spec 01) · *o passo mais trabalhoso*

- Introduzir camada de **repositório** que injeta `org_id` no acesso a dados — a decisão
  D-01.1 pede centralizar isso, **não** espalhar `WHERE org_id` em cada função.
- Portar model por model para filtrar por `org_id`; atenção às queries com JOIN
  (ex.: `sugerirVocais`, que junta `membros`/`escala_vocal`/`cultos`).
- ⚠️ *Gotcha:* hoje os models usam o `query` global sem escopo (`membroModel.ts` etc.) — é
  aqui que se concentra o risco de vazamento entre organizações.
- **Pronto quando:** teste com 2 orgs mostra **zero** vazamento (A não lê/edita nada de B → 403/404).

## Passo 5 — RBAC (spec 02)

- Migration: adicionar `papel_org` (Administrador/Líder/Membro) e derivar dos papéis atuais
  (`admin`→Administrador, `ministro`/`vocal`/`membro`→Membro).
- Mapa central de **capacidades** + middleware `autoriza('capacidade')` — evolução do
  `autorizator([papéis])` atual (`roleMiddleware.ts`).
- Incluir `papel_org` no JWT; migrar rotas de strings de papel → capacidade.
- **Pronto quando:** um "Membro" recebe 403 em ações de admin/líder.

## Passo 6 — Plano PRO + feature flags (spec 03)

- `organizacoes.plano` (`free`/`pro`) já criado no Passo 2; catálogo central de recursos (chaves).
- Backend `podeUsar(org, recurso)` + middleware `requerRecurso()` (na v1 libera tudo —
  `plano_permite` retorna `true`).
- **Pronto quando:** dá pra marcar uma rota como PRO e, ligando o gate manualmente, ela passa
  a exigir plano — sem afetar as demais.

## Passo 7 — Frontend da fundação

- Telas de **criar / entrar em organização** no fluxo de cadastro; exibir código de convite pro admin.
- Ajustar `AuthContext` (guardar org do usuário); helpers `utils/papel.ts` para os dois eixos de papel.
- Hook `useRecurso()` + componente de **selo PRO** (liberado na v1).
- **Pronto quando:** um usuário cria org, outro entra pelo código, e cada um só vê os próprios dados.

## Passo 8 — Testes de isolamento e autorização

- Checklist (ou testes automatizados) cobrindo cada endpoint: isolamento por org (Passo 4) +
  capacidades (Passo 5).

---

## Ordem, PRs e riscos

- **Sequência obrigatória:** 0 → 1 → 2 → 3 → 4; depois 5 e 6 (independentes entre si);
  7 e 8 ao longo do caminho.
- **Sugestão de PRs** (menores = revisão mais fácil):
  1. migrations + baseline (Passos 0–1)
  2. multi-tenant schema + auth (Passos 2–3)
  3. escopo por org / repositórios (Passo 4)
  4. RBAC (Passo 5)
  5. Plano PRO / feature flags (Passo 6)
- **Riscos principais:**
  - Fidelidade do baseline (Passo 1) — exige o schema real do banco.
  - Vazamento entre organizações (Passo 4) — mitigado pela camada de repositório + Passo 8.
- **Dependência externa:** para o Passo 1, é necessário o **schema real do banco**
  (`pg_dump --schema-only`) para escrever o baseline fiel.

---

## Novas dependências previstas (backend)

- `node-pg-migrate` (migrations).
- (Opcional, spec 00) `zod` para validação de entrada — pode entrar de forma incremental.
- Já presentes: `bcrypt`, `jsonwebtoken`, `pg`, `express`, `dotenv`.
