import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { SeloPro } from '@/components/SeloPro';
import { useOctapad } from '@/hooks/useOctapad';
import { CATEGORIAS, KIT_PADRAO } from '@/audio/kits';
import { colors, fonts, radius, spacing, typography } from '@/theme';

// Vibração leve no toque (web), sem depender de módulo nativo.
function vibrar() {
  const g = globalThis as unknown as { navigator?: { vibrate?: (ms: number) => void } };
  g.navigator?.vibrate?.(8);
}

export function OctapadScreen() {
  const { suportado, tocar } = useOctapad();
  const [ativo, setAtivo] = useState<string | null>(null);

  function handlePad(id: string) {
    tocar(id); // onPressIn → dispara no toque (latência mínima)
    if (Platform.OS === 'web') {
      vibrar();
    }
    setAtivo(id);
  }

  if (!suportado) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <Header title="Octapad" showBack />
        <View style={styles.aviso}>
          <Ionicons name="musical-notes-outline" size={44} color={colors.textMuted} />
          <Text style={styles.avisoTitulo}>Disponível na versão web</Text>
          <Text style={styles.avisoTexto}>
            O Octapad usa áudio de baixa latência via navegador. No app nativo chega numa
            próxima fase — abra o Deep Scales no navegador pra tocar agora.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Octapad" showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {CATEGORIAS.map((categoria) => (
          <View key={categoria} style={styles.categoria}>
            <Text style={styles.categoriaTitulo}>{categoria}</Text>
            <View style={styles.grid}>
              {KIT_PADRAO.filter((p) => p.categoria === categoria).map((pad) => {
                const on = ativo === pad.id;
                return (
                  <Pressable
                    key={pad.id}
                    onPressIn={() => handlePad(pad.id)}
                    onPressOut={() => setAtivo((atual) => (atual === pad.id ? null : atual))}
                    style={[
                      styles.pad,
                      { borderColor: pad.cor },
                      on && { backgroundColor: pad.cor },
                    ]}
                  >
                    <View style={[styles.padPonto, { backgroundColor: on ? colors.textInverse : pad.cor }]} />
                    <Text style={[styles.padNome, on && styles.padNomeAtivo]}>{pad.nome}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <Text style={styles.dica}>Toque os pads. O som dispara no toque, sem lag.</Text>

        {/* Teaser dos recursos PRO (spec 03) — não bloqueia nada na v1. */}
        <View style={styles.proCard}>
          <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
          <View style={styles.proTexto}>
            <Text style={styles.proTitulo}>Seus samples e packs de sons</Text>
            <Text style={styles.proSub}>Suba seus próprios sons e presets — em breve.</Text>
          </View>
          <SeloPro />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  categoria: {
    gap: spacing.sm,
  },
  categoriaTitulo: {
    ...typography.h3,
    color: colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  pad: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.xl,
    borderWidth: 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  padPonto: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
  padNome: {
    ...typography.bodySmall,
    color: colors.text,
    fontFamily: fonts.semibold,
    textAlign: 'center',
  },
  padNomeAtivo: {
    color: colors.textInverse,
  },
  dica: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  proTexto: {
    flex: 1,
    gap: 2,
  },
  proTitulo: {
    ...typography.bodySmall,
    color: colors.text,
    fontFamily: fonts.semibold,
  },
  proSub: {
    ...typography.caption,
    color: colors.textMuted,
  },
  aviso: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  avisoTitulo: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  avisoTexto: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
