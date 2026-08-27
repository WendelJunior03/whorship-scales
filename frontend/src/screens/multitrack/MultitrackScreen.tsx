import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { BarraDeslizante } from '@/components/BarraDeslizante';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useMultitrack } from '@/audio/multitrack/useMultitrack';
import { spacing, radius, typography, fonts } from '@/theme';
import { Cores } from '@/theme/palettes';

const SEMITONS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function formatarTempo(seg: number): string {
  if (!Number.isFinite(seg) || seg < 0) seg = 0;
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Abre o seletor de arquivos do navegador e resolve com os arquivos escolhidos. */
function escolherArquivos(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'audio/*,.wav,.mp3,.m4a,.ogg';
    input.onchange = () => resolve(input.files ? Array.from(input.files) : []);
    input.click();
  });
}

export function MultitrackScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const mt = useMultitrack();

  const [nomeMusica, setNomeMusica] = useState('');
  const [artista, setArtista] = useState('');
  const [bpm, setBpm] = useState('');
  const [tomIndex, setTomIndex] = useState(0);
  const dropRef = useRef<View>(null);

  const suportado = Platform.OS === 'web';

  // Drag & drop (web) na área de soltar.
  useEffect(() => {
    if (!suportado) return;
    const el = dropRef.current as unknown as HTMLElement | null;
    if (!el) return;
    const prevenir = (e: Event) => e.preventDefault();
    const soltar = (e: DragEvent) => {
      e.preventDefault();
      const arquivos = Array.from(e.dataTransfer?.files ?? []).filter(
        (f) => f.type.startsWith('audio') || /\.(wav|mp3|m4a|ogg)$/i.test(f.name),
      );
      if (arquivos.length) mt.adicionarArquivos(arquivos);
    };
    el.addEventListener('dragover', prevenir);
    el.addEventListener('drop', soltar);
    return () => {
      el.removeEventListener('dragover', prevenir);
      el.removeEventListener('drop', soltar);
    };
  }, [suportado, mt]);

  async function abrirSeletor() {
    const arquivos = await escolherArquivos();
    if (arquivos.length) mt.adicionarArquivos(arquivos);
  }

  const frac = mt.duracao > 0 ? mt.posicao / mt.duracao : 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Multitrack / VS" subtitle="Player de multitracks" showBack />

      {!suportado ? (
        <View style={styles.aviso}>
          <Icon name="musical-notes-outline" size={44} color={colors.textMuted} />
          <Text style={styles.avisoTitulo}>Disponível na versão web</Text>
          <Text style={styles.avisoTexto}>
            O Multitrack usa a Web Audio API do navegador. Abra o Worship Stage no navegador
            (computador) para usar.
          </Text>
        </View>
      ) : mt.faixas.length === 0 ? (
        // Área de carregamento
        <View style={styles.centro}>
          <Pressable ref={dropRef} style={styles.dropzone} onPress={abrirSeletor}>
            <Icon name="upload-outline" size={40} color={colors.primary} />
            <Text style={styles.dropTitulo}>Arraste suas faixas aqui</Text>
            <Text style={styles.dropSub}>ou</Text>
            <View style={styles.dropBtn}>
              <Text style={styles.dropBtnTexto}>Selecionar arquivos</Text>
            </View>
            <Text style={styles.dropFormatos}>WAV, MP3, M4A, OGG</Text>
          </Pressable>
          {mt.carregando && <Text style={styles.carregando}>Carregando faixas…</Text>}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
          {/* Cabeçalho: nome/artista opcionais */}
          <TextInput
            value={nomeMusica}
            onChangeText={setNomeMusica}
            placeholder="Nome da música"
            placeholderTextColor={colors.textMuted}
            style={styles.tituloInput}
          />
          <TextInput
            value={artista}
            onChangeText={setArtista}
            placeholder="Artista"
            placeholderTextColor={colors.textMuted}
            style={styles.artistaInput}
          />

          {/* Faixas */}
          <View style={styles.faixas}>
            {mt.faixas.map((f) => {
              const carregandoFaixa = f.buffer === null;
              return (
                <Card key={f.id} style={styles.faixa}>
                  <Text style={styles.faixaEmoji}>{f.emoji}</Text>
                  <View style={styles.faixaInfo}>
                    <Text style={styles.faixaNome} numberOfLines={1}>
                      {f.nome}
                      {carregandoFaixa ? ' · carregando…' : ''}
                    </Text>
                    <BarraDeslizante
                      valor={f.volume}
                      onChange={(v) => mt.setVolume(f.id, v)}
                      corPreenchida={f.mudo ? colors.textMuted : colors.primary}
                      corBolinha={colors.primary}
                    />
                  </View>
                  <TouchableOpacity onPress={() => mt.toggleMudo(f.id)} hitSlop={6} style={styles.faixaBtn}>
                    <Icon
                      name={f.mudo ? 'volume-mute-outline' : 'volume-high-outline'}
                      size={20}
                      color={f.mudo ? colors.textMuted : colors.text}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => mt.toggleSolo(f.id)} hitSlop={6} style={[styles.solo, f.solo && styles.soloAtivo]}>
                    <Text style={[styles.soloTexto, f.solo && styles.soloTextoAtivo]}>S</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => mt.removerFaixa(f.id)} hitSlop={6} style={styles.faixaBtn}>
                    <Icon name="trash-outline" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </Card>
              );
            })}
          </View>

          {/* Tom e BPM */}
          <View style={styles.tomBpm}>
            <View style={styles.tomBox}>
              <Text style={styles.tomLabel}>Tom</Text>
              <View style={styles.tomControle}>
                <TouchableOpacity style={styles.tomBtn} onPress={() => setTomIndex((i) => (i + 11) % 12)}>
                  <Text style={styles.tomBtnTexto}>−</Text>
                </TouchableOpacity>
                <Text style={styles.tomValor}>{SEMITONS[tomIndex]}</Text>
                <TouchableOpacity style={styles.tomBtn} onPress={() => setTomIndex((i) => (i + 1) % 12)}>
                  <Text style={styles.tomBtnTexto}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.tomNota}>transposição de áudio: em breve</Text>
            </View>
            <View style={styles.bpmBox}>
              <Text style={styles.tomLabel}>BPM</Text>
              <TextInput
                value={bpm}
                onChangeText={(t) => setBpm(t.replace(/\D/g, '').slice(0, 3))}
                placeholder="—"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                style={styles.bpmInput}
              />
            </View>
          </View>

          {/* Transporte */}
          <View style={styles.transporte}>
            <TouchableOpacity onPress={() => mt.seek(mt.posicao - 10)} hitSlop={8} style={styles.transBtn}>
              <Icon name="play-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => (mt.tocando ? mt.pause() : mt.play())}
              style={styles.playBtn}
              accessibilityLabel={mt.tocando ? 'Pausar' : 'Tocar'}
            >
              <Icon name={mt.tocando ? 'pause' : 'play'} size={26} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => mt.seek(mt.posicao + 10)} hitSlop={8} style={styles.transBtn}>
              <Icon name="play-forward" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={mt.stop} hitSlop={8} style={styles.transBtn}>
              <Icon name="stop" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Progresso */}
          <View style={styles.progresso}>
            <Text style={styles.tempo}>{formatarTempo(mt.posicao)}</Text>
            <View style={styles.progressoBarra}>
              <BarraDeslizante
                valor={frac}
                onChange={(v) => mt.seek(v * mt.duracao)}
                corPreenchida={colors.primary}
                corBolinha={colors.primary}
              />
            </View>
            <Text style={styles.tempo}>{formatarTempo(mt.duracao)}</Text>
          </View>

          <TouchableOpacity style={styles.adicionar} onPress={abrirSeletor}>
            <Icon name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.adicionarTexto}>Adicionar faixas</Text>
          </TouchableOpacity>
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    aviso: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
    avisoTitulo: { ...typography.h3, color: colors.text },
    avisoTexto: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },

    centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
    dropzone: {
      width: '100%', maxWidth: 520, alignItems: 'center', gap: spacing.sm,
      paddingVertical: spacing.xl, paddingHorizontal: spacing.lg,
      borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', borderRadius: radius.xl,
      backgroundColor: colors.surface,
    },
    dropTitulo: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
    dropSub: { ...typography.caption, color: colors.textMuted },
    dropBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
    dropBtnTexto: { ...typography.body, color: colors.textInverse, fontFamily: fonts.semibold },
    dropFormatos: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
    carregando: { ...typography.bodySmall, color: colors.textSecondary },

    conteudo: { padding: spacing.lg, gap: spacing.sm, maxWidth: 720, width: '100%', alignSelf: 'center' },
    tituloInput: { ...typography.h2, color: colors.text, padding: 0 },
    artistaInput: { ...typography.body, color: colors.textSecondary, padding: 0, marginBottom: spacing.sm },

    faixas: { gap: spacing.sm },
    faixa: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
    faixaEmoji: { fontSize: 22 },
    faixaInfo: { flex: 1, gap: spacing.xs },
    faixaNome: { ...typography.bodySmall, color: colors.text, fontFamily: fonts.semibold },
    faixaBtn: { padding: spacing.xs },
    solo: {
      width: 30, height: 30, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: colors.border,
    },
    soloAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
    soloTexto: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.bold },
    soloTextoAtivo: { color: colors.textInverse },

    tomBpm: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    tomBox: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, alignItems: 'center' },
    bpmBox: { width: 120, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, alignItems: 'center' },
    tomLabel: { ...typography.caption, color: colors.textSecondary },
    tomControle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    tomBtn: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
    tomBtnTexto: { ...typography.h3, color: colors.primary },
    tomValor: { ...typography.h2, color: colors.text, minWidth: 40, textAlign: 'center' },
    tomNota: { ...typography.caption, color: colors.textMuted, fontSize: 10 },
    bpmInput: { ...typography.h2, color: colors.text, textAlign: 'center', minWidth: 60, padding: 0 },

    transporte: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.md },
    transBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    playBtn: {
      width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
    },

    progresso: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
    progressoBarra: { flex: 1 },
    tempo: { ...typography.caption, color: colors.textSecondary, minWidth: 40, textAlign: 'center' },

    adicionar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.lg },
    adicionarTexto: { ...typography.body, color: colors.primary, fontFamily: fonts.semibold },
  });
