# CI — Validação e revisão automática de PRs

Toda vez que alguém (ex.: o Japa) abre um **Pull Request pra `main`**, dois workflows rodam
automaticamente e reportam no próprio PR. Você é avisado pelo GitHub (aba **Actions** +
notificação por e-mail dos checks/comentário). **Tudo gratuito, sem API paga e sem configurar
nenhum secret.**

## O que roda

### 1. `Validação de PR` (`.github/workflows/pr-validacao.yml`)
Portões objetivos que **bloqueiam** o merge se quebrarem (checks vermelhos):
- **Backend:** sobe um Postgres, roda as migrations (schema + **RLS** + role `deepscales_app`),
  `tsc` e **todos os testes** — incluindo os de **segurança** (isolamento por org +
  autorização por capacidade), que rodam de verdade contra o banco com RLS ativo.
- **Frontend:** `tsc`, `eslint` e build web (`expo export`).

### 2. `Revisão automática de PR` (`.github/workflows/revisao-automatica.yml`)
Análise estática com **Semgrep** (regras open-source, sem login/token) que **comenta no PR**
um resumo com veredito:
- `✅ Nada crítico encontrado`
- `⚠️ Ajustes recomendados`
- `❌ Problemas graves encontrados` (falha o check)

Cada achado vem com `arquivo:linha` + mensagem + a regra. Cobre:
- **Segurança:** `p/security-audit`, `p/owasp-top-ten`, `p/nodejs` (SQL injection, uso perigoso,
  etc.) e `p/secrets` (segredos/credenciais commitados).
- **TS/React:** `p/typescript`, `p/react` (padrões problemáticos, bugs comuns).

O comentário é **fixo** (se atualiza a cada push, não polui o PR). Usa só o `GITHUB_TOKEN`
automático — **não precisa criar nenhum secret**.

## Setup

**Nenhum.** Depois que a PR que adiciona esses arquivos for mergeada na `main`, todo PR novo já
dispara os dois workflows. Zero configuração, zero custo.

## Ajustes possíveis

- **Endurecer/afrouxar o que falha o check:** hoje falha só em achados de severidade `ERROR`
  do Semgrep (ver `.github/scripts/resumo-semgrep.js`). Avisos (`WARNING`) aparecem no
  comentário mas não bloqueiam.
- **Mudar as regras:** edite os `--config p/...` em `revisao-automatica.yml`
  (catálogo em https://semgrep.dev/explore).
- **Regras próprias do projeto:** dá pra criar regras Semgrep custom (ex.: "proibir
  `unscopedQuery` fora de `organizacaoModel`/login") num arquivo `.semgrep.yml` e adicioná-lo
  com `--config .semgrep.yml`. Peça que eu escrevo.
- **Rodar em outras branches:** troque `branches: [main]` nos dois arquivos.

## Observações

- **PR de fork:** num PR vindo de **fork**, o GitHub deixa o `GITHUB_TOKEN` só-leitura, então o
  **comentário** pode não ser postado (a análise ainda roda e aparece nos logs/checks). Como o
  Japa trabalha em branches deste repo, funciona normal.
