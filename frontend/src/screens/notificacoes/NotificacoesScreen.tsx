import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';
import { Icon, IconName } from '@/components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import * as notificacoesService from '@/services/notificacoes';
import { ApiError } from '@/services/api';
import { Notificacao, TipoNotificacao } from '@/types';
import { spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { formatDataRelativa, formatHora } from '@/utils/date';

const iconePorTipo: Record<TipoNotificacao, IconName> = {
  escala: 'calendar',
  substituicao: 'swap-horizontal',
  confirmacao: 'checkmark-circle',
  repertorio: 'musical-notes',
  lembrete: 'alarm',
};

interface Secao {
  title: string;
  data: Notificacao[];
}

function agruparPorData(notificacoes: Notificacao[]): Secao[] {
  const grupos = new Map<string, Secao>();
  for (const notificacao of notificacoes) {
    const chave = notificacao.created_at.slice(0, 10);
    const grupo = grupos.get(chave);
    if (grupo) {
      grupo.data.push(notificacao);
    } else {
      grupos.set(chave, { title: formatDataRelativa(notificacao.created_at), data: [notificacao] });
    }
  }
  return Array.from(grupos.values());
}

export function NotificacoesScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dados = await notificacoesService.getMinhasNotificacoes();
      setNotificacoes(dados);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar as notificações.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  function handleAbrir(item: Notificacao) {
    if (item.lida) return;

    setNotificacoes((prev) => prev.map((n) => (n.id === item.id ? { ...n, lida: true } : n)));
    notificacoesService.marcarComoLida(item.id).catch(() => {
      setNotificacoes((prev) => prev.map((n) => (n.id === item.id ? { ...n, lida: false } : n)));
    });
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

  const secoes = agruparPorData(notificacoes);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Notificações</Text>
        <Icon name="settings-outline" size={22} color={colors.text} />
      </View>

      <SectionList
        style={styles.list}
        sections={secoes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Card>
            <Text style={styles.emptyText}>Você ainda não tem notificações.</Text>
          </Card>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <Card style={styles.item} onPress={() => handleAbrir(item)}>
            <View style={styles.itemIcon}>
              <Icon name={iconePorTipo[item.tipo]} size={18} color={colors.primary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemTitulo, !item.lida && styles.itemTituloNaoLido]}>
                {item.titulo}
              </Text>
              <Text style={styles.itemDescricao}>{item.descricao}</Text>
            </View>
            <View style={styles.itemLado}>
              <Text style={styles.itemHora}>{formatHora(item.created_at)}</Text>
              {!item.lida && <View style={styles.dotNaoLido} />}
            </View>
          </Card>
        )}
      />
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    flexGrow: 1,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
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
  },
  itemTituloNaoLido: {
    fontWeight: '700',
  },
  itemDescricao: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemLado: {
    alignItems: 'flex-end',
    gap: 6,
  },
  itemHora: {
    ...typography.caption,
    color: colors.textMuted,
  },
  dotNaoLido: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
