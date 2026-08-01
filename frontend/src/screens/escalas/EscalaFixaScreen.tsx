import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { MainStackParamList } from '@/navigation/MainNavigator';
import * as cultosService from '@/services/cultos';
import * as escalaFixaService from '@/services/escalaFixa';
import * as escalaVocalService from '@/services/escalaVocal';
import * as membrosService from '@/services/membros';
import { ApiError } from '@/services/api';
import { confirmAction } from '@/utils/confirm';
import { Culto, DiaSemana, EscalaFixaMontada, EscalaVocalDoCultoItem, Membro } from '@/types';
import { colors, spacing, typography } from '@/theme';
import { formatDiaCompleto, formatDiaCurto, formatHora } from '@/utils/date';
import { papelLabel } from '@/utils/papel';

const DIAS: DiaSemana[] = ['quarta', 'sabado', 'domingo'];

const diaLabel: Record<DiaSemana, string> = {
  quarta: 'Quarta-feira',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

const diaSemanaPorIndice: Record<number, DiaSemana> = {
  0: 'domingo',
  3: 'quarta',
  6: 'sabado',
};

export function EscalaFixaScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();

  const [escalaFixa, setEscalaFixa] = useState<EscalaFixaMontada[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const [novaEscalaAberta, setNovaEscalaAberta] = useState(false);
  const [novoDia, setNovoDia] = useState<DiaSemana>('domingo');
  const [novaFuncao, setNovaFuncao] = useState('');
  const [novoMembro, setNovoMembro] = useState<Membro | null>(null);
  const [membroPickerAberto, setMembroPickerAberto] = useState(false);
  const [todosMembrosAtivos, setTodosMembrosAtivos] = useState<Membro[]>([]);
  const [carregandoMembros, setCarregandoMembros] = useState(false);
  const [criandoEscala, setCriandoEscala] = useState(false);

  const [cultoPickerAberto, setCultoPickerAberto] = useState(false);
  const [cultos, setCultos] = useState<Culto[]>([]);

  const [proximoCultoPorDia, setProximoCultoPorDia] = useState<Partial<Record<DiaSemana, Culto>>>(
    {},
  );
  const [vozesPorDia, setVozesPorDia] = useState<Record<DiaSemana, EscalaVocalDoCultoItem[]>>({
    quarta: [],
    sabado: [],
    domingo: [],
  });

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dados, todosCultos] = await Promise.all([
        escalaFixaService.getEscalaFixaMontada(),
        cultosService.getTodosCultos(),
      ]);
      setEscalaFixa(dados);
      setCultos(todosCultos);

      const agora = new Date();
      const proximoPorDia: Partial<Record<DiaSemana, Culto>> = {};
      for (const culto of todosCultos) {
        const dataCulto = new Date(culto.data_hora);
        if (dataCulto < agora) continue;
        const dia = diaSemanaPorIndice[dataCulto.getDay()];
        if (!dia) continue;
        const atual = proximoPorDia[dia];
        if (!atual || dataCulto < new Date(atual.data_hora)) {
          proximoPorDia[dia] = culto;
        }
      }
      setProximoCultoPorDia(proximoPorDia);

      const vozesEntries = await Promise.all(
        DIAS.map(async (dia) => {
          const cultoDoDia = proximoPorDia[dia];
          if (!cultoDoDia) return [dia, []] as const;
          try {
            const vozes = await escalaVocalService.getEscalaVocalDoCulto(cultoDoDia.id);
            return [dia, vozes] as const;
          } catch {
            return [dia, []] as const;
          }
        }),
      );
      setVozesPorDia(
        Object.fromEntries(vozesEntries) as Record<DiaSemana, EscalaVocalDoCultoItem[]>,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar a escala fixa.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  async function abrirNovaEscala() {
    setNovoDia('domingo');
    setNovaFuncao('');
    setNovoMembro(null);
    setNovaEscalaAberta(true);

    if (todosMembrosAtivos.length > 0) return;
    setCarregandoMembros(true);
    try {
      const todos = await membrosService.getTodosMembros();
      setTodosMembrosAtivos(todos.filter((m) => m.ativo !== false));
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof ApiError ? err.message : 'Não foi possível carregar os membros.',
      );
    } finally {
      setCarregandoMembros(false);
    }
  }

  async function handleCriarEscalaFixa() {
    if (!novoMembro || !novaFuncao.trim()) {
      Alert.alert('Preencha tudo', 'Selecione o membro e informe a função antes de criar.');
      return;
    }

    setCriandoEscala(true);
    try {
      await escalaFixaService.criarEscalaFixa({
        membroId: novoMembro.id,
        diaSemana: novoDia,
        funcao: novaFuncao.trim(),
      });
      Alert.alert(
        'Escala fixa criada',
        `${novoMembro.nome} foi vinculado como "${novaFuncao.trim()}" toda ${diaLabel[novoDia]} e recebeu uma notificação por e-mail.`,
      );
      setNovaEscalaAberta(false);
      await carregarDados();
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof ApiError ? err.message : 'Não foi possível criar a escala fixa.',
      );
    } finally {
      setCriandoEscala(false);
    }
  }

  function handleExcluirEscalaFixa(item: EscalaFixaMontada) {
    confirmAction(
      {
        title: 'Remover vínculo fixo',
        message: `Isso remove "${item.nome}" (${item.funcao}) de toda a escala fixa de ${diaLabel[item.dia_semana]}, todas as semanas. Confirmar?`,
        confirmLabel: 'Remover',
      },
      async () => {
        setExcluindoId(item.id);
        try {
          await escalaFixaService.deletarEscalaFixa(item.id);
          setEscalaFixa((prev) => prev.filter((e) => e.id !== item.id));
        } catch (err) {
          Alert.alert(
            'Erro',
            err instanceof ApiError ? err.message : 'Não foi possível remover o vínculo.',
          );
        } finally {
          setExcluindoId(null);
        }
      },
    );
  }

  function abrirGerarEscala() {
    setCultoPickerAberto(true);
  }

  if (user && user.papel !== 'admin' && user.papel !== 'ministro') {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <Header title="Escala Fixa" showBack />
        <View style={[styles.content, styles.centered]}>
          <Text style={styles.errorText}>Essa tela é exclusiva para admin e ministro.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={['top']}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Tentar novamente"
          onPress={carregarDados}
          variant="outline"
          style={styles.retryButton}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header
        title="Escala Fixa"
        showBack
        rightIcon="mic-outline"
        onRightPress={abrirGerarEscala}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {DIAS.map((dia) => {
          const instrumentos = escalaFixa.filter(
            (item) => item.dia_semana === dia && (item.papel === 'membro' || item.papel === 'admin'),
          );
          const vozes = vozesPorDia[dia];
          const proximoCulto = proximoCultoPorDia[dia];

          return (
            <View key={dia}>
              <Text style={styles.sectionTitle}>{diaLabel[dia]}</Text>

              <Text style={styles.subsectionTitle}>Instrumentos</Text>
              {instrumentos.length === 0 ? (
                <Card style={styles.card}>
                  <Text style={styles.emptyText}>Ninguém vinculado ainda.</Text>
                </Card>
              ) : (
                <Card style={styles.card}>
                  {instrumentos.map((item, index) => (
                    <View
                      key={item.id}
                      style={[styles.itemRow, index > 0 && styles.itemRowBorda]}
                    >
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemNome}>{item.nome}</Text>
                        <Text style={styles.itemFuncao}>{item.funcao}</Text>
                      </View>
                      {user?.papel === 'admin' &&
                        (excluindoId === item.id ? (
                          <ActivityIndicator size="small" color={colors.error} />
                        ) : (
                          <TouchableOpacity onPress={() => handleExcluirEscalaFixa(item)} hitSlop={8}>
                            <Ionicons name="trash-outline" size={20} color={colors.error} />
                          </TouchableOpacity>
                        ))}
                    </View>
                  ))}
                </Card>
              )}

              <Text style={styles.subsectionTitle}>
                Vozes{proximoCulto ? ` · próximo dia ${formatDiaCurto(proximoCulto.data_hora)}` : ''}
              </Text>
              {!proximoCulto ? (
                <Card style={styles.card}>
                  <Text style={styles.emptyText}>
                    Nenhum culto futuro de {diaLabel[dia].toLowerCase()} cadastrado ainda.
                  </Text>
                </Card>
              ) : vozes.length === 0 ? (
                <Card style={styles.card}>
                  <Text style={styles.emptyText}>
                    A escala de vocais desse culto ainda não foi publicada.
                  </Text>
                </Card>
              ) : (
                <Card style={styles.card}>
                  {vozes.map((item, index) => (
                    <View
                      key={item.id}
                      style={[styles.itemRow, index > 0 && styles.itemRowBorda]}
                    >
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemNome}>{item.nome}</Text>
                        <Text style={styles.itemFuncao}>Vocal</Text>
                      </View>
                    </View>
                  ))}
                </Card>
              )}
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={abrirNovaEscala}>
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </TouchableOpacity>

      <Modal
        visible={novaEscalaAberta}
        animationType="slide"
        transparent
        onRequestClose={() => setNovaEscalaAberta(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova escala fixa</Text>

            <Text style={styles.formLabel}>Dia da semana</Text>
            <View style={styles.diasRow}>
              {DIAS.map((dia) => {
                const ativo = novoDia === dia;
                return (
                  <TouchableOpacity
                    key={dia}
                    style={[styles.diaChip, ativo && styles.diaChipAtivo]}
                    onPress={() => setNovoDia(dia)}
                  >
                    <Text style={[styles.diaChipText, ativo && styles.diaChipTextAtivo]}>
                      {diaLabel[dia]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.formLabel}>Membro</Text>
            <TouchableOpacity
              style={styles.selectorInput}
              onPress={() => setMembroPickerAberto(true)}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.selectorIcon}
              />
              <Text
                style={novoMembro ? styles.selectorText : styles.selectorPlaceholder}
                numberOfLines={1}
              >
                {novoMembro ? novoMembro.nome : 'Selecionar membro'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <Text style={styles.formLabel}>Função</Text>
            <View style={styles.selectorInput}>
              <Ionicons
                name="musical-notes-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.selectorIcon}
              />
              <TextInput
                style={styles.selectorTextInput}
                placeholder="Ex: Teclado"
                placeholderTextColor={colors.textMuted}
                value={novaFuncao}
                onChangeText={setNovaFuncao}
              />
            </View>

            <Button
              title="Criar escala fixa"
              onPress={handleCriarEscalaFixa}
              loading={criandoEscala}
              style={styles.modalButton}
            />
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setNovaEscalaAberta(false)}
              disabled={criandoEscala}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={membroPickerAberto}
        animationType="slide"
        transparent
        onRequestClose={() => setMembroPickerAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentPicker}>
            <Text style={styles.modalTitle}>Escolher membro</Text>
            {carregandoMembros ? (
              <ActivityIndicator color={colors.primary} style={styles.modalLoading} />
            ) : (
              <ScrollView style={styles.modalList}>
                {todosMembrosAtivos.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhum membro disponível.</Text>
                ) : (
                  todosMembrosAtivos.map((membro) => (
                    <TouchableOpacity
                      key={membro.id}
                      style={styles.modalItem}
                      onPress={() => {
                        setNovoMembro(membro);
                        setMembroPickerAberto(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>{membro.nome}</Text>
                      <Text style={styles.modalItemSubtext}>{papelLabel[membro.papel]}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
            <Button title="Cancelar" variant="outline" onPress={() => setMembroPickerAberto(false)} />
          </View>
        </View>
      </Modal>

      <Modal
        visible={cultoPickerAberto}
        animationType="slide"
        transparent
        onRequestClose={() => setCultoPickerAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentPicker}>
            <Text style={styles.modalTitle}>Gerar escala de vocal — escolha o culto</Text>
            <ScrollView style={styles.modalList}>
              {cultos.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum culto cadastrado ainda.</Text>
              ) : (
                cultos.map((culto) => (
                  <TouchableOpacity
                    key={culto.id}
                    style={styles.modalItem}
                    onPress={() => {
                      setCultoPickerAberto(false);
                      navigation.navigate('DetalhesCulto', { cultoId: culto.id });
                    }}
                  >
                    <Text style={styles.modalItemText}>
                      {culto.tipo ?? formatDiaCompleto(culto.data_hora)}
                    </Text>
                    <Text style={styles.modalItemSubtext}>
                      {formatDiaCompleto(culto.data_hora)} · {formatHora(culto.data_hora)}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <Button title="Cancelar" variant="outline" onPress={() => setCultoPickerAberto(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 200,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subsectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  card: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  itemRowBorda: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemNome: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  itemFuncao: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
  },
  modalContentPicker: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '70%',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  formLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  diasRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  diaChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  diaChipAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  diaChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  diaChipTextAtivo: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  selectorInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorIcon: {
    marginRight: spacing.sm,
  },
  selectorTextInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  selectorText: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  selectorPlaceholder: {
    flex: 1,
    ...typography.body,
    color: colors.textMuted,
  },
  modalButton: {
    marginTop: spacing.md,
  },
  modalLoading: {
    marginVertical: spacing.lg,
  },
  modalList: {
    maxHeight: 320,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    ...typography.body,
    color: colors.text,
  },
  modalItemSubtext: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
