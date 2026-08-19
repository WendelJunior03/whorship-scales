import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon, IconName } from '@/components/Icon';
import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/theme';

export interface OptionsMenuAction {
  label: string;
  icon?: IconName;
  destructive?: boolean;
  onPress: () => void;
}

interface OptionsMenuProps {
  actions: OptionsMenuAction[];
  loading?: boolean;
}

/**
 * Ícone de 3 pontinhos que abre um menuzinho com ações (ex: excluir), no
 * lugar de deixar um ícone de ação sempre visível grudado na linha.
 */
export function OptionsMenu({ actions, loading }: OptionsMenuProps) {
  const [aberto, setAberto] = useState(false);

  if (loading) {
    return <ActivityIndicator size="small" color={colors.error} />;
  }

  return (
    <>
      <TouchableOpacity onPress={() => setAberto(true)} hitSlop={10}>
        <Icon name="ellipsis-vertical" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={aberto}
        animationType="slide"
        transparent
        onRequestClose={() => setAberto(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.item}
                onPress={() => {
                  setAberto(false);
                  action.onPress();
                }}
              >
                {action.icon && (
                  <Icon
                    name={action.icon}
                    size={20}
                    color={action.destructive ? colors.error : colors.text}
                  />
                )}
                <Text style={[styles.itemText, action.destructive && styles.itemTextDestructive]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setAberto(false)}
              style={styles.cancelButton}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  itemText: {
    ...typography.body,
    color: colors.text,
  },
  itemTextDestructive: {
    color: colors.error,
  },
  cancelButton: {
    marginTop: spacing.sm,
  },
});
