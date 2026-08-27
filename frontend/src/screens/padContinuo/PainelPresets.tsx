import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { PadPreset } from '@/hooks/usePadPresets';
import { confirmAction } from '@/utils/confirm';
import { radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { ANCORA_DIREITA, ANCORA_TOPO } from './anchoragem';

const LARGURA_POPOVER = 260;

interface PainelPresetsProps {
  visible: boolean;
  onClose: () => void;
  presets: PadPreset[];
  onAplicar: (preset: PadPreset) => void;
  onSalvar: (nome: string) => void;
  onExcluir: (id: string) => void;
}

/**
 * Popover de Presets do Pad Contínuo — salvar/aplicar/excluir mixagens. Aberto a partir
 * do menu de opções (ícone de 3 barrinhas no header), ancorado no mesmo canto superior
 * direito dele.
 */
export function PainelPresets({ visible, onClose, presets, onAplicar, onSalvar, onExcluir }: PainelPresetsProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const [nomeNovo, setNomeNovo] = useState('');

  // Esc fecha o popover (web) — o `onRequestClose` do Modal já cobre o botão físico/gesto
  // de voltar do Android, mas não o teclado no navegador.
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    // Tipo mínimo local — o tsconfig não inclui a lib "dom" (mesmo padrão de
    // useAfinador.ts), então não dá pra usar o `KeyboardEvent` global do navegador.
    const aoTeclar = (e: { key: string }) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [visible, onClose]);

  function salvar() {
    const nome = nomeNovo.trim();
    if (!nome) return;
    onSalvar(nome);
    setNomeNovo('');
    onClose();
  }

  function aplicar(preset: PadPreset) {
    onAplicar(preset);
    onClose();
  }

  function excluirComConfirmacao(preset: PadPreset) {
    confirmAction(
      { title: 'Excluir preset', message: `Excluir "${preset.nome}"? Essa ação não pode ser desfeita.` },
      () => onExcluir(preset.id),
    );
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fechar presets" />
      <View style={styles.popover}>
        <Text style={styles.titulo}>Presets</Text>

        <View style={styles.salvarInputWrap}>
          <TextInput
            value={nomeNovo}
            onChangeText={setNomeNovo}
            placeholder="Nome do preset"
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={salvar}
            style={styles.salvarInput}
          />
        </View>
        <Button title="Salvar" onPress={salvar} disabled={!nomeNovo.trim()} />

        <View style={styles.divisor} />

        {presets.length === 0 ? (
          <Text style={styles.vazioTexto}>Nenhum preset salvo ainda.</Text>
        ) : (
          <View style={styles.lista}>
            {presets.map((preset, indice) => (
              <View key={preset.id} style={styles.linha}>
                <TouchableOpacity
                  style={styles.linhaBotaoAplicar}
                  onPress={() => aplicar(preset)}
                  accessibilityRole="button"
                  accessibilityLabel={`Aplicar preset ${preset.nome}`}
                >
                  <Text style={styles.linhaNome} numberOfLines={1}>
                    {indice + 1} - {preset.nome}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => excluirComConfirmacao(preset)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Excluir ${preset.nome}`}
                >
                  <Icon name="trash-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const criarEstilos = (colors: Cores) =>
  StyleSheet.create({
    popover: {
      position: 'absolute',
      top: ANCORA_TOPO,
      right: ANCORA_DIREITA,
      width: LARGURA_POPOVER,
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      // Sombra pra destacar o popover flutuando por cima do resto da tela.
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
    salvarInputWrap: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
    },
    salvarInput: {
      ...typography.bodySmall,
      color: colors.text,
      paddingVertical: spacing.sm,
    },
    divisor: {
      height: 1,
      backgroundColor: colors.border,
    },
    vazioTexto: {
      ...typography.caption,
      color: colors.textMuted,
    },
    lista: {
      gap: spacing.xs,
    },
    linha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    linhaBotaoAplicar: {
      flex: 1,
    },
    linhaNome: {
      ...typography.bodySmall,
      color: colors.text,
    },
  });
