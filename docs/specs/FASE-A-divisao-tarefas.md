# Fase A — Divisão de Tarefas (2 pessoas)

Divisão de trabalho da [Fase A](./FASE-A-plano-implementacao.md) entre **duas pessoas**,
pensada para **avançar em paralelo sem conflito de merge**.

- **Wendel (sênior)** — fez a base atual; assume o **caminho crítico do backend-núcleo**.
- **Japa (backend guiado)** — assume **arquivos novos e isolados** do backend, com
  revisão do sênior; não toca nos arquivos-núcleo enquanto a fundação não aterrissa.

> ⚠️ **Por que o corte é por _arquivo_, não por passo:** a espinha dorsal da Fase A
> (Passos 0→1→2→3→4) mexe nos mesmos arquivos-núcleo (migrations, `database.ts`, todos os
> `models/*`, `authMiddleware.ts`). Se as duas pessoas editarem esses arquivos ao mesmo
> tempo, o conflito é garantido. Por isso **um único dono** cuida do núcleo, e o outro
> trabalha em **arquivos novos e isolados** que ninguém mais edita.

---

## 🔑 Regras que impedem conflito (ler antes de começar)

1. **Só o Wendel cria migrations.** O `node-pg-migrate` usa arquivos com prefixo de ordem;
   se os dois gerarem migration, a numeração/ordem quebra. **Japa nunca cria arquivo em
   `backend/migrations/`.**
2. **Contrato de API primeiro.** Antes de qualquer tela/consumo, fechamos juntos o formato
   dos endpoints de organização (ver seção _Contrato_ abaixo). Com o contrato acordado,
   o consumo é feito contra um mock e não precisa refazer quando o backend real chegar.
3. **Middlewares são a costura final.** RBAC (`autoriza()`) e PRO (`requerRecurso()`) só são
   plugados **depois** que a base 0→4 aterrissar, usando as funções puras que o Japa
   entregou. Japa **não** edita `authMiddleware.ts`/rotas durante a fundação.
4. **Um branch por dono + PRs pequenos**, seguindo o fatiamento do
   [plano](./FASE-A-plano-implementacao.md#ordem-prs-e-riscos).
5. **Arquivos puros e testáveis** (sem acesso a banco/rede) para o Japa: fáceis de revisar,
   impossível vazar dado entre orgs, e destraváveis sem depender da fundação.

---

## 👤 Wendel — backend-núcleo (caminho crítico, serial)

| Passo | Entrega | Arquivos |
|---|---|---|
| 0 | Infra de migrations (`node-pg-migrate`) | `backend/package.json`, `backend/migrations/` |
| 1 | Baseline do schema atual | `backend/migrations/*` |
| 2 | Schema multi-tenant (`organizacoes`, `org_id`, seed) | `backend/migrations/*` |
| 3 | Auth com `org_id` no JWT + fluxo criar/entrar em org | `controllers/membroController.ts`, `middlewares/authMiddleware.ts`, `controllers/organizacaoController.ts`, `routes/organizacaoRoutes.ts` |
| 4 | **Escopo por org** (camada de repositório) — *o mais arriscado* | `models/*`, camada de repositório, `config/database.ts` |
| 5 | Costura RBAC: middleware `autoriza('capacidade')` | `middlewares/roleMiddleware.ts` (usa o mapa do Japa) |
| 6 | Costura PRO: middleware `requerRecurso()` | novo middleware (usa `podeUsar()` do Japa) |

**Motivo:** exige conhecer o schema atual e é onde se concentra o risco de **vazamento de
dado entre igrejas** (Passo 4). Núcleo com dono único = sem conflito.

---

## 👤 Japa — backend guiado (arquivos novos e isolados)

| Origem | Entrega | Arquivos | Destrava sem esperar? |
|---|---|---|---|
| Passo 2 | Gerador de código de convite `PREFIXO-XXXXXX` (sem `0/O/1/I`) + testes | `backend/src/utils/orgCode.ts` | ✅ Sim (função pura) |
| Passo 5 | Catálogo de **capacidades** + mapa de papéis (dados puros) | `backend/src/config/capacidades.ts`, `backend/src/utils/papel.ts` | ✅ Sim |
| Passo 6 | Catálogo de **recursos** + `podeUsar(org, recurso)` (função pura) | `backend/src/config/recursos.ts` | ✅ Sim |
| Passo 8 | Infra de teste de isolamento (fixtures de 2 orgs, helpers) | setup de teste | ⚠️ Parcial (assertivas dependem dos endpoints) |
| Passo 7 | Frontend de criar/entrar em org (opcional, depois das entregas acima) | telas RN, `AuthContext`, `useRecurso()` | ✅ Sim (contra o contrato) |

**Motivo:** são **arquivos novos** que ninguém mais edita → zero conflito. São **funções
puras** → fáceis de testar e revisar, e impossível vazar dado entre orgs. E **destravam sem
esperar** a fundação ficar pronta.

---

## 🤝 Contrato de API (fechar juntos antes do Japa consumir)

Definir o formato destes endpoints **antes** de qualquer consumo, para o frontend/mocks não
precisarem de retrabalho:

- `POST /organizacoes` — criar organização (o criador vira admin). → retorna org + código.
- `POST /organizacoes/entrar` — entrar via código de convite.
- `POST /login` — passa a incluir `org_id` (e depois `papel_org`) no token.

> Esboço detalhado do modelo em [`01-multi-tenant.md`](./01-multi-tenant.md).

---

## ⏱️ Ordem no tempo (Japa nunca fica travado)

| Sprint | Wendel | Japa |
|---|---|---|
| 1 | Passos 0 → 1 → 2 | `orgCode.ts` + catálogos de recursos/capacidades (arquivos novos puros) |
| 2 | Passos 3 → 4 (o pesado) | fixtures de teste + (opcional) frontend contra o contrato |
| 3 | Costura 5 e 6 usando os módulos puros do Japa | testes de isolamento (Passo 8) juntos |

**Sequência obrigatória do núcleo:** 0 → 1 → 2 → 3 → 4 (serial, um dono). RBAC (5) e PRO (6)
vêm depois e são independentes entre si.

---

## ✅ Definição de pronto da Fase A (compartilhada)

- Um banco criado só com migrations é idêntico ao atual (Passo 1).
- Dois usuários de orgs diferentes recebem tokens com `org_id` distintos (Passo 3).
- Teste com 2 orgs mostra **zero vazamento** — A não lê/edita nada de B (Passos 4 + 8).
- Um "Membro" recebe 403 em ações de admin/líder (Passo 5).
- Dá pra marcar uma rota como PRO e o gate passa a exigir plano, sem afetar as demais (Passo 6).
