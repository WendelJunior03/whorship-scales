import React, { useRef } from 'react';
import { GestureResponderEvent, StyleSheet, View } from 'react-native';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

interface KnobGiratorioProps {
  valor: number;
  onChange: (v: number) => void;
  cor: string;
  tamanho?: number;
  /** Cor das marcas apagadas/base — opcional, sobrescreve o tom padrão do tema (personalização). */
  corInativa?: string;
}

const ANGULO_MIN = -135;
const ANGULO_MAX = 135;
const NUM_MARCAS = 13;
// Pixels de arrasto vertical pro curso completo (0 a 1) — arrastar de verdade num arco
// é pouco confiável no touch; arrasto vertical reto é o padrão usado por apps de áudio.
const PIXELS_PARA_CURSO_COMPLETO = 120;

/**
 * Knob giratório (0 a 1), visual estilo "cutoff" de plugin de áudio: anel de marcas
 * (barrinhas) ao redor, coloridas até o valor atual — não só um ponteiro. Arrasto
 * vertical (não segue um arco) — mesma filosofia do `BarraDeslizante`/`FaderVertical`:
 * gesto nativo do RN, sem lib nova.
 */
export function KnobGiratorio({ valor, onChange, cor, tamanho = 56, corInativa }: KnobGiratorioProps) {
  const { colors } = useTheme();
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

  const raioMarcas = tamanho / 2 + 9;
  const ladoContainer = tamanho + 22;
  const angulo = ANGULO_MIN + valor * (ANGULO_MAX - ANGULO_MIN);

  return (
    <View
      style={[styles.container, { width: ladoContainer, height: ladoContainer }]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={aoIniciar}
      onResponderMove={aoArrastar}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {Array.from({ length: NUM_MARCAS }).map((_, i) => {
        const fracao = i / (NUM_MARCAS - 1);
        const anguloGraus = ANGULO_MIN + fracao * (ANGULO_MAX - ANGULO_MIN);
        const anguloRad = (anguloGraus * Math.PI) / 180;
        const x = Math.sin(anguloRad) * raioMarcas;
        const y = -Math.cos(anguloRad) * raioMarcas;
        const aceso = fracao <= valor;
        return (
          <View
            key={i}
            style={[
              styles.marca,
              {
                backgroundColor: aceso ? cor : (corInativa ?? colors.border),
                transform: [{ translateX: x }, { translateY: y }, { rotate: `${anguloGraus}deg` }],
              },
            ]}
          />
        );
      })}

      <View style={[styles.base, { width: tamanho, height: tamanho, borderRadius: tamanho / 2 }]}>
        <View style={[StyleSheet.absoluteFillObject, styles.pivot, { transform: [{ rotate: `${angulo}deg` }] }]}>
          <View style={[styles.ponteiro, { backgroundColor: cor }]} />
        </View>
      </View>
    </View>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marca: {
    position: 'absolute',
    width: 3,
    height: 8,
    borderRadius: 1.5,
  },
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
  ponteiro: {
    position: 'absolute',
    top: 6,
    width: 4,
    height: 10,
    borderRadius: 2,
  },
});
