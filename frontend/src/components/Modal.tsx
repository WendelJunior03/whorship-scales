import React from 'react';
import { Modal as RNModal, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { radius, spacing, typography } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Icon } from './Icon';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  /** Título no cabeçalho (com botão de fechar ao lado). */
  title?: string;
  children: React.ReactNode;
  /** Fechar ao tocar fora / mostrar o X (default: true). */
  dismissable?: boolean;
  contentStyle?: ViewStyle;
}

/**
 * Bottom-sheet padronizado: overlay escuro, painel ancorado embaixo com cantos
 * arredondados, fechar tocando fora e (opcional) cabeçalho com título + X.
 * Substitui o `Modal` do RN montado "na unha" em ~18 telas.
 */
export function Modal({ visible, onClose, title, children, dismissable = true, contentStyle }: ModalProps) {
  const { colors } = useTheme();
  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={dismissable ? onClose : undefined}>
        {/* Pressable interno absorve o toque para não fechar ao tocar no conteúdo. */}
        <Pressable
          style={[styles.content, { backgroundColor: colors.surface }, contentStyle]}
          onPress={() => {}}
        >
          {title || dismissable ? (
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                {title ?? ''}
              </Text>
              {dismissable ? (
                <Pressable
                  onPress={onClose}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar"
                >
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </Pressable>
              ) : null}
            </View>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { ...typography.h3, flexShrink: 1 },
});
