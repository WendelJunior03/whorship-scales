import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SeloPro } from '@/components/SeloPro';
import { useOctapad } from '@/hooks/useOctapad';
import { CATEGORIAS, KIT_PADRAO } from '@/audio/kits';
import { fonts, radius, spacing, typography } from '@/theme';
import { dark } from '@/theme/dark';

function vibrar() {
  const g = globalThis as unknown as { navigator?: { vibrate?: (ms: number) => void } };
  g.navigator?.vibrate?.(8);
}

// Fader horizontal (o toque define o valor pela posição). Protótipo do controle "pro".
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
  const { suportado, tocar } = useOctapad();
  const [ativo, setAtivo] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.85);

  function handlePad(id: string) {
    tocar(id, volume);
    if (Platform.OS === 'web') {
      vibrar();
    }
    setAtivo(id);
  }

  return (
    <View style={styles.raiz}>
      <LinearGradient colors={dark.bgGradient} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
            {CATEGORIAS.map((categoria) => (
              <View key={categoria} style={styles.grupo}>
                <Text style={styles.grupoTitulo}>{categoria.toUpperCase()}</Text>
                <View style={styles.grid}>
                  {KIT_PADRAO.filter((p) => p.categoria === categoria).map((pad) => {
                    const on = ativo === pad.id;
                    return (
                      <Pressable
                        key={pad.id}
                        onPressIn={() => handlePad(pad.id)}
                        onPressOut={() => setAtivo((a) => (a === pad.id ? null : a))}
                        style={[
                          styles.pad,
                          on && {
                            borderColor: pad.cor,
                            backgroundColor: dark.surfaceStrong,
                            shadowColor: pad.cor,
                          },
                          on && styles.padGlow,
                        ]}
                      >
                        <View style={[styles.padDot, { backgroundColor: pad.cor }]} />
                        <Text style={styles.padNome}>{pad.nome}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}

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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: dark.bg },
  safe: { flex: 1 },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  voltar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  marca: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  marcaBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontFamily: fonts.bold, fontSize: 18, color: dark.text },
  subtitulo: { ...typography.caption, color: dark.textMuted },
  conteudo: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
  grupo: { gap: spacing.sm },
  grupoTitulo: {
    ...typography.caption,
    color: dark.textMuted,
    fontFamily: fonts.semibold,
    letterSpacing: 1.5,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm },
  pad: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: dark.border,
    backgroundColor: dark.surface,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  padGlow: {
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  padDot: { width: 12, height: 12, borderRadius: radius.pill },
  padNome: { ...typography.bodySmall, color: dark.text, fontFamily: fonts.semibold },
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
  faderBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: dark.surface,
  },
  faderFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: dark.primary,
  },
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
