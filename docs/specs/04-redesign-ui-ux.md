# 04 — Redesign Completo da Interface (UI/UX)

## Objetivo

Modernizar toda a experiência para transmitir uma aparência **premium, moderna e
intuitiva**, tendo como **referência de inspiração** (não cópia) o
[app.louveapp.com.br](https://app.louveapp.com.br/). Foco em hierarquia visual,
espaçamentos, tipografia, componentização, dashboard limpo, cards, sidebar, tema escuro,
micro-animações e experiência **mobile-first**, boa também em tablets e desktop.

> Fica **depois** da fundação (Fase A) de propósito: multi-tenant e RBAC mudam a navegação
> (seletor/contexto de organização, novas áreas de líder/admin). Redesenhar antes obrigaria
> a refazer telas.

---

## Contexto atual

- Front em React Native + Expo (web/PWA + nativo). Tema escuro roxo já existe em
  `theme/` (`colors.ts` fundo `#0D0210`, primária `#6C3CE0`).
- Componentes base: `Button`, `Input`, `Card`, `Header`, `Badge`, `OptionsMenu`.
- Navegação: bottom tabs (Home, Agenda, Notificações, Perfil) + stack.
- Não usa lib de animação avançada; a spec pede **Framer Motion** para micro-animações.

---

## Decisões-chave

### D-04.1 — Escopo: redesign incremental vs. novo design system

| Opção | Prós | Contras |
|-------|------|---------|
| **A. Incremental** (refinar componentes atuais tela a tela) | Menos risco; entrega contínua; app nunca "quebra" | Resultado pode ficar inconsistente; teto de "premium" mais baixo |
| **B. Novo design system primeiro, depois migrar telas** | Consistência real; base sólida pro crescimento; combina com componentização pedida | Investimento inicial maior antes de ver telas prontas |

> **Recomendação:** **B leve** — definir tokens (cores, tipografia, espaçamento, raios,
> sombras) e recriar os ~6 componentes base como um design system enxuto **primeiro**, depois
> migrar as telas. Evita o "Frankenstein" de refinar tela a tela sem padrão.

**Decisão: ✅ Design system primeiro** — definir tokens (cores/tipografia/espaçamento/raios/sombras) e recriar os componentes base como um design system enxuto, depois migrar as telas uma a uma.

---

### D-04.2 — Framer Motion no React Native/Expo (⚠️ atenção técnica)

**Framer Motion é uma biblioteca do React DOM (web).** No Expo web (PWA) funciona; no
runtime **nativo** (Expo Go / app), o equivalente é **Moti** (baseado em Reanimated) ou o
próprio **Reanimated**.

| Opção | Cobre web (PWA) | Cobre nativo | Nota |
|-------|:---:|:---:|------|
| **A. Framer Motion (só web)** | ✅ | ❌ | Fiel à spec, mas anima só no PWA |
| **B. Moti / Reanimated (cross-platform)** | ✅ | ✅ | Padrão do ecossistema RN; anima em web e nativo |
| **C. Framer Motion no web + Moti no nativo** | ✅ | ✅ | Melhor resultado, mais trabalho |

> **Recomendação:** decidir explicitamente o alvo. Se o produto é **primordialmente PWA**,
> Framer Motion (A) atende. Se o app nativo importa, **Moti/Reanimated (B)** é o caminho
> idiomático. Vale confirmar antes de fechar.

**Decisão: ✅ Moti / Reanimated (cross-platform)** — NÃO Framer Motion. Coerente com o alvo 'PWA-first agora, nativo depois': anima no web e já prepara o nativo sem retrabalho.

---

### D-04.3 — Navegação: bottom tabs vs. sidebar

A spec cita "sidebar". Em mobile, sidebar (drawer) + bottom tabs coexistem; em desktop/tablet
uma sidebar fixa aproveita melhor o espaço.

| Opção | Mobile | Desktop/Tablet |
|-------|--------|----------------|
| **A. Manter bottom tabs em tudo** | Bom | Desperdiça espaço |
| **B. Responsivo: tabs no mobile, sidebar no desktop** | Bom | Ótimo (aproveita a referência Louve) |

> **Recomendação:** **B** — layout responsivo. Casa com "mobile-first" + "bom em tablet/desktop".

**Decisão: ✅ Layout responsivo** — bottom tabs no mobile, sidebar fixa no desktop/tablet.

---

## Escopo de telas a redesenhar

Todas as existentes + as novas da fundação:
- **Existentes:** Login, Home/Dashboard, Agenda, Escalas, Escala Fixa, Confirmações,
  Detalhes do Culto, Membros, Detalhe do Membro, Notificações, Perfil.
- **Novas (fundação):** Criar/Entrar em organização, seletor/contexto de organização,
  selo PRO/CTA de upgrade (spec 03), área de gestão de liderança (spec 07).
- **Novas (módulos):** entradas de Octapad, Banco de Pads, Vídeos, Afinador, Reuniões.

---

## Tarefas

- [x] **T-04.1** — ✅ Decidido (ver seção Decisões-chave). Fechar D-04.1, D-04.2, D-04.3 (e definir PWA-first vs. nativo).
- [x] **T-04.2** — ✅ Dispensada como doc à parte: os princípios (grid, espaçamento,
  tipografia, densidade) já ficaram materializados nos **design tokens** (`theme/` + `theme/README.md`)
  e no kit de componentes. Não faz sentido um doc de auditoria depois do redesign já aplicado.
- [x] **T-04.3** — ✅ **Design tokens** definidos e documentados: `theme/` cobre cores
  (por tema claro/escuro), tipografia, spacing, radius, sombras, estados; adicionado token de
  **breakpoints** (`theme/breakpoints.ts`) e doc de referência em `frontend/src/theme/README.md`.
- [x] **T-04.4** — ✅ Kit de componentes fechado: os base (Button, Input, Card, Badge, Header,
  OptionsMenu) já existiam e ganharam os que faltavam — **Tabs**, **Modal** (bottom-sheet), **EmptyState**,
  **Skeleton** (+`SkeletonText`), **Toast** (`showToast` + `ToastHost` global) e `PersistentSidebar`.
- [x] **T-04.5** — ✅ **Layout responsivo**: bottom tabs no mobile viram **sidebar fixa** a
  partir de `lg` (1024px) via navigation rail do react-navigation v7 (`tabBarPosition: 'left'`
  + `tabBarVariant: 'material'`), com hook `useBreakpoint()` — D-04.3.
- [x] **T-04.6** — ✅ Home/Dashboard redesenhada no novo padrão (branches `redesign-home`/`redesign-inicio`,
  já na main).
- [x] **T-04.7** — ✅ Lib de animação: **Moti** (sobre Reanimated, D-04.2). `Button`/`Card` têm press state
  e entrada (FadeInUp); componente **`AnimatedItem`** dá entrada em cascata de listas (adotado em Membros/
  Comunicados). Build web validado com Moti 0.30 × Reanimated 4.1.
- [x] **T-04.8** — ✅ Telas migradas pro kit (loading→`Skeleton`, vazio→`EmptyState`, modais/abas→`Modal`/`Tabs`):
  Notificações, Membros, Aniversariantes, Comunicados, Escalas, Agenda, Confirmações, Panorama, Biblioteca,
  Pasta, DetalheMúsica, Ministério, DetalheMembro, Assinaturas, Indisponibilidades, Home, Presets.
- [x] **T-04.9** — ✅ **Básica:** responsividade coberta por tokens (`breakpoints`, `LARGURA_CONTEUDO`) +
  `PersistentSidebar`; componentes base já acessíveis (roles/labels/`hitSlop` em Header/Input/Button/Card/Tabs);
  melhorias centralizadas — `Skeleton` oculto do leitor de tela, `Toast` anunciado (live region + role `alert`),
  `Tabs` como `tablist`. _Follow-up:_ auditoria fina de `accessibilityLabel` em botões só-ícone tela a tela.

---

## Dependências & riscos

- **Depende de:** Fase A (a navegação nova de org/RBAC precisa existir pra não redesenhar 2x).
- **Recomendado junto:** adotar TanStack Query (spec 00) já que todas as telas serão tocadas.
- **Risco:** Framer Motion não animar no nativo (D-04.2). Mitigação: decidir o alvo antes.
- **Risco:** escopo inflar (redesign é poço sem fundo). Mitigação: design system primeiro,
  telas depois, uma por vez, sem travar releases.
