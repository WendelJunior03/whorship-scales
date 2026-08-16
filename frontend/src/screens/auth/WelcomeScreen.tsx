import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button } from '@/components/Button';
import { AuthScaffold } from '@/components/AuthScaffold';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { colors, spacing, typography } from '@/theme';
import logo from '../../../assets/logo.png';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Welcome'>;
};

export function WelcomeScreen({ navigation }: Props) {
  return (
    <AuthScaffold>
      <View style={styles.header}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.subtitle}>Organize seu ministério com excelência</Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Criar organização"
          onPress={() => navigation.navigate('CriarOrganizacao')}
        />
        <Button
          title="Entrar com código"
          variant="outline"
          onPress={() => navigation.navigate('EntrarOrganizacao')}
        />

        <Text style={styles.footer}>
          Já tem uma conta?{' '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
            Entrar
          </Text>
        </Text>
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.md,
  },
  footer: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
