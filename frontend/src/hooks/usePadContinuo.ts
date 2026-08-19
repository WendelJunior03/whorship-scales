import { useCallback, useState } from 'react';
import { NOTAS, Note, tocar, parar, definirVolumeGeral } from '@/screens/padContinuo/padContinuoEngine';

/**
 * Controlador do Pad Contínuo (Banco de Pads). Mapa central de notas ativas —
 * os componentes visuais só leem esse estado, nunca falam direto com a engine.
 */
export function usePadContinuo() {
  const [ativos, setAtivos] = useState<Record<Note, boolean>>(
    () => Object.fromEntries(NOTAS.map((nota) => [nota, false])) as Record<Note, boolean>,
  );
  const [volumeGeral, setVolumeGeral] = useState(0.7);

  const alternar = useCallback(
    (nota: Note) => {
      const estaAtivo = ativos[nota];
      if (estaAtivo) {
        parar(nota);
      } else {
        tocar(nota);
      }
      // atualizador puro (sem efeito colateral aqui dentro) — seguro contra dupla
      // invocação do Strict Mode.
      setAtivos((atual) => ({ ...atual, [nota]: !estaAtivo }));
    },
    [ativos],
  );

  const ajustarVolumeGeral = useCallback((valor: number) => {
    definirVolumeGeral(valor);
    setVolumeGeral(valor);
  }, []);

  return { notas: NOTAS, ativos, alternar, volumeGeral, ajustarVolumeGeral };
}
