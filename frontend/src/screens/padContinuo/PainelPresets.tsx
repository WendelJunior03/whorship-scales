import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PadPreset } from '@/hooks/usePadPresets';
import { confirmAction } from '@/utils/confirm';
import { fonts, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

interface LinhaPresetProps {
  numero: number;
  preset: PadPreset;
  onAplicar: () => void;
  onRenomear: (nome: string) => void;
  onExcluir: () => void;
}

function LinhaPreset({ numero, preset, onAplicar, onRenomear, onExcluir }: LinhaPresetProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const [editando, setEditando] = useState(false);
  const [nomeEdit, setNomeEdit] = useState(preset.nome);

  function confirmarEdicao() {
    const nome = nomeEdit.trim();
    if (nome) onRenomear(nome);
    setEditando(false);
  }

  if (editando) {
    return (
      <View style={styles.linha}>
        <TextInput
          value={nomeEdit}
          onChangeText={setNomeEdit}
          autoFocus
          onSubmitEditing={confirmarEdicao}
          style={styles.linhaInput}
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity onPress={confirmarEdicao} hitSlop={8} accessibilityRole="button" accessibilityLabel="Confirmar novo nome">
          <Icon name="checkmark" size={18} color={colors.success} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setNomeEdit(preset.nome);
            setEditando(false);
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Cancelar edição do nome"
        >
          <Icon name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.linha}>
      <TouchableOpacity style={styles.linhaBotaoAplicar} onPress={onAplicar} accessibilityRole="button" accessibilityLabel={`Aplicar preset ${preset.nome}`}>
        <Text style={styles.linhaNome} numberOfLines={1}>
          {numero} - {preset.nome}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setEditando(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Renomear ${preset.nome}`}>
        <Icon name="create-outline" size={18} color={colors.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onExcluir} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Excluir ${preset.nome}`}>
        <Icon name="trash-outline" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

interface PainelPresetsProps {
  presets: PadPreset[];
  onAplicar: (preset: PadPreset) => void;
  onSalvar: (nome: string) => void;
  onRenomear: (id: string, nome: string) => void;
  onExcluir: (id: string) => void;
  /** 'coluna': painel fixo (desktop). 'modal': folha deslizante (mobile). */
  variante: 'coluna' | 'modal';
  visible?: boolean;
  onClose?: () => void;
}

/** Presets do Pad Contínuo — salvar/aplicar/renomear/excluir combinações de camadas+master. */
export function PainelPresets({ presets, onAplicar, onSalvar, onRenomear, onExcluir, variante, visible, onClose }: PainelPresetsProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const [nomeNovo, setNomeNovo] = useState('');

  function salvar() {
    const nome = nomeNovo.trim();
    if (!nome) return;
    onSalvar(nome);
    setNomeNovo('');
  }

  function excluirComConfirmacao(preset: PadPreset) {
    confirmAction(
      { title: 'Excluir preset', message: `Excluir "${preset.nome}"? Essa ação não pode ser desfeita.` },
      () => onExcluir(preset.id),
    );
  }

  const conteudo = (
    <>
      <View style={styles.salvarLinha}>
        <View style={styles.salvarInputWrap}>
          <Icon name="create-outline" size={16} color={colors.textMuted} />
          <TextInput
            value={nomeNovo}
            onChangeText={setNomeNovo}
            placeholder="Nome do preset"
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={salvar}
            style={styles.salvarInput}
          />
        </View>
        <Button title="Salvar" onPress={salvar} disabled={!nomeNovo.trim()} style={styles.salvarBotao} />
      </View>

      {presets.length === 0 ? (
        <Text style={styles.vazioTexto}>Nenhum preset salvo ainda — ajuste a mixagem e salve com o nome que quiser.</Text>
      ) : (
        <View style={styles.lista}>
          {presets.map((preset, indice) => (
            <LinhaPreset
              key={preset.id}
              numero={indice + 1}
              preset={preset}
              onAplicar={() => onAplicar(preset)}
              onRenomear={(nome) => onRenomear(preset.id, nome)}
              onExcluir={() => excluirComConfirmacao(preset)}
            />
          ))}
        </View>
      )}
    </>
  );

  if (variante === 'modal') {
    return (
      <Modal visible={!!visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.cabecalho}>
              <Text style={styles.titulo}>Presets</Text>
              <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Fechar presets">
                <Icon name="close-circle" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {conteudo}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Card style={styles.coluna}>
      <Text style={styles.titulo}>Presets</Text>
      {conteudo}
    </Card>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  // Modo coluna (desktop)
  coluna: {
    width: 260,
    gap: spacing.md,
    borderRadius: radius.lg,
    alignSelf: 'flex-start',
  },
  // Modo modal (mobile)
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
    gap: spacing.md,
    maxHeight: '80%',
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
  // Compartilhado
  salvarLinha: {
    gap: spacing.sm,
  },
  salvarInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  salvarInput: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  // Largura cheia (igual ao campo de nome acima) em vez de encolher no conteúdo — fica
  // uma barra retangular, não um botão quadrado.
  salvarBotao: {
    width: '100%',
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
    fontFamily: fonts.semibold,
  },
  linhaInput: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
    paddingVertical: 2,
  },
});
