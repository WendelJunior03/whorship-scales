import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { audioSuportado, criarMotorWeb, MotorAudio } from '@/audio/motor';
import { KIT_PADRAO } from '@/audio/kits';

/**
 * Octapad (spec 05): expõe `tocar(id)` com latência mínima. Cria/retoma o AudioContext
 * no primeiro toque (exigência do iOS Safari — autoplay policy). Web-first: em nativo,
 * `suportado` é false e a tela mostra o aviso.
 */
export function useOctapad() {
  const motorRef = useRef<MotorAudio | null>(null);
  const prontoRef = useRef(false);
  const suportado = Platform.OS === 'web' && audioSuportado();

  const tocar = useCallback(
    async (id: string, volume?: number) => {
      if (!suportado) {
        return;
      }
      if (!motorRef.current) {
        motorRef.current = criarMotorWeb();
        motorRef.current.carregar(KIT_PADRAO);
      }
      if (!prontoRef.current) {
        await motorRef.current.iniciar(); // dentro do gesto de toque
        prontoRef.current = true;
      }
      motorRef.current.tocar(id, volume);
    },
    [suportado],
  );

  useEffect(
    () => () => {
      motorRef.current?.encerrar();
      motorRef.current = null;
      prontoRef.current = false;
    },
    [],
  );

  return { suportado, tocar };
}
