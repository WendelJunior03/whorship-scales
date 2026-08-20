# 03 — Plano PRO & Feature Flags

> ⚠️ **Atualização (spec 11, D-11.2 = híbrido):** o modelo de monetização passa a ser
> **híbrido** — além do gating de recursos por plano (esta spec), há **vagas/assentos por
> ministério** (10 grátis + pacotes extras; ver spec 11, módulo 12). Os dois eixos são
> **ortogonais**: uma ação pode exigir *ter vaga* **e** *plano PRO*. Esta spec segue válida
> para a parte de **feature flags**; o billing de assentos vive na spec 11.

## Objetivo

Preparar a arquitetura para **monetização futura** sem bloquear nada agora. Inicialmente
**todas as funcionalidades permanecem liberadas**, mas o sistema já nasce com:

- Conceito de **plano** por organização (`free` / `pro`).
- Um mecanismo de **feature flags** para ligar/desligar recursos e fazer gating por plano.

Assim, quando a cobrança entrar, é só "virar a chave" — sem refatorar módulo por módulo.

Recursos candidatos a PRO (da spec original): downloads offline, packs exclusivos de pads,
biblioteca premium, upload de samples, afinador avançado, organizações ilimitadas,
armazenamento expandido, playlists, estatísticas, backup automático, recursos avançados de
líder, conteúdos exclusivos.

---

## Contexto atual

- Não existe conceito de plano nem de flags. Tudo é liberado por papel.
- A spec 01 (multi-tenant) já prevê `organizacoes.plano`.

---

## Decisões-chave

### D-03.1 — Feature flags: caseiro vs. biblioteca vs. serviço

| Opção | O que é | Prós | Contras |
|-------|---------|------|---------|
| **A. Caseiro (tabela + config)** | Flags numa config/tabela, resolvidas por plano/org | Zero custo/dependência; controle total; suficiente pra "Free x PRO" | Sem UI de gestão pronta; rollout/percentual na mão |
| **B. Lib open source** (ex.: Unleash self-hosted, Flagsmith) | Servidor de flags dedicado | UI de gestão; rollout gradual; targeting avançado | Infra extra; over-engineering pra necessidade atual |
| **C. SaaS** (LaunchDarkly, etc.) | Flags como serviço | Poderoso | Custo; dependência externa; exagero agora |

> **Recomendação:** **A (caseiro)**. Para "Free x PRO" num projeto nesse estágio, uma
> definição central de flags + um resolvedor por plano resolve. Migrar pra B/C só se um dia
> precisar de rollout percentual, A/B testing etc.

**Decisão: ✅ A — Feature flags caseiro** (catálogo central de recursos + resolvedor por plano). Migrar para lib/SaaS só se um dia precisar de rollout percentual / A-B testing.

---

### D-03.2 — Modelo de gating: por plano, por flag, ou ambos

| Conceito | Papel |
|----------|-------|
| **Plano** (`free`/`pro`) | Define **o que a organização comprou** |
| **Feature flag** | Define **se um recurso está ligado** (por ambiente, org, ou plano) |
| **RBAC** (spec 02) | Define **quem, dentro da org, pode usar** |

Proposta: um recurso é acessível se `flag_ligada(recurso) && plano_permite(recurso) && rbac_permite(acao)`.
Na v1, `plano_permite` retorna **sempre true** (tudo liberado), mas o ponto de checagem já existe.

**Decisão: ✅ Três eixos:** `flag_ativa && plano_permite && rbac_permite`. Na v1 `plano_permite` retorna sempre true (tudo liberado), mas o ponto de checagem já existe.

---

### D-03.3 — Onde a checagem acontece

- **Backend:** fonte da verdade. Um helper `podeUsar(org, recurso)` + middleware `requerRecurso('samples.upload')` nas rotas PRO.
- **Frontend:** apenas **espelha** pra UX (esconder/mostrar, mostrar selo "PRO", CTA de upgrade). Nunca confiar só no front.

**Decisão: ✅ Backend é a fonte da verdade** (`requerRecurso(...)`); o frontend apenas espelha (selo PRO / CTA de upgrade), nunca confia só no front.

---

## Modelo de dados (esboço)

```
organizacoes
  ... 
  plano        text default 'free'   -- 'free' | 'pro'  (já previsto na spec 01)
  plano_expira timestamptz null      -- pra assinatura futura

-- Catálogo de recursos e o plano mínimo exigido (config, pode ser código ou tabela):
recursos (catálogo)
  chave         text   -- 'samples.upload', 'offline.download', 'pads.pack_premium'
  plano_minimo  text   -- 'free' | 'pro'
  flag_ativa    bool   -- liga/desliga global

-- (Assinatura/pagamento fica fora do escopo v1 — só o "esqueleto" do plano.)
```

> A **integração de pagamento** (gateway, webhooks, cobrança recorrente) é explicitamente
> **fora do escopo desta fase**. Aqui só entregamos a *estrutura* que a cobrança vai usar.

---

## Impacto no que já existe

- Adicionar `plano` a `organizacoes` (já na migration da spec 01, ou incremental).
- Criar o resolvedor de recursos + middleware `requerRecurso(...)`.
- Frontend: componente de "selo PRO" / "bloqueio com CTA de upgrade" reutilizável (entra no design system da spec 04).
- Cada módulo novo (05–09) marca quais features são candidatas a PRO usando a **chave de recurso** — sem bloquear nada ainda.

---

## Tarefas

- [x] **T-03.1** — ✅ Decidido (ver seção Decisões-chave). Fechar D-03.1, D-03.2, D-03.3.
- [ ] **T-03.2** — Definir o catálogo inicial de recursos e chaves (mesmo que todos `free` na v1).
  _Pronto quando:_ existe uma lista central de `chave → plano_minimo → flag`.
- [ ] **T-03.3** — Backend: `podeUsar(org, recurso)` + middleware `requerRecurso`.
  _Pronto quando:_ dá pra marcar uma rota como PRO e, ligando o gate manualmente, ela passa a exigir plano pro.
- [ ] **T-03.4** — Frontend: hook/util `useRecurso(chave)` + componente de bloqueio/selo PRO.
  _Pronto quando:_ uma feature marcada PRO mostra selo, mas continua liberada (v1).
- [ ] **T-03.5** — Documentar como marcar uma feature como PRO (pra as specs 05–09 seguirem o padrão).

---

## Dependências & riscos

- **Depende de:** 01 (plano vive na organização) e 02 (RBAC é eixo separado).
- **Bloqueia (levemente):** módulos 05–09 devem já declarar suas chaves de recurso.
- **Risco:** acoplar plano com papel. Mitigação: manter plano (o que a org comprou) e RBAC
  (quem pode) **separados** (ver spec 02).
- **Fora de escopo:** gateway de pagamento e billing recorrente (fase futura).
