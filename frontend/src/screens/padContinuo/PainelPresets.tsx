import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { Icon } from '@/components/Icon';
import { PadPreset } from '@/hooks/usePadPresets';
import { confirmAction } from '@/utils/confirm';
import { fonts, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

const LARGURA_DIALOGO = 360;
const DURACAO_TOAST_MS = 2200;

export interface PainelPresetsHandle {
  /** Abre o painel programaticamente. `sucesso: true` também mostra o toast de
   * confirmação (usado logo depois de salvar um preset novo). */
  abrir: (opcoes?: { sucesso?: boolean }) => void;
}

interface PainelPresetsProps {
  presets: PadPreset[];
  onAplicar: (preset: PadPreset) => void;
  onRenomear: (id: string, nome: string) => void;
  onExcluir: (id: string) => void;
}

interface LinhaPresetProps {
  preset: PadPreset;
  onAplicar: () => void;
  onRenomear: (nome: string) => void;
  onExcluir: () => void;
}

/** Uma linha da lista — nome clicável aplica; ⋮ abre "Editar nome" / "Excluir". */
function LinhaPreset({ preset, onAplicar, onRenomear, onExcluir }: LinhaPresetProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const [menuAberto, setMenuAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [nomeEdicao, setNomeEdicao] = useState(preset.nome);

  function confirmarEdicao() {
    const nome = nomeEdicao.trim();
    if (nome) onRenomear(nome);
    setEditando(false);
  }

  if (editando) {
    return (
      <View style={styles.balao}>
        <View style={styles.balaoIcone}>
          <Icon name="options-outline" size={20} color={colors.primary} />
        </View>
        <TextInput
          value={nomeEdicao}
          onChangeText={setNomeEdicao}
          autoFocus
          onSubmitEditing={confirmarEdicao}
          style={styles.balaoInput}
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity onPress={confirmarEdicao} hitSlop={8} accessibilityRole="button" accessibilityLabel="Confirmar novo nome">
          <Icon name="checkmark" size={20} color={colors.success} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setNomeEdicao(preset.nome);
            setEditando(false);
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Cancelar edição do nome"
        >
          <Icon name="close" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.balaoWrap}>
      <View style={styles.balao}>
        <View style={styles.balaoIcone}>
          <Icon name="options-outline" size={20} color={colors.primary} />
        </View>
        <TouchableOpacity
          style={styles.balaoBotaoAplicar}
          onPress={onAplicar}
          accessibilityRole="button"
          accessibilityLabel={`Aplicar preset ${preset.nome}`}
        >
          <Text style={styles.balaoNome} numberOfLines={1}>
            {preset.nome}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMenuAberto((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Opções de ${preset.nome}`}
        >
          <Icon name="ellipsis-vertical" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {menuAberto && (
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuAberto(false);
              setEditando(true);
            }}
          >
            <Icon name="create-outline" size={16} color={colors.text} />
            <Text style={styles.menuItemTexto}>Editar nome</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuAberto(false);
              onExcluir();
            }}
          >
            <Icon name="trash-outline" size={16} color={colors.error} />
            <Text style={[styles.menuItemTexto, { color: colors.error }]}>Excluir</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/**
 * Link "Meus presets" (rodapé do mixer) — abre um painel centralizado na tela com a lista
 * de presets salvos, cada um num "balão" (nome clicável aplica, ⋮ abre editar/excluir).
 * Também pode ser aberto programaticamente (ref).
 */
export const PainelPresets = forwardRef<PainelPresetsHandle, PainelPresetsProps>(function PainelPresets(
  { presets, onAplicar, onRenomear, onExcluir },
  ref,
) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const [aberto, setAberto] = useState(false);
  const [mostrarToast, setMostrarToast] = useState(false);

  const abrir = (opcoes?: { sucesso?: boolean }) => {
    setAberto(true);
    if (opcoes?.sucesso) setMostrarToast(true);
  };
  const fechar = () => setAberto(false);

  useImperativeHandle(ref, () => ({ abrir }), []);

  // Toast de "salvo com sucesso" some sozinho depois de um tempo.
  useEffect(() => {
    if (!mostrarToast) return;
    const id = setTimeout(() => setMostrarToast(false), DURACAO_TOAST_MS);
    return () => clearTimeout(id);
  }, [mostrarToast]);

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

  // Fecha ESTE painel primeiro, só depois abre o diálogo de confirmação — dois <Modal> do
  // RN abertos ao mesmo tempo travava a tela (foco/overlay brigando entre si).
  function pedirExclusao(preset: PadPreset) {
    fechar();
    confirmAction(
      { title: 'Excluir preset', message: `Excluir "${preset.nome}"? Essa ação não pode ser desfeita.` },
      () => onExcluir(preset.id),
    );
  }

  return (
    <>
      <TouchableOpacity style={styles.acao} onPress={() => abrir()} accessibilityRole="button" accessibilityLabel="Meus presets">
        <Icon name="list-outline" size={16} color={colors.primary} />
        <Text style={styles.acaoTexto}>Meus presets</Text>
      </TouchableOpacity>

      {/* Só existe (monta o Modal/portal) enquanto está de fato aberto — o RN Web cria um
          <div> extra no body assim que o Modal MONTA, mesmo com visible=false, e só
          remove ao desmontar. Deixar sempre montado (visible controlando só a exibição)
          arrisca acumular portais órfãos se este componente remontar mais de uma vez. */}
      {aberto && (
        <Modal visible transparent animationType="fade" onRequestClose={fechar}>
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
                    <LinhaPreset
                      key={preset.id}
                      preset={preset}
                      onAplicar={() => aplicar(preset)}
                      onRenomear={(nome) => onRenomear(preset.id, nome)}
                      onExcluir={() => pedirExclusao(preset)}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>

          {mostrarToast && (
            <Animated.View
              style={styles.toast}
              pointerEvents="none"
              entering={FadeInDown.duration(220)}
              exiting={FadeOutDown.duration(220)}
            >
              <Icon name="checkmark-circle" size={18} color={colors.textInverse} />
              <Text style={styles.toastTexto}>Preset salvo com sucesso</Text>
            </Animated.View>
          )}
        </Modal>
      )}
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
    // card arredondado, ícone à esquerda, nome em destaque, ⋮ à direita.
    balaoWrap: {
      position: 'relative',
    },
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
    balaoInput: {
      ...typography.body,
      color: colors.text,
      flex: 1,
      paddingVertical: 2,
    },
    // Menu "⋮" — dropdown simples, sem Modal (nada de portal novo), ancorado no próprio
    // balão via position relative/absolute.
    menu: {
      position: 'absolute',
      top: '100%',
      right: 0,
      marginTop: spacing.xs,
      width: 160,
      gap: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xs,
      zIndex: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    menuItemTexto: {
      ...typography.bodySmall,
      color: colors.text,
    },
    toast: {
      position: 'absolute',
      bottom: spacing.xxl,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.success,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
    toastTexto: {
      ...typography.bodySmall,
      color: colors.textInverse,
      fontFamily: fonts.semibold,
    },
  });
