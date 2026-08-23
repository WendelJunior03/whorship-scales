import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MainStackParamList } from '@/navigation/MainNavigator';
import * as cultosService from '@/services/cultos';
import * as escalaAvulsaService from '@/services/escalaAvulsa';
import * as escalaFixaService from '@/services/escalaFixa';
import * as escalaVocalService from '@/services/escalaVocal';
import * as excecoesService from '@/services/excecoes';
import { ApiError } from '@/services/api';
import {
  Culto,
  DiaSemana,
  MembroCandidato,
  MinhaEscalaAvulsaItem,
  MinhaEscalaFixaItem,
  MinhaEscalaVocalItem,
  StatusEscalaVocal,
} from '@/types';
import { spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { formatDiaCompleto, formatHora } from '@/utils/date';
import { confirmAction } from '@/utils/confirm';

const statusLabel: Record<StatusEscalaVocal, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  recusado: 'Recusado',
};

const statusTone: Record<StatusEscalaVocal, 'warning' | 'success' | 'error'> = {
  pendente: 'warning',
  confirmado: 'success',
  recusado: 'error',
};

const diaSemanaPorIndice: Record<number, DiaSemana> = {
  0: 'domingo',
  3: 'quarta',
  6: 'sabado',
};

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function AgendaScreen() {
  const { colors, modo } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const [escalaVocal, setEscalaVocal] = useState<MinhaEscalaVocalItem[]>([]);
  const [escalaAvulsa, setEscalaAvulsa] = useState<MinhaEscalaAvulsaItem[]>([]);
  const [escalaFixa, setEscalaFixa] = useState<MinhaEscalaFixaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [proximoCultoPorDia, setProximoCultoPorDia] = useState<Partial<Record<DiaSemana, Culto>>>(
    {},
  );

  type Indicacao =
    | { tipo: 'vocal'; item: MinhaEscalaVocalItem }
    | { tipo: 'avulsa'; item: MinhaEscalaAvulsaItem }
    | { tipo: 'fixa'; item: MinhaEscalaFixaItem; data: string };
  const [indicacao, setIndicacao] = useState<Indicacao | null>(null);
  const [candidatos, setCandidatos] = useState<MembroCandidato[]>([]);
  const [carregandoCandidatos, setCarregandoCandidatos] = useState(false);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vocal, avulsa, fixa, todosCultos] = await Promise.all([
        escalaVocalService.getMinhaEscalaVocal(),
        escalaAvulsaService.getMinhaEscalaAvulsa(),
        escalaFixaService.getMinhaEscalaFixa(),
        cultosService.getTodosCultos(),
      ]);
      setEscalaVocal(vocal);
      setEscalaAvulsa(avulsa);
      setEscalaFixa(fixa);

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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar sua agenda.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  async function handleConfirmarStatus(item: MinhaEscalaVocalItem) {
    setActionLoadingId(item.id);
    try {
      await escalaVocalService.confirmarPresenca(item.id, 'confirmado');
      setEscalaVocal((prev) => prev.map((e) => (e.id === item.id ? { ...e, status: 'confirmado' } : e)));
    } catch (err) {
      Alert.alert('Erro', err instanceof ApiError ? err.message : 'Não foi possível atualizar.');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleConfirmarStatusAvulsa(item: MinhaEscalaAvulsaItem) {
    setActionLoadingId(item.id);
    try {
      await escalaAvulsaService.confirmarPresencaAvulsa(item.id, 'confirmado');
      setEscalaAvulsa((prev) => prev.map((e) => (e.id === item.id ? { ...e, status: 'confirmado' } : e)));
    } catch (err) {
      Alert.alert('Erro', err instanceof ApiError ? err.message : 'Não foi possível atualizar.');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function carregarCandidatos(buscar: () => Promise<MembroCandidato[]>) {
    setCandidatos([]);
    setCarregandoCandidatos(true);
    try {
      setCandidatos(await buscar());
    } catch {
      // sem candidatos pra indicar não impede a recusa — só some a lista
    } finally {
      setCarregandoCandidatos(false);
    }
  }

  function abrirIndicacaoVocal(item: MinhaEscalaVocalItem) {
    setIndicacao({ tipo: 'vocal', item });
    carregarCandidatos(() => escalaVocalService.getCandidatosVocais(item.culto_id));
  }

  function abrirIndicacaoAvulsa(item: MinhaEscalaAvulsaItem) {
    setIndicacao({ tipo: 'avulsa', item });
    carregarCandidatos(() => escalaAvulsaService.getCandidatosAvulsa(item.culto_id));
  }

  function abrirIndicacaoFixa(item: MinhaEscalaFixaItem) {
    if (!selectedDate) {
      Alert.alert(
        'Selecione uma data',
        'Toque no dia do calendário em que você vai faltar antes de recusar.',
      );
      return;
    }
    setIndicacao({ tipo: 'fixa', item, data: selectedDate });
    carregarCandidatos(() => excecoesService.getCandidatosExcecao());
  }

  function fecharIndicacao() {
    setIndicacao(null);
    setCandidatos([]);
  }

  function executarRecusa(indicado: MembroCandidato | null) {
    if (!indicacao) return;
    const atual = indicacao;
    fecharIndicacao();

    confirmAction(
      {
        title: 'Recusar presença',
        message: indicado
          ? `Recusar essa escala e indicar ${indicado.nome} pra te substituir?`
          : 'Confirmar a recusa dessa escala?',
        confirmLabel: 'Recusar',
      },
      async () => {
        setActionLoadingId(atual.item.id);
        try {
          if (atual.tipo === 'vocal') {
            await escalaVocalService.confirmarPresenca(atual.item.id, 'recusado', indicado?.id);
            setEscalaVocal((prev) =>
              prev.map((e) => (e.id === atual.item.id ? { ...e, status: 'recusado' } : e)),
            );
          } else if (atual.tipo === 'avulsa') {
            await escalaAvulsaService.confirmarPresencaAvulsa(atual.item.id, 'recusado', indicado?.id);
            setEscalaAvulsa((prev) =>
              prev.map((e) => (e.id === atual.item.id ? { ...e, status: 'recusado' } : e)),
            );
          } else {
            await excecoesService.criarExcecao({
              escalaFixaId: atual.item.id,
              data: atual.data,
              indicadoId: indicado?.id,
            });
            Alert.alert(
              'Registrado',
              'Sua falta foi registrada. Você será avisado quando um substituto for definido.',
            );
          }
        } catch (err) {
          Alert.alert('Erro', err instanceof ApiError ? err.message : 'Não foi possível registrar a recusa.');
        } finally {
          setActionLoadingId(null);
        }
      },
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

  const markedDates: Record<
    string,
    { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }
  > = {};
  for (const item of escalaVocal) {
    const day = item.data_hora.slice(0, 10);
    markedDates[day] = { ...markedDates[day], marked: true, dotColor: colors.primary };
  }
  for (const item of escalaAvulsa) {
    const day = item.data_hora.slice(0, 10);
    markedDates[day] = { ...markedDates[day], marked: true, dotColor: colors.primary };
  }
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: colors.primary,
    };
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Minha Agenda</Text>
        <Text style={styles.subtitle}>Seus próximos compromissos</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.calendarCard}>
          <Calendar
            // `react-native-calendars` não reage bem a mudança de tema via prop depois de
            // montado — forçar remount na troca de modo garante que a paleta nova aplique.
            key={modo}
            markedDates={markedDates}
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            theme={{
              backgroundColor: colors.surface,
              calendarBackground: colors.surface,
              textSectionTitleColor: colors.textSecondary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.textInverse,
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.textMuted,
              dotColor: colors.primary,
              monthTextColor: colors.text,
              arrowColor: colors.primary,
            }}
          />
        </Card>

        {escalaVocal.length === 0 && escalaAvulsa.length === 0 && escalaFixa.length === 0 && (
          <Card>
            <Text style={styles.emptyText}>Você não tem compromissos futuros registrados.</Text>
          </Card>
        )}

        {escalaVocal.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Compromissos de vocal</Text>
            </View>

            {escalaVocal.map((item) => (
            <Card
              key={item.id}
              style={styles.compromisso}
              onPress={() => navigation.navigate('DetalhesCulto', { cultoId: item.culto_id })}
            >
              <View style={styles.compromissoInfo}>
                <Text style={styles.compromissoDia}>{formatDiaCompleto(item.data_hora)}</Text>
                <Text style={styles.compromissoHora}>
                  {formatHora(item.data_hora)}
                  {item.tipo ? ` · ${item.tipo}` : ''}
                </Text>
                <Badge label={statusLabel[item.status]} tone={statusTone[item.status]} />
              </View>
              {item.status === 'pendente' && (
                <View style={styles.acoes}>
                  <Button
                    title="Confirmar"
                    onPress={() => handleConfirmarStatus(item)}
                    loading={actionLoadingId === item.id}
                    style={styles.acaoBotao}
                  />
                  <Button
                    title="Recusar"
                    onPress={() => abrirIndicacaoVocal(item)}
                    loading={actionLoadingId === item.id}
                    variant="outline"
                    style={styles.acaoBotao}
                  />
                </View>
              )}
            </Card>
            ))}
          </>
        )}

        {escalaAvulsa.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Compromissos</Text>
            </View>

            {escalaAvulsa.map((item) => (
            <Card
              key={item.id}
              style={styles.compromisso}
              onPress={() => navigation.navigate('DetalhesCulto', { cultoId: item.culto_id })}
            >
              <View style={styles.compromissoInfo}>
                <Text style={styles.compromissoDia}>{formatDiaCompleto(item.data_hora)}</Text>
                <Text style={styles.compromissoHora}>
                  {formatHora(item.data_hora)} · {item.funcao}
                </Text>
                <Badge label={statusLabel[item.status]} tone={statusTone[item.status]} />
              </View>
              {item.status === 'pendente' && (
                <View style={styles.acoes}>
                  <Button
                    title="Confirmar"
                    onPress={() => handleConfirmarStatusAvulsa(item)}
                    loading={actionLoadingId === item.id}
                    style={styles.acaoBotao}
                  />
                  <Button
                    title="Recusar"
                    onPress={() => abrirIndicacaoAvulsa(item)}
                    loading={actionLoadingId === item.id}
                    variant="outline"
                    style={styles.acaoBotao}
                  />
                </View>
              )}
            </Card>
            ))}
          </>
        )}

        {escalaFixa.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sua escala fixa</Text>
            </View>

            {escalaFixa.map((item) => {
              const proximoCulto = proximoCultoPorDia[item.dia_semana];
              return (
              <Card
                key={item.id}
                style={styles.compromisso}
                onPress={
                  proximoCulto
                    ? () => navigation.navigate('DetalhesCulto', { cultoId: proximoCulto.id })
                    : undefined
                }
              >
                <View style={styles.compromissoInfo}>
                  <Text style={styles.compromissoDia}>{capitalize(item.dia_semana)}</Text>
                  <Text style={styles.compromissoHora}>{item.funcao}</Text>
                  {!proximoCulto && (
                    <Text style={styles.semCultoTexto}>
                      Nenhum culto futuro criado ainda pra esse dia
                    </Text>
                  )}
                </View>
                <Button
                  title="Recusar"
                  onPress={() => abrirIndicacaoFixa(item)}
                  loading={actionLoadingId === item.id}
                  variant="outline"
                  style={styles.acaoBotaoUnico}
                />
              </Card>
              );
            })}
          </>
        )}
      </ScrollView>

      <Modal
        visible={!!indicacao}
        animationType="slide"
        transparent
        onRequestClose={fecharIndicacao}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Indicar alguém pra sua vaga?</Text>

            {carregandoCandidatos ? (
              <ActivityIndicator color={colors.primary} style={styles.modalLoading} />
            ) : (
              <ScrollView style={styles.modalList}>
                {candidatos.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhum candidato disponível no momento.</Text>
                ) : (
                  candidatos.map((candidato) => (
                    <TouchableOpacity
                      key={candidato.id}
                      style={styles.modalItem}
                      onPress={() => executarRecusa(candidato)}
                    >
                      <Text style={styles.modalItemText}>{candidato.nome}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}

            <Button
              title="Recusar sem indicar"
              variant="outline"
              onPress={() => executarRecusa(null)}
              style={styles.modalButton}
            />
            <Button title="Cancelar" variant="outline" onPress={fecharIndicacao} style={styles.modalButton} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.md,
  },
  calendarCard: {
    padding: 0,
    overflow: 'hidden',
  },
  sectionHeader: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  compromisso: {
    gap: spacing.sm,
  },
  compromissoInfo: {
    gap: 4,
  },
  compromissoDia: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  compromissoHora: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  semCultoTexto: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  acoes: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acaoBotao: {
    flex: 1,
  },
  acaoBotaoUnico: {
    alignSelf: 'flex-start',
    minWidth: 120,
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
    maxHeight: 280,
  },
  modalItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    ...typography.body,
    color: colors.text,
  },
  modalButton: {
    marginTop: spacing.xs,
  },
});
