# 00 — Arquitetura Geral

## Objetivo

Definir os padrões arquiteturais que **todas** as outras specs vão seguir, para que a
plataforma cresça de forma modular, testável e preparada para multi-tenant e planos PRO —
sem transformar o código num emaranhado.

Não é uma reescrita "big bang". É estabelecer as **camadas e convenções** e ir migrando
por módulo, à medida que cada frente é implementada.

---

## Contexto atual

**Backend** (`backend/src/`) hoje é um MVC enxuto:
`routes → controllers → models` (models escrevem SQL direto via `pg`, sem ORM). Não há
camada de serviço/domínio consistente (só `services/emailService.ts`). Não há testes.

**Frontend** (`frontend/src/`): `screens` + `services` (axios) + `contexts` + `components`.
Estado de auth em `AuthContext`. Sem gerência de estado de servidor (cache/refetch é manual).

Isso funciona bem no tamanho atual. O problema é que os novos módulos (multi-tenant, RBAC,
PRO, reuniões) adicionam **regra de negócio transversal** que não cabe bem em controllers
que chamam models direto.

---

## Decisões-chave

### D-00.1 — Quão longe levar "Clean Architecture / DDD"

A spec original pede "Clean Architecture / DDD quando aplicável". Isso é um espectro, não
um botão liga/desliga. Opções:

| Opção | O que é | Prós | Contras |
|-------|---------|------|---------|
| **A. Manter MVC + adicionar camada `services/`** (pragmático) | Controllers finos → `services` (regra de negócio) → `models` (SQL). Sem entidades de domínio ricas. | Baixo atrito; time pequeno; migração incremental; fácil de entender | Menos "purista"; regra ainda acoplada ao Postgres |
| **B. Clean Architecture leve por módulo** | Cada módulo (`membros`, `escalas`, `reunioes`...) vira uma pasta com `domain` / `application` (use-cases) / `infra` (repositórios) | Módulos isolados; testável sem banco; escala bem | Mais boilerplate; curva maior; risco de over-engineering num projeto pessoal |
| **C. DDD completo** (agregados, value objects, event bus) | Modelagem rica de domínio | Poderoso pra domínios complexos | Exagero para o escopo atual; alto custo |

> **Recomendação:** começar em **A** e evoluir para **B só nos módulos que ganharem
> complexidade real** (ex.: reuniões, RBAC). DDD completo (C) provavelmente é over-engineering aqui.

**Decisão: ✅ A — Manter MVC + camada `services/`**, evoluindo para Clean Architecture leve (B) por módulo conforme a complexidade exigir (ex.: reuniões, RBAC). DDD completo (C) descartado.

---

### D-00.2 — Estrutura de pastas do backend

| Opção | Layout | Nota |
|-------|--------|------|
| **Por tipo (atual)** | `controllers/`, `models/`, `routes/`, `services/` | Familiar, mas espalha um módulo por 4 pastas |
| **Por feature/módulo** | `modules/escalas/{routes,controller,service,repository}.ts` | Cada módulo autocontido; melhor pra crescer e pra multi-tenant |

> **Recomendação:** migrar gradualmente para **por módulo** conforme cada spec é
> implementada (não precisa migrar tudo de uma vez).

**Decisão: ✅ Migração gradual para estrutura por módulo** (`modules/<x>/{routes,controller,service,repository}.ts`), conforme cada spec é implementada — não migrar tudo de uma vez. Casa com o requisito de repositório centralizado da spec 01.

---

### D-00.3 — Estado de servidor no frontend

Com mais telas e dados por organização, o padrão atual (axios manual + `useState`) vai
gerar muito código repetido de loading/erro/refetch.

| Opção | Prós | Contras |
|-------|------|---------|
| **Manter axios manual** | Zero dependência nova | Muito boilerplate; cache/invalidação na mão |
| **TanStack Query (React Query)** | Cache, refetch, estados de loading/erro prontos; ótimo com REST; ajuda no offline | Nova dependência; curva pequena |

> **Recomendação:** adotar **TanStack Query** já na Fase B (redesign), pois o redesign vai
> mexer em todas as telas de qualquer forma.

**Decisão: ✅ Adotar TanStack Query na Fase B** (redesign), já que todas as telas serão tocadas.

---

## Padrões transversais a estabelecer (independente das decisões acima)

Estes valem como convenção desde a Fase A:

1. **Tratamento de erro padronizado** — um `errorHandler` middleware no Express + um formato
   de resposta de erro único (`{ error: { code, message } }`). Hoje cada controller trata
   erro do seu jeito.
2. **Validação de entrada** — adotar um validador (ex.: **Zod**) nas bordas (body/params),
   em vez de checagens manuais espalhadas. Serve backend e frontend.
3. **Contexto de request** — carregar `req.user` (já existe) **e** `req.orgId` (novo, Fase 01)
   de forma centralizada num middleware.
4. **Tipos compartilhados** — hoje os tipos são duplicados entre back e front. Avaliar um
   pacote/pasta `shared/` de tipos (decisão menor, pode ficar pra depois).
5. **Migrations de banco** — hoje não há versionamento de schema (o SQL das tabelas não está
   versionado no repo de forma executável). **Isto é bloqueante para multi-tenant.** Ver D-00.4.

---

### D-00.4 — Migrations de banco de dados (bloqueante)

Multi-tenant e todos os módulos novos criam/alteram tabelas. Sem um sistema de migrations,
isso vira SQL solto e frágil.

| Opção | Prós | Contras |
|-------|------|---------|
| **node-pg-migrate** | Simples, casa com o `pg` já usado (sem ORM) | Migrations em JS/SQL manual |
| **Drizzle Kit** (só migrations, sem virar ORM completo) | Migrations tipadas + schema em TS | Introduz conceitos de ORM |
| **SQL versionado + runner caseiro** | Zero dependência | Reinventar a roda |

> **Recomendação:** **node-pg-migrate** — mantém a filosofia "SQL sem ORM" do projeto e
> resolve o versionamento. Deve ser a **primeira** coisa a entrar na Fase A.

**Decisão: ✅ node-pg-migrate** — mantém a filosofia 'SQL sem ORM'. É a primeira tarefa da Fase A (pré-requisito do multi-tenant).

---

## Tarefas

- [x] **T-00.1** — ✅ Decidido (ver seção Decisões-chave). Fechar decisões D-00.1 a D-00.4.
- [ ] **T-00.2** — Introduzir sistema de migrations e portar o schema atual para a primeira
  migration ("baseline"). _Pronto quando:_ um banco novo é criado do zero rodando as migrations.
- [ ] **T-00.3** — Criar `errorHandler` central + formato de erro padrão e aplicar em 1 módulo
  piloto (membros). _Pronto quando:_ erros de membros saem no formato novo e o restante segue igual até ser migrado.
- [ ] **T-00.4** — Introduzir Zod na validação de 1 rota piloto. _Pronto quando:_ body inválido
  retorna 400 com mensagem clara e tipada.
- [ ] **T-00.5** — (Fase B) Introduzir TanStack Query numa tela piloto.
- [ ] **T-00.6** — Documentar as convenções escolhidas num `CONTRIBUTING.md` curto (ou
  atualizar o CLAUDE.md) pra servir de referência das próximas specs.

---

## Dependências & riscos

- **Bloqueante para:** 01 (Multi-Tenant) depende de migrations (T-00.2).
- **Risco:** tentar migrar tudo de arquitetura de uma vez. Mitigação: migração **incremental
  por módulo**, mantendo o código atual funcionando.
