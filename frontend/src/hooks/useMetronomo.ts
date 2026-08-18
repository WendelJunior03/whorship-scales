import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { audioSuportado, ConfigMetronomo, criarMetronomo, Metronomo } from '@/audio/metronomo';

// Screen Wake Lock (web) — segura a tela durante o ensaio (D-10.3). Best-effort.
type WakeSentinel = { release(): Promise<void> };
let wakeLock: WakeSentinel | null = null;

async function segurarTela() {
  const g = globalThis as unknown as {
    navigator?: { wakeLock?: { request(tipo: string): Promise<WakeSentinel> } };
  };
  try {
    wakeLock = (await g.navigator?.wakeLock?.request('screen')) ?? null;
  } catch {
    wakeLock = null;
  }
}

function liberarTela() {
  wakeLock?.release().catch(() => undefined);
  wakeLock = null;
}

/**
 * Controla a engine do metrônomo (spec 10): tocar/parar, mantém a config em sincronia em
 * tempo real e expõe o `beatAtivo` sincronizado com o áudio (via rAF lendo a fila agendada).
 */
export function useMetronomo(config: ConfigMetronomo) {
  const suportado = Platform.OS === 'web' && audioSuportado();
  const engineRef = useRef<Metronomo | null>(null);
  const rafRef = useRef<number | null>(null);
  const [tocando, setTocando] = useState(false);
  const [beatAtivo, setBeatAtivo] = useState(-1);
  const [pulso, setPulso] = useState(0);

  // Mantém a engine sincronizada com a config (bpm/volume/timbre/compasso ao vivo).
  useEffect(() => {
    engineRef.current?.atualizar(config);
  }, [config]);

  const loopVisual = useCallback(() => {
    const nota = engineRef.current?.estadoVisual();
    if (nota) {
      setBeatAtivo(nota.beat);
      if (nota.sub === 0) {
        setPulso((p) => p + 1); // flash no tempo principal
      }
    }
    rafRef.current = globalThis.requestAnimationFrame(loopVisual);
  }, []);

  const parar = useCallback(() => {
    engineRef.current?.parar();
    if (rafRef.current !== null) {
      globalThis.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    liberarTela();
    setTocando(false);
    setBeatAtivo(-1);
  }, []);

  const iniciar = useCallback(async () => {
    if (!suportado) {
      return;
    }
    if (!engineRef.current) {
      engineRef.current = criarMetronomo(config);
    } else {
      engineRef.current.atualizar(config);
    }
    await engineRef.current.iniciar(); // dentro do gesto de toque (iOS)
    segurarTela();
    setTocando(true);
    rafRef.current = globalThis.requestAnimationFrame(loopVisual);
  }, [suportado, config, loopVisual]);

  const alternar = useCallback(() => {
    if (tocando) {
      parar();
    } else {
      void iniciar();
    }
  }, [tocando, parar, iniciar]);

  useEffect(
    () => () => {
      engineRef.current?.encerrar();
      engineRef.current = null;
      if (rafRef.current !== null) {
        globalThis.cancelAnimationFrame(rafRef.current);
      }
      liberarTela();
    },
    [],
  );

  return { suportado, tocando, beatAtivo, pulso, iniciar, parar, alternar };
}
