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
  definirCutoffMaster as definirCutoffMasterNaEngine,
  definirLoFilterMaster as definirLoFilterMasterNaEngine,
  recalcularGanhos,
  tocar as tocarNaEngine,
} from '@/audio/padContinuo';
import { notifyAction } from '@/utils/confirm';

const IDS_CAMADAS = CAMADAS.map((c) => c.id);

function estadoInicial(): Record<CamadaId, EstadoCamada> {
  const estado = {} as Record<CamadaId, EstadoCamada>;
  for (const camada of CAMADAS) {
    estado[camada.id] = { ligada: false, volume: camada.volumePadrao, cutoff: 1, mudo: false, solo: false };
  }
  return estado;
}

/**
 * Controller do Pad Contínuo multicamadas. A NOTA é global — uma só, compartilhada por
 * todas as camadas ligadas (decisão do dono do projeto) — cada camada só decide se está
 * ligada (tocando a nota global) ou não, além de volume/cutoff/mute/solo próprios. Mapa
 * central de estado — os componentes visuais só leem isso, nunca chamam a engine
 * (`@/audio/padContinuo`) direto.
 */
export function usePadContinuo() {
  const [notaGlobal, setNotaGlobal] = useState<Note | null>(null);
  const [estados, setEstados] = useState<Record<CamadaId, EstadoCamada>>(estadoInicial);
  const [carregando, setCarregando] = useState<Partial<Record<CamadaId, boolean>>>({});
  const [volumeMaster, setVolumeMaster] = useState(0.7);
  const [cutoffMaster, setCutoffMaster] = useState(1);
  const [loFilterMaster, setLoFilterMaster] = useState(0);

  // Sempre com o estado mais recente — usado só pra montar o payload de
  // `recalcularGanhos` (que precisa do conjunto inteiro por causa do solo global) sem
  // exigir `estados` inteiro nas deps de todo callback.
  const estadosRef = useRef(estados);
  useEffect(() => {
    estadosRef.current = estados;
  }, [estados]);

  /** Toca a nota global em UMA camada — usado tanto ao ligar uma camada quanto ao trocar a nota global. */
  const tocarCamada = useCallback(async (camada: CamadaId, nota: Note) => {
    setCarregando((c) => ({ ...c, [camada]: true }));
    try {
      await tocarNaEngine(camada, nota);
      setEstados((s) => ({ ...s, [camada]: { ...s[camada], ligada: true } }));
    } catch {
      notifyAction('Áudio não encontrado', `A gravação de "${nota}" ainda não está disponível em ${camada}.`);
      setEstados((s) => ({ ...s, [camada]: { ...s[camada], ligada: false } }));
    } finally {
      setCarregando((c) => ({ ...c, [camada]: false }));
    }
  }, []);

  /**
   * Troca a nota global — todas as camadas LIGADAS no momento passam a tocar essa nota
   * (com crossfade: a nota antiga some com fade de saída, a nova entra com fade de
   * entrada — ver `camadaEngine.ts`). Clicar na MESMA nota que já está tocando desativa
   * tudo (mesmo gesto de antes: tocar de novo no pad ativo desliga).
   */
  const selecionarNotaGlobal = useCallback(
    (nota: Note) => {
      const ligadas = IDS_CAMADAS.filter((id) => estadosRef.current[id].ligada);

      if (nota === notaGlobal) {
        ligadas.forEach((camada) => {
          pararCamadaNaEngine(camada);
          setEstados((s) => ({ ...s, [camada]: { ...s[camada], ligada: false } }));
        });
        setNotaGlobal(null);
        return;
      }

      setNotaGlobal(nota);
      ligadas.forEach((camada) => tocarCamada(camada, nota));
    },
    [notaGlobal, tocarCamada],
  );

  /** Liga/desliga uma camada. Ligar sem nota global escolhida ainda só avisa. */
  const alternarLigada = useCallback(
    (camada: CamadaId) => {
      const ligadaAgora = estadosRef.current[camada].ligada;
      if (ligadaAgora) {
        pararCamadaNaEngine(camada);
        setEstados((s) => ({ ...s, [camada]: { ...s[camada], ligada: false } }));
        return;
      }
      if (!notaGlobal) {
        notifyAction('Escolha uma nota', 'Toque numa nota no banco de pads antes de ligar a camada.');
        return;
      }
      tocarCamada(camada, notaGlobal);
    },
    [notaGlobal, tocarCamada],
  );

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

  const ajustarCutoffMaster = useCallback((valor: number) => {
    definirCutoffMasterNaEngine(valor);
    setCutoffMaster(valor);
  }, []);

  const ajustarLoFilterMaster = useCallback((valor: number) => {
    definirLoFilterMasterNaEngine(valor);
    setLoFilterMaster(valor);
  }, []);

  // Desliga qualquer camada tocando — usado ao sair da tela, pra não deixar nota presa.
  const pararTudo = useCallback(() => {
    pararTodasAsCamadas(IDS_CAMADAS);
    setEstados(estadoInicial);
    setNotaGlobal(null);
  }, []);

  return {
    camadas: CAMADAS,
    notaGlobal,
    selecionarNotaGlobal,
    estados,
    carregando,
    alternarLigada,
    ajustarVolume,
    ajustarCutoff,
    alternarMudo,
    alternarSolo,
    volumeMaster,
    ajustarVolumeMaster,
    cutoffMaster,
    ajustarCutoffMaster,
    loFilterMaster,
    ajustarLoFilterMaster,
    pararTudo,
  };
}
