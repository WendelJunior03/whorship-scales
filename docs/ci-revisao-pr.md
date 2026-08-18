# CI — Validação e revisão automática de PRs

Toda vez que alguém (ex.: o Japa) abre um **Pull Request pra `main`**, dois workflows rodam
automaticamente e comentam/reportam no próprio PR. Você é avisado pelo GitHub (aba **Actions**
+ notificação por e-mail do comentário/checks).

## O que roda

### 1. `Validação de PR` (`.github/workflows/pr-validacao.yml`) — determinístico
Portões objetivos que **bloqueiam** o merge se quebrarem (checks vermelhos):
- **Backend:** sobe um Postgres, roda as migrations (cria schema + **RLS** + role
  `deepscales_app`), `tsc` e **todos os testes** — incluindo os de **segurança**
  (isolamento por org + autorização por capacidade), que rodam de verdade contra o banco
  com RLS ativo.
- **Frontend:** `tsc`, `eslint` e build web (`expo export`).

Não precisa de nenhum secret. Funciona sozinho.

### 2. `Revisão de PR (Claude)` (`.github/workflows/revisao-claude.yml`) — IA
Um revisor sênior (Claude) lê o diff e **comenta no PR**:
- Comentários **inline** nos pontos problemáticos.
- Um **comentário de resumo** que começa com um veredito bem visível:
  - `✅ Aprovado — sem problemas relevantes`
  - `⚠️ Ajustes recomendados`
  - `❌ Problemas graves (segurança/bug)`

Foca em: **segurança multi-tenant** (isolamento por org / RLS, rotas sem `autoriza`, uso
indevido de bypass do RLS), segurança geral (segredos commitados, SQL não parametrizado,
IDOR), **bugs/lógica** e **qualidade** (duplicação, `any`, código mal feito).

## Setup (só uma vez) — necessário só pro review com IA

O portão determinístico já funciona. Pra ligar o review do Claude, crie **um secret**:

1. GitHub → o repositório → **Settings → Secrets and variables → Actions → New repository secret**
2. **Name:** `ANTHROPIC_API_KEY`
3. **Value:** sua chave da Anthropic (em https://console.anthropic.com)
4. Salvar. Pronto — o próximo PR já é revisado.

> **Custo:** cada review consome tokens da API (é cobrado por PR). Alternativa: usar
> `claude_code_oauth_token` (da sua assinatura Claude) no lugar de `anthropic_api_key` — troque
> a linha no workflow e crie o secret correspondente com `claude setup-token`.

> **Sem o secret:** o workflow de IA só falha nessa etapa (não atrapalha o determinístico).

## Observações

- **PR de fork:** se o Japa abrir o PR de um **fork** (repo dele, não uma branch deste repo),
  o GitHub **não** expõe os secrets — o review da IA não roda (segurança do GitHub). Se ele
  trabalhar em branches deste repo (como vem fazendo), roda normal.
- **Ajustar o foco da revisão:** edite o bloco `prompt:` em `revisao-claude.yml`.
- **Rodar também em outras branches:** troque `branches: [main]` nos dois arquivos.
