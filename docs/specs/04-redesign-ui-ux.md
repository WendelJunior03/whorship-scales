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
- [ ] **T-04.2** — Auditoria visual da referência: extrair princípios (grid, espaçamento,
  tipografia, densidade) — **sem copiar**. Entregável: um doc curto de diretrizes.
- [ ] **T-04.3** — Definir **design tokens** (cores, tipografia, spacing, radius, sombras,
  estados) evoluindo o `theme/` atual. _Pronto quando:_ tokens documentados e aplicáveis.
- [ ] **T-04.4** — Recriar o kit de componentes base como design system (Button, Input, Card,
  Badge, Header, Menu, + novos: Tabs, Sidebar, Modal, EmptyState, Skeleton/Loading, Toast).
- [ ] **T-04.5** — Layout responsivo (tabs no mobile / sidebar no desktop) — D-04.3.
- [ ] **T-04.6** — Redesenhar o **Dashboard/Home** como vitrine do novo padrão (primeira tela).
- [ ] **T-04.7** — Introduzir a lib de animação escolhida + micro-animações (transições,
  press states, entrada de listas). _Pronto quando:_ navegação e cards têm micro-animações suaves.
- [ ] **T-04.8** — Migrar as demais telas para o novo design system, uma a uma.
- [ ] **T-04.9** — Revisão de responsividade (mobile / tablet / desktop) e acessibilidade básica
  (contraste, tamanho de toque).

---

## Dependências & riscos

- **Depende de:** Fase A (a navegação nova de org/RBAC precisa existir pra não redesenhar 2x).
- **Recomendado junto:** adotar TanStack Query (spec 00) já que todas as telas serão tocadas.
- **Risco:** Framer Motion não animar no nativo (D-04.2). Mitigação: decidir o alvo antes.
- **Risco:** escopo inflar (redesign é poço sem fundo). Mitigação: design system primeiro,
  telas depois, uma por vez, sem travar releases.
