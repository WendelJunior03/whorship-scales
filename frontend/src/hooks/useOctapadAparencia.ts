import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE = '@deepscales:octapad:aparencia';

export interface AparenciaOctapad {
  /** Cor de destaque por id de pad — ausente = usa a cor original do instrumento no kit. */
  coresPads: Record<string, string>;
  /** Nome customizado por id de pad — ausente = usa o nome original do instrumento no kit. */
  nomesPads: Record<string, string>;
  /** Id do som da Biblioteca de Drums por pad — ausente = usa o som sintetizado do kit. */
  somPads: Record<string, string>;
  /** 0 a 1 — intensidade do brilho ao tocar. */
  brilho: number;
}

const PADRAO: AparenciaOctapad = { coresPads: {}, nomesPads: {}, somPads: {}, brilho: 1 };

/** Preferências de aparência do Octapad, persistidas localmente (por dispositivo). */
export function useOctapadAparencia() {
  const [aparencia, setAparencia] = useState<AparenciaOctapad>(PADRAO);

  // Exposto como `recarregar` — o Octapad e a Biblioteca de Drums usam instâncias
  // separadas deste hook (telas diferentes na pilha), então o Octapad precisa reler o
  // storage ao voltar de lá pra pegar o som escolhido (ver useFocusEffect na tela).
  const carregar = useCallback(() => {
    AsyncStorage.getItem(CHAVE)
      .then((v) => {
        if (v) setAparencia({ ...PADRAO, ...JSON.parse(v) });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const persistir = useCallback((novo: AparenciaOctapad) => {
    setAparencia(novo);
    AsyncStorage.setItem(CHAVE, JSON.stringify(novo)).catch(() => undefined);
  }, []);

  // `cor: null` remove a personalização daquele pad — volta a usar a cor do kit.
  const definirCorPad = useCallback(
    (padId: string, cor: string | null) => {
      setAparencia((atual) => {
        const coresPads = { ...atual.coresPads };
        if (cor) {
          coresPads[padId] = cor;
        } else {
          delete coresPads[padId];
        }
        const novo = { ...atual, coresPads };
        AsyncStorage.setItem(CHAVE, JSON.stringify(novo)).catch(() => undefined);
        return novo;
      });
    },
    [],
  );

  // Nome vazio/removido volta a usar o nome original do instrumento no kit.
  const definirNomePad = useCallback(
    (padId: string, nome: string | null) => {
      setAparencia((atual) => {
        const nomesPads = { ...atual.nomesPads };
        if (nome && nome.trim()) {
          nomesPads[padId] = nome;
        } else {
          delete nomesPads[padId];
        }
        const novo = { ...atual, nomesPads };
        AsyncStorage.setItem(CHAVE, JSON.stringify(novo)).catch(() => undefined);
        return novo;
      });
    },
    [],
  );

  // `somId: null` remove a personalização daquele pad — volta a usar o som sintetizado do kit.
  // `nome`, se informado (mesmo call), atualiza junto — numa escrita só. Precisa ser assim
  // (não duas chamadas separadas) porque a Biblioteca de Drums troca som+nome e já volta
  // (`goBack()`) na sequência: duas gravações assíncronas no AsyncStorage corriam risco de o
  // "voltar" disparar a releitura da tela do Octapad entre a 1ª e a 2ª escrita, perdendo a 2ª.
  const definirSomPad = useCallback(
    (padId: string, somId: string | null, nome?: string | null) => {
      setAparencia((atual) => {
        const somPads = { ...atual.somPads };
        if (somId) {
          somPads[padId] = somId;
        } else {
          delete somPads[padId];
        }
        const nomesPads = { ...atual.nomesPads };
        if (nome !== undefined) {
          if (nome) {
            nomesPads[padId] = nome;
          } else {
            delete nomesPads[padId];
          }
        }
        const novo = { ...atual, somPads, nomesPads };
        AsyncStorage.setItem(CHAVE, JSON.stringify(novo)).catch(() => undefined);
        return novo;
      });
    },
    [],
  );

  const ajustarBrilho = useCallback(
    (brilho: number) => {
      persistir({ ...aparencia, brilho });
    },
    [aparencia, persistir],
  );

  const restaurarPadrao = useCallback(() => {
    setAparencia(PADRAO);
    AsyncStorage.removeItem(CHAVE).catch(() => undefined);
  }, []);

  return { aparencia, definirCorPad, definirNomePad, definirSomPad, ajustarBrilho, restaurarPadrao, recarregar: carregar };
}
