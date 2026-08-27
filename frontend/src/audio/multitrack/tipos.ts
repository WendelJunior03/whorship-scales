// Tipos do módulo Multitrack / VS (web-only, Web Audio API).
import { IconName } from '@/components/Icon';

export interface Faixa {
  id: string;
  nome: string;
  icone: IconName;
  /** buffer decodificado; null enquanto carrega. */
  buffer: AudioBuffer | null;
  volume: number; // 0..1
  mudo: boolean;
  solo: boolean;
}

export interface EstadoReproducao {
  tocando: boolean;
  posicao: number; // segundos
  duracao: number; // segundos (maior faixa)
}
