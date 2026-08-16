import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors, spacing } from '@/theme';

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
  return (
    <View style={styles.screen}>
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />

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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.primary,
    opacity: 0.18,
  },
  glowTop: {
    top: -140,
    left: -80,
  },
  glowBottom: {
    bottom: -160,
    right: -100,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
});
