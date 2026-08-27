import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { fonts, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { usePopoverAncorado } from './usePopoverAncorado';

const LARGURA_POPOVER = 240;

interface PopoverSalvarPresetProps {
  onSalvar: (nome: string) => void;
  /** Chamado depois de salvar com sucesso (fechado este popover) — usado pra abrir a
   * lista "Meus presets" em seguida, o preset novo já aparecendo nela como confirmação
   * visual de que salvou. */
  onSalvo?: () => void;
}

/** Link "Salvar preset" (rodapé do mixer) — abre um popover com só o nome + Salvar. */
export function PopoverSalvarPreset({ onSalvar, onSalvo }: PopoverSalvarPresetProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const { gatilhoRef, aberto, pos, abrir, fechar } = usePopoverAncorado(LARGURA_POPOVER);
  const [nome, setNome] = useState('');

  // Esc fecha o popover (web) — o `onRequestClose` do Modal já cobre o botão físico/gesto
  // de voltar do Android, mas não o teclado no navegador.
  useEffect(() => {
    if (Platform.OS !== 'web' || !aberto) return;
    // Tipo mínimo local — o tsconfig não inclui a lib "dom" (mesmo padrão de useAfinador.ts).
    const aoTeclar = (e: { key: string }) => {
      if (e.key === 'Escape') fechar();
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto]);

  function salvar() {
    const valor = nome.trim();
    if (!valor) return;
    onSalvar(valor);
    setNome('');
    fechar();
    onSalvo?.();
  }

  return (
    <>
      <TouchableOpacity ref={gatilhoRef} style={styles.acao} onPress={abrir} accessibilityRole="button" accessibilityLabel="Salvar preset">
        <Icon name="save-outline" size={16} color={colors.primary} />
        <Text style={styles.acaoTexto}>Salvar preset</Text>
      </TouchableOpacity>

      <Modal visible={aberto} transparent animationType="none" onRequestClose={fechar}>
        <Pressable style={StyleSheet.absoluteFill} onPress={fechar} accessibilityLabel="Fechar" />
        <View style={[styles.popover, { bottom: pos.bottom, left: pos.left }]}>
          <Text style={styles.titulo}>Salvar preset</Text>
          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Nome do preset"
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={salvar}
            style={styles.input}
            autoFocus
          />
          <Button title="Salvar" onPress={salvar} disabled={!nome.trim()} />
        </View>
      </Modal>
    </>
  );
}

const criarEstilos = (colors: Cores) =>
  StyleSheet.create({
    acao: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    acaoTexto: {
      ...typography.bodySmall,
      color: colors.primary,
      fontFamily: fonts.semibold,
    },
    popover: {
      position: 'absolute',
      width: LARGURA_POPOVER,
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    titulo: {
      ...typography.h3,
      color: colors.text,
    },
    input: {
      ...typography.bodySmall,
      color: colors.text,
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
  });
