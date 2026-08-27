import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon, IconName } from '@/components/Icon';
import { useNavigation } from '@react-navigation/native';
import { spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

export interface HeaderAction {
  icon: IconName;
  label: string;
  onPress: () => void;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  /** Botões à direita do título — na ordem em que devem aparecer. */
  rightActions?: HeaderAction[];
}

export function Header({
  title,
  subtitle,
  showBack,
  rightActions = [],
}: HeaderProps) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);

  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {showBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={[styles.side, styles.sideRight]}>
        {rightActions.map((acao) => (
          <TouchableOpacity
            key={acao.label}
            onPress={acao.onPress}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={acao.label}
          >
            <Icon name={acao.icon} size={24} color={colors.text} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  side: {
    minWidth: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
