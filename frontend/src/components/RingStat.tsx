import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { typography, fonts } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface RingStatProps {
  /** 0–100. */
  percent: number;
  valor: string;
  label: string;
  size?: number;
  stroke?: number;
  /** Gradiente do anel (default: accentGradient do tema). */
  cores?: readonly [string, string];
  corTrilho?: string;
  corValor?: string;
  corLabel?: string;
}

let contador = 0;

/**
 * Anel de progresso com stroke em gradiente e o valor no centro — o "donut chart"
 * do design de referência. SVG (react-native-svg) funciona em web e nativo.
 */
export function RingStat({
  percent,
  valor,
  label,
  size = 76,
  stroke = 7,
  cores,
  corTrilho,
  corValor,
  corLabel,
}: RingStatProps) {
  const { colors } = useTheme();
  const grad = cores ?? colors.accentGradient;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, percent));
  const preenchido = (pct / 100) * circ;
  // id único e estável por instância (gradientes SVG são globais por id).
  const gid = React.useMemo(() => `ring-grad-${contador++}`, []);

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Defs>
            <SvgGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={grad[0]} />
              <Stop offset="1" stopColor={grad[1]} />
            </SvgGradient>
          </Defs>
          {/* Trilho sempre visível (tom fraco da própria cor) → o anel sempre "lê". */}
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={corTrilho ?? `${grad[0]}2E`} strokeWidth={stroke} fill="none" />
          {/* Progresso só quando há valor — evita o "pontinho solto" do cap redondo em 0%. */}
          {pct > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={`url(#${gid})`}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${preenchido} ${circ - preenchido}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={[styles.valor, { color: corValor ?? colors.text }]}>{valor}</Text>
        </View>
      </View>
      <Text style={[styles.label, { color: corLabel ?? colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  valor: { ...typography.body, fontFamily: fonts.bold },
  label: { ...typography.caption },
});
