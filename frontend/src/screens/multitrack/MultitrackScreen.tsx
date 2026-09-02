import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { LogoCarregando } from '@/components/LogoCarregando';
import { Waveform } from './Waveform';
import { SliderFaixa } from './SliderFaixa';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useMultitrack } from '@/audio/multitrack/useMultitrack';
import * as projetoStore from '@/audio/multitrack/projetoStore';
import type { ProjetoMeta } from '@/audio/multitrack/projetoStore';
import { confirmAction, notifyAction } from '@/utils/confirm';
import { spacing, radius, typography, fonts } from '@/theme';
import { Cores } from '@/theme/palettes';

const SEMITONS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Paleta discreta de cores por faixa (accent do usuário, não do tema).
const PALETA = ['#EF4444', '#F59E0B', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899'];

function formatarTempo(seg: number): string {
  if (!Number.isFinite(seg) || seg < 0) seg = 0;
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatarTamanho(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

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
  const { width } = useWindowDimensions();
  const mt = useMultitrack();

  const [bpm, setBpm] = useState('');
  const [tomIndex, setTomIndex] = useState(0);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [projetos, setProjetos] = useState<ProjetoMeta[]>([]);
  const [modalSalvar, setModalSalvar] = useState(false);
  const [nomeProjeto, setNomeProjeto] = useState('');
  const dropRef = useRef<View>(null);

  const suportado = Platform.OS === 'web';
  const duasColunas = width >= 720;
  const editando = editandoId ? mt.faixas.find((f) => f.id === editandoId) ?? null : null;
  const semFaixas = mt.faixas.length === 0;

  // Carrega a lista de projetos salvos (na tela inicial / após limpar).
  useEffect(() => {
    if (!suportado || !semFaixas) return;
    projetoStore.listarProjetos().then(setProjetos).catch(() => setProjetos([]));
  }, [suportado, semFaixas]);

  async function abrirProjeto(meta: ProjetoMeta) {
    try {
      await mt.restaurarProjeto(meta);
    } catch {
      notifyAction('Erro', 'Não foi possível reabrir o projeto.');
    }
  }

  function apagarProjeto(meta: ProjetoMeta) {
    confirmAction(
      { title: 'Apagar projeto', message: `Apagar "${meta.nome}" deste dispositivo?`, confirmLabel: 'Apagar', destructive: true },
      async () => {
        await projetoStore.apagarProjeto(meta.id);
        setProjetos(await projetoStore.listarProjetos());
      },
    );
  }

  async function salvar() {
    setModalSalvar(false);
    try {
      const { meta, tamanhoOriginal } = await mt.salvarProjeto(nomeProjeto);
      const economia =
        tamanhoOriginal > meta.tamanho
          ? ` (${formatarTamanho(tamanhoOriginal)} → ${formatarTamanho(meta.tamanho)})`
          : '';
      notifyAction('Salvo', `Projeto salvo neste navegador${economia}. Reabra por aqui quando voltar.`);
    } catch {
      notifyAction('Erro', 'Não foi possível salvar (espaço do navegador cheio?).');
    }
  }

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
      ) : mt.carregando || mt.salvando ? (
        <View style={styles.centroFull}>
          <LogoCarregando texto={mt.salvando ? 'Comprimindo e salvando…' : 'Carregando faixas…'} />
        </View>
      ) : semFaixas ? (
        <ScrollView contentContainerStyle={styles.centro}>
          <Pressable ref={dropRef} style={styles.dropzone} onPress={abrirSeletor}>
            <Icon name="upload-outline" size={40} color={colors.primary} />
            <Text style={styles.dropTitulo}>Arraste suas faixas aqui</Text>
            <Text style={styles.dropSub}>ou</Text>
            <View style={styles.dropBtn}>
              <Text style={styles.dropBtnTexto}>Selecionar arquivos</Text>
            </View>
            <Text style={styles.dropFormatos}>WAV, MP3, M4A, OGG</Text>
          </Pressable>

          {projetos.length > 0 && (
            <View style={styles.projetos}>
              <Text style={styles.projetosTitulo}>Projetos salvos neste navegador</Text>
              {projetos.map((p) => (
                <Card key={p.id} style={styles.projeto}>
                  <TouchableOpacity style={styles.projetoInfo} onPress={() => abrirProjeto(p)}>
                    <Icon name="folder-outline" size={20} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.projetoNome} numberOfLines={1}>{p.nome}</Text>
                      <Text style={styles.projetoMeta}>
                        {p.faixas.length} faixa{p.faixas.length === 1 ? '' : 's'} · {formatarTamanho(p.tamanho)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => apagarProjeto(p)} hitSlop={8} style={styles.remover}>
                    <Icon name="trash-outline" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
          {/* Player: play grande + waveform */}
          <Card style={styles.player}>
            <TouchableOpacity
              style={styles.playCirculo}
              onPress={() => (mt.tocando ? mt.pause() : mt.play())}
              accessibilityLabel={mt.tocando ? 'Pausar' : 'Tocar'}
            >
              <Icon name={mt.tocando ? 'pause' : 'play'} size={28} color={colors.background} />
            </TouchableOpacity>
            <View style={styles.playerDir}>
              <Waveform peaks={mt.peaks} frac={frac} onSeek={(f) => mt.seek(f * mt.duracao)} />
              <View style={styles.tempoRow}>
                <Text style={styles.tempo}>{formatarTempo(mt.posicao)}</Text>
                <Text style={styles.tempo}>{formatarTempo(mt.duracao)}</Text>
              </View>
            </View>
          </Card>

          {/* Faixas — grid 2 colunas */}
          <View style={styles.grid}>
            {mt.faixas.map((f) => (
              <Card key={f.id} style={StyleSheet.flatten([styles.faixa, { width: duasColunas ? '48.5%' : '100%' }])}>
                <TouchableOpacity
                  style={[styles.ms, f.mudo && styles.msMudo]}
                  onPress={() => mt.toggleMudo(f.id)}
                  accessibilityLabel="Mudo"
                >
                  <Text style={[styles.msTexto, f.mudo && styles.msTextoAtivo]}>M</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ms, f.solo && styles.msSolo]}
                  onPress={() => mt.toggleSolo(f.id)}
                  accessibilityLabel="Solo"
                >
                  <Text style={[styles.msTexto, f.solo && styles.msTextoAtivo]}>S</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditandoId(f.id)} style={styles.iconeBtn} accessibilityLabel="Editar faixa">
                  <Icon name={f.icone} size={22} color={f.cor ?? (f.buffer === null ? colors.textMuted : colors.text)} />
                </TouchableOpacity>
                <View style={styles.faixaCentro}>
                  <TouchableOpacity onPress={() => setEditandoId(f.id)}>
                    <Text style={styles.faixaNome} numberOfLines={1}>
                      {f.nome}
                    </Text>
                  </TouchableOpacity>
                  <SliderFaixa valor={f.volume} onChange={(v) => mt.setVolume(f.id, v)} mudo={f.mudo} cor={f.cor} />
                </View>
                <TouchableOpacity onPress={() => mt.removerFaixa(f.id)} hitSlop={8} style={styles.remover} accessibilityLabel="Remover faixa">
                  <Icon name="close" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </Card>
            ))}
          </View>

          {/* Rodapé discreto: transporte extra + tom + bpm + adicionar */}
          <View style={styles.rodape}>
            <View style={styles.transRow}>
              <TouchableOpacity onPress={() => mt.seek(mt.posicao - 10)} style={styles.transBtn} accessibilityLabel="Voltar 10 segundos">
                <Icon name="play-back" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={mt.stop} style={styles.transBtn} accessibilityLabel="Parar">
                <Icon name="stop" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => mt.seek(mt.posicao + 10)} style={styles.transBtn} accessibilityLabel="Avançar 10 segundos">
                <Icon name="play-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={styles.rodapeSep} />

              <Text style={styles.rodapeLabel}>Tom</Text>
              <TouchableOpacity style={styles.tomBtn} onPress={() => setTomIndex((i) => (i + 11) % 12)}>
                <Text style={styles.tomBtnTexto}>−</Text>
              </TouchableOpacity>
              <Text style={styles.tomValor}>{SEMITONS[tomIndex]}</Text>
              <TouchableOpacity style={styles.tomBtn} onPress={() => setTomIndex((i) => (i + 1) % 12)}>
                <Text style={styles.tomBtnTexto}>+</Text>
              </TouchableOpacity>

              <View style={styles.rodapeSep} />

              <Text style={styles.rodapeLabel}>BPM</Text>
              <TextInput
                value={bpm}
                onChangeText={(t) => setBpm(t.replace(/\D/g, '').slice(0, 3))}
                placeholder="—"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                style={styles.bpmInput}
              />
            </View>
            <Text style={styles.tomNota}>Transposição de áudio sem alterar o BPM: em breve.</Text>

            <View style={styles.rodapeAcoes}>
              <TouchableOpacity style={styles.adicionar} onPress={abrirSeletor}>
                <Icon name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.adicionarTexto}>Adicionar faixas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.adicionar}
                onPress={() => {
                  setNomeProjeto(mt.projetoNome);
                  setModalSalvar(true);
                }}
              >
                <Icon name="checkmark-done-outline" size={20} color={colors.primary} />
                <Text style={styles.adicionarTexto}>
                  {mt.projetoId ? 'Salvar alterações' : 'Salvar projeto'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      )}

      {/* Salvar projeto */}
      <Modal visible={modalSalvar} animationType="slide" transparent onRequestClose={() => setModalSalvar(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalSalvar(false)} hitSlop={8} accessibilityLabel="Fechar">
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitulo}>Salvar projeto</Text>
              <View style={{ width: 24 }} />
            </View>
            <Text style={styles.corLabel}>Fica salvo só neste navegador/computador (não sincroniza entre aparelhos).</Text>
            <TextInput
              value={nomeProjeto}
              onChangeText={setNomeProjeto}
              placeholder="Nome do projeto"
              placeholderTextColor={colors.textMuted}
              style={styles.nomeInput}
            />
            <TouchableOpacity style={styles.dropBtn} onPress={salvar}>
              <Text style={styles.dropBtnTexto}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Editor de faixa: nome + cor */}
      <Modal visible={!!editando} animationType="slide" transparent onRequestClose={() => setEditandoId(null)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditandoId(null)} hitSlop={8} accessibilityLabel="Fechar">
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitulo}>Editar faixa</Text>
              <View style={{ width: 24 }} />
            </View>

            <TextInput
              value={editando?.nome ?? ''}
              onChangeText={(t) => editando && mt.renomearFaixa(editando.id, t)}
              placeholder="Nome da faixa"
              placeholderTextColor={colors.textMuted}
              style={styles.nomeInput}
            />

            <Text style={styles.corLabel}>Cor</Text>
            <View style={styles.paleta}>
              <TouchableOpacity
                onPress={() => editando && mt.definirCor(editando.id, null)}
                style={[styles.swatch, styles.swatchSemCor, !editando?.cor && styles.swatchSel]}
              >
                <Icon name="close" size={14} color={colors.textMuted} />
              </TouchableOpacity>
              {PALETA.map((cor) => (
                <TouchableOpacity
                  key={cor}
                  onPress={() => editando && mt.definirCor(editando.id, cor)}
                  style={[styles.swatch, { backgroundColor: cor }, editando?.cor === cor && styles.swatchSel]}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    aviso: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
    avisoTitulo: { ...typography.h3, color: colors.text },
    avisoTexto: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },

    centro: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
    centroFull: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
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

    conteudo: { padding: spacing.lg, gap: spacing.md, maxWidth: 900, width: '100%', alignSelf: 'center' },

    // Player
    player: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg },
    playCirculo: {
      width: 72, height: 72, borderRadius: 36, backgroundColor: colors.text,
      alignItems: 'center', justifyContent: 'center',
    },
    playerDir: { flex: 1, gap: spacing.xs },
    tempoRow: { flexDirection: 'row', justifyContent: 'space-between' },
    tempo: { ...typography.caption, color: colors.textSecondary },

    // Grid de faixas
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' },
    faixa: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
    ms: {
      width: 30, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    msMudo: { backgroundColor: colors.error },
    msSolo: { backgroundColor: colors.primary },
    msTexto: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.bold },
    msTextoAtivo: { color: colors.textInverse },
    iconeBtn: { width: 30, alignItems: 'center' },
    faixaCentro: { flex: 1, gap: 4, marginLeft: spacing.xs },
    faixaNome: { ...typography.caption, color: colors.textSecondary, fontFamily: fonts.semibold },
    remover: { padding: spacing.xs },

    // Rodapé discreto
    rodape: { gap: spacing.sm, marginTop: spacing.sm },
    transRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
    transBtn: {
      width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.surface,
      alignItems: 'center', justifyContent: 'center',
    },
    rodapeSep: { width: 1, height: 24, backgroundColor: colors.border, marginHorizontal: spacing.xs },
    rodapeLabel: { ...typography.caption, color: colors.textSecondary },
    tomBtn: { width: 30, height: 30, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
    tomBtnTexto: { ...typography.h3, color: colors.primary },
    tomValor: { ...typography.body, color: colors.text, fontFamily: fonts.semibold, minWidth: 26, textAlign: 'center' },
    bpmInput: { ...typography.body, color: colors.text, minWidth: 44, padding: 0 },
    tomNota: { ...typography.caption, color: colors.textMuted },

    rodapeAcoes: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs, flexWrap: 'wrap' },
    adicionar: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    adicionarTexto: { ...typography.body, color: colors.primary, fontFamily: fonts.semibold },

    // Projetos salvos
    projetos: { width: '100%', maxWidth: 520, gap: spacing.sm, marginTop: spacing.lg },
    projetosTitulo: { ...typography.bodySmall, color: colors.textSecondary, fontFamily: fonts.semibold },
    projeto: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
    projetoInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    projetoNome: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
    projetoMeta: { ...typography.caption, color: colors.textMuted },

    // Editor de faixa
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modal: {
      backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      padding: spacing.lg, gap: spacing.md,
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    modalTitulo: { ...typography.h3, color: colors.text },
    nomeInput: {
      ...typography.body, color: colors.text, borderWidth: 1, borderColor: colors.border,
      borderRadius: radius.md, paddingHorizontal: spacing.md, height: 48,
    },
    corLabel: { ...typography.bodySmall, color: colors.textSecondary, fontFamily: fonts.semibold },
    paleta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingBottom: spacing.sm },
    swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent' },
    swatchSemCor: { backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
    swatchSel: { borderColor: colors.text },
  });
