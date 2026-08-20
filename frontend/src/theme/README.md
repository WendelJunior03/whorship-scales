# Design Tokens — Deep Scales

Fonte única de verdade do visual do app (spec [`04-redesign-ui-ux.md`](../../../docs/specs/04-redesign-ui-ux.md), T-04.3).
Os tokens são **temáticos** (claro/escuro): cores e sombras vêm do `ThemeContext`;
espaçamento, raios, tipografia e breakpoints são constantes globais.

## Como consumir

```tsx
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { spacing, radius, typography } from '@/theme';
import { Cores, Sombras } from '@/theme/palettes';

function Exemplo() {
  const { colors } = useTheme();               // cores do tema ativo
  const styles = useThemedStyles(criarEstilos); // estilos que dependem do tema
  return <View style={styles.card} />;
}

const criarEstilos = (colors: Cores, shadows: Sombras) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...shadows.md,
    },
  });
```

> ⚠️ Não importe `colors`/`shadows` estáticos em telas: use `useTheme()` /
> `useThemedStyles()` para reagir à troca de tema. Só `spacing`, `radius`,
> `typography`, `fonts` e `breakpoints` são seguros de importar diretos.

## Tokens

### Cores (`palettes.ts` → `Cores`)
Definidas por tema (`paletaClara` / `paletaEscura`). Grupos:
- **Superfícies:** `background`, `surface`, `surfaceElevated`, `surfaceMuted`
- **Marca:** `primary`, `primaryDark`, `primaryLight`, `primarySoft`, `accent`, `primaryGradient`, `bgGradient`
- **Texto:** `text`/`textPrimary`, `textSecondary`, `textMuted`, `textInverse`
- **Estrutura:** `border`
- **Estados:** `success`, `warning`, `error`, `info`
- **Papéis:** `papel.{admin,ministro,vocal,membro}`

### Tipografia (`typography.ts`)
Família **Plus Jakarta Sans**. Com fontes custom no RN o peso vem da **família**
(`fonts.regular|medium|semibold|bold`), não do `fontWeight`. Escala: `h1` (28),
`h2` (22), `h3` (18), `body` (16), `bodySmall` (14), `caption` (12).

### Espaçamento (`spacing.ts`)
`xs` 4 · `sm` 8 · `md` 16 · `lg` 24 · `xl` 32 · `xxl` 48. Escala base 4/8.

### Raios (`radius.ts`)
`sm` 8 · `md` 12 · `lg` 14 · `xl` 16 · `xxl` 20 · `pill` 999.

### Sombras (`palettes.ts` → `Sombras`)
`sm` / `md` / `lg`, por tema (no dark são pretas com opacidade maior; no claro,
azul-escuras e sutis). Aplique com spread: `...shadows.md`.

### Breakpoints (`breakpoints.ts`)
`sm` 480 · `md` 768 · `lg` 1024 · `xl` 1280. Mobile-first. A partir de `lg` o
layout troca bottom tabs → sidebar (ver `navigation/MainTabs.tsx`). Consuma via
`useBreakpoint()` (`hooks/useBreakpoint.ts`): `isMobile`, `isTablet`,
`isDesktop`, `acima(bp)`.
