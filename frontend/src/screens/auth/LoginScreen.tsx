import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { AuthScaffold } from '@/components/AuthScaffold';
import { Logo } from '@/components/Logo';
import { GoogleLogo } from '@/components/GoogleLogo';
import { useAuth } from '@/contexts/AuthContext';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { ApiError } from '@/services/api';
import * as integracoesService from '@/services/integracoes';
import { googleClientId } from '@/utils/googleGsi';
import { spacing, radius, typography, fonts } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
};

export function LoginScreen({ navigation }: Props) {
  const styles = useThemedStyles(criarEstilos);
  const { colors } = useTheme();
  const { signIn, entrarComGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarGoogle, setMostrarGoogle] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  // Só mostra "Entrar com Google" no web e se o servidor tiver a integração ligada.
  useEffect(() => {
    if (Platform.OS !== 'web' || !googleClientId()) return;
    integracoesService
      .getStatus()
      .then((s) => setMostrarGoogle(s.google))
      .catch(() => setMostrarGoogle(false));
  }, []);

  async function handleGoogle() {
    setError(null);
    setGoogleBusy(true);
    try {
      await entrarComGoogle();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar com o Google.');
    } finally {
      setGoogleBusy(false);
    }
  }

  async function handleEntrar() {
    if (!email || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Não foi possível entrar.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEsqueciSenha() {
    navigation.navigate('EsqueciSenha');
  }

  return (
    <AuthScaffold>
      <View style={styles.header}>
        <Logo />
        <Text style={styles.subtitle}>Organize seu ministério com excelência</Text>
      </View>

      <View style={styles.form}>
        <Input
          icon="mail-outline"
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
        />
        <Input
          icon="lock-closed-outline"
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          isPassword
          autoComplete="password"
        />

        <Text style={styles.forgotPassword} onPress={handleEsqueciSenha}>
          Esqueci minha senha
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          title="Entrar"
          onPress={handleEntrar}
          loading={isSubmitting}
          style={styles.button}
        />

        {mostrarGoogle && (
          <>
            <View style={styles.divisor}>
              <View style={styles.divisorLinha} />
              <Text style={styles.divisorTexto}>ou entre com</Text>
              <View style={styles.divisorLinha} />
            </View>
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogle}
              disabled={googleBusy}
              accessibilityRole="button"
              accessibilityLabel="Entrar com Google"
            >
              {googleBusy ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <>
                  <GoogleLogo size={20} />
                  <Text style={styles.googleTexto}>Google</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.footer}>
          Ainda não tem uma conta?{' '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('CriarOrganizacao')}>
            Criar organização
          </Text>
          {'  ·  '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('EntrarOrganizacao')}>
            Entrar com código
          </Text>
        </Text>
      </View>
    </AuthScaffold>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  forgotPassword: {
    ...typography.bodySmall,
    color: colors.primary,
    marginTop: -spacing.xs,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.sm,
  },
  divisor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  divisorLinha: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  divisorTexto: {
    ...typography.caption,
    color: colors.textMuted,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 50,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  googleTexto: {
    ...typography.body,
    color: colors.text,
    fontFamily: fonts.semibold,
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
