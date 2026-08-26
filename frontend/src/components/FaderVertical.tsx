import React, { useState } from 'react';
import { GestureResponderEvent, StyleSheet, View } from 'react-native';
import { Cores } from '@/theme/palettes';
import { useThemedStyles } from '@/contexts/ThemeContext';
import { radius } from '@/theme';

interface FaderVerticalProps {
  valor: number;
  onChange: (v: number) => void;
  corPreenchida: string;
  corBolinha: string;
}

/**
 * Fader vertical (0 a 1) — mesma técnica de gesto nativo do `BarraDeslizante` (sem lib
 * de slider no projeto: `onResponderMove` puro), só no eixo Y e invertido: arrastar pra
 * cima aumenta, pra baixo diminui (convenção de fader de mixer).
 */
export function FaderVertical({ valor, onChange, corPreenchida, corBolinha }: FaderVerticalProps) {
  const styles = useThemedStyles(criarEstilos);
  const [altura, setAltura] = useState(1); // evita divisão por zero antes do 1º layout

  function definirPelaPosicao(e: GestureResponderEvent) {
    const y = e.nativeEvent.locationY;
    const fracao = 1 - Math.min(1, Math.max(0, y / altura));
    onChange(fracao);
  }

  return (
    <View
      style={styles.trilha}
      onLayout={(e) => setAltura(e.nativeEvent.layout.height)}
      onStartShouldSetResponder={() => true}
      onResponderGrant={definirPelaPosicao}
      onResponderMove={definirPelaPosicao}
    >
      <View style={[styles.trilhaPreenchida, { height: `${valor * 100}%`, backgroundColor: corPreenchida }]} />
      <View style={[styles.bolinha, { bottom: `${valor * 100}%`, backgroundColor: corBolinha }]} />
    </View>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  trilha: {
    width: 8,
    flex: 1,
    minHeight: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
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
    left: '50%',
    marginLeft: -10,
    marginBottom: -10,
  },
});
