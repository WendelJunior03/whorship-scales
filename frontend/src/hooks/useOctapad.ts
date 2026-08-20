import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { Amostra, amostraDeArquivo, audioSuportado, criarMotorWeb, MotorAudio } from '@/audio/motor';
import { KIT_PADRAO } from '@/audio/kits';
import { BIBLIOTECA_DRUMS } from '@/audio/bibliotecaDrums';

/**
 * Octapad (spec 05): expõe `tocar(id)` com latência mínima. Cria/retoma o AudioContext
 * no primeiro toque (exigência do iOS Safari — autoplay policy). Web-first: em nativo,
 * `suportado` é false e a tela mostra o aviso.
 *
 * `somPads` (spec 06 — Biblioteca de Drums): mapa padId → id de som da biblioteca,
 * substitui a amostra sintetizada daquele pad por um arquivo real.
 */
export function useOctapad(somPads: Record<string, string> = {}) {
  const motorRef = useRef<MotorAudio | null>(null);
  const prontoRef = useRef(false);
  const suportado = Platform.OS === 'web' && audioSuportado();

  if (!motorRef.current && suportado) {
    motorRef.current = criarMotorWeb();
  }

  const amostras = useMemo<Amostra[]>(
    () =>
      KIT_PADRAO.map((pad) => {
        const somId = somPads[pad.id];
        const item = somId ? BIBLIOTECA_DRUMS.find((s) => s.id === somId) : undefined;
        return item ? amostraDeArquivo(pad.id, `/drums/${item.arquivo}`) : pad;
      }),
    [somPads],
  );

  useEffect(() => {
    motorRef.current?.carregar(amostras);
  }, [amostras]);

  const tocar = useCallback(
    async (id: string, volume?: number) => {
      if (!suportado || !motorRef.current) {
        return;
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
