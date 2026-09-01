import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { spacing, typography } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Icon, IconName } from './Icon';
import { Button } from './Button';

interface EmptyStateProps {
  /** Ícone semântico no topo (opcional). */
  icon?: IconName;
  title: string;
  /** Texto de apoio abaixo do título. */
  description?: string;
  /** Botão de ação opcional (ex.: "Criar o primeiro"). */
  action?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

/**
 * Estado vazio padronizado (lista sem itens, busca sem resultado). Antes era feito
 * "na unha" em ~20 telas; centralizar aqui garante o mesmo visual e espaçamento.
 */
export function EmptyState({ icon, title, description, action, style }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, style]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: colors.surfaceElevated }]}>
          <Icon name={icon} size={28} color={colors.textSecondary} />
        </View>
      ) : null}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      ) : null}
      {action ? (
        <Button
          title={action.label}
          onPress={action.onPress}
          variant="outline"
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: { ...typography.h3, textAlign: 'center' },
  description: { ...typography.bodySmall, textAlign: 'center', maxWidth: 320, lineHeight: 20 },
  action: { marginTop: spacing.md, minWidth: 200 },
});
