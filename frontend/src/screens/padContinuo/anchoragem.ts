import { spacing } from '@/theme';

/**
 * Posição fixa (canto superior direito, logo abaixo do header) compartilhada pelo menu de
 * opções e pelo popover de Presets — os dois abrem sempre no mesmo lugar, já que o botão
 * de 3 barrinhas fica dentro do `Header` (sem ref exposta pra medir a posição real dele).
 */
export const ANCORA_TOPO = 60;
export const ANCORA_DIREITA = spacing.lg;
