import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { BarraDeslizante } from '@/components/BarraDeslizante';
import { AparenciaOctapad } from '@/hooks/useOctapadAparencia';
import { KIT_PADRAO } from '@/audio/kits';
import { BIBLIOTECA_DRUMS } from '@/audio/bibliotecaDrums';
import { PALETA_DESTAQUE } from './paletasOctapad';
import { corEhClara } from '@/utils/cor';
import type { MainStackParamList } from '@/navigation/MainNavigator';
import { fonts, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

type Nav = StackNavigationProp<MainStackParamList, 'Octapad'>;

interface PainelPersonalizarOctapadProps {
  visible: boolean;
  onClose: () => void;
  aparencia: AparenciaOctapad;
  definirCorPad: (padId: string, cor: string | null) => void;
  definirNomePad: (padId: string, nome: string | null) => void;
  ajustarBrilho: (v: number) => void;
  restaurarPadrao: () => void;
}

interface NomeEditavelProps {
  nomeAtual: string;
  onConfirmar: (nome: string | null) => void;
}

/**
 * Nome do instrumento com estado local próprio — só entra em modo edição ao clicar na
 * caneta, e só confirma (persiste) no blur/enter. Evita commitar cada tecla direto no
 * valor salvo: se fizesse isso, apagar até a última letra fazia o texto "voltar" pro
 * nome padrão no meio da digitação (o value controlado cai no fallback quando vazio).
 */
function NomeEditavel({ nomeAtual, onConfirmar }: NomeEditavelProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(nomeAtual);

  useEffect(() => {
    if (!editando) setTexto(nomeAtual);
  }, [nomeAtual, editando]);

  function confirmar() {
    onConfirmar(texto.trim() || null);
    setEditando(false);
  }

  if (editando) {
    return (
      <TextInput
        value={texto}
        onChangeText={setTexto}
        onBlur={confirmar}
        onSubmitEditing={confirmar}
        autoFocus
        placeholderTextColor={colors.textMuted}
        style={styles.nomeInput}
      />
    );
  }

  return (
    <View style={styles.nomeLinha}>
      <Text style={styles.secao}>{nomeAtual}</Text>
      <TouchableOpacity
        onPress={() => setEditando(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Editar nome do pad ${nomeAtual}`}
      >
        <Icon name="create-outline" size={14} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

function Amostra({
  corReal,
  nome,
  selecionada,
  onPress,
}: {
  corReal: string;
  nome: string;
  selecionada: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(criarEstilos);
  const corCheck = corEhClara(corReal) ? '#1E2340' : '#FFFFFF';
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.amostra, { backgroundColor: corReal }, selecionada && styles.amostraSelecionada]}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={selecionada ? `${nome} (selecionada)` : nome}
    >
      {selecionada && <Icon name="checkmark" size={14} color={corCheck} />}
    </TouchableOpacity>
  );
}

/** Painel de personalização visual do Octapad — cor individual por instrumento + brilho. */
export function PainelPersonalizarOctapad({
  visible,
  onClose,
  aparencia,
  definirCorPad,
  definirNomePad,
  ajustarBrilho,
  restaurarPadrao,
}: PainelPersonalizarOctapadProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const navigation = useNavigation<Nav>();

  function abrirBiblioteca(padId: string) {
    onClose();
    navigation.navigate('BibliotecaDrums', { padId });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.cabecalho}>
            <Text style={styles.titulo}>Aparência do Octapad</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Fechar painel de aparência"
            >
              <Icon name="close-circle" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.corpo} showsVerticalScrollIndicator={false}>
            {KIT_PADRAO.map((pad) => {
              const corSelecionada = aparencia.coresPads[pad.id] ?? null;
              const somId = aparencia.somPads[pad.id] ?? null;
              const nomeSom = somId ? BIBLIOTECA_DRUMS.find((s) => s.id === somId)?.nome ?? 'Padrão' : 'Padrão';
              return (
                <View key={pad.id} style={styles.padBloco}>
                  <NomeEditavel
                    nomeAtual={aparencia.nomesPads[pad.id] ?? pad.nome}
                    onConfirmar={(nome) => definirNomePad(pad.id, nome)}
                  />
                  <View style={styles.amostras}>
                    {PALETA_DESTAQUE.map((opcao) => (
                      <Amostra
                        key={opcao.label}
                        corReal={opcao.cor ?? pad.cor}
                        nome={opcao.label}
                        selecionada={corSelecionada === opcao.cor}
                        onPress={() => definirCorPad(pad.id, opcao.cor)}
                      />
                    ))}
                  </View>
                  <TouchableOpacity style={styles.somLinha} onPress={() => abrirBiblioteca(pad.id)} activeOpacity={0.7}>
                    <Icon name="volume-medium" size={14} color={colors.textMuted} />
                    <Text style={styles.somTexto}>Som: {nomeSom}</Text>
                    <Text style={styles.trocarTexto}>Trocar</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            <Text style={styles.secao}>Brilho ao tocar</Text>
            <View style={styles.brilhoLinha}>
              <BarraDeslizante
                valor={aparencia.brilho}
                onChange={ajustarBrilho}
                corPreenchida={colors.primary}
                corBolinha={colors.primary}
              />
              <Text style={styles.brilhoTexto}>{Math.round(aparencia.brilho * 100)}%</Text>
            </View>
          </ScrollView>

          <Button title="Restaurar padrão" variant="outline" onPress={restaurarPadrao} style={styles.restaurarButton} />
        </View>
      </View>
    </Modal>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
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
  corpo: {
    gap: spacing.md,
  },
  padBloco: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  secao: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
  },
  nomeLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nomeInput: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    flex: 1,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  amostras: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  somLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  somTexto: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  trocarTexto: {
    ...typography.caption,
    color: colors.primary,
    fontFamily: fonts.semibold,
  },
  amostra: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amostraSelecionada: {
    borderColor: colors.text,
  },
  brilhoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  brilhoTexto: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    width: 44,
    textAlign: 'right',
  },
  restaurarButton: {
    marginTop: spacing.xs,
  },
});
