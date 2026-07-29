import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, typography } from '@/theme';

/**
 * Placeholder temporário — o dashboard completo (próximo culto, escalas,
 * atalhos) vem num próximo prompt. Por agora, só confirma que o login
 * e a navegação estão funcionando de ponta a ponta.
 */
export function HomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.screen}>
      <Text style={styles.greeting}>Boa noite, {user?.nome ?? 'usuário'} 👋</Text>
      <Text style={styles.subtitle}>Login funcionando — dashboard chega no próximo prompt.</Text>
      <Button title="Sair da conta" onPress={signOut} variant="outline" style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  greeting: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    width: '100%',
  },
});
