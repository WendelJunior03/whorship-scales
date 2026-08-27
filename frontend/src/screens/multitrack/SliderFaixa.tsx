import React, { useState } from 'react';
import { GestureResponderEvent, StyleSheet, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SliderFaixaProps {
  valor: number; // 0..1
  onChange: (v: number) => void;
  mudo?: boolean;
}

const KNOB = 22;

/** Slider de volume com knob (círculo com miolo) no estilo do mockup, usando a
 *  cor do tema. Toque/arraste define o valor pela posição (sem lib externa). */
export function SliderFaixa({ valor, onChange, mudo }: SliderFaixaProps) {
  const { colors } = useTheme();
  const [largura, setLargura] = useState(1);

  function definir(e: GestureResponderEvent) {
    const x = e.nativeEvent.locationX;
    onChange(Math.min(1, Math.max(0, x / largura)));
  }

  const corPreenchida = mudo ? colors.textMuted : colors.primary;

  return (
    <View
      style={styles.area}
      onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onResponderGrant={definir}
      onResponderMove={definir}
    >
      <View style={[styles.trilha, { backgroundColor: colors.border }]} />
      <View style={[styles.preenchida, { width: `${valor * 100}%`, backgroundColor: corPreenchida }]} />
      <View
        style={[
          styles.knob,
          { left: `${valor * 100}%`, backgroundColor: colors.surface, borderColor: corPreenchida },
        ]}
      >
        <View style={[styles.miolo, { backgroundColor: corPreenchida }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { height: KNOB, justifyContent: 'center' },
  trilha: { height: 4, borderRadius: 2 },
  preenchida: { position: 'absolute', left: 0, height: 4, borderRadius: 2 },
  knob: {
    position: 'absolute',
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    borderWidth: 2,
    marginLeft: -KNOB / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miolo: { width: 6, height: 6, borderRadius: 3 },
});
