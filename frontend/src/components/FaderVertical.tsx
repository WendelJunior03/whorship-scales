import React, { useState } from 'react';
import { GestureResponderEvent, StyleSheet, View } from 'react-native';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { hexParaRgba } from '@/utils/cor';
import { radius } from '@/theme';

interface FaderVerticalProps {
  valor: number;
  onChange: (v: number) => void;
  corPreenchida: string;
  corBolinha: string;
  /** Cor da trilha vazia — opcional, sobrescreve o tom padrão do tema (personalização). */
  corTrilha?: string;
}

/**
 * Fader vertical (0 a 1) — mesma técnica de gesto nativo do `BarraDeslizante` (sem lib
 * de slider no projeto: `onResponderMove` puro), só no eixo Y e invertido: arrastar pra
 * cima aumenta, pra baixo diminui (convenção de fader de mixer).
 */
export function FaderVertical({ valor, onChange, corPreenchida, corBolinha, corTrilha }: FaderVerticalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const [altura, setAltura] = useState(1); // evita divisão por zero antes do 1º layout

  function definirPelaPosicao(e: GestureResponderEvent) {
    const y = e.nativeEvent.locationY;
    const fracao = 1 - Math.min(1, Math.max(0, y / altura));
    onChange(fracao);
  }

  return (
    // Área de toque mais larga que o trilho visível — mais fácil de agarrar no dedo.
    <View
      style={styles.areaToque}
      onLayout={(e) => setAltura(e.nativeEvent.layout.height)}
      onStartShouldSetResponder={() => true}
      onResponderGrant={definirPelaPosicao}
      onResponderMove={definirPelaPosicao}
    >
      <View style={[styles.trilha, corTrilha ? { backgroundColor: hexParaRgba(corTrilha, 0.35) } : null]}>
        <View style={[styles.trilhaPreenchida, { height: `${valor * 100}%`, backgroundColor: corPreenchida }]} />
        <View
          style={[
            styles.bolinha,
            { bottom: `${valor * 100}%`, backgroundColor: corBolinha, borderColor: colors.surface },
          ]}
        />
      </View>
    </View>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  areaToque: {
    width: 44,
    flex: 1,
    minHeight: 96,
    alignItems: 'center',
  },
  trilha: {
    width: 14,
    flex: 1,
    borderRadius: radius.pill,
    backgroundColor: hexParaRgba(colors.textMuted, 0.35),
    justifyContent: 'flex-end',
  },
  trilhaPreenchida: {
    width: '100%',
    borderRadius: radius.pill,
  },
  bolinha: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    left: '50%',
    marginLeft: -10,
    marginBottom: -10,
  },
});
