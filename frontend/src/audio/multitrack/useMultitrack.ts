import { useCallback, useEffect, useRef, useState } from 'react';
import { MultitrackEngine } from './audioEngine';
import { identificarInstrumento } from './nomeInstrumento';
import { Faixa } from './tipos';
import * as projetoStore from './projetoStore';
import type { ProjetoMeta } from './projetoStore';

/** id único e estável dentro/entre sessões (evita colisão ao restaurar projeto). */
function novoId(): string {
  return `f-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/**
 * Hook que liga o `MultitrackEngine` (web-only) ao React: gerencia a lista de
 * faixas, o estado de reprodução e um loop (rAF) que atualiza a posição e para
 * no fim. Toda a lógica de áudio/sincronização mora no engine, não aqui.
 */
export function useMultitrack() {
  const engineRef = useRef<MultitrackEngine | null>(null);
  const rafRef = useRef<number | null>(null);
  const blobsRef = useRef<Map<string, Blob>>(new Map());

  const [faixas, setFaixas] = useState<Faixa[]>([]);
  const [tocando, setTocando] = useState(false);
  const [posicao, setPosicao] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [projetoId, setProjetoId] = useState<string | null>(null);
  const [projetoNome, setProjetoNome] = useState('');

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
      for (let i = 0; i < arquivos.length; i++) {
        const arquivo = arquivos[i];
        const id = novoId();
        const meta = identificarInstrumento(arquivo.name, faixas.length + i);
        // placeholder enquanto decodifica
        setFaixas((atual) => [
          ...atual,
          { id, nome: meta.nome, icone: meta.icone, cor: null, buffer: null, volume: 1, mudo: false, solo: false },
        ]);
        try {
          await engine().adicionarArquivo(id, arquivo);
          blobsRef.current.set(id, arquivo);
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
    blobsRef.current.delete(id);
    setFaixas((atual) => atual.filter((f) => f.id !== id));
    setDuracao(engine().duracao);
    setPeaks(engine().getPeaks(140));
  }, []);

  /** Salva o projeto atual no navegador (IndexedDB). Retorna os metadados. */
  const salvarProjeto = useCallback(
    async (nome: string): Promise<ProjetoMeta> => {
      const id = projetoId ?? `p-${Date.now().toString(36)}`;
      const blobs = faixas
        .map((f) => ({ id: f.id, blob: blobsRef.current.get(f.id) }))
        .filter((b): b is { id: string; blob: Blob } => !!b.blob);
      const tamanho = blobs.reduce((s, b) => s + b.blob.size, 0);
      const meta: ProjetoMeta = {
        id,
        nome: nome.trim() || 'Projeto sem nome',
        criadoEm: Date.now(),
        tamanho,
        faixas: faixas.map((f) => ({
          id: f.id,
          nome: f.nome,
          icone: f.icone,
          cor: f.cor,
          volume: f.volume,
          mudo: f.mudo,
          solo: f.solo,
        })),
      };
      await projetoStore.salvarProjeto(meta, blobs);
      setProjetoId(id);
      setProjetoNome(meta.nome);
      return meta;
    },
    [faixas, projetoId],
  );

  /** Reabre um projeto salvo: restaura os áudios e a mesa (nome/cor/volume…). */
  const restaurarProjeto = useCallback(
    async (meta: ProjetoMeta) => {
      setCarregando(true);
      try {
        // limpa o estado atual
        engineRef.current?.destruir();
        engineRef.current = null;
        blobsRef.current.clear();
        pararLoop();
        setTocando(false);
        setPosicao(0);
        setFaixas([]);

        const blobs = await projetoStore.carregarBlobs(meta.id);
        const mapa = new Map(blobs.map((b) => [b.id, b.blob]));
        const restauradas: Faixa[] = [];
        for (const fm of meta.faixas) {
          const blob = mapa.get(fm.id);
          if (!blob) continue;
          await engine().adicionarArquivo(fm.id, blob);
          blobsRef.current.set(fm.id, blob);
          engine().setVolume(fm.id, fm.volume);
          engine().setMudo(fm.id, fm.mudo);
          engine().setSolo(fm.id, fm.solo);
          restauradas.push({ ...fm, buffer: {} as AudioBuffer });
        }
        setFaixas(restauradas);
        setDuracao(engine().duracao);
        setPeaks(engine().getPeaks(140));
        setProjetoId(meta.id);
        setProjetoNome(meta.nome);
      } finally {
        setCarregando(false);
      }
    },
    [pararLoop],
  );

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
    projetoId,
    projetoNome,
    salvarProjeto,
    restaurarProjeto,
  };
}
