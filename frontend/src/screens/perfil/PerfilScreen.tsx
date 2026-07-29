import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { papelLabel, papelTone } from '@/utils/papel';
import { colors, spacing, typography } from '@/theme';

const MENU_ITEMS = [
  { icon: 'person-outline' as const, label: 'Informações pessoais' },
  { icon: 'notifications-outline' as const, label: 'Notificações' },
  { icon: 'shield-checkmark-outline' as const, label: 'Segurança' },
  { icon: 'help-circle-outline' as const, label: 'Ajuda e suporte' },
  { icon: 'information-circle-outline' as const, label: 'Sobre o aplicativo' },
];

export function PerfilScreen() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Meu Perfil</Text>
        <Ionicons name="create-outline" size={22} color={colors.text} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.nome?.[0] ?? '?'}</Text>
          </View>
          <TouchableOpacity style={styles.cameraButton}>
            <Ionicons name="camera" size={16} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        <Text style={styles.nome}>{user?.nome ?? '—'}</Text>
        {user && <Badge label={papelLabel[user.papel]} tone={papelTone[user.papel]} />}
        <Text style={styles.igreja}>Igreja Central</Text>

        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuItem}>
              <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Sair da conta"
          onPress={signOut}
          variant="outline"
          style={styles.logoutButton}
        />
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  content: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatarBlock: {
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.h1,
    color: colors.primary,
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  nome: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.xs,
  },
  igreja: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  menu: {
    width: '100%',
    gap: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLabel: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  logoutButton: {
    width: '100%',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
});
