import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CAMADAS,
  CamadaId,
  EstadoCamada,
  Note,
  pararCamada as pararCamadaNaEngine,
  pararTodasAsCamadas,
  definirCutoffDaCamada,
  definirVolumeMaster as definirVolumeMasterNaEngine,
  recalcularGanhos,
  tocar as tocarNaEngine,
} from '@/audio/padContinuo';
import { notifyAction } from '@/utils/confirm';

const IDS_CAMADAS = CAMADAS.map((c) => c.id);

function estadoInicial(): Record<CamadaId, EstadoCamada> {
  const estado = {} as Record<CamadaId, EstadoCamada>;
  for (const camada of CAMADAS) {
    estado[camada.id] = { notaAtiva: null, volume: camada.volumePadrao, cutoff: 1, mudo: false, solo: false };
  }
  return estado;
}

/**
 * Controller do Pad Contínuo multicamadas (spec 06, D-06.6). Mapa central de estado por
 * camada — os componentes visuais só leem isso, nunca chamam a engine
 * (`@/audio/padContinuo`) direto. Cada camada é monofônica dentro de si mesma (uma nota
 * por vez), mas camadas diferentes tocam notas diferentes simultaneamente.
 */
export function usePadContinuo() {
  const [estados, setEstados] = useState<Record<CamadaId, EstadoCamada>>(estadoInicial);
  const [carregando, setCarregando] = useState<Partial<Record<CamadaId, boolean>>>({});
  const [volumeMaster, setVolumeMaster] = useState(0.7);

  // Sempre com o estado mais recente — usado só pra montar o payload de
  // `recalcularGanhos` (que precisa do conjunto inteiro por causa do solo global) sem
  // exigir `estados` inteiro nas deps de todo callback.
  const estadosRef = useRef(estados);
  useEffect(() => {
    estadosRef.current = estados;
  }, [estados]);

  const selecionarNota = useCallback(async (camada: CamadaId, nota: Note) => {
    const atual = estadosRef.current[camada];

    if (atual.notaAtiva === nota) {
      // mesma nota que já tocava nessa camada — só desliga ela.
      pararCamadaNaEngine(camada);
      setEstados((s) => ({ ...s, [camada]: { ...s[camada], notaAtiva: null } }));
      return;
    }

    setCarregando((c) => ({ ...c, [camada]: true }));
    try {
      await tocarNaEngine(camada, nota);
      setEstados((s) => ({ ...s, [camada]: { ...s[camada], notaAtiva: nota } }));
    } catch {
      notifyAction(
        'Áudio não encontrado',
        `A gravação de "${nota}" ainda não está disponível nessa camada.`,
      );
    } finally {
      setCarregando((c) => ({ ...c, [camada]: false }));
    }
  }, []);

  const ajustarVolume = useCallback((camada: CamadaId, valor: number) => {
    setEstados((s) => {
      const novo = { ...s, [camada]: { ...s[camada], volume: valor } };
      recalcularGanhos(novo);
      return novo;
    });
  }, []);

  const ajustarCutoff = useCallback((camada: CamadaId, valor: number) => {
    definirCutoffDaCamada(camada, valor);
    setEstados((s) => ({ ...s, [camada]: { ...s[camada], cutoff: valor } }));
  }, []);

  const alternarMudo = useCallback((camada: CamadaId) => {
    setEstados((s) => {
      const novo = { ...s, [camada]: { ...s[camada], mudo: !s[camada].mudo } };
      recalcularGanhos(novo);
      return novo;
    });
  }, []);

  const alternarSolo = useCallback((camada: CamadaId) => {
    setEstados((s) => {
      const novo = { ...s, [camada]: { ...s[camada], solo: !s[camada].solo } };
      recalcularGanhos(novo);
      return novo;
    });
  }, []);

  const ajustarVolumeMaster = useCallback((valor: number) => {
    definirVolumeMasterNaEngine(valor);
    setVolumeMaster(valor);
  }, []);

  // Desliga qualquer camada tocando — usado ao sair da tela, pra não deixar nota presa.
  const pararTudo = useCallback(() => {
    pararTodasAsCamadas(IDS_CAMADAS);
    setEstados(estadoInicial);
  }, []);

  return {
    camadas: CAMADAS,
    estados,
    carregando,
    selecionarNota,
    ajustarVolume,
    ajustarCutoff,
    alternarMudo,
    alternarSolo,
    volumeMaster,
    ajustarVolumeMaster,
    pararTudo,
  };
}
