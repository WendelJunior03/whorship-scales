import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { podeGerir } from '@/utils/papel';
import { MainStackParamList } from '@/navigation/MainNavigator';
import * as cultosService from '@/services/cultos';
import * as escalaAvulsaService from '@/services/escalaAvulsa';
import * as escalaVocalService from '@/services/escalaVocal';
import { ApiError } from '@/services/api';
import { Culto } from '@/types';
import { colors, spacing, typography } from '@/theme';
import { formatDiaCompleto, formatDiaSemana, formatHora } from '@/utils/date';

interface CultoComContagem {
  culto: Culto;
  total: number;
  confirmados: number;
  pendentes: number;
  recusados: number;
}

export function ConfirmacoesScreen() {
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const { user } = useAuth();

  const [itens, setItens] = useState<CultoComContagem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const todos = await cultosService.getTodosCultos();
      const agora = Date.now();
      const proximos = todos
        .filter((culto) => new Date(culto.data_hora).getTime() >= agora)
        .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

      const comContagem = await Promise.all(
        proximos.map(async (culto) => {
          const [vocal, avulsa] = await Promise.all([
            escalaVocalService.getEscalaVocalDoCulto(culto.id),
            escalaAvulsaService.getEscalaAvulsaDoCulto(culto.id),
          ]);
          const todosEscalados = [...vocal, ...avulsa];
          return {
            culto,
            total: todosEscalados.length,
            confirmados: todosEscalados.filter((e) => e.status === 'confirmado').length,
            pendentes: todosEscalados.filter((e) => e.status === 'pendente').length,
            recusados: todosEscalados.filter((e) => e.status === 'recusado').length,
          };
        }),
      );

      setItens(comContagem.filter((item) => item.total > 0));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar as confirmações.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  if (user && !podeGerir(user)) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <Header title="Confirmações" showBack />
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
      <Header title="Confirmações" showBack />

      <FlatList
        style={styles.list}
        data={itens}
        keyExtractor={(item) => String(item.culto.id)}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <Card>
            <Text style={styles.emptyText}>
              Nenhum culto futuro com vocal ou avulsa escalado ainda.
            </Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Card
            style={styles.cultoCard}
            onPress={() => navigation.navigate('DetalhesCulto', { cultoId: item.culto.id })}
          >
            <View style={styles.cultoHeader}>
              <Text style={styles.cultoTitulo}>
                {item.culto.tipo ?? `Culto de ${formatDiaSemana(item.culto.data_hora)}`}
              </Text>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
            <Text style={styles.cultoData}>
              {formatDiaCompleto(item.culto.data_hora)} · {formatHora(item.culto.data_hora)}
            </Text>
            <View style={styles.badges}>
              <Badge label={`${item.confirmados}/${item.total} confirmados`} tone="success" />
              {item.pendentes > 0 && (
                <Badge label={`${item.pendentes} pendente${item.pendentes > 1 ? 's' : ''}`} tone="warning" />
              )}
              {item.recusados > 0 && (
                <Badge label={`${item.recusados} recusado${item.recusados > 1 ? 's' : ''}`} tone="error" />
              )}
            </View>
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
  content: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    flexGrow: 1,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cultoCard: {
    gap: 4,
    marginBottom: spacing.sm,
  },
  cultoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
