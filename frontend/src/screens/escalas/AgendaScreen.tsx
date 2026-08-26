import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { MainTabScreenNavigationProp } from '@/navigation/types';
import * as escalaAvulsaService from '@/services/escalaAvulsa';
import * as escalaVocalService from '@/services/escalaVocal';
import * as notificacoesService from '@/services/notificacoes';
import { ApiError } from '@/services/api';
import { MinhaEscalaAvulsaItem, MinhaEscalaVocalItem } from '@/types';
import { LARGURA_CONTEUDO, radius, spacing, typography } from '@/theme';
import { Cores, Sombras } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { formatDiaCompleto, formatHora } from '@/utils/date';

/**
 * Compromissos: lista TUDO que a pessoa está escalada (vocal e avulsa),
 * sem status de pendente/confirmado/recusado — confirmar e recusar agora
 * acontece direto na notificação de "nova escala". Quem recusou lá
 * simplesmente já não aparece mais aqui na próxima vez que a tela carregar
 * (por isso recarrega sempre que a aba ganha foco).
 */
export function AgendaScreen() {
  const { colors, modo } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const navigation = useNavigation<MainTabScreenNavigationProp<'Agenda'>>();
  const [escalaVocal, setEscalaVocal] = useState<MinhaEscalaVocalItem[]>([]);
  const [escalaAvulsa, setEscalaAvulsa] = useState<MinhaEscalaAvulsaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [temNotificacaoNaoLida, setTemNotificacaoNaoLida] = useState(false);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vocal, avulsa] = await Promise.all([
        escalaVocalService.getMinhaEscalaVocal(),
        escalaAvulsaService.getMinhaEscalaAvulsa(),
      ]);
      setEscalaVocal(vocal.filter((e) => e.status !== 'recusado'));
      setEscalaAvulsa(avulsa.filter((e) => e.status !== 'recusado'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar sua agenda.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados]),
  );

  useFocusEffect(
    useCallback(() => {
      notificacoesService
        .getMinhasNotificacoes()
        .then((notificacoes) => setTemNotificacaoNaoLida(notificacoes.some((n) => !n.lida)))
        .catch(() => {
          // o sino não é crítico pra tela funcionar, falha aqui é silenciosa
        });
    }, []),
  );

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
  for (const item of escalaAvulsa) {
    const day = item.data_hora.slice(0, 10);
    markedDates[day] = { ...markedDates[day], marked: true, dotColor: colors.primary };
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTextos}>
          <Text style={styles.title}>Minha Agenda</Text>
          <Text style={styles.subtitle}>Seus próximos compromissos</Text>
        </View>
        <TouchableOpacity
          style={styles.bell}
          onPress={() => navigation.navigate('Notificacoes')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={temNotificacaoNaoLida ? 'Notificações (não lidas)' : 'Notificações'}
        >
          <Icon name="notifications-outline" size={22} color={colors.text} />
          {temNotificacaoNaoLida && <View style={styles.badgeDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.calendarCard}>
          <Calendar
            // `react-native-calendars` não reage bem a mudança de tema via prop depois de
            // montado — forçar remount na troca de modo garante que a paleta nova aplique.
            key={modo}
            markedDates={markedDates}
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

        {escalaVocal.length === 0 && escalaAvulsa.length === 0 && (
          <Card>
            <Text style={styles.emptyText}>Você não tem compromissos futuros registrados.</Text>
          </Card>
        )}

        {escalaVocal.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Compromissos de vocal</Text>
            </View>

            {escalaVocal.map((item) => (
              <Card
                key={item.id}
                style={styles.compromisso}
                onPress={() => navigation.navigate('DetalhesCulto', { cultoId: item.culto_id })}
              >
                <View style={styles.compromissoInfo}>
                  <Text style={styles.compromissoDia}>{formatDiaCompleto(item.data_hora)}</Text>
                  <Text style={styles.compromissoHora}>
                    {formatHora(item.data_hora)}
                    {item.tipo ? ` · ${item.tipo}` : ''}
                  </Text>
                  {item.status === 'pendente' ? (
                    <Badge label="Confirme na aba Notificações" tone="warning" />
                  ) : (
                    <Badge label="Confirmado" tone="success" />
                  )}
                </View>
              </Card>
            ))}
          </>
        )}

        {escalaAvulsa.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Compromissos</Text>
            </View>

            {escalaAvulsa.map((item) => (
              <Card
                key={item.id}
                style={styles.compromisso}
                onPress={() => navigation.navigate('DetalhesCulto', { cultoId: item.culto_id })}
              >
                <View style={styles.compromissoInfo}>
                  <Text style={styles.compromissoDia}>{formatDiaCompleto(item.data_hora)}</Text>
                  <Text style={styles.compromissoHora}>
                    {formatHora(item.data_hora)} · {item.funcao}
                  </Text>
                  {item.status === 'pendente' ? (
                    <Badge label="Confirme na aba Notificações" tone="warning" />
                  ) : (
                    <Badge label="Confirmado" tone="success" />
                  )}
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores, shadows: Sombras) => StyleSheet.create({
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
  headerTextos: {
    flex: 1,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  badgeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: LARGURA_CONTEUDO,
    alignSelf: 'center',
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
});
