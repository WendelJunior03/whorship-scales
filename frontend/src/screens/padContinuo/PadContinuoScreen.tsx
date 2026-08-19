import React, { useState } from 'react';
import { GestureResponderEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { usePadContinuo } from '@/hooks/usePadContinuo';
import { Note } from './padContinuoEngine';
import { NOTA_LABEL } from './notasLabel';
import { colors, fonts, radius, spacing, typography } from '@/theme';

// Coluna centralizada com largura máxima (não estica no desktop/PWA).
const MAX_LARGURA = 640;
// Cor que enche o pad SÓ quando está tocando (idle = escuro liso, sem glow).
const ATIVO = '#14B8A6'; // ciano/teal
const ATIVO_CLARO = '#2DD4BF';

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
        <View style={styles.container}>
          <View style={styles.aviso}>
            <Icon name="information-circle-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.avisoTexto}>Toque nos pads para iniciar/parar as notas contínuas.</Text>
          </View>

          <View style={styles.grid}>
            {notas.map((nota: Note) => {
              const on = ativos[nota];
              return (
                <TouchableOpacity
                  key={nota}
                  activeOpacity={0.9}
                  onPress={() => alternar(nota)}
                  style={[styles.pad, on && styles.padAtivo]}
                >
                  <View style={[styles.led, on && styles.ledOn]} />
                  <Text style={[styles.padNota, on && styles.padNotaAtiva]}>{nota}</Text>
                  <Text style={[styles.padLabel, on && styles.padLabelAtiva]}>{NOTA_LABEL[nota]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.secao}>Volume geral</Text>
          <BarraVolume valor={volumeGeral} onChange={ajustarVolumeGeral} />
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
  },
  container: {
    width: '100%',
    maxWidth: MAX_LARGURA,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
  // Idle: escuro liso, sem glow.
  pad: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  // Ao tocar: enche com a cor "por cima".
  padAtivo: {
    backgroundColor: ATIVO,
    borderColor: ATIVO_CLARO,
  },
  led: {
    position: 'absolute',
    top: 7,
    left: 7,
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  ledOn: {
    backgroundColor: colors.textInverse,
  },
  padNota: {
    ...typography.h3,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  padNotaAtiva: {
    color: colors.textInverse,
  },
  padLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  padLabelAtiva: {
    color: 'rgba(255,255,255,0.85)',
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
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
  },
  trilhaPreenchida: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.pill,
    backgroundColor: ATIVO,
  },
  bolinha: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: ATIVO_CLARO,
    borderWidth: 2,
    borderColor: colors.background,
    marginLeft: -9,
  },
  volumeTexto: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    width: 44,
    textAlign: 'right',
  },
});
