# Guia — Como marcar uma feature como PRO / atrás de flag

Referência prática da spec 03 (feature flags caseiro). Vale pra os módulos 05–09 seguirem o
mesmo padrão. **Backend é a fonte da verdade**; o frontend só espelha (selo PRO / CTA).

## Os três eixos (spec 03, D-03.2)

Um recurso é acessível se **`flag_ativa && plano_permite && rbac_permite`**:

| Eixo | Onde | Pergunta |
|------|------|----------|
| **flag** | `config/recursos.ts` (`flagAtiva`) | O recurso está ligado (lançado)? |
| **plano** | `config/recursos.ts` (`planoMinimo`) + `LIBERAR_TUDO_V1` | A org comprou? (v1: sempre sim) |
| **RBAC** | `config/capacidades.ts` (`autoriza`) | Quem, dentro da org, pode? |

`plano` (o que a org comprou) e `RBAC` (quem pode) são **ortogonais** — não misture.

## Passo a passo

**1. Declare a chave no catálogo** (`backend/src/config/recursos.ts`):
```ts
export const recursos = {
  // ...
  'samples.upload': { planoMinimo: 'pro', flagAtiva: true },   // liberado (v1)
  'backup.automatico': { planoMinimo: 'pro', flagAtiva: false }, // ainda não lançado
};
```
- `planoMinimo`: `'free'` ou `'pro'` (só passa a bloquear quando `LIBERAR_TUDO_V1 = false`).
- `flagAtiva`: `false` esconde a feature JÁ (independente de plano) — use pra algo em construção.

**2. Proteja a rota** com o middleware (`requerRecurso`), combinando com auth/RBAC quando fizer sentido:
```ts
import { requerRecurso } from '../middlewares/recursoMiddleware';

router.post('/samples',
  authMiddleware,
  autoriza('musica.gerenciar'),   // RBAC: quem pode (opcional, se a ação exigir papel)
  requerRecurso('samples.upload'), // plano/flag: a org tem o recurso?
  uploadSampleController,
);
```
Bloqueado → **403** com `{ recurso, upgrade: true }` (o front usa isso pra CTA de upgrade).

**3. (Frontend — T-03.4, ainda pendente)** espelhar com um `useRecurso(chave)` + `<SeloPro>`:
esconder/mostrar e exibir o selo "PRO". Nunca confiar só no front — o backend já barra.

## Virar a chave da cobrança (futuro)

Enquanto `LIBERAR_TUDO_V1 = true` (em `recursos.ts`), **nada é bloqueado por plano** — só por
flag. Quando a cobrança PRO entrar: mude para `false`. A partir daí `planoMinimo` passa a valer
e as orgs `free` recebem 403 nos recursos `pro`. O eixo de flag continua valendo nos dois modos.

> Pagamento (gateway, webhooks, cobrança recorrente) é **fora do escopo** desta fase — aqui só
> existe o esqueleto (`organizacoes.plano` + `plano_expira`) que a cobrança vai usar.
