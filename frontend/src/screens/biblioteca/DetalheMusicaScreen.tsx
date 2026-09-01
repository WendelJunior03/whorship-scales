import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@/components/Icon';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { PlayerYoutube } from '@/components/PlayerYoutube';
import { useAuth } from '@/contexts/AuthContext';
import { MainStackParamList } from '@/navigation/MainNavigator';
import * as musicasService from '@/services/musicas';
import * as videosService from '@/services/videos';
import { ApiError } from '@/services/api';
import { confirmAction, notifyAction } from '@/utils/confirm';
import { isAdmin, podeGerir } from '@/utils/papel';
import { extrairVideoIdYoutube } from '@/utils/youtube';
import { CategoriaVideo, Musica, Video } from '@/types';
import { fonts, LARGURA_CONTEUDO, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

const CATEGORIAS: { v: CategoriaVideo; nome: string }[] = [
  { v: 'oficial', nome: 'Vídeo Oficial' },
  { v: 'playback', nome: 'Playback' },
  { v: 'tutorial', nome: 'Tutorial' },
  { v: 'ministracao', nome: 'Ministração' },
];

export function DetalheMusicaScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const route = useRoute<RouteProp<MainStackParamList, 'DetalheMusica'>>();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const { user } = useAuth();
  const { musicaId } = route.params;
  const admin = user ? isAdmin(user) : false;
  const gestor = user ? podeGerir(user) : false;

  const [musica, setMusica] = useState<Musica | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [modal, setModal] = useState(false);
  const [link, setLink] = useState('');
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<CategoriaVideo>('oficial');
  const [salvando, setSalvando] = useState(false);

  // Edição da música (gestor)
  const [modalEdit, setModalEdit] = useState(false);
  const [eNome, setENome] = useState('');
  const [eArtista, setEArtista] = useState('');
  const [eTom, setETom] = useState('');
  const [eBpm, setEBpm] = useState('');
  const [eCifra, setECifra] = useState('');
  const [eAudio, setEAudio] = useState('');

  function abrirEdicao() {
    if (!musica) return;
    setENome(musica.nome);
    setEArtista(musica.artista ?? '');
    setETom(musica.tom_padrao ?? '');
    setEBpm(musica.bpm ? String(musica.bpm) : '');
    setECifra(musica.cifra_url ?? '');
    setEAudio(musica.audio_url ?? '');
    setModalEdit(true);
  }

  async function salvarEdicao() {
    if (!eNome.trim()) {
      notifyAction('Nome obrigatório', 'Informe o nome da música.');
      return;
    }
    setSalvando(true);
    try {
      await musicasService.atualizarMusica(musicaId, {
        nome: eNome.trim(),
        artista: eArtista.trim() || null,
        tomPadrao: eTom.trim() || null,
        bpm: eBpm.trim() ? Number(eBpm) : null,
        cifraUrl: eCifra.trim() || null,
        audioUrl: eAudio.trim() || null,
      });
      setModalEdit(false);
      await carregar();
    } catch (e) {
      notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  function abrirLink(url: string) {
    Linking.openURL(url).catch(() => notifyAction('Erro', 'Não foi possível abrir o link.'));
  }

  const previewId = useMemo(() => extrairVideoIdYoutube(link), [link]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [m, vs] = await Promise.all([
        musicasService.getMusica(musicaId),
        videosService.listarVideosPorMusica(musicaId),
      ]);
      setMusica(m);
      setVideos(vs);
    } catch {
      // silencioso — mostra vazio
    } finally {
      setCarregando(false);
    }
  }, [musicaId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function salvarVideo() {
    if (!link.trim()) {
      notifyAction('Link obrigatório', 'Cole o link do YouTube.');
      return;
    }
    if (!previewId) {
      notifyAction('Link inválido', 'Não reconheci esse link do YouTube.');
      return;
    }
    setSalvando(true);
    try {
      await videosService.criarVideo({
        musicaId,
        link: link.trim(),
        categoria,
        titulo: titulo.trim() || null,
      });
      setModal(false);
      setLink('');
      setTitulo('');
      setCategoria('oficial');
      await carregar();
    } catch (e) {
      notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  function removerVideo(v: Video) {
    confirmAction(
      { title: 'Remover vídeo', message: 'Tem certeza que deseja remover este vídeo?', confirmLabel: 'Remover', destructive: true },
      async () => {
        try {
          await videosService.apagarVideo(v.id);
          await carregar();
        } catch (e) {
          notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível remover.');
        }
      },
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title={route.params.nome ?? 'Música'} showBack />

      {carregando ? (
        <View style={styles.conteudo}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={64} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
          <View style={styles.cabecalho}>
            {musica?.capa_url ? (
              <Image source={{ uri: musica.capa_url }} style={styles.capa} resizeMode="cover" />
            ) : null}
            {musica?.artista ? <Text style={styles.artista}>{musica.artista}</Text> : null}
            <Text style={styles.meta}>
              {[musica?.tom_padrao ? `Tom ${musica.tom_padrao}` : null, musica?.bpm ? `${musica.bpm} BPM` : null]
                .filter(Boolean)
                .join(' · ') || 'Sem tom/BPM'}
            </Text>
            {musica?.bpm ? (
              <Button
                title={`▶ Metrônomo em ${musica.bpm} BPM`}
                variant="outline"
                onPress={() => navigation.navigate('Metronomo', { bpm: musica.bpm ?? undefined })}
              />
            ) : null}
            <View style={styles.linksRow}>
              {musica?.cifra_url ? (
                <Button title="Cifra" variant="outline" onPress={() => abrirLink(musica.cifra_url as string)} style={styles.linkBtn} />
              ) : null}
              {musica?.audio_url ? (
                <Button title="Áudio" variant="outline" onPress={() => abrirLink(musica.audio_url as string)} style={styles.linkBtn} />
              ) : null}
            </View>
          </View>

          <View style={styles.acoes}>
            {gestor && (
              <Button title="Editar música" variant="outline" onPress={abrirEdicao} style={styles.acaoBtn} />
            )}
            {admin && (
              <Button title="+ Adicionar vídeo" onPress={() => setModal(true)} style={styles.acaoBtn} />
            )}
          </View>

          {videos.length === 0 ? (
            <EmptyState
              icon="musical-notes"
              title="Nenhum vídeo ainda"
              description="Adicione vídeos do YouTube para esta música."
            />
          ) : (
            CATEGORIAS.map((cat) => {
              const doGrupo = videos.filter((v) => v.categoria === cat.v);
              if (doGrupo.length === 0) {
                return null;
              }
              return (
                <View key={cat.v} style={styles.grupo}>
                  <Text style={styles.grupoTitulo}>{cat.nome}</Text>
                  {doGrupo.map((v) => (
                    <View key={v.id} style={styles.videoCard}>
                      <PlayerYoutube videoId={v.video_id} />
                      <View style={styles.videoRodape}>
                        <Text style={styles.videoTitulo} numberOfLines={1}>
                          {v.titulo || 'Vídeo'}
                        </Text>
                        {admin && (
                          <TouchableOpacity
                            onPress={() => removerVideo(v)}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Remover vídeo"
                          >
                            <Icon name="trash-outline" size={18} color={colors.error} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modal}>
              <Text style={styles.modalTitulo}>Adicionar vídeo</Text>
              <Input icon="logo-youtube" placeholder="Cole o link do YouTube" value={link} onChangeText={setLink} autoCapitalize="none" />
              {previewId ? (
                <PlayerYoutube videoId={previewId} />
              ) : link.trim() ? (
                <Text style={styles.avisoLink}>Link do YouTube não reconhecido.</Text>
              ) : null}
              <Input icon="text-outline" placeholder="Título (opcional)" value={titulo} onChangeText={setTitulo} containerStyle={styles.modalInput} />
              <Text style={styles.label}>Categoria</Text>
              <View style={styles.chips}>
                {CATEGORIAS.map((c) => (
                  <TouchableOpacity
                    key={c.v}
                    onPress={() => setCategoria(c.v)}
                    style={[styles.chip, c.v === categoria && styles.chipAtivo]}
                  >
                    <Text style={[styles.chipTexto, c.v === categoria && styles.chipTextoAtivo]}>{c.nome}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Button title="Salvar vídeo" onPress={salvarVideo} loading={salvando} style={styles.modalBtn} />
              <Button title="Cancelar" variant="outline" onPress={() => setModal(false)} disabled={salvando} style={styles.modalBtn} />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal: editar música */}
      <Modal visible={modalEdit} animationType="slide" transparent onRequestClose={() => setModalEdit(false)}>
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modal}>
              <Text style={styles.modalTitulo}>Editar música</Text>
              <Input icon="musical-note-outline" placeholder="Nome da música" value={eNome} onChangeText={setENome} />
              <Input icon="person-outline" placeholder="Artista (opcional)" value={eArtista} onChangeText={setEArtista} containerStyle={styles.modalInput} />
              <Input icon="key-outline" placeholder="Tom (ex.: G) — opcional" value={eTom} onChangeText={setETom} containerStyle={styles.modalInput} />
              <Input icon="speedometer-outline" placeholder="BPM (opcional)" value={eBpm} onChangeText={setEBpm} keyboardType="number-pad" containerStyle={styles.modalInput} />
              <Input icon="text-outline" placeholder="Link da cifra (opcional)" value={eCifra} onChangeText={setECifra} autoCapitalize="none" containerStyle={styles.modalInput} />
              <Input icon="musical-notes-outline" placeholder="Link do áudio (opcional)" value={eAudio} onChangeText={setEAudio} autoCapitalize="none" containerStyle={styles.modalInput} />
              <Button title="Salvar" onPress={salvarEdicao} loading={salvando} style={styles.modalBtn} />
              <Button title="Cancelar" variant="outline" onPress={() => setModalEdit(false)} disabled={salvando} style={styles.modalBtn} />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  conteudo: { width: '100%', maxWidth: LARGURA_CONTEUDO, alignSelf: 'center', padding: spacing.lg, gap: spacing.md },
  cabecalho: { gap: spacing.sm },
  capa: { width: '100%', height: 200, borderRadius: radius.xl, backgroundColor: colors.surfaceMuted },
  artista: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
  meta: { ...typography.body, color: colors.textSecondary },
  linksRow: { flexDirection: 'row', gap: spacing.sm },
  linkBtn: { flex: 1 },
  acoes: { flexDirection: 'row', gap: spacing.sm },
  acaoBtn: { flex: 1, marginTop: spacing.xs },
  grupo: { gap: spacing.sm },
  grupoTitulo: { ...typography.bodySmall, color: colors.textSecondary, fontFamily: fonts.semibold, marginTop: spacing.sm },
  videoCard: { gap: spacing.xs },
  videoRodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  videoTitulo: { ...typography.bodySmall, color: colors.text, flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitulo: { ...typography.h3, color: colors.text },
  modalInput: { marginTop: 0 },
  avisoLink: { ...typography.caption, color: colors.warning },
  label: { ...typography.bodySmall, color: colors.textSecondary, fontFamily: fonts.semibold },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipTexto: { ...typography.bodySmall, color: colors.textSecondary },
  chipTextoAtivo: { color: colors.primary, fontFamily: fonts.semibold },
  modalBtn: { marginTop: spacing.xs },
});
