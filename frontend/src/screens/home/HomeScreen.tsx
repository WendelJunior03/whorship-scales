import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { MainStackParamList } from '@/navigation/MainNavigator';
import { colors, spacing, typography } from '@/theme';

const ATALHOS = [
  { icon: 'calendar-outline' as const, label: 'Escalas', sublabel: 'Ver escalas' },
  {
    icon: 'people-outline' as const,
    label: 'Membros',
    sublabel: 'Gerenciar',
    route: 'Membros' as const,
  },
  { icon: 'musical-notes-outline' as const, label: 'Repertórios', sublabel: 'Ver repertórios' },
  { icon: 'checkmark-done-outline' as const, label: 'Confirmações', sublabel: 'Acompanhar' },
];

const PROXIMAS_ESCALAS = [
  {
    dia: 'Quarta-feira',
    data: '22/05',
    hora: '19:30',
    culto: 'Culto de Oração',
    confirmacoes: '8/12',
  },
  { dia: 'Sábado', data: '24/05', hora: '19:00', culto: 'Ensaio', confirmacoes: '10/12' },
  {
    dia: 'Domingo',
    data: '25/05',
    hora: '19:00',
    culto: 'Culto de Adoração',
    confirmacoes: '9/12',
  },
];

export function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Ionicons name="menu" size={26} color={colors.text} />
        <View>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          <View style={styles.badgeDot} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Boa noite, {user?.nome?.split(' ')[0] ?? 'membro'} 👋</Text>
        <Text style={styles.subtitle}>Aqui está o que acontece no ministério.</Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('DetalhesCulto', { cultoId: 1 })}
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
            <Text style={styles.proximoCultoData}>Domingo, 25 de Maio</Text>
            <Text style={styles.proximoCultoHora}>19:00 · Igreja Central</Text>
            <Text style={styles.proximoCultoTipo}>Culto de Adoração</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.grid}>
          {ATALHOS.map((atalho) => (
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximas escalas</Text>
          <Text style={styles.sectionLink}>Ver todas</Text>
        </View>

        {PROXIMAS_ESCALAS.map((escala) => (
          <Card
            key={escala.data}
            style={styles.escalaCard}
            onPress={() => navigation.navigate('DetalhesCulto', { cultoId: 1 })}
          >
            <Text style={styles.escalaDia}>
              {escala.dia} · {escala.data}
            </Text>
            <Text style={styles.escalaInfo}>
              {escala.hora} · {escala.culto}
            </Text>
            <Text style={styles.escalaConfirmacoes}>Confirmações: {escala.confirmacoes}</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
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
  sectionLink: {
    ...typography.bodySmall,
    color: colors.primary,
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
  escalaConfirmacoes: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 2,
  },
});
