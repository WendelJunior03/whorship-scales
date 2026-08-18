# Fase A — Checklist de segurança (Passo 8)

Cobertura de **isolamento por organização** (Passo 4) e **autorização por capacidade**
(Passo 5), por endpoint. Fonte da verdade automatizada:
`backend/src/integration/seguranca.test.ts` (app real via supertest, RLS ativo, 2 orgs).

> O teste de integração pula sozinho se o banco estiver indisponível ou a conexão for
> superusuária (que ignora RLS). Para valer, o app conecta como `deepscales_app`.

## Autorização — membro comum (vocal) recebe **403** · admin/ministro passa

| Endpoint | Capacidade | Membro | Admin |
|---|---|---|---|
| `POST /cultos` | `culto.gerenciar` | 403 ✅ | ok |
| `DELETE /cultos/:id` | `culto.gerenciar` | 403 ✅ | ok |
| `POST /membros/cadastro` | `membro.cadastrar` | 403 ✅ | ok |
| `GET /membros` | `membro.listar` | 403 ✅ | 200 ✅ |
| `DELETE /membros/:id` | `membro.desativar` | 403 ✅ | ok |
| `POST /escala-fixa` | `escala.gerenciar` | 403 ✅ | ok |
| `GET /escala-fixa` | `escala.gerenciar` | 403 ✅ | 200 ✅ |
| `DELETE /escala-fixa/:id` | `escala.gerenciar` | 403 ✅ | ok |
| `POST /escala-vocal` | `escala.gerenciar` | 403 ✅ | ok |
| `GET /escala-vocal/sugestao` | `escala.gerenciar` | 403 ✅ | ok |
| `DELETE /escala-vocal/:id` | `escala.gerenciar` | 403 ✅ | ok |
| `POST /escala-avulsa` | `escala.gerenciar` | 403 ✅ | ok |
| `DELETE /escala-avulsa/:id` | `escala.gerenciar` | 403 ✅ | ok |
| `POST /repertorio` | `repertorio.gerenciar` | 403 ✅ | ok |
| `DELETE /repertorio/:id` | `repertorio.gerenciar` | 403 ✅ | ok |

Também coberto: membro comum **acessa o próprio** (`GET /membros/me`, `GET /cultos` → 200) —
não é bloqueado além do necessário. Regras puras: `capacidades.test.ts`,
`roleMiddleware.test.ts`.

## Isolamento — org A não alcança dados da org B

| Cenário | Esperado | Status |
|---|---|---|
| `GET /cultos` (A) | só cultos da A (não lista os da B) | ✅ |
| `GET /cultos/:idDaB` (A) | 404 | ✅ |
| `DELETE /cultos/:idDaB` (A) | 404, e o culto da B continua existindo | ✅ |
| `GET /membros` (A) | não inclui membros da B | ✅ |
| `GET /membros/:idDaB` (A) | corpo não traz o membro da B | ✅ |
| `GET /repertorio/:cultoDaB` (A) | lista vazia | ✅ |

Camada de banco (RLS puro, INSERT/UPDATE/DELETE cross-org, forjar `org_id`):
`config/isolamento.test.ts`.

## Defesa em profundidade (relembrando)

Uma ação passa por **três eixos** independentes:
`flag_ativa && plano_permite && rbac_permite` (spec 03) — e o isolamento por `org_id` é
garantido tanto na **aplicação** (contexto de tenant + `query()` escopado) quanto no
**banco** (RLS `FORCE`), então esquecer um `WHERE` no código não vaza dados.

## Manual / ainda não automatizado

- **Frontend (visual):** gating por papel nas telas (admin vê gestão; membro não) e selo
  PRO — validar rodando o app (ver Passo 7).
- **Produção (Neon):** rodar migrations como admin + rotacionar a senha do role
  `deepscales_app` e apontar `APP_DATABASE_URL` (o RLS só barra com role não-superusuário).
