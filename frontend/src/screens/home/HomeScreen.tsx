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
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { MainTabScreenNavigationProp } from '@/navigation/types';
import * as escalaFixaService from '@/services/escalaFixa';
import * as repertorioService from '@/services/repertorio';
import { ApiError } from '@/services/api';
import { EscalaFixaMontada } from '@/types';
import { MeuProximoCulto } from '@/services/repertorio';
import { colors, spacing, typography } from '@/theme';
import { formatDiaCompleto, formatHora } from '@/utils/date';
import { getSaudacao } from '@/utils/greeting';
import { isGestor } from '@/utils/papel';
import logo from '../../../assets/logo.png';

// A imagem original (1092x1092) tem o emblema circular em cima e o texto
// "Deep Scales" embaixo. Essas constantes recortam só o círculo (região
// x: 210-876, y: 140-802 medida na imagem original), escalado pro
// tamanho do header.
const LOGO_MARK_SIZE = 32;
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

export function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<MainTabScreenNavigationProp<'Home'>>();

  const [proximoCulto, setProximoCulto] = useState<MeuProximoCulto | null>(null);
  const [minhaEscala, setMinhaEscala] = useState<EscalaFixaMontada[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLogoCrop}>
          <Image source={logo} style={styles.headerLogo} />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notificacoes')}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          <View style={styles.badgeDot} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>
          {getSaudacao()}, {user?.nome?.split(' ')[0] ?? 'membro'} 👋
        </Text>
        <Text style={styles.subtitle}>Aqui está o que acontece no ministério.</Text>

        {proximoCulto ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('DetalhesCulto', { cultoId: proximoCulto.culto.id })}
          >
            <LinearGradient
              colors={colors.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.proximoCultoCard}
            >
              <View style={styles.proximoCultoBadge}>
                <Ionicons name="musical-notes" size={18} color={colors.textInverse} />
              </View>
              <Text style={styles.proximoCultoLabel}>Próximo culto</Text>
              <Text style={styles.proximoCultoData}>
                {formatDiaCompleto(proximoCulto.culto.data_hora)}
              </Text>
              <Text style={styles.proximoCultoHora}>
                {formatHora(proximoCulto.culto.data_hora)}
              </Text>
              {proximoCulto.culto.tipo && (
                <Text style={styles.proximoCultoTipo}>{proximoCulto.culto.tipo}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <Card>
            <Text style={styles.semCultoTexto}>Nenhum culto agendado pra você no momento.</Text>
          </Card>
        )}

        {user && isGestor(user.papel) ? (
          <View style={styles.grid}>
            {ATALHOS_GESTAO.filter(
              (atalho) => atalho.label !== 'Membros' || user.papel === 'admin',
            ).map((atalho) => (
              <Card
                key={atalho.label}
                style={styles.gridCard}
                onPress={() => atalho.route && navigation.navigate(atalho.route)}
              >
                <Ionicons name={atalho.icon} size={22} color={colors.primary} />
                <Text style={styles.gridLabel}>{atalho.label}</Text>
                <Text style={styles.gridSublabel}>{atalho.sublabel}</Text>
              </Card>
            ))}
          </View>
        ) : (
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Agenda')}>
            <Card style={styles.confirmarCard}>
              <View style={styles.confirmarIcon}>
                <Ionicons name="checkmark-done" size={20} color={colors.primary} />
              </View>
              <View style={styles.confirmarInfo}>
                <Text style={styles.gridLabel}>Confirmar Presença</Text>
                <Text style={styles.gridSublabel}>Ver e confirmar seus próximos compromissos</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Card>
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sua escala fixa</Text>
        </View>

        {minhaEscala.length === 0 ? (
          <Card>
            <Text style={styles.semCultoTexto}>Você ainda não tem uma escala fixa cadastrada.</Text>
          </Card>
        ) : (
          minhaEscala.map((escala, index) => (
            <Card key={`${escala.dia_semana}-${escala.funcao}-${index}`} style={styles.escalaCard}>
              <Text style={styles.escalaDia}>{capitalize(escala.dia_semana)}</Text>
              <Text style={styles.escalaInfo}>{escala.funcao}</Text>
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
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  greeting: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
  },
  proximoCultoCard: {
    borderRadius: 18,
    padding: spacing.lg,
  },
  proximoCultoBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  proximoCultoLabel: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
  },
  proximoCultoData: {
    ...typography.h2,
    color: colors.textInverse,
    marginTop: spacing.xs,
  },
  proximoCultoHora: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  proximoCultoTipo: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  semCultoTexto: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridCard: {
    width: '47%',
    gap: 4,
  },
  gridLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  gridSublabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  confirmarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  confirmarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmarInfo: {
    flex: 1,
    gap: 2,
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
