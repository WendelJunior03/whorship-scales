import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { fonts, radius, spacing, typography } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

export interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  /** Chave da aba ativa. */
  active: string;
  onChange: (key: string) => void;
  style?: ViewStyle;
}

/**
 * Abas segmentadas (pills) — padrão já usado em Biblioteca/Ministério/Escalas,
 * agora num único componente. Ocupa a largura toda dividindo igualmente as abas.
 */
export function Tabs({ tabs, active, onChange, style }: TabsProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, style]}>
      {tabs.map((tab) => {
        const ativo = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              { backgroundColor: ativo ? colors.primary : colors.surfaceMuted },
            ]}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
          >
            <Text
              style={[styles.label, { color: ativo ? colors.textInverse : colors.textSecondary }]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  label: { ...typography.bodySmall, fontFamily: fonts.semibold },
});
