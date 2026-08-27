import { useCallback, useEffect, useRef, useState } from 'react';
import { MultitrackEngine } from './audioEngine';
import { identificarInstrumento } from './nomeInstrumento';
import { Faixa } from './tipos';

/**
 * Hook que liga o `MultitrackEngine` (web-only) ao React: gerencia a lista de
 * faixas, o estado de reprodução e um loop (rAF) que atualiza a posição e para
 * no fim. Toda a lógica de áudio/sincronização mora no engine, não aqui.
 */
export function useMultitrack() {
  const engineRef = useRef<MultitrackEngine | null>(null);
  const rafRef = useRef<number | null>(null);
  const contadorRef = useRef(0);

  const [faixas, setFaixas] = useState<Faixa[]>([]);
  const [tocando, setTocando] = useState(false);
  const [posicao, setPosicao] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [peaks, setPeaks] = useState<number[]>([]);

  function engine(): MultitrackEngine {
    if (!engineRef.current) engineRef.current = new MultitrackEngine();
    return engineRef.current;
  }

  const pararLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const loop = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    const pos = eng.posicao;
    setPosicao(pos);
    if (eng.duracao > 0 && pos >= eng.duracao) {
      eng.stop();
      setTocando(false);
      setPosicao(0);
      pararLoop();
      return;
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [pararLoop]);

  const adicionarArquivos = useCallback(async (arquivos: File[]) => {
    setCarregando(true);
    try {
      for (const arquivo of arquivos) {
        const id = `f${contadorRef.current++}`;
        const meta = identificarInstrumento(arquivo.name, contadorRef.current - 1);
        // placeholder enquanto decodifica
        setFaixas((atual) => [
          ...atual,
          { id, nome: meta.nome, icone: meta.icone, cor: null, buffer: null, volume: 1, mudo: false, solo: false },
        ]);
        try {
          await engine().adicionarArquivo(id, arquivo);
          setFaixas((atual) => atual.map((f) => (f.id === id ? { ...f, buffer: {} as AudioBuffer } : f)));
        } catch {
          // arquivo inválido/formato não suportado → remove o placeholder
          setFaixas((atual) => atual.filter((f) => f.id !== id));
        }
      }
      setDuracao(engine().duracao);
      setPeaks(engine().getPeaks(140));
    } finally {
      setCarregando(false);
    }
  }, []);

  const play = useCallback(async () => {
    await engine().play();
    if (engine().estaTocando) {
      setTocando(true);
      pararLoop();
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [loop, pararLoop]);

  const pause = useCallback(() => {
    engine().pause();
    setTocando(false);
    setPosicao(engine().posicao);
    pararLoop();
  }, [pararLoop]);

  const stop = useCallback(() => {
    engine().stop();
    setTocando(false);
    setPosicao(0);
    pararLoop();
  }, [pararLoop]);

  const seek = useCallback((segundos: number) => {
    engine().seek(segundos);
    setPosicao(engine().posicao);
  }, []);

  const setVolume = useCallback((id: string, v: number) => {
    engine().setVolume(id, v);
    setFaixas((atual) => atual.map((f) => (f.id === id ? { ...f, volume: v } : f)));
  }, []);

  const toggleMudo = useCallback((id: string) => {
    setFaixas((atual) =>
      atual.map((f) => {
        if (f.id !== id) return f;
        const mudo = !f.mudo;
        engine().setMudo(id, mudo);
        return { ...f, mudo };
      }),
    );
  }, []);

  const toggleSolo = useCallback((id: string) => {
    setFaixas((atual) =>
      atual.map((f) => {
        if (f.id !== id) return f;
        const solo = !f.solo;
        engine().setSolo(id, solo);
        return { ...f, solo };
      }),
    );
  }, []);

  const renomearFaixa = useCallback((id: string, nome: string) => {
    setFaixas((atual) => atual.map((f) => (f.id === id ? { ...f, nome } : f)));
  }, []);

  const definirCor = useCallback((id: string, cor: string | null) => {
    setFaixas((atual) => atual.map((f) => (f.id === id ? { ...f, cor } : f)));
  }, []);

  const removerFaixa = useCallback((id: string) => {
    engine().removerFaixa(id);
    setFaixas((atual) => atual.filter((f) => f.id !== id));
    setDuracao(engine().duracao);
    setPeaks(engine().getPeaks(140));
  }, []);

  useEffect(() => {
    return () => {
      pararLoop();
      engineRef.current?.destruir();
    };
  }, [pararLoop]);

  return {
    faixas,
    tocando,
    posicao,
    duracao,
    carregando,
    peaks,
    adicionarArquivos,
    play,
    pause,
    stop,
    seek,
    setVolume,
    toggleMudo,
    toggleSolo,
    renomearFaixa,
    definirCor,
    removerFaixa,
  };
}
