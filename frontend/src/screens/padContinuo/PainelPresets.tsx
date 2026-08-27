import React, { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { PadPreset } from '@/hooks/usePadPresets';
import { confirmAction } from '@/utils/confirm';
import { radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

const LARGURA_POPOVER = 260;
const MARGEM_TELA = 8;

interface PainelPresetsProps {
  presets: PadPreset[];
  onAplicar: (preset: PadPreset) => void;
  onSalvar: (nome: string) => void;
  onExcluir: (id: string) => void;
}

/**
 * Botão "Presets" que abre um popover (abaixo/à esquerda do botão) com salvar/aplicar/
 * excluir mixagens do Pad Contínuo — mesmo componente em qualquer tamanho de tela, em vez
 * de um painel fixo no desktop e outro modal no mobile.
 */
export function PainelPresets({ presets, onAplicar, onSalvar, onExcluir }: PainelPresetsProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const { width: larguraJanela } = useWindowDimensions();
  const gatilhoRef = useRef<View>(null);

  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [nomeNovo, setNomeNovo] = useState('');

  function abrir() {
    gatilhoRef.current?.measureInWindow((x, y, largura, altura) => {
      setPos({
        top: y + altura + MARGEM_TELA,
        // Ancorado pela borda direita do botão, crescendo pra esquerda — nunca deixa
        // vazar pra fora da tela (nem à esquerda, nem à direita).
        left: Math.min(Math.max(MARGEM_TELA, x + largura - LARGURA_POPOVER), larguraJanela - LARGURA_POPOVER - MARGEM_TELA),
      });
      setAberto(true);
    });
  }

  function fechar() {
    setAberto(false);
  }

  // Esc fecha o popover (web) — o `onRequestClose` do Modal já cobre o botão físico/gesto
  // de voltar do Android, mas não o teclado no navegador.
  useEffect(() => {
    if (Platform.OS !== 'web' || !aberto) return;
    // Tipo mínimo local — o tsconfig não inclui a lib "dom" (mesmo padrão de
    // useAfinador.ts), então não dá pra usar o `KeyboardEvent` global do navegador.
    const aoTeclar = (e: { key: string }) => {
      if (e.key === 'Escape') fechar();
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto]);

  function salvar() {
    const nome = nomeNovo.trim();
    if (!nome) return;
    onSalvar(nome);
    setNomeNovo('');
    fechar();
  }

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
      <TouchableOpacity
        ref={gatilhoRef}
        style={styles.gatilho}
        onPress={abrir}
        accessibilityRole="button"
        accessibilityLabel="Presets"
      >
        <Text style={styles.gatilhoTexto}>💾 Presets</Text>
      </TouchableOpacity>

      <Modal visible={aberto} transparent animationType="none" onRequestClose={fechar}>
        <Pressable style={StyleSheet.absoluteFill} onPress={fechar} accessibilityLabel="Fechar presets" />
        <View style={[styles.popover, { top: pos.top, left: pos.left }]}>
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
    </>
  );
}

const criarEstilos = (colors: Cores) =>
  StyleSheet.create({
    gatilho: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    gatilhoTexto: {
      ...typography.bodySmall,
      color: colors.text,
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
      // Sombra pra destacar o popover flutuando por cima do resto da tela.
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
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
