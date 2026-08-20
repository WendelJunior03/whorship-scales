# 02 — RBAC (Sistema de Permissões)

## Objetivo

Evoluir o controle de acesso atual (baseado em um enum de papel simples) para um sistema de
**permissões por papel desacoplado**, capaz de suportar os novos cenários:

- Papéis do módulo de liderança: **Membro**, **Líder**, **Administrador**.
- Ações administrativas (convidar líderes, promover/remover, agendar reuniões).
- Permissões **por organização** (o papel vale dentro da igreja — spec 01).
- Base para o gating de recursos do **plano PRO** (spec 03) — que é ortogonal ao RBAC.

---

## Contexto atual

- Papéis hoje: `admin`, `ministro`, `vocal`, `membro` (coluna `membros.papel`).
- Autorização via `authMiddleware.ts` (valida JWT) + `roleMiddleware.ts` →
  `autorizator(['admin', 'ministro'])` protege rotas por lista de papéis.
- É um RBAC **implícito e acoplado**: as regras estão espalhadas como listas de strings de
  papel dentro de cada rota.

A spec de evolução introduz papéis de **liderança** (Membro / Líder / Administrador) que
**não são os mesmos** dos papéis musicais (vocal, ministro, instrumentista). Isso é a
principal tensão de modelagem desta frente.

---

## Decisões-chave

### D-02.1 — Como modelar os dois "eixos" de papel

O sistema passa a ter **dois conceitos diferentes** de papel:
1. **Papel musical/ministério** — instrumentista, vocal, ministro (usado nas escalas).
2. **Papel administrativo/organizacional** — membro, líder, administrador (usado em
   permissões, reuniões, convites).

| Opção | Como | Prós | Contras |
|-------|------|------|---------|
| **A. Um enum só, ampliado** | Continuar com uma coluna `papel` e adicionar `lider`/`administrador` | Menor mudança | Mistura dois conceitos; "sou vocal E líder" fica impossível; vira gambiarra |
| **B. Dois campos separados** | `papel_ministerio` (musical) + `papel_org` (membro/líder/admin) | Simples; representa a realidade (alguém pode ser vocal e líder) | Duas colunas; regras ainda por-papel |
| **C. RBAC granular (papéis + permissões)** | Tabelas `roles`, `permissions`, `role_permissions`, `user_roles`. Rotas checam **permissão** (`meetings.create`), não papel | Flexível; escala pra qualquer papel futuro; permissões versionáveis | Mais complexo; provavelmente além do necessário agora |

> **Recomendação:** **B** agora (dois eixos de papel, ainda checando por papel), com as
> checagens de rota já escritas em termos de **capacidade** (`podeGerenciarLideranca`) e não
> de string de papel — assim a migração futura para **C** (permissões granulares) fica barata
> se o produto crescer. **A** cria dívida; **C** é over-engineering hoje.

**Decisão: ✅ B — Dois eixos de papel:** `papel_ministerio` (musical) + `papel_org` (Membro/Líder/Administrador). Checagens escritas por capacidade para permitir evoluir a RBAC granular (C) no futuro sem retrabalho.

---

### D-02.2 — Autorização desacoplada no código

Independente de A/B/C, a spec original pede "sistema de permissões desacoplado". Hoje as
regras estão como listas de strings nas rotas. Proposta:

- Definir um mapa central de **capacidades → quem pode** (ex.: `escala.gerenciar`,
  `lideranca.convidar`, `reuniao.agendar`, `membro.promover`, `ingresso.aprovar`).
  - `ingresso.aprovar` (aprovar/recusar solicitações de ingresso — ver spec 01 D-01.5):
    concedida a **Administrador** e **Líder** do ministério.
- Middleware `autoriza('reuniao.agendar')` em vez de `autorizator(['admin'])`.
- Vantagem: mudar quem pode fazer o quê acontece em **um só lugar**, não em N rotas.

**Decisão: ✅ Checagem por capacidade desde já** — `autoriza('reuniao.agendar')` com um mapa central capacidade→quem-pode, em vez de listas de strings de papel nas rotas.

---

### D-02.3 — Mapeamento dos papéis atuais

Como os papéis existentes se encaixam no eixo organizacional?

| Papel atual | Papel org sugerido | Observação |
|-------------|--------------------|------------|
| `admin` | Administrador | Ganha gestão de liderança/convites/reuniões |
| `ministro` | Líder (ou Admin?) | **Decidir:** ministro vira Líder ou continua com poderes de admin? |
| `vocal` | Membro | Papel musical permanece em `papel_ministerio` |
| `membro` | Membro | — |

**Decisão: ✅ `admin` → Administrador; `ministro` → Membro; `vocal`/`membro` → Membro.** Os poderes do ministro sobre escala/repertório vêm do eixo musical (`papel_ministerio`), não do organizacional. Acesso à liderança é concedido promovendo explicitamente alguém a Líder/Administrador.

---

## Modelo de dados (esboço — assumindo opção B)

```
membros
  ... (colunas atuais)
  papel_ministerio  text   -- 'ministro' | 'vocal' | 'instrumentista' (musical; pode ser null)
  papel_org         text   -- 'administrador' | 'lider' | 'membro'    (organizacional)
```

Se optar por **C (granular)** no futuro:
```
roles              (id, org_id, nome)
permissions        (id, chave)               -- 'reuniao.agendar', ...
role_permissions   (role_id, permission_id)
membro_roles       (membro_id, role_id)
```

> Observação: papéis passam a ser **por organização** (spec 01). Na opção B isso já está
> resolvido (a coluna vive em `membros`, que tem `org_id`).

---

## Impacto no que já existe

- `roleMiddleware.ts` evolui de `autorizator([papéis])` para `autoriza('capacidade')`
  (mantendo compatibilidade durante a migração).
- Migration adicionando `papel_org` (e renomeando/derivando `papel` → `papel_ministerio`).
- JWT passa a carregar `papel_org` (além do que já carrega) pra evitar consulta a cada request.
- Telas de gestão de membros expõem o novo eixo de papel; tela de "gerenciar liderança"
  (promover/remover líder) — detalhada na spec 07.
- Frontend: helpers atuais em `utils/papel.ts` precisam entender os dois eixos.

---

## Tarefas

- [x] **T-02.1** — ✅ Decidido (ver seção Decisões-chave). Fechar D-02.1 (modelo), D-02.2 (capacidades) e D-02.3 (mapeamento).
- [ ] **T-02.2** — Migration dos papéis (novo eixo organizacional + derivar dados atuais).
  _Pronto quando:_ todo membro existente tem `papel_org` coerente com o papel antigo.
- [ ] **T-02.3** — Mapa central de capacidades + middleware `autoriza(capacidade)`.
  _Pronto quando:_ pelo menos as rotas de membros/escala usam capacidade em vez de string de papel.
- [ ] **T-02.4** — `papel_org` no JWT.
- [ ] **T-02.5** — UI: exibir/editar papel organizacional na gestão de membros (respeitando quem pode).
- [ ] **T-02.6** — Testes de autorização: cada capacidade só é permitida a quem deve.
  _Pronto quando:_ um "membro" recebe 403 em ações de admin/líder.

---

## Dependências & riscos

- **Depende de:** 01 (papéis são por organização) e 00 (migrations).
- **Bloqueia:** 07 (Reuniões da Liderança) e o gating de 03 (PRO).
- **Nota:** RBAC (quem pode) e plano (Free/PRO — o que está liberado) são **ortogonais**.
  Uma ação pode exigir *ser admin* **e** *ter plano PRO*. Manter as duas checagens separadas.
- **Risco:** confundir os dois eixos de papel. Mitigação: nomear claramente
  (`papel_ministerio` vs `papel_org`) e documentar.
