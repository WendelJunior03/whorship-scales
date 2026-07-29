import React from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { colors, spacing, typography } from '@/theme';

interface Notificacao {
  icon: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descricao: string;
  hora: string;
}

const SECOES: Array<{ title: string; data: Notificacao[] }> = [
  {
    title: 'Hoje',
    data: [
      {
        icon: 'calendar',
        titulo: 'Nova escala publicada',
        descricao: 'A escala de Maio foi publicada com sucesso.',
        hora: '09:30',
      },
      {
        icon: 'swap-horizontal',
        titulo: 'Substituição realizada',
        descricao: 'Pedro Henrique foi escalado para o culto de 25/05.',
        hora: '08:15',
      },
      {
        icon: 'checkmark-circle',
        titulo: 'Confirmação recebida',
        descricao: 'Juliana Fernandes confirmou presença no culto de 25/05.',
        hora: 'Ontem',
      },
    ],
  },
  {
    title: 'Ontem',
    data: [
      {
        icon: 'musical-notes',
        titulo: 'Alteração no repertório',
        descricao: 'O repertório do culto de 25/05 foi atualizado.',
        hora: '22:10',
      },
      {
        icon: 'alarm',
        titulo: 'Lembrete de confirmação',
        descricao: 'Não esqueça de confirmar sua presença nos próximos cultos.',
        hora: '18:00',
      },
    ],
  },
];

export function NotificacoesScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Notificações</Text>
        <Ionicons name="settings-outline" size={22} color={colors.text} />
      </View>

      <SectionList
        sections={SECOES}
        keyExtractor={(item, index) => item.titulo + index}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <Card style={styles.item}>
            <View style={styles.itemIcon}>
              <Ionicons name={item.icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitulo}>{item.titulo}</Text>
              <Text style={styles.itemDescricao}>{item.descricao}</Text>
            </View>
            <Text style={styles.itemHora}>{item.hora}</Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitulo: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  itemDescricao: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemHora: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
