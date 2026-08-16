import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { MainTabScreenNavigationProp } from '@/navigation/types';
import * as escalaFixaService from '@/services/escalaFixa';
import * as notificacoesService from '@/services/notificacoes';
import * as repertorioService from '@/services/repertorio';
import { ApiError } from '@/services/api';
import { MinhaEscalaFixaItem } from '@/types';
import { MeuProximoCulto } from '@/services/repertorio';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatDiaCompleto, formatHora } from '@/utils/date';
import { getSaudacao } from '@/utils/greeting';
import { isGestor } from '@/utils/papel';
import logo from '../../../assets/logo.png';

// A imagem original (1092x1092) tem o emblema circular em cima e o texto
// "Deep Scales" embaixo. Essas constantes recortam só o círculo (região
// x: 210-876, y: 140-802 medida na imagem original), escalado pro
// tamanho do header.
const LOGO_MARK_SIZE = 36;
const LOGO_MARK_SCALE = 1092 / (876 - 210);
const LOGO_MARK_OFFSET_X = -(210 / (876 - 210)) * LOGO_MARK_SIZE;
const LOGO_MARK_OFFSET_Y = -(140 / (802 - 140)) * LOGO_MARK_SIZE;

const ATALHOS_GESTAO = [
  {
    icon: 'calendar-outline' as const,
    label: 'Escalas',
    sublabel: 'Ver escalas',
    route: 'Escalas' as const,
  },
  {
    icon: 'people-outline' as const,
    label: 'Membros',
    sublabel: 'Gerenciar',
    route: 'Membros' as const,
  },
  {
    icon: 'repeat-outline' as const,
    label: 'Escala Fixa',
    sublabel: 'Configurar',
    route: 'EscalaFixa' as const,
  },
  {
    icon: 'checkmark-done-outline' as const,
    label: 'Confirmações',
    sublabel: 'Acompanhar',
    route: 'Confirmacoes' as const,
  },
];

const ATALHOS_MEMBRO = [
  {
    icon: 'calendar-outline' as const,
    label: 'Escalas',
    sublabel: 'Ver cultos',
    route: 'Escalas' as const,
  },
  {
    icon: 'checkmark-done-outline' as const,
    label: 'Confirmar',
    sublabel: 'Sua presença',
    route: 'Agenda' as const,
  },
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
          // 404 aqui significa "sem culto futuro", um estado válido, não um erro
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
        <Button
          title="Tentar novamente"
          onPress={carregarDados}
          variant="outline"
          style={styles.retryButton}
        />
      </SafeAreaView>
    );
  }

  const atalhos =
    user && isGestor(user.papel)
      ? ATALHOS_GESTAO.filter((atalho) => atalho.label !== 'Membros' || user.papel === 'admin')
      : ATALHOS_MEMBRO;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.headerLogoCrop}>
            <Image source={logo} style={styles.headerLogo} />
          </View>
          <View style={styles.headerTexts}>
            <Text style={styles.headerOrg} numberOfLines={1}>
              {org?.nome ?? 'Deep Scales'}
            </Text>
            <Text style={styles.headerHint}>Seu ministério</Text>
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
        <View>
          <Text style={styles.greeting}>
            {getSaudacao()}, {user?.nome?.split(' ')[0] ?? 'membro'} 👋
          </Text>
          <Text style={styles.subtitle}>Aqui está o que acontece no ministério.</Text>
        </View>

        {proximoCulto ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('DetalhesCulto', { cultoId: proximoCulto.culto.id })}
            style={styles.heroShadow}
          >
            <LinearGradient
              colors={colors.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.proximoCultoCard}
            >
              <View style={styles.proximoCultoTop}>
                <View style={styles.proximoCultoBadge}>
                  <Ionicons name="musical-notes" size={18} color={colors.textInverse} />
                </View>
                <Text style={styles.proximoCultoLabel}>Próximo culto</Text>
              </View>
              <Text style={styles.proximoCultoData}>
                {formatDiaCompleto(proximoCulto.culto.data_hora)}
              </Text>
              <View style={styles.proximoCultoFooter}>
                <View style={styles.proximoCultoHoraChip}>
                  <Ionicons name="time-outline" size={14} color={colors.textInverse} />
                  <Text style={styles.proximoCultoHora}>
                    {formatHora(proximoCulto.culto.data_hora)}
                  </Text>
                </View>
                {proximoCulto.culto.tipo && (
                  <Text style={styles.proximoCultoTipo}>{proximoCulto.culto.tipo}</Text>
                )}
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="rgba(255,255,255,0.9)"
                  style={styles.proximoCultoChevron}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <Card style={styles.cardShadow}>
            <Text style={styles.semCultoTexto}>Nenhum culto agendado pra você no momento.</Text>
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Atalhos</Text>
        </View>
        <View style={styles.grid}>
          {atalhos.map((atalho) => (
            <Card
              key={atalho.label}
              style={styles.gridCard}
              onPress={() => navigation.navigate(atalho.route)}
            >
              <View style={styles.gridIcon}>
                <Ionicons name={atalho.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.gridLabel}>{atalho.label}</Text>
              <Text style={styles.gridSublabel}>{atalho.sublabel}</Text>
            </Card>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sua escala fixa</Text>
        </View>

        {minhaEscala.length === 0 ? (
          <Card style={styles.cardShadow}>
            <Text style={styles.semCultoTexto}>Você ainda não tem uma escala fixa cadastrada.</Text>
          </Card>
        ) : (
          minhaEscala.map((escala, index) => (
            <Card
              key={`${escala.dia_semana}-${escala.funcao}-${index}`}
              style={StyleSheet.flatten([styles.escalaCard, styles.cardShadow])}
            >
              <View style={styles.escalaDot} />
              <View style={styles.escalaInfoBlock}>
                <Text style={styles.escalaDia}>{capitalize(escala.dia_semana)}</Text>
                <Text style={styles.escalaInfo}>{escala.funcao}</Text>
              </View>
            </Card>
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
    minWidth: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerTexts: {
    flex: 1,
  },
  headerLogoCrop: {
    width: LOGO_MARK_SIZE,
    height: LOGO_MARK_SIZE,
    overflow: 'hidden',
    borderRadius: LOGO_MARK_SIZE / 2,
  },
  headerLogo: {
    position: 'absolute',
    width: LOGO_MARK_SIZE * LOGO_MARK_SCALE,
    height: LOGO_MARK_SIZE * LOGO_MARK_SCALE,
    left: LOGO_MARK_OFFSET_X,
    top: LOGO_MARK_OFFSET_Y,
  },
  headerOrg: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  headerHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
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
  greeting: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  heroShadow: {
    borderRadius: radius.xxl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  proximoCultoCard: {
    borderRadius: radius.xxl,
    padding: spacing.lg,
  },
  proximoCultoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  proximoCultoBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proximoCultoLabel: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
  },
  proximoCultoData: {
    ...typography.h2,
    color: colors.textInverse,
  },
  proximoCultoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  proximoCultoHoraChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  proximoCultoHora: {
    ...typography.bodySmall,
    color: colors.textInverse,
    fontWeight: '600',
  },
  proximoCultoTipo: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
  },
  proximoCultoChevron: {
    marginLeft: 'auto',
  },
  semCultoTexto: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cardShadow: {
    ...shadows.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridCard: {
    width: '47%',
    gap: 4,
    ...shadows.sm,
  },
  gridIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDark,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  escalaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  escalaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  escalaInfoBlock: {
    gap: 2,
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
