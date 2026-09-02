import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { spacing, typography, fonts } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useThemedStyles } from '@/contexts/ThemeContext';

interface SectionHeaderProps {
  titulo: string;
  /** Legenda discreta ao lado do título (ex.: "Próximas"). */
  subtitulo?: string;
  /** Pílula com número ao lado do título (ex.: total de itens). */
  contador?: number;
  /** Link de ação à direita (ex.: "Ver todas"). */
  acao?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

/**
 * Cabeçalho de seção padronizado (título grande + contador + subtítulo + ação).
 * Extraído da Home pra dar a mesma hierarquia "arejada" em todas as telas.
 */
export function SectionHeader({ titulo, subtitulo, contador, acao, style }: SectionHeaderProps) {
  const styles = useThemedStyles(criarEstilos);
  return (
    <View style={[styles.header, style]}>
      <View style={styles.tituloLinha}>
        <Text style={styles.titulo} numberOfLines={1}>
          {titulo}
        </Text>
        {contador !== undefined && (
          <View style={styles.contador}>
            <Text style={styles.contadorText}>{contador}</Text>
          </View>
        )}
        {subtitulo ? (
          <Text style={styles.sub} numberOfLines={1}>
            {subtitulo}
          </Text>
        ) : null}
      </View>
      {acao ? (
        <TouchableOpacity onPress={acao.onPress} hitSlop={6} style={styles.acaoWrap}>
          <Text style={styles.acao}>{acao.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const criarEstilos = (colors: Cores) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
      marginBottom: spacing.xs,
    },
    tituloLinha: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, minWidth: 0 },
    titulo: { ...typography.h2, color: colors.text, flexShrink: 1 },
    contador: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 6,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    contadorText: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.semibold },
    sub: { ...typography.caption, color: colors.textMuted, flexShrink: 1 },
    acaoWrap: { flexShrink: 0, marginLeft: spacing.sm },
    acao: { ...typography.bodySmall, color: colors.primary, fontFamily: fonts.semibold },
  });
