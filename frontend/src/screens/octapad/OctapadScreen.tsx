import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SeloPro } from '@/components/SeloPro';
import { useOctapad } from '@/hooks/useOctapad';
import { KIT_PADRAO, PadDef } from '@/audio/kits';
import { fonts, radius, spacing, typography } from '@/theme';
import { dark } from '@/theme/dark';

// Coluna do instrumento centralizada e com largura máxima (não estica no desktop).
const MAX_LARGURA = 760;
// A partir daqui vira 4 colunas (layout landscape do octapad real): iPad/desktop.
const BREAKPOINT_LARGO = 640;
const PAD_GAP = spacing.sm;

// Gradientes que dão o aspecto de BORRACHA abaulada (domo): topo com leve brilho,
// base bem escura. Ao afundar, escurece/achata.
const BORRACHA = ['#343A45', '#181B21'] as const;
const BORRACHA_AFUNDADA = ['#1B1E25', '#0D0F14'] as const;

function vibrar() {
  const g = globalThis as unknown as { navigator?: { vibrate?: (ms: number) => void } };
  g.navigator?.vibrate?.(8);
}

function Pad({ pad, size, onHit }: { pad: PadDef; size: number; onHit: (id: string) => void }) {
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
          <View style={styles.brilho} />
          <View
            style={[
              styles.led,
              pressed && { backgroundColor: pad.cor, shadowColor: pad.cor, shadowOpacity: 0.9 },
            ]}
          />
          <Text style={[styles.padNome, pressed && { color: pad.cor }]}>{pad.nome}</Text>
        </View>
      )}
    </Pressable>
  );
}

function Fader({ valor, onChange }: { valor: number; onChange: (v: number) => void }) {
  const [largura, setLargura] = useState(0);
  return (
    <Pressable
      style={styles.faderTrack}
      onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
      onPress={(e) => {
        if (largura > 0) {
          onChange(Math.max(0, Math.min(1, e.nativeEvent.locationX / largura)));
        }
      }}
    >
      <View style={styles.faderBar} />
      <View style={[styles.faderFill, { width: `${valor * 100}%` }]} />
      <View style={[styles.faderThumb, { left: `${valor * 100}%` }]} />
    </Pressable>
  );
}

export function OctapadScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { suportado, tocar } = useOctapad();
  const [volume, setVolume] = useState(0.85);
  const [gridLargura, setGridLargura] = useState(0);

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
      <LinearGradient colors={dark.bgGradient} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.topo}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.voltar}>
              <Ionicons name="chevron-back" size={22} color={dark.text} />
            </Pressable>
            <View style={styles.marca}>
              <LinearGradient
                colors={[dark.primaryStrong, dark.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.marcaBadge}
              >
                <Ionicons name="grid" size={16} color={dark.textInverse} />
              </LinearGradient>
              <View>
                <Text style={styles.titulo}>Octapad</Text>
                <Text style={styles.subtitulo}>Bateria eletrônica</Text>
              </View>
            </View>
            <View style={styles.voltar} />
          </View>

          {!suportado ? (
            <View style={styles.aviso}>
              <Ionicons name="musical-notes-outline" size={44} color={dark.textMuted} />
              <Text style={styles.avisoTitulo}>Disponível na versão web</Text>
              <Text style={styles.avisoTexto}>
                O Octapad usa áudio de baixa latência via navegador. Abra o Deep Scales no
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
                      <Pad key={pad.id} pad={pad} size={padSize} onHit={handlePad} />
                    ))}
                </View>
              </View>

              <View style={styles.proCard}>
                <Ionicons name="cloud-upload-outline" size={20} color={dark.primaryStrong} />
                <View style={styles.proTexto}>
                  <Text style={styles.proTitulo}>Seus samples e packs de sons</Text>
                  <Text style={styles.proSub}>Suba seus próprios sons e presets — em breve.</Text>
                </View>
                <SeloPro />
              </View>
            </ScrollView>
          )}

          {suportado && (
            <View style={styles.master}>
              <Ionicons name="volume-medium" size={18} color={dark.textSecondary} />
              <Fader valor={volume} onChange={setVolume} />
              <Text style={styles.masterPct}>{Math.round(volume * 100)}%</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: dark.bg },
  safe: { flex: 1 },
  container: { flex: 1, width: '100%', maxWidth: MAX_LARGURA, alignSelf: 'center' },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  voltar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  marca: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  marcaBadge: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: fonts.bold, fontSize: 18, color: dark.text },
  subtitulo: { ...typography.caption, color: dark.textMuted },
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
  padNome: { ...typography.caption, color: dark.textMuted, fontFamily: fonts.semibold, letterSpacing: 0.5 },

  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: dark.panel,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: dark.border,
    padding: spacing.md,
  },
  proTexto: { flex: 1, gap: 2 },
  proTitulo: { ...typography.bodySmall, color: dark.text, fontFamily: fonts.semibold },
  proSub: { ...typography.caption, color: dark.textMuted },

  master: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: dark.border,
    backgroundColor: dark.panel,
  },
  faderTrack: { flex: 1, height: 28, justifyContent: 'center' },
  faderBar: { position: 'absolute', left: 0, right: 0, height: 6, borderRadius: radius.pill, backgroundColor: dark.surface },
  faderFill: { position: 'absolute', left: 0, height: 6, borderRadius: radius.pill, backgroundColor: dark.primary },
  faderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    marginLeft: -10,
    borderRadius: radius.pill,
    backgroundColor: dark.primaryStrong,
    borderWidth: 3,
    borderColor: dark.bg,
  },
  masterPct: { ...typography.bodySmall, color: dark.textSecondary, width: 44, textAlign: 'right' },
  aviso: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  avisoTitulo: { ...typography.h3, color: dark.text, textAlign: 'center' },
  avisoTexto: { ...typography.bodySmall, color: dark.textSecondary, textAlign: 'center' },
});
