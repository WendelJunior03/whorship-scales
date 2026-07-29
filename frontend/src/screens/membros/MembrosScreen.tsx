import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { MainStackParamList } from '@/navigation/MainNavigator';
import { Papel } from '@/types';
import { papelLabel, papelTone } from '@/utils/papel';
import { colors, spacing, typography } from '@/theme';

const FILTROS: Array<{ label: string; papel?: Papel }> = [
  { label: 'Todos' },
  { label: 'Admin', papel: 'admin' },
  { label: 'Ministro', papel: 'ministro' },
  { label: 'Vocal', papel: 'vocal' },
  { label: 'Membro', papel: 'membro' },
];

const MEMBROS_MOCK = [
  { id: 1, nome: 'João Victor', papel: 'admin' as Papel },
  { id: 2, nome: 'Pr. Marcos Lima', papel: 'ministro' as Papel },
  { id: 3, nome: 'Juliana Fernandes', papel: 'vocal' as Papel },
  { id: 4, nome: 'Beatriz Lima', papel: 'vocal' as Papel },
  { id: 5, nome: 'Pedro Henrique', papel: 'membro' as Papel },
  { id: 6, nome: 'Lucas Gabriel', papel: 'membro' as Papel },
  { id: 7, nome: 'Ana Clara', papel: 'membro' as Papel },
];

export function MembrosScreen() {
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const [filtro, setFiltro] = useState<Papel | undefined>(undefined);

  const membrosFiltrados = filtro ? MEMBROS_MOCK.filter((m) => m.papel === filtro) : MEMBROS_MOCK;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Membros" showBack rightIcon="search-outline" onRightPress={() => {}} />

      <FlatList
        data={membrosFiltrados}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={FILTROS}
            keyExtractor={(item) => item.label}
            contentContainerStyle={styles.filtros}
            renderItem={({ item }) => {
              const ativo = filtro === item.papel;
              return (
                <TouchableOpacity
                  style={[styles.filtroChip, ativo && styles.filtroChipAtivo]}
                  onPress={() => setFiltro(item.papel)}
                >
                  <Text style={[styles.filtroText, ativo && styles.filtroTextAtivo]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        }
        renderItem={({ item }) => (
          <Card
            style={styles.membroCard}
            onPress={() => navigation.navigate('DetalheMembro', { membroId: item.id })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.nome[0]}</Text>
            </View>
            <View style={styles.membroInfo}>
              <Text style={styles.membroNome}>{item.nome}</Text>
              <Text style={styles.membroPapel}>{papelLabel[item.papel]}</Text>
            </View>
            <Badge label={papelLabel[item.papel]} tone={papelTone[item.papel]} />
            <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
          </Card>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('DetalheMembro', { membroId: undefined })}
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  filtros: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  filtroChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filtroChipAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtroText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  filtroTextAtivo: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  membroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  membroInfo: {
    flex: 1,
  },
  membroNome: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  membroPapel: {
    ...typography.caption,
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
});
