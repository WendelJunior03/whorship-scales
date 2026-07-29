import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { colors, spacing, typography } from '@/theme';

// Recebe { cultoId: number } via rota (ver MainStackParamList) — ainda
// não usado, a busca dos dados reais do culto vem num próximo prompt.

const REPERTORIO = [
  { numero: '01', nome: 'Grande é o Senhor', tom: 'G' },
  { numero: '02', nome: 'Teu Amor Não Falha', tom: 'C' },
  { numero: '03', nome: 'Nada Além do Sangue', tom: 'D' },
  { numero: '04', nome: 'O Que É o Amor', tom: 'Em' },
  { numero: '05', nome: 'Santo é o Senhor', tom: 'G' },
];

const EQUIPE = [
  { nome: 'João', funcao: 'Ministro' },
  { nome: 'Maria', funcao: 'Vocal' },
  { nome: 'Pedro', funcao: 'Guitarra' },
  { nome: 'Ana', funcao: 'Baixo' },
  { nome: 'Lucas', funcao: 'Bateria' },
];

export function DetalhesCultoScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header
        title="Detalhes do Culto"
        showBack
        rightIcon="ellipsis-horizontal"
        onRightPress={() => {}}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={styles.data}>Domingo, 25 de Maio</Text>
          <Text style={styles.hora}>19:00</Text>
          <View style={styles.localRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.local}>Culto de Adoração · Igreja Central</Text>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Repertório</Text>
        </View>
        <Card style={styles.listCard}>
          {REPERTORIO.map((musica) => (
            <View key={musica.numero} style={styles.musicaRow}>
              <Text style={styles.musicaNumero}>{musica.numero}</Text>
              <Text style={styles.musicaNome}>{musica.nome}</Text>
              <Badge label={musica.tom} tone="neutral" />
            </View>
          ))}
          <Text style={styles.verTodos}>Ver todos</Text>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Equipe</Text>
          <Text style={styles.sectionLink}>Ver escala completa</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.equipeRow}
        >
          {EQUIPE.map((membro) => (
            <View key={membro.nome} style={styles.membroAvatarBlock}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{membro.nome[0]}</Text>
              </View>
              <Text style={styles.membroNome}>{membro.nome}</Text>
              <Text style={styles.membroFuncao}>{membro.funcao}</Text>
            </View>
          ))}
        </ScrollView>

        <Card style={styles.suaFuncaoCard}>
          <Text style={styles.suaFuncaoLabel}>Sua função</Text>
          <View style={styles.suaFuncaoRow}>
            <Ionicons name="musical-notes" size={20} color={colors.primary} />
            <Text style={styles.suaFuncaoValor}>Teclado</Text>
          </View>
        </Card>
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
  data: {
    ...typography.h2,
    color: colors.text,
  },
  hora: {
    ...typography.h1,
    color: colors.primary,
    marginTop: 2,
  },
  localRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  local: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  sectionLink: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  listCard: {
    gap: spacing.sm,
  },
  musicaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  musicaNumero: {
    ...typography.caption,
    color: colors.textMuted,
    width: 20,
  },
  musicaNome: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  verTodos: {
    ...typography.bodySmall,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  equipeRow: {
    gap: spacing.md,
  },
  membroAvatarBlock: {
    alignItems: 'center',
    width: 64,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  membroNome: {
    ...typography.caption,
    color: colors.text,
  },
  membroFuncao: {
    ...typography.caption,
    color: colors.textMuted,
  },
  suaFuncaoCard: {
    borderColor: colors.primary,
  },
  suaFuncaoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  suaFuncaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  suaFuncaoValor: {
    ...typography.h3,
    color: colors.text,
  },
});
