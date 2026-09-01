import React from 'react';
import { ViewStyle } from 'react-native';
import { MotiView } from 'moti';

interface AnimatedItemProps {
  /** Posição na lista — escalona o atraso de entrada (cap em 8 p/ listas longas). */
  index?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Entrada suave (fade + subida leve) para itens de lista/cards. Camada declarativa
 * do Moti sobre o Reanimated (decisão D-04.2). O atraso escalonado por índice dá o
 * efeito "cascata" sem travar listas grandes (limitado a 8 posições).
 */
export function AnimatedItem({ index = 0, children, style }: AnimatedItemProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 260, delay: Math.min(index, 8) * 40 }}
      style={style}
    >
      {children}
    </MotiView>
  );
}
