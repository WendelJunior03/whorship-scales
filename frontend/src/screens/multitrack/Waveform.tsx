import React, { useState } from 'react';
import { GestureResponderEvent, StyleSheet, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface WaveformProps {
  /** picos 0..1 (uma barra cada). */
  peaks: number[];
  /** fração tocada (0..1). */
  frac: number;
  onSeek: (frac: number) => void;
}

const ALTURA = 64;

/** Waveform tocável (seek pela posição do toque). Parte tocada fica destacada. */
export function Waveform({ peaks, frac, onSeek }: WaveformProps) {
  const { colors } = useTheme();
  const [largura, setLargura] = useState(1);

  function seekAt(e: GestureResponderEvent) {
    const x = e.nativeEvent.locationX;
    onSeek(Math.min(1, Math.max(0, x / largura)));
  }

  // Sem picos ainda (carregando) — mostra uma linha base sutil.
  const barras = peaks.length > 0 ? peaks : new Array(80).fill(0.15);

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onResponderGrant={seekAt}
      onResponderMove={seekAt}
    >
      {barras.map((p, i) => {
        const tocado = i / barras.length <= frac;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              marginHorizontal: 0.5,
              height: Math.max(3, p * ALTURA),
              borderRadius: 1,
              backgroundColor: tocado ? colors.text : colors.textMuted,
              opacity: tocado ? 0.9 : 0.35,
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    height: ALTURA,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
