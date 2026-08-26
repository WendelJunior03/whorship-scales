import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Card } from '@/components/Card';
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
  | 'Escalas'
  | 'Membros'
  | 'Ministerio'
  | 'Confirmacoes'
  | 'PanoramaEscalas';

interface ItemRecurso {
  icon: IconName;
  label: string;
  sublabel: string;
  route: RotaRecurso;
}

const INSTRUMENTOS: ItemRecurso[] = [
  { icon: 'musical-note-outline', label: 'Afinador', sublabel: 'Afine o instrumento', route: 'Afinador' },
  { icon: 'grid-outline', label: 'Octapad', sublabel: 'Pads de som', route: 'Octapad' },
  { icon: 'timer-outline', label: 'Metrônomo', sublabel: 'BPM e tap tempo', route: 'Metronomo' },
  { icon: 'pulse-outline', label: 'Pads Contínuos', sublabel: 'Banco de pads', route: 'PadContinuo' },
  { icon: 'videocam-outline', label: 'Biblioteca', sublabel: 'Vídeos das músicas', route: 'Biblioteca' },
];

const GESTAO: (ItemRecurso & { soAdmin?: boolean })[] = [
  { icon: 'business-outline', label: 'Ministério', sublabel: 'Equipes e funções', route: 'Ministerio' },
  { icon: 'calendar-outline', label: 'Escalas', sublabel: 'Ver escalas', route: 'Escalas' },
  { icon: 'stats-chart-outline', label: 'Panorama', sublabel: 'Escalas do mês', route: 'PanoramaEscalas' },
  { icon: 'people-outline', label: 'Membros', sublabel: 'Gerenciar', route: 'Membros', soAdmin: true },
  { icon: 'checkmark-done-outline', label: 'Confirmações', sublabel: 'Acompanhar', route: 'Confirmacoes' },
];

export function RecursosScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const { user } = useAuth();
  const navigation = useNavigation<MainTabScreenNavigationProp<'Recursos'>>();

  const mostrarGestao = user ? podeGerir(user) : false;
  const gestao = GESTAO.filter((item) => !item.soAdmin || (user && isAdmin(user)));

  const renderCard = (item: ItemRecurso) => (
    <Card key={item.label} style={styles.card} onPress={() => navigation.navigate(item.route)}>
      <View style={styles.cardIcon}>
        <Icon name={item.icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.cardLabel}>{item.label}</Text>
      <Text style={styles.cardSublabel}>{item.sublabel}</Text>
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
        <Text style={styles.sectionTitle}>Instrumentos</Text>
        <View style={styles.grid}>{INSTRUMENTOS.map(renderCard)}</View>

        {mostrarGestao && (
          <>
            <Text style={styles.sectionTitle}>Gestão</Text>
            <View style={styles.grid}>{gestao.map(renderCard)}</View>
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
    card: {
      width: '47%',
      borderRadius: radius.xl,
      gap: 4,
      ...shadows.sm,
    },
    cardIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    cardLabel: {
      ...typography.body,
      color: colors.text,
      fontFamily: fonts.semibold,
    },
    cardSublabel: {
      ...typography.caption,
      color: colors.textSecondary,
    },
  });
