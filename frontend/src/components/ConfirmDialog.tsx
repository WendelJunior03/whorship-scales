import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { useThemedStyles } from '@/contexts/ThemeContext';
import { Cores } from '@/theme/palettes';
import { radius, spacing, typography } from '@/theme';

interface ConfirmDialogProps {
  visible: boolean;
  titulo: string;
  mensagem: string;
  confirmLabel?: string;
  /** Passe `null` para modo aviso (um único botão). */
  cancelLabel?: string | null;
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * Diálogo in-app (centralizado) para confirmações e avisos — substitui
 * Alert.alert/window.confirm, que no react-native-web não exibem de forma
 * confiável / bonita. Se `cancelLabel` for null (ou não houver `onCancel`),
 * vira um aviso com um botão só.
 */
export function ConfirmDialog({
  visible,
  titulo,
  mensagem,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const styles = useThemedStyles(criarEstilos);
  const soConfirmar = cancelLabel === null || !onCancel;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => (onCancel ?? onConfirm)()}
    >
      <Pressable style={styles.overlay} onPress={onCancel ?? onConfirm}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.mensagem}>{mensagem}</Text>
          <View style={styles.botoes}>
            {!soConfirmar && (
              <Button title={cancelLabel ?? 'Cancelar'} variant="outline" onPress={onCancel!} style={styles.botao} />
            )}
            <Button title={confirmLabel} onPress={onConfirm} style={styles.botao} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const criarEstilos = (colors: Cores) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    titulo: { ...typography.h3, color: colors.text },
    mensagem: { ...typography.body, color: colors.textSecondary },
    botoes: { flexDirection: 'column', gap: spacing.sm, marginTop: spacing.sm },
    botao: { width: '100%' },
  });
