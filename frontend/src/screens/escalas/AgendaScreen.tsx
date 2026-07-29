import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { colors, spacing, typography } from '@/theme';

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// Grade estática de maio/2025, só pra layout — vira dinâmico quando a
// tela ganhar lógica de dados de verdade.
const SEMANAS = [
  [null, null, null, 1, 2, 3, null],
  [4, 5, 6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15, 16, 17],
  [18, 19, 20, 21, 22, 23, 24],
  [25, 26, 27, 28, 29, 30, null],
];

const COMPROMISSOS = [
  {
    dia: 'Domingo',
    data: '25/05',
    hora: '19:00',
    tipo: 'Culto de Adoração',
    funcao: 'Teclado',
    status: 'Pendente' as const,
  },
  {
    dia: 'Quarta-feira',
    data: '28/05',
    hora: '19:30',
    tipo: 'Culto de Oração',
    funcao: 'Teclado',
    status: 'Confirmado' as const,
  },
  {
    dia: 'Sábado',
    data: '31/05',
    hora: '19:00',
    tipo: 'Ensaio Geral',
    funcao: 'Teclado',
    status: 'Pendente' as const,
  },
];

export function AgendaScreen() {
  const [diaSelecionado, setDiaSelecionado] = useState(25);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Minha Agenda</Text>
        <Text style={styles.subtitle}>Seus próximos compromissos</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={styles.calendarHeader}>
            <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
            <Text style={styles.calendarTitle}>Maio 2025</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>

          <View style={styles.weekRow}>
            {DIAS_SEMANA.map((dia, index) => (
              <Text key={`${dia}-${index}`} style={styles.weekDayLabel}>
                {dia}
              </Text>
            ))}
          </View>

          {SEMANAS.map((semana, index) => (
            <View key={index} style={styles.weekRow}>
              {semana.map((dia, dayIndex) => (
                <TouchableOpacity
                  key={dayIndex}
                  style={[styles.day, dia === diaSelecionado && styles.daySelected]}
                  disabled={!dia}
                  onPress={() => dia && setDiaSelecionado(dia)}
                >
                  {dia && (
                    <Text
                      style={[styles.dayText, dia === diaSelecionado && styles.dayTextSelected]}
                    >
                      {dia}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </Card>

        {COMPROMISSOS.map((item) => (
          <Card key={item.data} style={styles.compromisso}>
            <View style={styles.compromissoIcon}>
              <Ionicons name="musical-notes-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.compromissoInfo}>
              <Text style={styles.compromissoDia}>
                {item.dia} · {item.data}
              </Text>
              <Text style={styles.compromissoHora}>
                {item.hora} · {item.tipo}
              </Text>
              <Badge label={item.funcao} tone="primary" />
            </View>
            <Badge
              label={item.status}
              tone={item.status === 'Confirmado' ? 'success' : 'warning'}
            />
          </Card>
        ))}

        <Button title="Confirmar Presença" onPress={() => {}} style={styles.confirmButton} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  calendarTitle: {
    ...typography.h3,
    color: colors.text,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  weekDayLabel: {
    ...typography.caption,
    color: colors.textMuted,
    width: 32,
    textAlign: 'center',
  },
  day: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  dayTextSelected: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  compromisso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  compromissoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compromissoInfo: {
    flex: 1,
    gap: 4,
  },
  compromissoDia: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  compromissoHora: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  confirmButton: {
    marginTop: spacing.sm,
  },
});
