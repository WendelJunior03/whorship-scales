import React, { useState } from 'react';
import { GestureResponderEvent, StyleSheet, View } from 'react-native';
import { Cores } from '@/theme/palettes';
import { useThemedStyles } from '@/contexts/ThemeContext';
import { radius } from '@/theme';

interface BarraDeslizanteProps {
  valor: number;
  onChange: (v: number) => void;
  corPreenchida: string;
  corBolinha: string;
}

/**
 * Trilha arrastável genérica (0 a 1). Sem lib de slider no projeto — usa o sistema de
 * toque nativo do RN (`locationX`, relativo ao próprio elemento) em vez de medir posição
 * na tela, então não precisa de nenhuma dependência nova.
 */
export function BarraDeslizante({ valor, onChange, corPreenchida, corBolinha }: BarraDeslizanteProps) {
  const styles = useThemedStyles(criarEstilos);
  const [largura, setLargura] = useState(1); // evita divisão por zero antes do 1º layout

  function definirPelaPosicao(e: GestureResponderEvent) {
    const x = e.nativeEvent.locationX;
    const fracao = Math.min(1, Math.max(0, x / largura));
    onChange(fracao);
  }

  return (
    <View
      style={styles.trilha}
      onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onResponderGrant={definirPelaPosicao}
      onResponderMove={definirPelaPosicao}
    >
      <View style={[styles.trilhaPreenchida, { width: `${valor * 100}%`, backgroundColor: corPreenchida }]} />
      <View style={[styles.bolinha, { left: `${valor * 100}%`, backgroundColor: corBolinha }]} />
    </View>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  trilha: {
    flex: 1,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
  },
  trilhaPreenchida: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.pill,
  },
  bolinha: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.background,
    marginLeft: -9,
  },
});
