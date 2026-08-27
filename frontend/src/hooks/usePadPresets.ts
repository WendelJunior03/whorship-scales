import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CamadaId } from '@/audio/padContinuo';

const CHAVE = '@deepscales:padcontinuo:presets';
const CHAVE_ULTIMO = '@deepscales:padcontinuo:preset-ultimo';

export interface PadPresetCamada {
  ligada: boolean;
  volume: number;
  cutoff: number;
}

export interface PadPresetMaster {
  volume: number;
  cutoff: number;
  loFilter: number;
}

export interface PadPreset {
  id: string;
  nome: string;
  camadas: Partial<Record<CamadaId, PadPresetCamada>>;
  master: PadPresetMaster;
}

function novoId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Presets do Pad Contínuo (mix salvo: quais camadas ligadas + volume/cutoff de cada +
 * master) — persistidos localmente por dispositivo, mesmo padrão do
 * `useOctapadAparencia`. Não guarda mute/solo (controles de performance ao vivo, não faz
 * sentido "salvar" isso) nem a nota (essa é escolhida na hora).
 */
export function usePadPresets() {
  const [presets, setPresets] = useState<PadPreset[]>([]);
  const [ultimoPresetId, setUltimoPresetIdState] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE)
      .then((v) => {
        if (v) setPresets(JSON.parse(v));
      })
      .catch(() => undefined);
    AsyncStorage.getItem(CHAVE_ULTIMO)
      .then((v) => {
        if (v) setUltimoPresetIdState(v);
      })
      .catch(() => undefined);
  }, []);

  // Marca qual preset foi o último aplicado — a tela usa isso pra restaurar sozinha ao
  // abrir de novo, sem precisar escolher o preset toda vez.
  const definirUltimoPreset = useCallback((id: string) => {
    setUltimoPresetIdState(id);
    AsyncStorage.setItem(CHAVE_ULTIMO, id).catch(() => undefined);
  }, []);

  const persistir = useCallback((atualizar: (atual: PadPreset[]) => PadPreset[]) => {
    setPresets((atual) => {
      const novos = atualizar(atual);
      AsyncStorage.setItem(CHAVE, JSON.stringify(novos)).catch(() => undefined);
      return novos;
    });
  }, []);

  const salvarPreset = useCallback(
    (nome: string, camadas: PadPreset['camadas'], master: PadPresetMaster) => {
      persistir((atual) => [...atual, { id: novoId(), nome, camadas, master }]);
    },
    [persistir],
  );

  const excluirPreset = useCallback(
    (id: string) => {
      persistir((atual) => atual.filter((p) => p.id !== id));
      setUltimoPresetIdState((atual) => {
        if (atual !== id) return atual;
        AsyncStorage.removeItem(CHAVE_ULTIMO).catch(() => undefined);
        return null;
      });
    },
    [persistir],
  );

  return { presets, salvarPreset, excluirPreset, ultimoPresetId, definirUltimoPreset };
}
