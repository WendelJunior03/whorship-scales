import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE = '@deepscales:pad-continuo:aparencia';

export interface AparenciaPads {
  /** `null` = usa o tom padrão do tema. */
  corInativo: string | null;
  /** `null` = usa o azul da marca (colors.primary). */
  corAtivo: string | null;
  /** 0 a 1 — intensidade da cor ativa (fader, knob, botões de destaque). */
  brilho: number;
}

const PADRAO: AparenciaPads = { corInativo: null, corAtivo: null, brilho: 1 };

/** Preferências de aparência dos Pads Contínuos, persistidas localmente (por dispositivo). */
export function usePadAparencia() {
  const [aparencia, setAparencia] = useState<AparenciaPads>(PADRAO);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE)
      .then((v) => {
        if (v) setAparencia({ ...PADRAO, ...JSON.parse(v) });
      })
      .catch(() => undefined);
  }, []);

  const atualizar = useCallback((parcial: Partial<AparenciaPads>) => {
    setAparencia((atual) => {
      const novo = { ...atual, ...parcial };
      AsyncStorage.setItem(CHAVE, JSON.stringify(novo)).catch(() => undefined);
      return novo;
    });
  }, []);

  const restaurarPadrao = useCallback(() => {
    setAparencia(PADRAO);
    AsyncStorage.removeItem(CHAVE).catch(() => undefined);
  }, []);

  return { aparencia, atualizar, restaurarPadrao };
}
