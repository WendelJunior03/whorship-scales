import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { MainTabScreenNavigationProp } from '@/navigation/types';
import * as notificacoesService from '@/services/notificacoes';
import * as repertorioService from '@/services/repertorio';
import { ApiError } from '@/services/api';
import { MeuProximoCulto } from '@/services/repertorio';
import { spacing, radius, typography, fonts, LARGURA_CONTEUDO } from '@/theme';
import { Cores, Sombras } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { formatDiaCompleto, formatHora } from '@/utils/date';
import { getSaudacao } from '@/utils/greeting';

export function HomeScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const { user, org } = useAuth();
  const navigation = useNavigation<MainTabScreenNavigationProp<'Home'>>();

  const [proximoCulto, setProximoCulto] = useState<MeuProximoCulto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [temNotificacaoNaoLida, setTemNotificacaoNaoLida] = useState(false);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const culto = await repertorioService.getMeuProximoCulto().catch((err) => {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      });
      setProximoCulto(culto);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar os dados.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

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
        <Icon name="cloud-offline-outline" size={40} color={colors.textMuted} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={carregarDados}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const primeiroNome = user?.nome?.split(' ')[0] ?? 'membro';
  const musicas = proximoCulto?.repertorios ?? [];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{primeiroNome[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <View style={styles.headerTexts}>
            <Text style={styles.greeting}>
              {getSaudacao()}, {primeiroNome}
            </Text>
            <Text style={styles.headerOrg} numberOfLines={1}>
              {org?.nome ?? 'Deep Scales'}
            </Text>
          </View>
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
        {proximoCulto ? (
          <Card
            onPress={() => navigation.navigate('DetalhesCulto', { cultoId: proximoCulto.culto.id })}
            style={styles.hero}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <Icon name="musical-notes-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.heroLabel}>Próximo culto</Text>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} style={styles.heroChevron} />
            </View>
            <Text style={styles.heroData}>{formatDiaCompleto(proximoCulto.culto.data_hora)}</Text>
            <View style={styles.heroFooter}>
              <View style={styles.heroChip}>
                <Icon name="time-outline" size={14} color={colors.primary} />
                <Text style={styles.heroChipText}>{formatHora(proximoCulto.culto.data_hora)}</Text>
              </View>
              {proximoCulto.culto.tipo && <Text style={styles.heroTipo}>{proximoCulto.culto.tipo}</Text>}
            </View>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Text style={styles.mutedText}>Nenhum culto agendado pra você no momento.</Text>
          </Card>
        )}

        <Text style={styles.sectionTitle}>Músicas do próximo culto</Text>
        {!proximoCulto ? (
          <Card style={styles.card}>
            <Text style={styles.mutedText}>Sem culto agendado — nenhuma música por enquanto.</Text>
          </Card>
        ) : musicas.length === 0 ? (
          <Card style={styles.card}>
            <Text style={styles.mutedText}>O repertório deste culto ainda não foi definido.</Text>
          </Card>
        ) : (
          musicas.map((musica) => (
            <Card
              key={musica.id}
              style={styles.musicaCard}
              onPress={() => navigation.navigate('DetalhesCulto', { cultoId: proximoCulto.culto.id })}
            >
              <View style={styles.musicaIcon}>
                <Icon name="musical-note-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.musicaNome} numberOfLines={1}>
                {musica.nome}
              </Text>
              {!!musica.tom && (
                <View style={styles.tomChip}>
                  <Text style={styles.tomText}>{musica.tom}</Text>
                </View>
              )}
            </Card>
          ))
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
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retryText: {
    ...typography.body,
    color: colors.primary,
    fontFamily: fonts.semibold,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
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
    ...typography.h3,
    color: colors.primary,
  },
  headerTexts: {
    flex: 1,
  },
  greeting: {
    ...typography.h3,
    color: colors.text,
  },
  headerOrg: {
    ...typography.bodySmall,
    color: colors.textSecondary,
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
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: LARGURA_CONTEUDO,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  heroIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  heroChevron: {
    marginLeft: 'auto',
  },
  heroData: {
    ...typography.h2,
    color: colors.text,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  heroChipText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontFamily: fonts.semibold,
  },
  heroTipo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  card: {
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  mutedText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.sm,
  },
  musicaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  musicaIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicaNome: {
    ...typography.body,
    color: colors.text,
    fontFamily: fonts.semibold,
    flex: 1,
  },
  tomChip: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  tomText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontFamily: fonts.semibold,
  },
});
