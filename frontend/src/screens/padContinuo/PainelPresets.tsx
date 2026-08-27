import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { PadPreset } from '@/hooks/usePadPresets';
import { confirmAction } from '@/utils/confirm';
import { fonts, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

const LARGURA_DIALOGO = 360;

export interface PainelPresetsHandle {
  /** Abre o painel programaticamente (usado pra mostrar sozinho ao entrar na tela). */
  abrir: () => void;
}

interface PainelPresetsProps {
  presets: PadPreset[];
  onAplicar: (preset: PadPreset) => void;
  onExcluir: (id: string) => void;
}

/**
 * Link "Meus presets" (rodapé do mixer) — abre um painel centralizado na tela com a lista
 * de presets salvos, cada um num "balão" (nome clicável aplica, lixeira exclui). Também
 * pode ser aberto programaticamente (ref) pra aparecer sozinho ao entrar na tela.
 */
export const PainelPresets = forwardRef<PainelPresetsHandle, PainelPresetsProps>(function PainelPresets(
  { presets, onAplicar, onExcluir },
  ref,
) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const [aberto, setAberto] = useState(false);

  const abrir = () => setAberto(true);
  const fechar = () => setAberto(false);

  useImperativeHandle(ref, () => ({ abrir }), []);

  // Esc fecha o painel (web) — o `onRequestClose` do Modal já cobre o botão físico/gesto
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
      <TouchableOpacity style={styles.acao} onPress={abrir} accessibilityRole="button" accessibilityLabel="Meus presets">
        <Icon name="list-outline" size={16} color={colors.primary} />
        <Text style={styles.acaoTexto}>Meus presets</Text>
      </TouchableOpacity>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={fechar}>
        <Pressable style={styles.overlay} onPress={fechar} accessibilityLabel="Fechar" />
        {/* `box-none`: a área vazia ao redor do diálogo deixa o toque passar pro overlay
            (fecha clicando fora); o diálogo em si continua clicável normalmente. */}
        <View style={styles.centro} pointerEvents="box-none">
          <View style={styles.dialogo}>
            <View style={styles.cabecalho}>
              <Text style={styles.titulo}>Meus presets</Text>
              <TouchableOpacity onPress={fechar} hitSlop={8} accessibilityRole="button" accessibilityLabel="Fechar sem escolher">
                <Icon name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {presets.length === 0 ? (
              <Text style={styles.vazioTexto}>Nenhum preset salvo ainda.</Text>
            ) : (
              <View style={styles.lista}>
                {presets.map((preset) => (
                  <View key={preset.id} style={styles.balao}>
                    <View style={styles.balaoIcone}>
                      <Icon name="bookmark-outline" size={20} color={colors.primary} />
                    </View>
                    <TouchableOpacity
                      style={styles.balaoBotaoAplicar}
                      onPress={() => aplicar(preset)}
                      accessibilityRole="button"
                      accessibilityLabel={`Aplicar preset ${preset.nome}`}
                    >
                      <Text style={styles.balaoNome} numberOfLines={1}>
                        {preset.nome}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => excluirComConfirmacao(preset)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Excluir ${preset.nome}`}
                    >
                      <Icon name="trash-outline" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
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
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    centro: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    dialogo: {
      width: '100%',
      maxWidth: LARGURA_DIALOGO,
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
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
      ...typography.bodySmall,
      color: colors.textMuted,
    },
    lista: {
      gap: spacing.sm,
    },
    // "Balão" de cada preset — mesmo espírito do item de projeto salvo do Multitrack:
    // card arredondado, ícone à esquerda, nome em destaque, lixeira à direita.
    balao: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    balaoIcone: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    balaoBotaoAplicar: {
      flex: 1,
    },
    balaoNome: {
      ...typography.body,
      color: colors.text,
      fontFamily: fonts.semibold,
    },
  });
