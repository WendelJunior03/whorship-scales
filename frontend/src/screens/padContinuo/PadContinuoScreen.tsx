import React, { useState } from 'react';
import { GestureResponderEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { usePadContinuo } from '@/hooks/usePadContinuo';
import { Note } from './padContinuoEngine';
import { NOTA_LABEL } from './notasLabel';
import { colors, fonts, radius, spacing, typography } from '@/theme';

/**
 * Barra de volume arrastável. Sem lib de slider no projeto — usa o sistema de toque
 * nativo do RN (`locationX`, relativo ao próprio elemento) em vez de medir posição na
 * tela, então não precisa de nenhuma dependência nova.
 */
function BarraVolume({ valor, onChange }: { valor: number; onChange: (v: number) => void }) {
  const [largura, setLargura] = useState(1); // evita divisão por zero antes do 1º layout

  function definirPelaPosicao(e: GestureResponderEvent) {
    const x = e.nativeEvent.locationX;
    const fracao = Math.min(1, Math.max(0, x / largura));
    onChange(fracao);
  }

  return (
    <View style={styles.volumeLinha}>
      <View
        style={styles.trilha}
        onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onResponderGrant={definirPelaPosicao}
        onResponderMove={definirPelaPosicao}
      >
        <View style={[styles.trilhaPreenchida, { width: `${valor * 100}%` }]} />
        <View style={[styles.bolinha, { left: `${valor * 100}%` }]} />
      </View>
      <Text style={styles.volumeTexto}>{Math.round(valor * 100)}%</Text>
    </View>
  );
}

export function PadContinuoScreen() {
  const { notas, ativos, alternar, volumeGeral, ajustarVolumeGeral } = usePadContinuo();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Pads Contínuos" subtitle="Banco de Pads" showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.aviso}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.avisoTexto}>Toque nos pads para iniciar/parar as notas contínuas.</Text>
        </View>

        <View style={styles.grid}>
          {notas.map((nota: Note) => {
            const on = ativos[nota];
            return (
              <TouchableOpacity
                key={nota}
                onPress={() => alternar(nota)}
                style={[styles.pad, on && styles.padAtivo]}
              >
                <Text style={[styles.padNota, on && styles.padTextoAtivo]}>{nota}</Text>
                <Text style={[styles.padLabel, on && styles.padTextoAtivo]}>{NOTA_LABEL[nota]}</Text>
                <Ionicons
                  name="pulse-outline"
                  size={16}
                  color={on ? colors.textInverse : colors.textMuted}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.secao}>Volume geral</Text>
        <BarraVolume valor={volumeGeral} onChange={ajustarVolumeGeral} />
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
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  avisoTexto: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  pad: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  padAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  padNota: {
    ...typography.h3,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  padLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  padTextoAtivo: {
    color: colors.textInverse,
  },
  secao: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
  },
  volumeLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  trilha: {
    flex: 1,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
  },
  trilhaPreenchida: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  bolinha: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    marginLeft: -9, // centraliza a bolinha em cima do ponto exato do valor
  },
  volumeTexto: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    width: 44,
    textAlign: 'right',
  },
});
