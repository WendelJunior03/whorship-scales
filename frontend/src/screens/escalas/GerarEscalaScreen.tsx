import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { colors, spacing, typography } from '@/theme';

const SUGESTAO = [
  { nome: 'Juliana Fernandes', ultimaVez: '05/04' },
  { nome: 'Beatriz Lima', ultimaVez: '12/04' },
  { nome: 'Débora Santos', ultimaVez: '19/04' },
  { nome: 'Camila Rocha', ultimaVez: '26/04' },
  { nome: 'Gabriela Alves', ultimaVez: '03/05' },
];

export function GerarEscalaScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Gerar Escala de Vocais" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.cultoCard}>
          <View style={styles.cultoIcon}>
            <Ionicons name="musical-notes" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.cultoTitulo}>Culto de Adoração</Text>
            <Text style={styles.cultoData}>Domingo, 25 de Maio · 19:00</Text>
          </View>
        </Card>

        <View>
          <Text style={styles.sectionTitle}>Sugestão do sistema</Text>
          <Text style={styles.sectionSubtitle}>Baseado em menor participação recente</Text>
        </View>

        <Card style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>Item</Text>
            <Text style={styles.listHeaderText}>Última participação</Text>
          </View>
          {SUGESTAO.map((vocal, index) => (
            <View key={vocal.nome} style={styles.vocalRow}>
              <View style={styles.vocalNumero}>
                <Text style={styles.vocalNumeroText}>{index + 1}</Text>
              </View>
              <Text style={styles.vocalNome}>{vocal.nome}</Text>
              <Text style={styles.vocalData}>{vocal.ultimaVez}</Text>
            </View>
          ))}
        </Card>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            O sistema prioriza quem participou menos recentemente, garantindo rodízio justo para
            todos.
          </Text>
        </View>

        <Button title="Aceitar Sugestão" onPress={() => {}} />
        <Button title="Editar Manualmente" onPress={() => {}} variant="outline" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
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
});
