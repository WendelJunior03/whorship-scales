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
import { Calendar, DateData } from 'react-native-calendars';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { MainStackParamList } from '@/navigation/types';
import * as cultosService from '@/services/cultos';
import * as escalaAvulsaService from '@/services/escalaAvulsa';
import * as escalaVocalService from '@/services/escalaVocal';
import * as membrosService from '@/services/membros';
import { ApiError } from '@/services/api';
import { Culto, Membro, SugestaoVocal } from '@/types';
import { colors, spacing, typography } from '@/theme';
import { formatDiaCompleto, formatDiaCurto, formatDiaSemana, formatHora } from '@/utils/date';
import { papelLabel } from '@/utils/papel';

function montarDataHoraISO(data: string, hora: string): string | null {
  const partesData = data.split('-').map(Number);
  const partesHora = hora.split(':').map(Number);
  if (partesData.length !== 3 || partesHora.length !== 2) return null;
  if ([...partesData, ...partesHora].some((n) => Number.isNaN(n))) return null;

  const [ano, mes, dia] = partesData;
  const [horas, minutos] = partesHora;
  const dataHora = new Date(ano, mes - 1, dia, horas, minutos);
  if (Number.isNaN(dataHora.getTime())) return null;

  return dataHora.toISOString();
}

export function GerarEscalaScreen() {
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'GerarEscala'>>();
  const { cultoId } = route.params;
  const { user } = useAuth();

  const [culto, setCulto] = useState<Culto | null>(null);
  const [sugestao, setSugestao] = useState<SugestaoVocal[]>([]);
  const [selecionados, setSelecionados] = useState<SugestaoVocal[]>([]);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [todosMembrosAtivos, setTodosMembrosAtivos] = useState<Membro[]>([]);
  const [carregandoMembros, setCarregandoMembros] = useState(false);
  const [indiceEmEdicao, setIndiceEmEdicao] = useState<number | null>(null);
  const [pickerAberto, setPickerAberto] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [escalaAvulsaAberta, setEscalaAvulsaAberta] = useState(false);
  const [novaData, setNovaData] = useState<string | null>(null);
  const [novaHora, setNovaHora] = useState('');
  const [novoTipo, setNovoTipo] = useState('');
  const [novoMembro, setNovoMembro] = useState<Membro | null>(null);
  const [novaFuncao, setNovaFuncao] = useState('');
  const [membroPickerAberto, setMembroPickerAberto] = useState(false);
  const [criandoAvulsa, setCriandoAvulsa] = useState(false);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cultoEncontrado, vocaisSugeridos] = await Promise.all([
        cultosService.getCultoById(cultoId),
        escalaVocalService.getSugestaoVocais(),
      ]);
      setCulto(cultoEncontrado);
      setSugestao(vocaisSugeridos);
      setSelecionados(vocaisSugeridos);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar a sugestão.');
    } finally {
      setIsLoading(false);
    }
  }, [cultoId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  async function garantirMembrosCarregados() {
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

  function ativarModoEdicao() {
    setModoEdicao(true);
    garantirMembrosCarregados();
  }

  function cancelarEdicao() {
    setModoEdicao(false);
    setSelecionados(sugestao);
    fecharPicker();
  }

  function abrirPickerParaTrocar(indice: number) {
    setIndiceEmEdicao(indice);
    setPickerAberto(true);
  }

  function abrirPickerParaAdicionar() {
    setIndiceEmEdicao(null);
    setPickerAberto(true);
  }

  function fecharPicker() {
    setPickerAberto(false);
    setIndiceEmEdicao(null);
  }

  function selecionarVocal(membro: Membro) {
    const novoItem: SugestaoVocal = { id: membro.id, nome: membro.nome, ultima_vez: null };
    setSelecionados((prev) => {
      if (indiceEmEdicao !== null) {
        const copia = [...prev];
        copia[indiceEmEdicao] = novoItem;
        return copia;
      }
      return [...prev, novoItem];
    });
    fecharPicker();
  }

  function removerVocal(indice: number) {
    setSelecionados((prev) => prev.filter((_, i) => i !== indice));
  }

  async function publicarEscala() {
    if (selecionados.length === 0) {
      Alert.alert('Nada para publicar', 'Adicione ao menos um vocal antes de publicar.');
      return;
    }

    setIsPublishing(true);
    const resultados = await Promise.allSettled(
      selecionados.map((vocal) =>
        escalaVocalService.criarEscalaVocal({ membroId: vocal.id, cultoId }),
      ),
    );
    setIsPublishing(false);

    const falhas = resultados.filter((r) => r.status === 'rejected').length;
    if (falhas === 0) {
      Alert.alert(
        'Escala publicada',
        'A escala de vocais foi publicada. Cada vocal escalado recebe uma notificação por e-mail.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } else {
      Alert.alert(
        'Publicado com ressalvas',
        `${selecionados.length - falhas} de ${selecionados.length} vocais foram escalados. Os demais podem já estar nessa escala.`,
      );
    }
  }

  function abrirEscalaAvulsa() {
    setEscalaAvulsaAberta(true);
    garantirMembrosCarregados();
  }

  function fecharEscalaAvulsa() {
    setEscalaAvulsaAberta(false);
    setMembroPickerAberto(false);
    setNovaData(null);
    setNovaHora('');
    setNovoTipo('');
    setNovoMembro(null);
    setNovaFuncao('');
  }

  async function criarEscalaAvulsa() {
    if (!novaData || !novaHora.trim() || !novoMembro || !novaFuncao.trim()) {
      Alert.alert(
        'Preencha tudo',
        'Selecione o dia, o horário, o membro e a função antes de criar a escala.',
      );
      return;
    }

    const dataHora = montarDataHoraISO(novaData, novaHora.trim());
    if (!dataHora) {
      Alert.alert('Horário inválido', 'Use o formato HH:mm, por exemplo 19:00.');
      return;
    }

    setCriandoAvulsa(true);
    try {
      const novoCulto = await cultosService.criarCulto({
        dataHora,
        tipo: novoTipo.trim() || null,
      });
      await escalaAvulsaService.criarEscalaAvulsa({
        membroId: novoMembro.id,
        cultoId: novoCulto.id,
        funcao: novaFuncao.trim(),
      });
      fecharEscalaAvulsa();
      Alert.alert(
        'Escala avulsa criada',
        `${novoMembro.nome} foi escalado como "${novaFuncao.trim()}" para esse culto e recebeu uma notificação por e-mail.`,
        [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Ver culto',
            onPress: () => navigation.navigate('DetalhesCulto', { cultoId: novoCulto.id }),
          },
        ],
      );
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof ApiError ? err.message : 'Não foi possível criar a escala avulsa.',
      );
    } finally {
      setCriandoAvulsa(false);
    }
  }

  if (user && user.papel !== 'admin') {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <Header title="Gerar Escala de Vocais" showBack />
        <View style={[styles.content, styles.centered]}>
          <Text style={styles.errorText}>Essa tela é exclusiva para administradores.</Text>
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

  if (error || !culto) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={['top']}>
        <Text style={styles.errorText}>{error ?? 'Culto não encontrado.'}</Text>
        <Button
          title="Tentar novamente"
          onPress={carregarDados}
          variant="outline"
          style={styles.retryButton}
        />
      </SafeAreaView>
    );
  }

  const vocaisParaEscolher = todosMembrosAtivos.filter(
    (m) => m.papel === 'vocal' && !selecionados.some((s) => s.id === m.id),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Gerar Escala de Vocais" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.cultoCard}>
          <View style={styles.cultoIcon}>
            <Ionicons name="musical-notes" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.cultoTitulo}>
              {culto.tipo ?? `Culto de ${formatDiaSemana(culto.data_hora)}`}
            </Text>
            <Text style={styles.cultoData}>
              {formatDiaCompleto(culto.data_hora)} · {formatHora(culto.data_hora)}
            </Text>
          </View>
        </Card>

        <View>
          <Text style={styles.sectionTitle}>
            {modoEdicao ? 'Escala em edição' : 'Sugestão do sistema'}
          </Text>
          <Text style={styles.sectionSubtitle}>Baseado em menor participação recente</Text>
        </View>

        {selecionados.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Nenhum vocal na escala ainda.</Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>Item</Text>
              <Text style={styles.listHeaderText}>Última participação</Text>
            </View>
            {selecionados.map((vocal, index) => (
              <View key={`${vocal.id}-${index}`} style={styles.vocalRow}>
                <View style={styles.vocalNumero}>
                  <Text style={styles.vocalNumeroText}>{index + 1}</Text>
                </View>
                <Text style={styles.vocalNome}>{vocal.nome}</Text>
                <Text style={styles.vocalData}>
                  {vocal.ultima_vez ? formatDiaCurto(vocal.ultima_vez) : '—'}
                </Text>
                {modoEdicao && (
                  <View style={styles.vocalAcoes}>
                    <TouchableOpacity onPress={() => abrirPickerParaTrocar(index)} hitSlop={8}>
                      <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removerVocal(index)} hitSlop={8}>
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
            {modoEdicao && (
              <TouchableOpacity style={styles.adicionarRow} onPress={abrirPickerParaAdicionar}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.adicionarTexto}>Adicionar vocal</Text>
              </TouchableOpacity>
            )}
          </Card>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            O sistema prioriza quem participou menos recentemente, garantindo rodízio justo para
            todos.
          </Text>
        </View>

        {!modoEdicao ? (
          <>
            <Button title="Aceitar Sugestão" onPress={publicarEscala} loading={isPublishing} />
            <Button title="Editar Manualmente" onPress={ativarModoEdicao} variant="outline" />
          </>
        ) : (
          <>
            <Button title="Publicar Escala" onPress={publicarEscala} loading={isPublishing} />
            <Button
              title="Cancelar edição"
              onPress={cancelarEdicao}
              variant="outline"
              disabled={isPublishing}
            />
          </>
        )}
      </ScrollView>

      <Modal
        visible={pickerAberto}
        animationType="slide"
        transparent
        onRequestClose={fecharPicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Escolher vocal</Text>
            {carregandoMembros ? (
              <ActivityIndicator color={colors.primary} style={styles.modalLoading} />
            ) : (
              <ScrollView style={styles.modalList}>
                {vocaisParaEscolher.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhum vocal disponível.</Text>
                ) : (
                  vocaisParaEscolher.map((membro) => (
                    <TouchableOpacity
                      key={membro.id}
                      style={styles.modalItem}
                      onPress={() => selecionarVocal(membro)}
                    >
                      <Text style={styles.modalItemText}>{membro.nome}</Text>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
            <Button title="Cancelar" variant="outline" onPress={fecharPicker} />
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={abrirEscalaAvulsa}>
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </TouchableOpacity>

      <Modal
        visible={escalaAvulsaAberta}
        animationType="slide"
        transparent
        onRequestClose={fecharEscalaAvulsa}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentGrande}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Nova escala avulsa</Text>
              <Text style={styles.modalSubtitle}>
                Pra cultos fora da rotina fixa (ex: um culto especial numa segunda-feira). Isso
                cria o culto e já escala o membro nele.
              </Text>

              <Text style={styles.formLabel}>Dia</Text>
              <Calendar
                current={novaData ?? undefined}
                markedDates={
                  novaData
                    ? { [novaData]: { selected: true, selectedColor: colors.primary } }
                    : {}
                }
                onDayPress={(day: DateData) => setNovaData(day.dateString)}
                theme={{
                  backgroundColor: colors.surface,
                  calendarBackground: colors.surface,
                  textSectionTitleColor: colors.textSecondary,
                  selectedDayBackgroundColor: colors.primary,
                  selectedDayTextColor: colors.textInverse,
                  todayTextColor: colors.primary,
                  dayTextColor: colors.text,
                  textDisabledColor: colors.textMuted,
                  monthTextColor: colors.text,
                  arrowColor: colors.primary,
                }}
                style={styles.calendar}
              />

              <Text style={styles.formLabel}>Horário</Text>
              <View style={styles.selectorInput}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.selectorIcon}
                />
                <TextInput
                  style={styles.selectorTextInput}
                  placeholder="19:00"
                  placeholderTextColor={colors.textMuted}
                  value={novaHora}
                  onChangeText={setNovaHora}
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              <Text style={styles.formLabel}>Tipo do culto (opcional)</Text>
              <View style={styles.selectorInput}>
                <Ionicons
                  name="bookmark-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.selectorIcon}
                />
                <TextInput
                  style={styles.selectorTextInput}
                  placeholder="Ex: Culto de Oração"
                  placeholderTextColor={colors.textMuted}
                  value={novoTipo}
                  onChangeText={setNovoTipo}
                />
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
                title="Criar e Escalar"
                onPress={criarEscalaAvulsa}
                loading={criandoAvulsa}
                style={styles.formButton}
              />
              <Button
                title="Cancelar"
                variant="outline"
                onPress={fecharEscalaAvulsa}
                disabled={criandoAvulsa}
                style={styles.formButton}
              />
            </ScrollView>
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
          <View style={styles.modalContent}>
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
  content: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  cultoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cultoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cultoTitulo: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  cultoData: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  listCard: {
    gap: spacing.sm,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listHeaderText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  vocalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  vocalNumero: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vocalNumeroText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '700',
  },
  vocalNome: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  vocalData: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  vocalAcoes: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  adicionarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  adicionarTexto: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: spacing.md,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
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
    gap: spacing.md,
    maxHeight: '70%',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
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
  modalContentGrande: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  formLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  formButton: {
    marginTop: spacing.md,
  },
  calendar: {
    borderRadius: 14,
    overflow: 'hidden',
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
});
