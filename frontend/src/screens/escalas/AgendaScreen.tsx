import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import * as escalaFixaService from '@/services/escalaFixa';
import * as escalaVocalService from '@/services/escalaVocal';
import * as excecoesService from '@/services/excecoes';
import { ApiError } from '@/services/api';
import { MinhaEscalaFixaItem, MinhaEscalaVocalItem, StatusEscalaVocal } from '@/types';
import { colors, spacing, typography } from '@/theme';
import { formatDiaCompleto, formatHora } from '@/utils/date';

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

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function AgendaScreen() {
  const [escalaVocal, setEscalaVocal] = useState<MinhaEscalaVocalItem[]>([]);
  const [escalaFixa, setEscalaFixa] = useState<MinhaEscalaFixaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vocal, fixa] = await Promise.all([
        escalaVocalService.getMinhaEscalaVocal(),
        escalaFixaService.getMinhaEscalaFixa(),
      ]);
      setEscalaVocal(vocal);
      setEscalaFixa(fixa);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar sua agenda.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  async function handleAtualizarStatus(item: MinhaEscalaVocalItem, status: StatusEscalaVocal) {
    setActionLoadingId(item.id);
    try {
      await escalaVocalService.confirmarPresenca(item.id, status);
      setEscalaVocal((prev) => prev.map((e) => (e.id === item.id ? { ...e, status } : e)));
    } catch (err) {
      Alert.alert('Erro', err instanceof ApiError ? err.message : 'Não foi possível atualizar.');
    } finally {
      setActionLoadingId(null);
    }
  }

  function handleRecusarEscalaFixa(item: MinhaEscalaFixaItem) {
    if (!selectedDate) {
      Alert.alert(
        'Selecione uma data',
        'Toque no dia do calendário em que você vai faltar antes de recusar.',
      );
      return;
    }

    Alert.alert(
      'Recusar presença',
      `Isso registra uma falta para "${item.funcao}" (${item.dia_semana}) no dia ${selectedDate}. O ministério vai precisar definir um substituto pra essa data. Confirmar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recusar',
          style: 'destructive',
          onPress: async () => {
            setActionLoadingId(item.id);
            try {
              await excecoesService.criarExcecao({ escalaFixaId: item.id, data: selectedDate });
              Alert.alert(
                'Registrado',
                'Sua falta foi registrada. Você será avisado quando um substituto for definido.',
              );
            } catch (err) {
              Alert.alert(
                'Erro',
                err instanceof ApiError ? err.message : 'Não foi possível registrar a falta.',
              );
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ],
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.calendarCard}>
          <Calendar
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Compromissos de vocal</Text>
        </View>

        {escalaVocal.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Você não tem compromissos de vocal registrados.</Text>
          </Card>
        ) : (
          escalaVocal.map((item) => (
            <Card key={item.id} style={styles.compromisso}>
              <View style={styles.compromissoInfo}>
                <Text style={styles.compromissoDia}>{formatDiaCompleto(item.data_hora)}</Text>
                <Text style={styles.compromissoHora}>
                  {formatHora(item.data_hora)}
                  {item.tipo ? ` · ${item.tipo}` : ''}
                </Text>
                <Badge label={statusLabel[item.status]} tone={statusTone[item.status]} />
              </View>
              <View style={styles.acoes}>
                <Button
                  title="Confirmar"
                  onPress={() => handleAtualizarStatus(item, 'confirmado')}
                  loading={actionLoadingId === item.id}
                  style={styles.acaoBotao}
                />
                <Button
                  title="Recusar"
                  onPress={() => handleAtualizarStatus(item, 'recusado')}
                  loading={actionLoadingId === item.id}
                  variant="outline"
                  style={styles.acaoBotao}
                />
              </View>
            </Card>
          ))
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sua escala fixa</Text>
        </View>

        {escalaFixa.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Você ainda não tem uma escala fixa cadastrada.</Text>
          </Card>
        ) : (
          escalaFixa.map((item) => (
            <Card key={item.id} style={styles.compromisso}>
              <View style={styles.compromissoInfo}>
                <Text style={styles.compromissoDia}>{capitalize(item.dia_semana)}</Text>
                <Text style={styles.compromissoHora}>{item.funcao}</Text>
              </View>
              <Button
                title="Recusar"
                onPress={() => handleRecusarEscalaFixa(item)}
                loading={actionLoadingId === item.id}
                variant="outline"
                style={styles.acaoBotaoUnico}
              />
            </Card>
          ))
        )}
      </ScrollView>
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
});
