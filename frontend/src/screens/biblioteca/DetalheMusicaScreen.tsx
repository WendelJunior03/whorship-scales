import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { PlayerYoutube } from '@/components/PlayerYoutube';
import { useAuth } from '@/contexts/AuthContext';
import { MainStackParamList } from '@/navigation/MainNavigator';
import * as musicasService from '@/services/musicas';
import * as videosService from '@/services/videos';
import { ApiError } from '@/services/api';
import { isAdmin } from '@/utils/papel';
import { extrairVideoIdYoutube } from '@/utils/youtube';
import { CategoriaVideo, Musica, Video } from '@/types';
import { colors, fonts, radius, spacing, typography } from '@/theme';

const CATEGORIAS: { v: CategoriaVideo; nome: string }[] = [
  { v: 'oficial', nome: 'Vídeo Oficial' },
  { v: 'playback', nome: 'Playback' },
  { v: 'tutorial', nome: 'Tutorial' },
  { v: 'ministracao', nome: 'Ministração' },
];

export function DetalheMusicaScreen() {
  const route = useRoute<RouteProp<MainStackParamList, 'DetalheMusica'>>();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const { user } = useAuth();
  const { musicaId } = route.params;
  const admin = user ? isAdmin(user) : false;

  const [musica, setMusica] = useState<Musica | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [modal, setModal] = useState(false);
  const [link, setLink] = useState('');
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<CategoriaVideo>('oficial');
  const [salvando, setSalvando] = useState(false);

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
      Alert.alert('Link obrigatório', 'Cole o link do YouTube.');
      return;
    }
    if (!previewId) {
      Alert.alert('Link inválido', 'Não reconheci esse link do YouTube.');
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
      Alert.alert('Erro', e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  function removerVideo(v: Video) {
    Alert.alert('Remover vídeo', 'Tem certeza que deseja remover este vídeo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await videosService.apagarVideo(v.id);
            await carregar();
          } catch (e) {
            Alert.alert('Erro', e instanceof ApiError ? e.message : 'Não foi possível remover.');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title={route.params.nome ?? 'Música'} showBack />

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
          <View style={styles.cabecalho}>
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
          </View>

          {admin && (
            <Button title="+ Adicionar vídeo" onPress={() => setModal(true)} style={styles.add} />
          )}

          {videos.length === 0 ? (
            <Text style={styles.vazio}>Nenhum vídeo ainda.</Text>
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
                          <TouchableOpacity onPress={() => removerVideo(v)} hitSlop={8}>
                            <Ionicons name="trash-outline" size={18} color={colors.error} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  conteudo: { padding: spacing.lg, gap: spacing.md },
  cabecalho: { gap: spacing.sm },
  meta: { ...typography.body, color: colors.textSecondary },
  add: { marginTop: spacing.xs },
  vazio: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
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
