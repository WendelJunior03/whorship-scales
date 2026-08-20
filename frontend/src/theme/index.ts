import { colors } from './colors';
import { typography, fonts } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';
import { breakpoints } from './breakpoints';

export const theme = {
  colors,
  typography,
  fonts,
  spacing,
  radius,
  shadows,
  breakpoints,
};

export type Theme = typeof theme;

export { colors, typography, fonts, spacing, radius, shadows, breakpoints };
export type { Breakpoint } from './breakpoints';
