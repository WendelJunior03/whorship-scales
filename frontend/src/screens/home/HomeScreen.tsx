import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import { RingStat } from '@/components/RingStat';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { MainTabScreenNavigationProp } from '@/navigation/types';
import * as notificacoesService from '@/services/notificacoes';
import * as ministeriosService from '@/services/ministerios';
import * as cultosService from '@/services/cultos';
import * as membrosService from '@/services/membros';
import * as avisosService from '@/services/avisos';
import { ApiError } from '@/services/api';
import { Aniversariante, Aviso, CultoResumo, Ministerio } from '@/types';
import { spacing, radius, typography, fonts, LARGURA_CONTEUDO } from '@/theme';
import { Cores, Sombras } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { formatDiaSemana, formatHora } from '@/utils/date';
import { getSaudacao } from '@/utils/greeting';

function inicioDoDia(d: Date): number {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c.getTime();
}

function diaMesCurto(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
    .format(new Date(iso))
    .replace('.', '');
}

function rotuloRelativo(iso: string): string {
  const dias = Math.round((inicioDoDia(new Date(iso)) - inicioDoDia(new Date())) / 86400000);
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Amanhã';
  return dias > 0 ? `daqui a ${dias} dias` : `há ${Math.abs(dias)} dias`;
}

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

const MESES_ANIV = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
/** 'YYYY-MM-DD' → "15 de maio" (ignora o ano). */
function formatAniversario(iso: string): string {
  const [, mm, dd] = iso.split('-');
  return `${Number(dd)} de ${MESES_ANIV[Number(mm) - 1] ?? ''}`;
}

export function HomeScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const { user, org } = useAuth();
  const navigation = useNavigation<MainTabScreenNavigationProp<'Home'>>();

  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [minhasEscalas, setMinhasEscalas] = useState<CultoResumo[]>([]);
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [temNotificacaoNaoLida, setTemNotificacaoNaoLida] = useState(false);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [mins, resumo, nascimentos, comunicados] = await Promise.all([
        ministeriosService.listarMinisterios(),
        cultosService.getResumoCultos(),
        membrosService.getAniversariantesDoMes(),
        avisosService.listarAvisos(),
      ]);
      const hoje = inicioDoDia(new Date());
      setMinisterios(mins);
      setAniversariantes(nascimentos);
      setAvisos(comunicados.slice(0, 3));
      setMinhasEscalas(
        resumo
          .filter((c) => c.minha_situacao !== null && inicioDoDia(new Date(c.data_hora)) >= hoje)
          .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())
          .slice(0, 3),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar os dados.');
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
        .catch(() => {});
    }, []),
  );

  const primeiroNome = user?.nome?.split(' ')[0] ?? 'membro';

  // Resumo do hero (dados reais já carregados).
  const proximaEscala = minhasEscalas[0];
  const confirmadas = minhasEscalas.filter((c) => c.minha_situacao === 'confirmado').length;
  const confPct = minhasEscalas.length ? (confirmadas / minhasEscalas.length) * 100 : 0;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.content}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={64} radius={radius.lg} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

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
              {org?.nome ?? 'Worship Stage'}
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Hero de resumo (próxima escala + anéis) */}
        <Card style={styles.heroCard}>
          <View style={styles.heroTopo}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>Próxima escala</Text>
              {proximaEscala ? (
                <>
                  <Text style={styles.heroBig}>{diaMesCurto(proximaEscala.data_hora)}</Text>
                  <Text style={styles.heroSub}>
                    {proximaEscala.tipo ?? 'Culto'} · {rotuloRelativo(proximaEscala.data_hora)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.heroBig}>Tudo em dia</Text>
                  <Text style={styles.heroSub}>Nenhuma escala próxima</Text>
                </>
              )}
            </View>
            <View style={styles.heroIcon}>
              <Icon name="calendar-outline" size={22} color={colors.accent} />
            </View>
          </View>
          <View style={styles.heroRings}>
            <RingStat percent={confPct} valor={`${confirmadas}`} label="Confirmadas" cores={colors.accentGradient} />
            <RingStat
              percent={(Math.min(ministerios.length, 6) / 6) * 100}
              valor={`${ministerios.length}`}
              label="Ministérios"
              cores={['#6E9BFF', '#4C82FF']}
            />
            <RingStat
              percent={(Math.min(avisos.length, 5) / 5) * 100}
              valor={`${avisos.length}`}
              label="Comunicados"
              cores={['#A78BFA', '#7C5CFF']}
            />
          </View>
        </Card>

        {error ? (
          <Card style={styles.centeredCard}>
            <Icon name="cloud-offline-outline" size={32} color={colors.textMuted} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={carregarDados}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </TouchableOpacity>
          </Card>
        ) : null}

        {/* Ministérios */}
        <SecaoHeader titulo="Ministérios" contador={ministerios.length} styles={styles} />
        {ministerios.length === 0 ? (
          <VazioCard texto="Você ainda não está em nenhum ministério." styles={styles} />
        ) : (
          ministerios.map((m) => (
            <Card key={m.id} style={styles.ministerioCard} onPress={() => navigation.navigate('Ministerio')}>
              <View style={styles.ministerioIcon}>
                <Icon name="business-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ministerioNome}>{m.nome}</Text>
                <Text style={styles.ministerioMeta}>
                  {(m.total_membros ?? 0)} membro{(m.total_membros ?? 0) === 1 ? '' : 's'}
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </Card>
          ))
        )}

        {/* Minhas escalas (próximas) */}
        <SecaoHeader
          titulo="Minhas escalas"
          subtitulo="Próximas"
          contador={minhasEscalas.length}
          acao={{ label: 'Ver todas', onPress: () => navigation.navigate('Escalas') }}
          styles={styles}
        />
        {minhasEscalas.length === 0 ? (
          <VazioCard texto="Nenhuma escala próxima." styles={styles} />
        ) : (
          minhasEscalas.map((c) => (
            <Card key={c.id} style={styles.escalaCard} onPress={() => navigation.navigate('DetalhesCulto', { cultoId: c.id })}>
              <View style={styles.escalaTopo}>
                <Icon name="calendar-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.escalaData}>
                  {formatDiaSemana(c.data_hora)}, {formatHora(c.data_hora)}
                </Text>
                <Text style={styles.escalaRelativo}>· {diaMesCurto(c.data_hora)} · {rotuloRelativo(c.data_hora)}</Text>
              </View>
              <Text style={styles.escalaTitulo}>
                {c.tipo ?? `Culto de ${formatDiaSemana(c.data_hora)}`}
              </Text>
              {c.participantes.length > 0 && (
                <View style={styles.avatares}>
                  {c.participantes.slice(0, 5).map((p, i) => (
                    <View key={p.membro_id} style={[styles.avatarPeq, i > 0 && styles.avatarSobreposto]}>
                      <Text style={styles.avatarPeqText}>{iniciais(p.nome)}</Text>
                    </View>
                  ))}
                  {c.participantes.length > 5 && (
                    <View style={[styles.avatarPeq, styles.avatarSobreposto, styles.avatarMais]}>
                      <Text style={styles.avatarPeqText}>+{c.participantes.length - 5}</Text>
                    </View>
                  )}
                </View>
              )}
              <View style={styles.escalaRodape}>
                {c.minha_situacao === 'confirmado' ? (
                  <Badge label="Confirmado" tone="success" />
                ) : (
                  <Badge label="Pendente" tone="warning" />
                )}
                <View style={styles.contador}>
                  <Icon name="musical-notes" size={14} color={colors.textMuted} />
                  <Text style={styles.contadorText}>{c.total_musicas}</Text>
                </View>
                <View style={styles.contador}>
                  <Icon name="chatbubble-ellipses-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.contadorText}>{c.total_comentarios}</Text>
                </View>
              </View>
            </Card>
          ))
        )}

        {/* Comunicados (módulo 9) */}
        <SecaoHeader
          titulo="Comunicados"
          subtitulo="Em destaque"
          contador={avisos.length}
          acao={{ label: 'Ver todos', onPress: () => navigation.navigate('Comunicados') }}
          styles={styles}
        />
        {avisos.length === 0 ? (
          <VazioCard texto="Nenhum comunicado no momento." styles={styles} />
        ) : (
          avisos.map((a) => (
            <Card
              key={a.id}
              style={styles.ministerioCard}
              onPress={() => navigation.navigate('Comunicados', { abrirId: a.id })}
            >
              <View style={[styles.avisoPonto, !a.lido && styles.avisoPontoNaoLido]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.ministerioNome, !a.lido && styles.avisoTituloNaoLido]} numberOfLines={1}>
                  {a.titulo}
                </Text>
                {a.corpo ? (
                  <Text style={styles.ministerioMeta} numberOfLines={1}>
                    {a.corpo}
                  </Text>
                ) : null}
              </View>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </Card>
          ))
        )}

        {/* Aniversariantes (módulo 8) */}
        <SecaoHeader
          titulo="Aniversariantes"
          subtitulo="Este mês"
          contador={aniversariantes.length}
          styles={styles}
        />
        {aniversariantes.length === 0 ? (
          <VazioCard texto="Nenhum aniversariante este mês." styles={styles} />
        ) : (
          aniversariantes.map((a) => (
            <Card key={a.id} style={styles.ministerioCard}>
              <View style={styles.ministerioIcon}>
                <Icon name="gift-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ministerioNome}>{a.nome}</Text>
                <Text style={styles.ministerioMeta}>{formatAniversario(a.data_nascimento)}</Text>
              </View>
            </Card>
          ))
        )}

        {/* Mais tocadas — atalho pra biblioteca */}
        <Card style={styles.promoCard} onPress={() => navigation.navigate('Biblioteca')}>
          <View style={styles.promoIcon}>
            <Icon name="musical-notes" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitulo}>Mais tocadas</Text>
            <Text style={styles.promoSub}>Confira as músicas do repertório.</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function SecaoHeader({
  titulo,
  subtitulo,
  contador,
  acao,
  styles,
}: {
  titulo: string;
  subtitulo?: string;
  contador?: number;
  acao?: { label: string; onPress: () => void };
  styles: ReturnType<typeof criarEstilos>;
}) {
  return (
    <View style={styles.secaoHeader}>
      <View style={styles.secaoTituloLinha}>
        <Text style={styles.secaoTitulo}>{titulo}</Text>
        {contador !== undefined && (
          <View style={styles.secaoContador}>
            <Text style={styles.secaoContadorText}>{contador}</Text>
          </View>
        )}
        {subtitulo ? <Text style={styles.secaoSub}>{subtitulo}</Text> : null}
      </View>
      {acao ? (
        <TouchableOpacity onPress={acao.onPress} hitSlop={6}>
          <Text style={styles.secaoAcao}>{acao.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function VazioCard({ texto, styles }: { texto: string; styles: ReturnType<typeof criarEstilos> }) {
  return (
    <Card>
      <Text style={styles.vazioText}>{texto}</Text>
    </Card>
  );
}

const criarEstilos = (colors: Cores, shadows: Sombras) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centeredCard: { alignItems: 'center', gap: spacing.sm },
    errorText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
    retryButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
    retryText: { ...typography.bodySmall, color: colors.primary, fontFamily: fonts.semibold },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      width: '100%',
      maxWidth: LARGURA_CONTEUDO,
      alignSelf: 'center',
    },
    headerBrand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
    avatar: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    avatarText: { ...typography.h3, color: colors.primary },
    headerTexts: { flex: 1 },
    greeting: { ...typography.h3, color: colors.text },
    headerOrg: { ...typography.bodySmall, color: colors.textSecondary },
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
    badgeDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
    heroCard: {
      gap: spacing.md,
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      ...shadows.lg,
    },
    heroTopo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    heroLabel: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    heroBig: { ...typography.h1, color: colors.text, marginTop: 2 },
    heroSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    heroIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroRings: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.xs },
    scroll: { flex: 1 },
    content: {
      width: '100%',
      maxWidth: LARGURA_CONTEUDO,
      alignSelf: 'center',
      padding: spacing.lg,
      paddingTop: spacing.sm,
      gap: spacing.sm,
    },
    secaoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
    secaoTituloLinha: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
    secaoTitulo: { ...typography.h3, color: colors.text },
    secaoContador: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 6,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secaoContadorText: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.semibold },
    secaoSub: { ...typography.caption, color: colors.textMuted },
    secaoAcao: { ...typography.bodySmall, color: colors.primary, fontFamily: fonts.semibold },
    vazioText: { ...typography.bodySmall, color: colors.textSecondary },
    ministerioCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    ministerioIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    ministerioNome: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
    ministerioMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
    avisoPonto: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'transparent' },
    avisoPontoNaoLido: { backgroundColor: colors.primary },
    avisoTituloNaoLido: { fontFamily: fonts.bold },
    escalaCard: { gap: spacing.xs },
    escalaTopo: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    escalaData: { ...typography.bodySmall, color: colors.text, fontFamily: fonts.semibold },
    escalaRelativo: { ...typography.caption, color: colors.textMuted },
    escalaTitulo: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
    avatares: { flexDirection: 'row', marginTop: 2 },
    avatarPeq: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    avatarSobreposto: { marginLeft: -8 },
    avatarMais: { backgroundColor: colors.surfaceElevated },
    avatarPeqText: { ...typography.caption, color: colors.primary, fontWeight: '700', fontSize: 9 },
    escalaRodape: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 2 },
    contador: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    contadorText: { ...typography.caption, color: colors.textMuted },
    promoCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
    promoIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    promoTitulo: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
    promoSub: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  });
