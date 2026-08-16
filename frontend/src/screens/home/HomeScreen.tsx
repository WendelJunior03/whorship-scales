import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { MainTabScreenNavigationProp } from '@/navigation/types';
import * as escalaFixaService from '@/services/escalaFixa';
import * as notificacoesService from '@/services/notificacoes';
import * as repertorioService from '@/services/repertorio';
import { ApiError } from '@/services/api';
import { MinhaEscalaFixaItem } from '@/types';
import { MeuProximoCulto } from '@/services/repertorio';
import { spacing, radius, typography } from '@/theme';
import { lightColors as colors, lightShadows } from '@/theme/light';
import { formatDiaCompleto, formatHora } from '@/utils/date';
import { getSaudacao } from '@/utils/greeting';
import { isGestor } from '@/utils/papel';

const ATALHOS_GESTAO = [
  { icon: 'calendar-outline' as const, label: 'Escalas', sublabel: 'Ver escalas', route: 'Escalas' as const },
  { icon: 'people-outline' as const, label: 'Membros', sublabel: 'Gerenciar', route: 'Membros' as const },
  { icon: 'repeat-outline' as const, label: 'Escala Fixa', sublabel: 'Configurar', route: 'EscalaFixa' as const },
  { icon: 'checkmark-done-outline' as const, label: 'Confirmações', sublabel: 'Acompanhar', route: 'Confirmacoes' as const },
];

const ATALHOS_MEMBRO = [
  { icon: 'calendar-outline' as const, label: 'Escalas', sublabel: 'Ver cultos', route: 'Escalas' as const },
  { icon: 'checkmark-done-outline' as const, label: 'Confirmar', sublabel: 'Sua presença', route: 'Agenda' as const },
];

export function HomeScreen() {
  const { user, org } = useAuth();
  const navigation = useNavigation<MainTabScreenNavigationProp<'Home'>>();

  const [proximoCulto, setProximoCulto] = useState<MeuProximoCulto | null>(null);
  const [minhaEscala, setMinhaEscala] = useState<MinhaEscalaFixaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [temNotificacaoNaoLida, setTemNotificacaoNaoLida] = useState(false);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [culto, escala] = await Promise.all([
        repertorioService.getMeuProximoCulto().catch((err) => {
          if (err instanceof ApiError && err.status === 404) return null;
          throw err;
        }),
        escalaFixaService.getMinhaEscalaFixa(),
      ]);
      setProximoCulto(culto);
      setMinhaEscala(escala);
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
        <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={carregarDados}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const primeiroNome = user?.nome?.split(' ')[0] ?? 'membro';
  const atalhos =
    user && isGestor(user.papel)
      ? ATALHOS_GESTAO.filter((a) => a.label !== 'Membros' || user.papel === 'admin')
      : ATALHOS_MEMBRO;

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
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {temNotificacaoNaoLida && <View style={styles.badgeDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {proximoCulto ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('DetalhesCulto', { cultoId: proximoCulto.culto.id })}
            style={styles.hero}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <Ionicons name="musical-notes-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.heroLabel}>Próximo culto</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={styles.heroChevron} />
            </View>
            <Text style={styles.heroData}>{formatDiaCompleto(proximoCulto.culto.data_hora)}</Text>
            <View style={styles.heroFooter}>
              <View style={styles.heroChip}>
                <Ionicons name="time-outline" size={14} color={colors.primary} />
                <Text style={styles.heroChipText}>{formatHora(proximoCulto.culto.data_hora)}</Text>
              </View>
              {proximoCulto.culto.tipo && <Text style={styles.heroTipo}>{proximoCulto.culto.tipo}</Text>}
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.card}>
            <Text style={styles.mutedText}>Nenhum culto agendado pra você no momento.</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Atalhos</Text>
        <View style={styles.grid}>
          {atalhos.map((atalho) => (
            <TouchableOpacity
              key={atalho.label}
              style={styles.gridCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(atalho.route)}
            >
              <View style={styles.gridIcon}>
                <Ionicons name={atalho.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.gridLabel}>{atalho.label}</Text>
              <Text style={styles.gridSublabel}>{atalho.sublabel}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Sua escala fixa</Text>
        {minhaEscala.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.mutedText}>Você ainda não tem uma escala fixa cadastrada.</Text>
          </View>
        ) : (
          minhaEscala.map((escala, index) => (
            <View key={`${escala.dia_semana}-${escala.funcao}-${index}`} style={styles.escalaCard}>
              <View style={styles.escalaIcon}>
                <Ionicons name="repeat-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.escalaDia}>{capitalize(escala.dia_semana)}</Text>
                <Text style={styles.escalaInfo}>{escala.funcao}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
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
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retryText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
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
    ...lightShadows.sm,
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
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...lightShadows.md,
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
    fontWeight: '600',
  },
  heroTipo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...lightShadows.sm,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
    ...lightShadows.sm,
  },
  gridIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  gridLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  gridSublabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  escalaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...lightShadows.sm,
  },
  escalaIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  escalaDia: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  escalaInfo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
