import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { Header } from '@/components/Header';
import * as membrosService from '@/services/membros';
import { ApiError } from '@/services/api';
import { Aniversariante } from '@/types';
import { LARGURA_CONTEUDO, radius, spacing, typography, fonts } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

/** "YYYY-MM-DD" -> "DD/MM", parseando local (sem fuso). */
function diaMes(iso: string): string {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

export function AniversariantesScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);

  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [lista, setLista] = useState<Aniversariante[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarDados = useCallback(async (mesAlvo: number) => {
    setIsLoading(true);
    setError(null);
    try {
      setLista(await membrosService.getAniversariantesDoMes(mesAlvo));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar os aniversariantes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados(mes);
  }, [mes, carregarDados]);

  function mudarMes(delta: number) {
    setMes((atual) => ((atual - 1 + delta + 12) % 12) + 1);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Aniversariantes" showBack />

      <View style={styles.mesNav}>
        <TouchableOpacity onPress={() => mudarMes(-1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Mês anterior">
          <Icon name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.mesTexto}>{MESES[mes - 1]}</Text>
        <TouchableOpacity onPress={() => mudarMes(1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Próximo mês">
          <Icon name="chevron-forward" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={64} radius={radius.lg} />
          ))}
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Tentar novamente"
            onPress={() => carregarDados(mes)}
            variant="outline"
            style={styles.retryButton}
          />
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={lista}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="gift-outline"
              title="Nenhum aniversariante"
              description={`Ninguém faz aniversário em ${MESES[mes - 1]}.`}
            />
          }
          renderItem={({ item }) => (
            <Card style={styles.itemCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{iniciais(item.nome)}</Text>
              </View>
              <Text style={styles.itemNome} numberOfLines={1}>
                {item.nome}
              </Text>
              <Text style={styles.itemData}>{diaMes(item.data_nascimento)}</Text>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
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
  mesNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  mesTexto: {
    ...typography.h3,
    color: colors.text,
    minWidth: 120,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    width: '100%',
    maxWidth: LARGURA_CONTEUDO,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.body,
    color: colors.primary,
    fontFamily: fonts.semibold,
  },
  itemNome: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  itemData: {
    ...typography.body,
    color: colors.primary,
    fontFamily: fonts.semibold,
  },
});
