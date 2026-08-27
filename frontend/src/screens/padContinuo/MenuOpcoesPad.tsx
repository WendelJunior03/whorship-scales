import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon, IconName } from '@/components/Icon';
import { radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { ANCORA_DIREITA, ANCORA_TOPO } from './anchoragem';

interface MenuOpcoesPadProps {
  visible: boolean;
  onClose: () => void;
  onPersonalizar: () => void;
  onPresets: () => void;
}

/** Menu de opções do Pad Contínuo (ícone de 3 barrinhas no header) — abre Personalizar ou Presets. */
export function MenuOpcoesPad({ visible, onClose, onPersonalizar, onPresets }: MenuOpcoesPadProps) {
  const styles = useThemedStyles(criarEstilos);

  function selecionar(acao: () => void) {
    onClose();
    acao();
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fechar menu" />
      <View style={styles.menu}>
        <ItemMenu icon="palette-outline" label="Personalizar" onPress={() => selecionar(onPersonalizar)} />
        <ItemMenu icon="save-outline" label="Presets" onPress={() => selecionar(onPresets)} />
      </View>
    </Modal>
  );
}

function ItemMenu({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Icon name={icon} size={18} color={colors.text} />
      <Text style={styles.itemTexto}>{label}</Text>
    </TouchableOpacity>
  );
}

const criarEstilos = (colors: Cores) =>
  StyleSheet.create({
    menu: {
      position: 'absolute',
      top: ANCORA_TOPO,
      right: ANCORA_DIREITA,
      width: 180,
      gap: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xs,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    itemTexto: {
      ...typography.bodySmall,
      color: colors.text,
    },
  });
