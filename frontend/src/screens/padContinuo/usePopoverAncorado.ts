import { useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';

const MARGEM_TELA = 8;

/**
 * Mede a posição real do botão-gatilho (`measureInWindow`) e devolve onde o popover deve
 * abrir — ancorado ACIMA do botão (os gatilhos de preset ficam perto do rodapé da tela,
 * então abrir pra baixo correria risco de sair da tela) e nunca vazando pras laterais.
 */
export function usePopoverAncorado(larguraPopover: number) {
  const gatilhoRef = useRef<View>(null);
  const { width: larguraJanela, height: alturaJanela } = useWindowDimensions();
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState({ bottom: 0, left: 0 });

  function abrir() {
    gatilhoRef.current?.measureInWindow((x, y) => {
      setPos({
        bottom: Math.max(MARGEM_TELA, alturaJanela - y + MARGEM_TELA),
        left: Math.min(Math.max(MARGEM_TELA, x), larguraJanela - larguraPopover - MARGEM_TELA),
      });
      setAberto(true);
    });
  }

  function fechar() {
    setAberto(false);
  }

  return { gatilhoRef, aberto, pos, abrir, fechar };
}
