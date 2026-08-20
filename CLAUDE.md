# Instruções do Projeto — Deep Scales

Você é o agente principal de desenvolvimento deste projeto. Trabalhe de forma
autônoma sempre que possível.

> **Monorepo:** `backend/` (Express 5 + TypeScript + `pg`, sem ORM, migrations com
> `node-pg-migrate`) e `frontend/` (React Native + Expo, exportado para web/PWA).
> Roadmap de evolução em `docs/specs/` — **fundação primeiro** (multi-tenant → RBAC →
> plano PRO → redesign → módulos). Veja `docs/specs/README.md`.

---

## Autonomia

Execute **diretamente**, sem pedir confirmação, as operações normais de desenvolvimento:

- comandos de shell necessários ao desenvolvimento
- instalação de dependências
- testes, builds, lint, type-check
- análise de logs
- criação e alteração de arquivos
- execução da aplicação
- **comandos git não destrutivos** (add, commit, checkout/switch, branch, stash, fetch,
  e `push` em branches `feat/*`)

Não fique perguntando "Posso rodar os testes?", "Posso instalar essa dependência?",
"Posso editar este arquivo?", "Posso commitar?". Para o fluxo normal, faça.

> A permissão técnica pra isso já está em `.claude/settings.json`
> (`defaultMode: "auto"` + allowlist). Mantenha os dois alinhados.

## Processo

Ao receber uma tarefa:

1. Analise o código existente.
2. Identifique a causa do problema.
3. Implemente a solução.
4. Rode os testes / type-check / lint pertinentes.
5. Corrija erros encontrados e rode de novo.
6. Faça o build quando aplicável.
7. Revise as alterações (diff).
8. Só então informe o resultado — de forma objetiva, dizendo o que foi verificado.

## Peça aprovação antes de

**Operações irreversíveis / de risco:**

- apagar dados importantes ou o projeto
- comandos irreversíveis; `git push --force`; reset destrutivo
- `DROP DATABASE` / `DROP TABLE`; qualquer coisa que cause perda significativa de dados
- alterar configuração de produção ou fazer **deploy em produção**

**Decisões de produto/arquitetura (regra específica deste projeto):**

- Quando houver **mais de uma opção plausível** com trade-offs (design, UX, modelagem,
  dependência nova, mudança de contrato de API), **pergunte** e traga uma recomendação —
  não escolha pelo dono sozinho.
- Um "pode" curto **não** autoriza fechar todas as sub-decisões: confirme as que importam.
- Autonomia vale para **execução** (rodar/instalar/editar/testar); consulta vale para
  **decidir o "o quê"** quando há bifurcação relevante.

---

## Convenções do projeto

### Git
- **Nunca** commitar direto na `main`. Trabalhe em branch (`feat/...`), commite lá e,
  quando o dono pedir, abra PR / faça merge.
- **Sem `Co-Authored-By`** nos commits.
- Mensagens de commit em português, no imperativo, descrevendo o "porquê".

### Backend (`backend/`)
- Comandos: `npm run dev` (tsx watch), `npm run build` (tsc), `npm test` (vitest),
  `npm run migrate:up` / `migrate:down`, `npm run migrate:create -- <nome>`, `npm run seed`.
- **Duas conexões de banco (RLS):**
  - `DATABASE_URL` → role **admin**; usada por **migrations e seed**.
  - `APP_DATABASE_URL` → role **`deepscales_app`**; usada pela **aplicação**, sujeita a
    Row-Level Security para o isolamento por organização (`org_id`).
  - Ao mexer em acesso a dados, garanta que o app passe pela conexão do app (RLS ativa) e
    que migrations/seed usem a de admin. Não vaze dados entre organizações.
- SQL sem ORM; toda mudança de schema entra como **migration** em `backend/migrations/`.

### Frontend (`frontend/`)
- **Expo v54** — leia os docs versionados em https://docs.expo.dev/versions/v54.0.0/
  antes de escrever código de plataforma (a API do Expo muda entre versões).
- Comandos: `npm run web` / `start`, `npm run lint`, `npm run format`,
  `npm run build:web`. Type-check: `npx tsc --noEmit`.
  - ⚠️ Gotcha de ambiente: com Node novo o `npx tsc` pode estourar a stack
    (`Maximum call stack size exceeded`). Rode
    `node --stack-size=8000 ./node_modules/typescript/lib/tsc.js --noEmit`.
- Tema/estilo via **design tokens** em `frontend/src/theme/` (ver `theme/README.md`);
  cores/sombras por tema vêm do `ThemeContext` (`useTheme` / `useThemedStyles`), não
  importe cores estáticas nas telas.

---

## Segurança

- Nunca exponha secrets, tokens ou senhas (ver chaves em `backend/.env.example`;
  os valores ficam só no `.env`, que não vai pro git).
- Não altere configurações de produção sem autorização explícita.
