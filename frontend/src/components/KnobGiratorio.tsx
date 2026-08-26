import React, { useRef } from 'react';
import { GestureResponderEvent, StyleSheet, View } from 'react-native';
import { Cores } from '@/theme/palettes';
import { useThemedStyles } from '@/contexts/ThemeContext';

interface KnobGiratorioProps {
  valor: number;
  onChange: (v: number) => void;
  cor: string;
  tamanho?: number;
}

const ANGULO_MIN = -135;
const ANGULO_MAX = 135;
// Pixels de arrasto vertical pro curso completo (0 a 1) — arrastar de verdade num arco
// é pouco confiável no touch; arrasto vertical reto é o padrão usado por apps de áudio.
const PIXELS_PARA_CURSO_COMPLETO = 120;

/**
 * Knob giratório (0 a 1), visual estilo "cutoff" de plugin de áudio. Arrasto vertical
 * (não segue um arco) — mesma filosofia do `BarraDeslizante`/`FaderVertical`: gesto
 * nativo do RN, sem lib nova.
 */
export function KnobGiratorio({ valor, onChange, cor, tamanho = 40 }: KnobGiratorioProps) {
  const styles = useThemedStyles(criarEstilos);
  const inicio = useRef({ pageY: 0, valor });

  function aoIniciar(e: GestureResponderEvent) {
    inicio.current = { pageY: e.nativeEvent.pageY, valor };
  }

  function aoArrastar(e: GestureResponderEvent) {
    const deltaY = inicio.current.pageY - e.nativeEvent.pageY; // pra cima = positivo
    const novoValor = Math.min(1, Math.max(0, inicio.current.valor + deltaY / PIXELS_PARA_CURSO_COMPLETO));
    onChange(novoValor);
  }

  const angulo = ANGULO_MIN + valor * (ANGULO_MAX - ANGULO_MIN);

  return (
    <View
      style={[styles.base, { width: tamanho, height: tamanho, borderRadius: tamanho / 2 }]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={aoIniciar}
      onResponderMove={aoArrastar}
    >
      <View style={[StyleSheet.absoluteFillObject, styles.pivot, { transform: [{ rotate: `${angulo}deg` }] }]}>
        <View style={[styles.marcador, { backgroundColor: cor }]} />
      </View>
    </View>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  base: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pivot: {
    alignItems: 'center',
  },
  marcador: {
    position: 'absolute',
    top: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
