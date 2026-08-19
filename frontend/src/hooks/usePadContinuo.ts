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
        // mesma nota que já tocava — só desliga ela.
        parar(nota);
        setAtivos((atual) => ({ ...atual, [nota]: false }));
        return;
      }

      // nota diferente — só uma toca por vez, então desliga qualquer outra ativa
      // antes de ligar essa (cada "parar" já usa o fade suave que existe na engine).
      NOTAS.forEach((outraNota) => {
        if (outraNota !== nota && ativos[outraNota]) {
          parar(outraNota);
        }
      });
      tocar(nota);

      setAtivos(() => {
        const novoEstado = Object.fromEntries(NOTAS.map((n) => [n, false])) as Record<Note, boolean>;
        novoEstado[nota] = true;
        return novoEstado;
      });
    },
    [ativos],
  );

  const ajustarVolumeGeral = useCallback((valor: number) => {
    definirVolumeGeral(valor);
    setVolumeGeral(valor);
  }, []);

  return { notas: NOTAS, ativos, alternar, volumeGeral, ajustarVolumeGeral };
}
