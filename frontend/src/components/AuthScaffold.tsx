import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { spacing } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useThemedStyles } from '@/contexts/ThemeContext';

interface AuthScaffoldProps {
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}

/**
 * Chrome padrão das telas de autenticação (Login, Welcome, Criar/Entrar em
 * organização): fundo escuro com os "glows" da marca + scroll + ajuste de
 * teclado. Centraliza o layout pra todas essas telas ficarem consistentes.
 */
export function AuthScaffold({ children, contentStyle }: AuthScaffoldProps) {
  const styles = useThemedStyles(criarEstilos);
  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
});
