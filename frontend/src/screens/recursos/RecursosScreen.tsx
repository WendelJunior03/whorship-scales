import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Card } from '@/components/Card';
import { SectionHeader } from '@/components/SectionHeader';
import { Icon, IconName } from '@/components/Icon';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { MainTabScreenNavigationProp } from '@/navigation/types';
import { Cores, Sombras } from '@/theme/palettes';
import { spacing, radius, typography, fonts, LARGURA_CONTEUDO } from '@/theme';
import { podeGerir, isAdmin } from '@/utils/papel';

/** Só rotas da stack sem params obrigatórios — as que a aba de recursos abre direto. */
type RotaRecurso =
  | 'Afinador'
  | 'Octapad'
  | 'Metronomo'
  | 'PadContinuo'
  | 'Biblioteca'
  | 'Multitrack'
  | 'Escalas'
  | 'Membros'
  | 'Ministerio'
  | 'Confirmacoes'
  | 'PanoramaEscalas'
  | 'Indisponibilidades'
  | 'Aniversariantes'
  | 'Comunicados'
  | 'Assinaturas'
  | 'Integracoes';

interface ItemRecurso {
  icon: IconName;
  label: string;
  sublabel: string;
  route: RotaRecurso;
}

const INSTRUMENTOS: ItemRecurso[] = [
  { icon: 'speedometer-outline', label: 'Afinador', sublabel: 'Afine o instrumento', route: 'Afinador' },
  { icon: 'grid-outline', label: 'Octapad', sublabel: 'Pads de som', route: 'Octapad' },
  { icon: 'timer-outline', label: 'Metrônomo', sublabel: 'BPM e tap tempo', route: 'Metronomo' },
  { icon: 'pulse-outline', label: 'Pads Contínuos', sublabel: 'Banco de pads', route: 'PadContinuo' },
  { icon: 'library-outline', label: 'Biblioteca', sublabel: 'Músicas, pastas e vídeos', route: 'Biblioteca' },
  { icon: 'options-outline', label: 'Multitrack / VS', sublabel: 'Player de multitracks', route: 'Multitrack' },
];

const PESSOAL: ItemRecurso[] = [
  {
    icon: 'calendar-outline',
    label: 'Indisponibilidades',
    sublabel: 'Datas que não posso servir',
    route: 'Indisponibilidades',
  },
  {
    icon: 'gift-outline',
    label: 'Aniversariantes',
    sublabel: 'Do mês, por membro',
    route: 'Aniversariantes',
  },
  {
    icon: 'chatbubble-ellipses-outline',
    label: 'Comunicados',
    sublabel: 'Avisos da organização',
    route: 'Comunicados',
  },
];

const GESTAO: (ItemRecurso & { soAdmin?: boolean })[] = [
  { icon: 'business-outline', label: 'Ministério', sublabel: 'Equipes e funções', route: 'Ministerio' },
  { icon: 'calendar-outline', label: 'Escalas', sublabel: 'Ver escalas', route: 'Escalas' },
  { icon: 'stats-chart-outline', label: 'Panorama', sublabel: 'Escalas do mês', route: 'PanoramaEscalas' },
  { icon: 'people-outline', label: 'Membros', sublabel: 'Gerenciar', route: 'Membros', soAdmin: true },
  { icon: 'checkmark-done-outline', label: 'Confirmações', sublabel: 'Acompanhar', route: 'Confirmacoes' },
  { icon: 'card-outline', label: 'Meu plano', sublabel: 'Assinatura PRO da organização', route: 'Assinaturas', soAdmin: true },
  { icon: 'key-outline', label: 'Integrações', sublabel: 'Tokens de API e Holyrics', route: 'Integracoes', soAdmin: true },
];

export function RecursosScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const { user } = useAuth();
  const navigation = useNavigation<MainTabScreenNavigationProp<'Recursos'>>();

  const mostrarGestao = user ? podeGerir(user) : false;
  const gestao = GESTAO.filter((item) => !item.soAdmin || (user && isAdmin(user)));

  // Cor por categoria (como os cards coloridos da referência), aplicada ao ícone.
  const renderCard = (item: ItemRecurso, cor: string, corBg: string) => (
    <Card key={item.label} style={styles.card} onPress={() => navigation.navigate(item.route)}>
      <View style={[styles.cardIcon, { backgroundColor: corBg }]}>
        <Icon name={item.icon} size={20} color={cor} />
      </View>
      <Text style={styles.cardLabel} numberOfLines={2}>
        {item.label}
      </Text>
      <Text style={styles.cardSublabel} numberOfLines={2}>
        {item.sublabel}
      </Text>
    </Card>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Recursos</Text>
        <Text style={styles.subtitle}>Ferramentas e gestão do ministério</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader titulo="Instrumentos" />
        <View style={styles.grid}>{INSTRUMENTOS.map((item) => renderCard(item, colors.accent, colors.accentSoft))}</View>

        <SectionHeader titulo="Pessoal" />
        <View style={styles.grid}>{PESSOAL.map((item) => renderCard(item, colors.primary, colors.primarySoft))}</View>

        {mostrarGestao && (
          <>
            <SectionHeader titulo="Gestão" />
            <View style={styles.grid}>{gestao.map((item) => renderCard(item, colors.warning, 'rgba(242, 180, 83, 0.16)'))}</View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores, shadows: Sombras) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    title: {
      ...typography.h2,
      color: colors.text,
    },
    subtitle: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginTop: 2,
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
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    card: {
      width: '47%',
      borderRadius: radius.xxl,
      gap: 4,
      ...shadows.sm,
    },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    cardLabel: {
      ...typography.body,
      color: colors.text,
      fontFamily: fonts.semibold,
      lineHeight: 20,
      minHeight: 40,
    },
    cardSublabel: {
      ...typography.caption,
      color: colors.textSecondary,
      lineHeight: 16,
      minHeight: 32,
    },
  });
