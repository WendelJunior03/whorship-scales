import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts, radius } from '@/theme';

/**
 * Selo "PRO" reutilizável (spec 03, T-03.4). Marca uma feature como paga na UI.
 * Na v1 nada é bloqueado por plano — o selo é informativo (CTA de upgrade futura).
 */
export function SeloPro({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.selo, style]}>
      <Text style={styles.texto}>PRO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  selo: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warning,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  texto: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.textInverse,
  },
});
