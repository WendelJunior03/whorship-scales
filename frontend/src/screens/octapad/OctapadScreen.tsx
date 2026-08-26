import React, { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { MainStackParamList } from '@/navigation/MainNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { BarraDeslizante } from '@/components/BarraDeslizante';
import { Card } from '@/components/Card';
import { SeloPro } from '@/components/SeloPro';
import { useOctapad } from '@/hooks/useOctapad';
import { useOctapadAparencia } from '@/hooks/useOctapadAparencia';
import { KIT_PADRAO, PadDef } from '@/audio/kits';
import { PainelPersonalizarOctapad } from './PainelPersonalizarOctapad';
import { hexParaRgba } from '@/utils/cor';
import { fonts, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

// Coluna do instrumento centralizada e com largura máxima (não estica no desktop).
const MAX_LARGURA = 760;
// A partir daqui vira 4 colunas (layout landscape do octapad real): iPad/desktop.
const BREAKPOINT_LARGO = 640;
const PAD_GAP = spacing.sm;

// Gradientes que dão o aspecto de BORRACHA abaulada (domo): topo com leve brilho,
// base bem escura. Ao afundar, escurece/achata.
const BORRACHA = ['#343A45', '#181B21'] as const;
const BORRACHA_AFUNDADA = ['#1B1E25', '#0D0F14'] as const;
// Faixa de opacidade do flash de destaque ao tocar, conforme o brilho (nunca zero, nunca ofusca).
const ALPHA_DESTAQUE_MIN = 0.15;
const ALPHA_DESTAQUE_MAX = 0.45;

function vibrar() {
  const g = globalThis as unknown as { navigator?: { vibrate?: (ms: number) => void } };
  g.navigator?.vibrate?.(8);
}

interface PadProps {
  pad: PadDef;
  nome: string;
  size: number;
  onHit: (id: string) => void;
  corDestaque: string;
  brilho: number;
}

function Pad({ pad, nome, size, onHit, corDestaque, brilho }: PadProps) {
  const styles = useThemedStyles(criarEstilos);
  const alphaDestaque = ALPHA_DESTAQUE_MIN + brilho * (ALPHA_DESTAQUE_MAX - ALPHA_DESTAQUE_MIN);
  return (
    <Pressable style={[styles.padCelula, { width: size }]} onPressIn={() => onHit(pad.id)}>
      {({ pressed }) => (
        <View style={[styles.padCorpo, pressed ? styles.padCorpoAfundado : styles.padCorpoRaised]}>
          <LinearGradient
            colors={pressed ? BORRACHA_AFUNDADA : BORRACHA}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {pressed && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: hexParaRgba(corDestaque, alphaDestaque) }]} />
          )}
          <View style={styles.brilho} />
          <View
            style={[
              styles.led,
              pressed && {
                backgroundColor: corDestaque,
                shadowColor: corDestaque,
                shadowOpacity: 0.5 + brilho * 0.4,
              },
            ]}
          />
          <Text style={[styles.padNome, pressed && { color: corDestaque }]} numberOfLines={1}>
            {nome}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

type Nav = StackNavigationProp<MainStackParamList, 'Octapad'>;

export function OctapadScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const navigation = useNavigation<Nav>();
  const { aparencia, definirCorPad, definirNomePad, ajustarBrilho, restaurarPadrao, recarregar } = useOctapadAparencia();
  const { suportado, tocar } = useOctapad(aparencia.somPads);
  const [volume, setVolume] = useState(0.85);
  const [gridLargura, setGridLargura] = useState(0);
  const [painelAberto, setPainelAberto] = useState(false);

  // A Biblioteca de Drums (tela separada) grava o som escolhido direto no storage — recarrega
  // ao voltar pra essa tela pra refletir a troca (instância de hook diferente da de lá).
  useFocusEffect(
    useCallback(() => {
      recarregar();
    }, [recarregar]),
  );

  const { width } = useWindowDimensions();
  const colunas = width >= BREAKPOINT_LARGO ? 4 : 2;
  const padSize = gridLargura > 0 ? (gridLargura - PAD_GAP * (colunas - 1)) / colunas : 0;

  function handlePad(id: string) {
    tocar(id, volume);
    if (Platform.OS === 'web') {
      vibrar();
    }
  }

  return (
    <View style={styles.raiz}>
      <LinearGradient colors={colors.bgGradient} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <Header
            title="Octapad"
            subtitle="Bateria eletrônica"
            showBack
            rightIcon={suportado ? 'settings-outline' : undefined}
            rightIconLabel="Personalizar aparência do octapad"
            onRightPress={() => setPainelAberto(true)}
          />

          {!suportado ? (
            <View style={styles.aviso}>
              <Icon name="musical-notes-outline" size={44} color={colors.textMuted} />
              <Text style={styles.avisoTitulo}>Disponível na versão web</Text>
              <Text style={styles.avisoTexto}>
                O Octapad usa áudio de baixa latência via navegador. Abra o Worship Stage no
                navegador pra tocar.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
              <View style={styles.chassi}>
                <View
                  style={styles.grid}
                  onLayout={(e) => setGridLargura(e.nativeEvent.layout.width)}
                >
                  {padSize > 0 &&
                    KIT_PADRAO.map((pad) => (
                      <Pad
                        key={pad.id}
                        pad={pad}
                        nome={aparencia.nomesPads[pad.id] ?? pad.nome}
                        size={padSize}
                        onHit={handlePad}
                        corDestaque={aparencia.coresPads[pad.id] ?? pad.cor}
                        brilho={aparencia.brilho}
                      />
                    ))}
                </View>
              </View>

              <Card style={styles.proCard} onPress={() => navigation.navigate('BibliotecaDrums')}>
                <Icon name="library-outline" size={20} color={colors.primaryLight} />
                <View style={styles.proTexto}>
                  <Text style={styles.proTitulo}>Biblioteca de Drums</Text>
                  <Text style={styles.proSub}>58 sons prontos pra personalizar seus pads.</Text>
                </View>
                <SeloPro />
              </Card>

              <Card style={styles.proCard}>
                <Icon name="cloud-upload-outline" size={20} color={colors.primaryLight} />
                <View style={styles.proTexto}>
                  <Text style={styles.proTitulo}>Seus samples e packs de sons</Text>
                  <Text style={styles.proSub}>Suba seus próprios sons e presets — em breve.</Text>
                </View>
                <SeloPro />
              </Card>

              <Text style={styles.secao}>Volume geral</Text>
              <View style={styles.volumeLinha}>
                <BarraDeslizante
                  valor={volume}
                  onChange={setVolume}
                  corPreenchida={colors.primary}
                  corBolinha={colors.primary}
                />
                <Text style={styles.volumeTexto}>{Math.round(volume * 100)}%</Text>
              </View>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>

      <PainelPersonalizarOctapad
        visible={painelAberto}
        onClose={() => setPainelAberto(false)}
        aparencia={aparencia}
        definirCorPad={definirCorPad}
        definirNomePad={definirNomePad}
        ajustarBrilho={ajustarBrilho}
        restaurarPadrao={restaurarPadrao}
      />
    </View>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  raiz: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  container: { flex: 1, width: '100%', maxWidth: MAX_LARGURA, alignSelf: 'center' },
  conteudo: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },

  chassi: {
    backgroundColor: '#0A0D12',
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: '#05070A',
    padding: spacing.sm,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: PAD_GAP },
  padCelula: { aspectRatio: 1.02 },
  padCorpo: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#05070A',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.md,
  },
  padCorpoRaised: {
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  padCorpoAfundado: {
    transform: [{ scale: 0.965 }],
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  brilho: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.07)' },
  led: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    width: 34,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#0D0F13',
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  padNome: { ...typography.caption, color: colors.textMuted, fontFamily: fonts.semibold, letterSpacing: 0.5 },

  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.xl,
  },
  proTexto: { flex: 1, gap: 2 },
  proTitulo: { ...typography.bodySmall, color: colors.text, fontFamily: fonts.semibold },
  proSub: { ...typography.caption, color: colors.textMuted },

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
  volumeTexto: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    width: 44,
    textAlign: 'right',
  },
  aviso: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  avisoTitulo: { ...typography.h3, color: colors.text, textAlign: 'center' },
  avisoTexto: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
});
