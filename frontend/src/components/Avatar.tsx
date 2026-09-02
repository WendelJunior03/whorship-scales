import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { fonts } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  const a = p[0]?.[0] ?? '';
  const b = p.length > 1 ? (p[p.length - 1]?.[0] ?? '') : '';
  return (a + b).toUpperCase();
}

interface AvatarProps {
  nome: string;
  /** URL (Google) ou data URL (upload). Sem foto → mostra as iniciais. */
  fotoUrl?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/** Avatar do membro: foto quando existe, senão as iniciais num círculo. */
export function Avatar({ nome, fotoUrl, size = 44, style }: AvatarProps) {
  const { colors } = useTheme();
  const dim = { width: size, height: size, borderRadius: size / 2 };

  if (fotoUrl) {
    return (
      <Image
        source={{ uri: fotoUrl }}
        style={[dim, style] as unknown as StyleProp<ImageStyle>}
        accessibilityIgnoresInvertColors
        accessibilityLabel={`Foto de ${nome}`}
      />
    );
  }

  return (
    <View style={[dim, styles.fallback, { backgroundColor: colors.primarySoft }, style]}>
      <Text style={[styles.txt, { color: colors.primary, fontSize: size * 0.4 }]}>{iniciais(nome) || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  txt: { fontFamily: fonts.bold },
});
