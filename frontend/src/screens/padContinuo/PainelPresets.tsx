import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { PadPreset } from '@/hooks/usePadPresets';
import { confirmAction } from '@/utils/confirm';
import { fonts, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { usePopoverAncorado } from './usePopoverAncorado';

const LARGURA_POPOVER = 260;

export interface PainelPresetsHandle {
  /** Abre o popover programaticamente (usado pra mostrar sozinho ao entrar na tela). */
  abrir: () => void;
}

interface PainelPresetsProps {
  presets: PadPreset[];
  onAplicar: (preset: PadPreset) => void;
  onExcluir: (id: string) => void;
}

/**
 * Link "Meus presets" (rodapé do mixer) — abre um popover com a lista de presets salvos
 * (nome clicável aplica, lixeira exclui). Também pode ser aberto programaticamente (ref)
 * pra aparecer sozinho quando a tela abre sem um "último preset usado" definido.
 */
export const PainelPresets = forwardRef<PainelPresetsHandle, PainelPresetsProps>(function PainelPresets(
  { presets, onAplicar, onExcluir },
  ref,
) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const { gatilhoRef, aberto, pos, abrir, fechar } = usePopoverAncorado(LARGURA_POPOVER);

  useImperativeHandle(ref, () => ({ abrir }), [abrir]);

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

  function aplicar(preset: PadPreset) {
    onAplicar(preset);
    fechar();
  }

  function excluirComConfirmacao(preset: PadPreset) {
    confirmAction(
      { title: 'Excluir preset', message: `Excluir "${preset.nome}"? Essa ação não pode ser desfeita.` },
      () => onExcluir(preset.id),
    );
  }

  return (
    <>
      <TouchableOpacity ref={gatilhoRef} style={styles.acao} onPress={abrir} accessibilityRole="button" accessibilityLabel="Meus presets">
        <Icon name="list-outline" size={16} color={colors.primary} />
        <Text style={styles.acaoTexto}>Meus presets</Text>
      </TouchableOpacity>

      <Modal visible={aberto} transparent animationType="none" onRequestClose={fechar}>
        <Pressable style={StyleSheet.absoluteFill} onPress={fechar} accessibilityLabel="Fechar" />
        <View style={[styles.popover, { bottom: pos.bottom, left: pos.left }]}>
          <View style={styles.cabecalho}>
            <Text style={styles.titulo}>Meus presets</Text>
            <TouchableOpacity onPress={fechar} hitSlop={8} accessibilityRole="button" accessibilityLabel="Fechar sem escolher">
              <Icon name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

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
    </>
  );
});

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
    cabecalho: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titulo: {
      ...typography.h3,
      color: colors.text,
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
