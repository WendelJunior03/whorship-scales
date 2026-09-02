import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { AnimatedItem } from '@/components/AnimatedItem';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { MainStackParamList } from '@/navigation/MainNavigator';
import * as membrosService from '@/services/membros';
import { ApiError } from '@/services/api';
import { Membro, Papel } from '@/types';
import { papelLabel, isAdmin, papelOrgLabel, papelOrgTone, papelOrgDe } from '@/utils/papel';
import { LARGURA_CONTEUDO, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

const FILTROS: Array<{ label: string; papel?: Papel }> = [
  { label: 'Todos' },
  { label: 'Admin', papel: 'admin' },
  { label: 'Ministro', papel: 'ministro' },
  { label: 'Vocal', papel: 'vocal' },
  { label: 'Membro', papel: 'membro' },
];

export function MembrosScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const { user } = useAuth();

  const [membros, setMembros] = useState<Membro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Papel | undefined>(undefined);
  const [busca, setBusca] = useState('');

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const todos = await membrosService.getTodosMembros();
      setMembros(todos);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar os membros.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  if (user && !isAdmin(user)) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <Header title="Membros" showBack />
        <View style={[styles.listContent, styles.centered]}>
          <Text style={styles.errorText}>Essa tela é exclusiva para administradores.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <Header title="Membros" showBack />
        <View style={styles.listContent}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={64} radius={radius.lg} />
          ))}
        </View>
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

  const buscaNormalizada = busca.trim().toLowerCase();
  const membrosFiltrados = membros
    .filter((m) => !filtro || m.papel === filtro)
    .filter((m) => !buscaNormalizada || m.nome.toLowerCase().includes(buscaNormalizada));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Membros" showBack />

      <FlatList
        style={styles.list}
        data={membrosFiltrados}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Input
              icon="search-outline"
              placeholder="Buscar por nome"
              value={busca}
              onChangeText={setBusca}
              containerStyle={styles.buscaInput}
            />
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
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Nenhum membro encontrado"
            description="Ajuste a busca ou o filtro para ver a equipe."
          />
        }
        renderItem={({ item, index }) => (
          <AnimatedItem index={index}>
            <Card
              style={styles.membroCard}
              onPress={() => navigation.navigate('DetalheMembro', { membroId: item.id })}
            >
              <Avatar nome={item.nome} fotoUrl={item.foto_url} size={44} />
              <View style={styles.membroInfo}>
                <Text style={styles.membroNome}>{item.nome}</Text>
                <Text style={styles.membroPapel}>{papelLabel[item.papel]}</Text>
              </View>
              <Badge label={papelOrgLabel[papelOrgDe(item)]} tone={papelOrgTone[papelOrgDe(item)]} />
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </Card>
          </AnimatedItem>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('DetalheMembro', { membroId: undefined })}
        accessibilityRole="button"
        accessibilityLabel="Adicionar membro"
      >
        <Icon name="add" size={28} color={colors.textInverse} />
      </TouchableOpacity>
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
  list: {
    flex: 1,
  },
  listContent: {
    width: '100%',
    maxWidth: LARGURA_CONTEUDO,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    flexGrow: 1,
  },
  listHeader: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  buscaInput: {
    marginBottom: 0,
  },
  filtros: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
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
