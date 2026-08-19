import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon, IconName } from '@/components/Icon';
import { PreferenciaTema, useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { Cores } from '@/theme/palettes';
import { fonts, radius, spacing, typography } from '@/theme';

const OPCOES: { valor: PreferenciaTema; label: string; icon: IconName }[] = [
  { valor: 'sistema', label: 'Sistema', icon: 'phone-portrait-outline' },
  { valor: 'claro', label: 'Claro', icon: 'sunny-outline' },
  { valor: 'escuro', label: 'Escuro', icon: 'moon-outline' },
];

/** Seletor de tema (Sistema / Claro / Escuro). Troca na hora e salva a preferência. */
export function SeletorTema() {
  const { colors, preferencia, definirPreferencia } = useTheme();
  const styles = useThemedStyles(criarEstilos);

  return (
    <View style={styles.grupo}>
      {OPCOES.map((o) => {
        const ativo = preferencia === o.valor;
        return (
          <TouchableOpacity
            key={o.valor}
            style={[styles.opcao, ativo && styles.opcaoAtiva]}
            onPress={() => definirPreferencia(o.valor)}
            activeOpacity={0.8}
          >
            <Icon name={o.icon} size={18} color={ativo ? colors.primary : colors.textSecondary} />
            <Text style={[styles.texto, ativo && styles.textoAtivo]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const criarEstilos = (colors: Cores) =>
  StyleSheet.create({
    grupo: {
      flexDirection: 'row',
      gap: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xs,
    },
    opcao: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
    },
    opcaoAtiva: {
      backgroundColor: colors.primarySoft,
    },
    texto: {
      ...typography.bodySmall,
      color: colors.textSecondary,
    },
    textoAtivo: {
      color: colors.primary,
      fontFamily: fonts.semibold,
    },
  });
