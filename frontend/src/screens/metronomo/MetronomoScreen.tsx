import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { RouteProp, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { useMetronomo } from '@/hooks/useMetronomo';
import { MainStackParamList } from '@/navigation/MainNavigator';
import { ConfigMetronomo, TIMBRES } from '@/audio/metronomo';
import { fonts, LARGURA_CONTEUDO, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

const BPM_MIN = 40;
const BPM_MAX = 240;
const COMPASSOS = [2, 3, 4, 5, 6];
const SUBDIVISOES = [
  { v: 1, nome: 'Semínima' },
  { v: 2, nome: 'Colcheias' },
  { v: 3, nome: 'Tercinas' },
  { v: 4, nome: 'Semicolc.' },
];
const VOLUMES = [
  { v: 0.5, nome: '50%' },
  { v: 0.75, nome: '75%' },
  { v: 1, nome: '100%' },
];

const clampBpm = (b: number) => Math.min(BPM_MAX, Math.max(BPM_MIN, b));

function Chip({ ativo, onPress, children }: { ativo: boolean; onPress: () => void; children: React.ReactNode }) {
  const styles = useThemedStyles(criarEstilos);
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, ativo && styles.chipAtivo]}>
      <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{children}</Text>
    </TouchableOpacity>
  );
}

export function MetronomoScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  // Pode ser aberto pela música (spec 10 × 08): inicia no BPM salvo dela.
  const route = useRoute<RouteProp<MainStackParamList, 'Metronomo'>>();
  const [bpm, setBpm] = useState(() => clampBpm(route.params?.bpm ?? 100));
  const [compasso, setCompasso] = useState(4);
  const [subdivisao, setSubdivisao] = useState(1);
  const [volume, setVolume] = useState(0.75);
  const [timbreId, setTimbreId] = useState(TIMBRES[0].id);

  const timbre = TIMBRES.find((t) => t.id === timbreId) ?? TIMBRES[0];
  const config = useMemo<ConfigMetronomo>(
    () => ({ bpm, compasso, subdivisao, volume, timbre }),
    [bpm, compasso, subdivisao, volume, timbre],
  );

  const { suportado, tocando, beatAtivo, alternar } = useMetronomo(config);

  // Tap tempo (T-10.5): estima o BPM pelos intervalos entre toques.
  const taps = useRef<number[]>([]);
  function tapTempo() {
    const agora = Date.now();
    const lista = taps.current;
    if (lista.length > 0 && agora - lista[lista.length - 1] > 2000) {
      lista.length = 0; // reinicia se demorou demais entre toques
    }
    lista.push(agora);
    if (lista.length > 6) {
      lista.shift();
    }
    if (lista.length >= 2) {
      const intervalos = lista.slice(1).map((t, i) => t - lista[i]);
      const media = intervalos.reduce((a, b) => a + b, 0) / intervalos.length;
      setBpm(clampBpm(Math.round(60000 / media)));
    }
  }

  const ajustar = (delta: number) => setBpm((b) => clampBpm(b + delta));

  if (!suportado) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <Header title="Metrônomo" showBack />
        <View style={styles.aviso}>
          <Icon name="timer-outline" size={44} color={colors.textMuted} />
          <Text style={styles.avisoTitulo}>Disponível na versão web</Text>
          <Text style={styles.avisoTexto}>
            O metrônomo usa áudio de tempo preciso via navegador. No app nativo chega numa
            próxima fase — abra o Worship Stage no navegador pra usar agora.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Metrônomo" showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pontos do compasso (acento no tempo 1) */}
        <View style={styles.dots}>
          {Array.from({ length: compasso }).map((_, i) => {
            const on = i === beatAtivo;
            const acento = i === 0;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  acento && styles.dotAcento,
                  on && (acento ? styles.dotOnAcento : styles.dotOn),
                ]}
              />
            );
          })}
        </View>

        {/* BPM */}
        <View style={styles.bpmBloco}>
          <Text style={styles.bpmValor}>{bpm}</Text>
          <Text style={styles.bpmLabel}>BPM</Text>
        </View>

        <View style={styles.steppers}>
          <TouchableOpacity style={styles.step} onPress={() => ajustar(-5)}>
            <Text style={styles.stepTexto}>−5</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.step} onPress={() => ajustar(-1)}>
            <Text style={styles.stepTexto}>−1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.step} onPress={() => ajustar(1)}>
            <Text style={styles.stepTexto}>+1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.step} onPress={() => ajustar(5)}>
            <Text style={styles.stepTexto}>+5</Text>
          </TouchableOpacity>
        </View>

        {/* Play/Stop + Tap */}
        <View style={styles.acoes}>
          <Pressable
            onPress={alternar}
            style={[styles.play, tocando && styles.playAtivo]}
          >
            <Icon name={tocando ? 'stop' : 'play'} size={30} color={colors.textInverse} />
            <Text style={styles.playTexto}>{tocando ? 'Parar' : 'Iniciar'}</Text>
          </Pressable>
          <TouchableOpacity style={styles.tap} onPress={tapTempo}>
            <Icon name="hand-left-outline" size={20} color={colors.primary} />
            <Text style={styles.tapTexto}>Tap tempo</Text>
          </TouchableOpacity>
        </View>

        {/* Compasso */}
        <Text style={styles.secao}>Compasso</Text>
        <View style={styles.linha}>
          {COMPASSOS.map((c) => (
            <Chip key={c} ativo={c === compasso} onPress={() => setCompasso(c)}>
              {c}/4
            </Chip>
          ))}
        </View>

        {/* Subdivisão */}
        <Text style={styles.secao}>Subdivisão</Text>
        <View style={styles.linha}>
          {SUBDIVISOES.map((s) => (
            <Chip key={s.v} ativo={s.v === subdivisao} onPress={() => setSubdivisao(s.v)}>
              {s.nome}
            </Chip>
          ))}
        </View>

        {/* Timbre */}
        <Text style={styles.secao}>Timbre</Text>
        <View style={styles.linha}>
          {TIMBRES.map((t) => (
            <Chip key={t.id} ativo={t.id === timbreId} onPress={() => setTimbreId(t.id)}>
              {t.nome}
            </Chip>
          ))}
        </View>

        {/* Volume */}
        <Text style={styles.secao}>Volume</Text>
        <View style={styles.linha}>
          {VOLUMES.map((vol) => (
            <Chip key={vol.v} ativo={vol.v === volume} onPress={() => setVolume(vol.v)}>
              {vol.nome}
            </Chip>
          ))}
        </View>

        <Text style={styles.dica}>
          A tela fica acesa enquanto o metrônomo toca. Em segundo plano, o áudio depende do
          dispositivo.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
    maxWidth: LARGURA_CONTEUDO,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dotAcento: {
    borderColor: colors.primary,
  },
  dotOn: {
    backgroundColor: colors.primaryLight,
    transform: [{ scale: 1.25 }],
  },
  dotOnAcento: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.35 }],
  },
  bpmBloco: {
    alignItems: 'center',
  },
  bpmValor: {
    fontFamily: fonts.bold,
    fontSize: 72,
    color: colors.text,
  },
  bpmLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
  },
  steppers: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  step: {
    width: 56,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  stepTexto: {
    ...typography.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  acoes: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  play: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  playAtivo: {
    backgroundColor: colors.error,
  },
  playTexto: {
    ...typography.body,
    fontFamily: fonts.bold,
    color: colors.textInverse,
  },
  tap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tapTexto: {
    ...typography.bodySmall,
    color: colors.primary,
    fontFamily: fonts.semibold,
  },
  secao: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    marginTop: spacing.sm,
  },
  linha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipTexto: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  chipTextoAtivo: {
    color: colors.primary,
    fontFamily: fonts.semibold,
  },
  dica: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
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
