import { colors } from './colors';
import { typography, fonts } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';

export const theme = {
  colors,
  typography,
  fonts,
  spacing,
  radius,
  shadows,
};

export type Theme = typeof theme;

export { colors, typography, fonts, spacing, radius, shadows };
