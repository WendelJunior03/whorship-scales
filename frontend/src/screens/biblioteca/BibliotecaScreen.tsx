import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@/components/Icon';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Tabs } from '@/components/Tabs';
import { useAuth } from '@/contexts/AuthContext';
import { MainStackParamList } from '@/navigation/MainNavigator';
import * as musicasService from '@/services/musicas';
import { MusicSearchResult } from '@/services/musicas';
import * as pastasService from '@/services/pastas';
import { ApiError } from '@/services/api';
import { confirmAction, notifyAction } from '@/utils/confirm';
import { podeGerir } from '@/utils/papel';
import { Musica, Pasta, Artista } from '@/types';
import { fonts, LARGURA_CONTEUDO, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

type Aba = 'musicas' | 'pastas' | 'artistas';

function metaMusica(m: Musica): string {
  return (
    [m.artista, m.tom_padrao ? `Tom ${m.tom_padrao}` : null, m.bpm ? `${m.bpm} BPM` : null]
      .filter(Boolean)
      .join(' · ') || 'Sem tom/BPM'
  );
}

export function BibliotecaScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const { user } = useAuth();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const gestor = user ? podeGerir(user) : false;

  const [aba, setAba] = useState<Aba>('musicas');
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [pastas, setPastas] = useState<Pasta[]>([]);
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroArtista, setFiltroArtista] = useState<string | null>(null);

  // Modal de música
  const [modalMusica, setModalMusica] = useState(false);
  const [nome, setNome] = useState('');
  const [artista, setArtista] = useState('');
  const [tom, setTom] = useState('');
  const [bpm, setBpm] = useState('');
  const [cifra, setCifra] = useState('');
  const [audio, setAudio] = useState('');
  const [capaUrl, setCapaUrl] = useState<string | null>(null);
  const [resultadosBusca, setResultadosBusca] = useState<MusicSearchResult[]>([]);
  const [buscandoLista, setBuscandoLista] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const timerBuscaRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenBuscaRef = useRef(0);
  // Modal de pasta
  const [modalPasta, setModalPasta] = useState(false);
  const [nomePasta, setNomePasta] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [ms, ps, as] = await Promise.all([
        musicasService.listarMusicas(),
        pastasService.listarPastas(),
        musicasService.listarArtistas(),
      ]);
      setMusicas(ms);
      setPastas(ps);
      setArtistas(as);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar a biblioteca.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  function fecharModalMusica() {
    if (timerBuscaRef.current) clearTimeout(timerBuscaRef.current);
    setModalMusica(false);
    setNome(''); setArtista(''); setTom(''); setBpm(''); setCifra(''); setAudio(''); setCapaUrl(null);
    setResultadosBusca([]); setBuscandoLista(false); setErroBusca(null);
  }

  // Busca ao vivo (autocomplete) no agregador (Deezer + iTunes + GetSongBPM +
  // YouTube quando ativo, já deduplicado pelo backend) enquanto digita o nome —
  // com debounce e "token" pra ignorar respostas antigas se a pessoa continuar
  // digitando rápido.
  async function buscarLista(termo: string) {
    const minhaVez = ++tokenBuscaRef.current;
    setBuscandoLista(true);
    setErroBusca(null);
    try {
      const resultados = await musicasService.buscarAgregado(termo);
      if (tokenBuscaRef.current !== minhaVez) return;
      setResultadosBusca(resultados);
    } catch {
      if (tokenBuscaRef.current !== minhaVez) return;
      setResultadosBusca([]);
      setErroBusca('Não foi possível buscar agora.');
    } finally {
      if (tokenBuscaRef.current === minhaVez) setBuscandoLista(false);
    }
  }

  function aoDigitarNome(texto: string) {
    setNome(texto);
    setErroBusca(null);
    if (timerBuscaRef.current) clearTimeout(timerBuscaRef.current);
    const termo = texto.trim();
    if (termo.length < 3) {
      tokenBuscaRef.current++; // invalida qualquer busca em andamento
      setResultadosBusca([]);
      setBuscandoLista(false);
      return;
    }
    timerBuscaRef.current = setTimeout(() => buscarLista(termo), 400);
  }

  // Escolheu um item da lista: o agregador já devolve tudo que mostramos (nome,
  // artista, capa) num resultado só — não precisa de uma segunda chamada.
  function escolherCandidato(item: MusicSearchResult) {
    setNome(item.title);
    setArtista(item.artist);
    if (item.coverUrl) setCapaUrl(item.coverUrl);
    setResultadosBusca([]);
    setErroBusca(null);
  }

  // Apertou Enter no campo Nome (ex.: o louvor não apareceu na lista de sugestões
  // da GetSongBPM — comum pra gospel BR) — tenta achar capa/artista (Deezer, catálogo
  // bem maior) e tom/bpm (GetSongBPM) mesmo sem escolher nenhum item da lista.
  async function buscarAoConfirmar() {
    if (!nome.trim()) return;
    if (timerBuscaRef.current) clearTimeout(timerBuscaRef.current);
    tokenBuscaRef.current++; // invalida qualquer busca da lista em andamento
    setResultadosBusca([]);
    setErroBusca(null);
    setBuscandoLista(true);
    try {
      const meta = await musicasService.buscarMetadados(nome.trim(), artista.trim() || undefined);
      if (meta.artista && !artista.trim()) setArtista(meta.artista);
      if (meta.tom && !tom.trim()) setTom(meta.tom);
      if (meta.bpm && !bpm.trim()) setBpm(String(meta.bpm));
      if (meta.capaUrl) setCapaUrl(meta.capaUrl);
    } catch {
      setErroBusca('Não foi possível buscar agora.');
    } finally {
      setBuscandoLista(false);
    }
  }

  async function salvarMusica() {
    if (!nome.trim()) {
      notifyAction('Nome obrigatório', 'Informe o nome da música.');
      return;
    }
    setSalvando(true);
    try {
      await musicasService.criarMusica({
        nome: nome.trim(),
        artista: artista.trim() || null,
        tomPadrao: tom.trim() || null,
        bpm: bpm.trim() ? Number(bpm) : null,
        cifraUrl: cifra.trim() || null,
        audioUrl: audio.trim() || null,
        capaUrl,
      });
      fecharModalMusica();
      await carregar();
    } catch (e) {
      notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  async function salvarPasta() {
    if (!nomePasta.trim()) {
      notifyAction('Nome obrigatório', 'Informe o nome da pasta.');
      return;
    }
    setSalvando(true);
    try {
      await pastasService.criarPasta(nomePasta.trim());
      setModalPasta(false);
      setNomePasta('');
      await carregar();
    } catch (e) {
      notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  function removerMusica(musica: Musica) {
    confirmAction(
      { title: 'Excluir música', message: `Excluir "${musica.nome}" da biblioteca?`, confirmLabel: 'Excluir', destructive: true },
      async () => {
        try {
          await musicasService.apagarMusica(musica.id);
          await carregar();
        } catch (e) {
          notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível excluir.');
        }
      },
    );
  }

  const musicasFiltradas = filtroArtista
    ? musicas.filter((m) => m.artista === filtroArtista)
    : musicas;

  const cardMusica = (item: Musica) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('DetalheMusica', { musicaId: item.id, nome: item.nome })}
    >
      {item.capa_url ? (
        <Image source={{ uri: item.capa_url }} style={styles.cardCapa} />
      ) : (
        <View style={styles.cardIcone}>
          <Icon name="musical-notes-outline" size={20} color={colors.primary} />
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.cardNome}>{item.nome}</Text>
        <Text style={styles.cardMeta}>{metaMusica(item)}</Text>
      </View>
      {gestor && (
        <TouchableOpacity onPress={() => removerMusica(item)} hitSlop={8} accessibilityLabel="Excluir música">
          <Icon name="trash-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      )}
      <Icon name="chevron-forward" size={18} color={colors.textMuted} />
    </Card>
  );

  function conteudo() {
    if (aba === 'musicas') {
      return (
        <FlatList
          data={musicasFiltradas}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={
            <View>
              {gestor && <Button title="+ Nova música" onPress={() => setModalMusica(true)} style={styles.novo} />}
              {filtroArtista && (
                <TouchableOpacity style={styles.filtroChip} onPress={() => setFiltroArtista(null)}>
                  <Text style={styles.filtroTexto}>Artista: {filtroArtista}</Text>
                  <Icon name="close" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="musical-notes"
              title="Nenhuma música por aqui ainda"
              description="Adicione a primeira música à biblioteca."
            />
          }
          renderItem={({ item }) => cardMusica(item)}
        />
      );
    }
    if (aba === 'pastas') {
      return (
        <FlatList
          data={pastas}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={
            gestor ? <Button title="+ Nova pasta" onPress={() => setModalPasta(true)} style={styles.novo} /> : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="folder-outline"
              title="Nenhuma pasta criada ainda"
              description="Crie pastas para organizar suas músicas."
            />
          }
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => navigation.navigate('Pasta', { pastaId: item.id, nome: item.nome })}>
              <View style={styles.cardIcone}>
                <Icon name="folder-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardNome}>{item.nome}</Text>
                <Text style={styles.cardMeta}>
                  {item.total_musicas ?? 0} música{(item.total_musicas ?? 0) === 1 ? '' : 's'}
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </Card>
          )}
        />
      );
    }
    // artistas
    return (
      <FlatList
        data={artistas}
        keyExtractor={(a) => a.artista}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <EmptyState
            icon="person-outline"
            title="Nenhum artista ainda"
            description="Adicione o artista nas músicas para vê-los aqui."
          />
        }
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => {
              setFiltroArtista(item.artista);
              setAba('musicas');
            }}
          >
            <View style={styles.cardIcone}>
              <Icon name="person-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardNome}>{item.artista}</Text>
              <Text style={styles.cardMeta}>
                {item.total_musicas} música{item.total_musicas === 1 ? '' : 's'}
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.textMuted} />
          </Card>
        )}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Biblioteca" showBack />

      <Tabs
        style={styles.abas}
        active={aba}
        onChange={(chave) => {
          setAba(chave as Aba);
          if (chave !== 'musicas') setFiltroArtista(null);
        }}
        tabs={[
          { key: 'musicas', label: 'Músicas' },
          { key: 'pastas', label: 'Pastas' },
          { key: 'artistas', label: 'Artistas' },
        ]}
      />

      {carregando ? (
        <View style={styles.lista}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={64} radius={radius.lg} />
          ))}
        </View>
      ) : erro ? (
        <View style={styles.centro}>
          <Icon name="cloud-offline-outline" size={40} color={colors.textMuted} />
          <Text style={styles.erroTexto}>{erro}</Text>
          <Button title="Tentar novamente" onPress={carregar} variant="outline" />
        </View>
      ) : (
        conteudo()
      )}

      {/* Modal: nova música */}
      <Modal visible={modalMusica} animationType="slide" transparent onRequestClose={fecharModalMusica}>
        <Pressable style={styles.overlay} onPress={fecharModalMusica}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <TouchableOpacity
              onPress={fecharModalMusica}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              style={styles.fechar}
            >
              <Icon name="close-circle" size={24} color={colors.textMuted} />
            </TouchableOpacity>
            <Text style={styles.modalTitulo}>Nova música</Text>
            <View style={styles.buscaWrap}>
              <Input
                icon="musical-note-outline"
                placeholder="Nome da música"
                value={nome}
                onChangeText={aoDigitarNome}
                onSubmitEditing={buscarAoConfirmar}
                returnKeyType="search"
              />
              {buscandoLista && (
                <ActivityIndicator size="small" color={colors.primary} style={styles.buscaSpinner} />
              )}
              {resultadosBusca.length > 0 && (
                <View style={styles.resultadosLista}>
                  {resultadosBusca.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.resultadoItem}
                      onPress={() => escolherCandidato(item)}
                    >
                      {item.coverUrl ? (
                        <Image source={{ uri: item.coverUrl }} style={styles.resultadoCapa} />
                      ) : (
                        <View style={styles.resultadoCapaFallback}>
                          <Icon name="musical-notes-outline" size={16} color={colors.textMuted} />
                        </View>
                      )}
                      <View style={styles.resultadoTextos}>
                        <Text style={styles.resultadoTitulo} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.resultadoMeta} numberOfLines={1}>{item.artist || 'Artista desconhecido'}</Text>
                      </View>
                      <Icon name="add-circle-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {erroBusca && <Text style={styles.buscaErro}>{erroBusca}</Text>}
            </View>
            {capaUrl && (
              <View style={styles.capaPreviewLinha}>
                <Image source={{ uri: capaUrl }} style={styles.capaPreview} />
                <Text style={styles.capaPreviewTexto} numberOfLines={2}>Capa encontrada automaticamente</Text>
              </View>
            )}
            <Input icon="person-outline" placeholder="Artista (opcional)" value={artista} onChangeText={setArtista} containerStyle={styles.modalInput} />
            <Input icon="key-outline" placeholder="Tom (ex.: G) — opcional" value={tom} onChangeText={setTom} containerStyle={styles.modalInput} />
            <Input icon="speedometer-outline" placeholder="BPM (opcional)" value={bpm} onChangeText={setBpm} keyboardType="number-pad" containerStyle={styles.modalInput} />
            <Input icon="text-outline" placeholder="Link da cifra (opcional)" value={cifra} onChangeText={setCifra} autoCapitalize="none" containerStyle={styles.modalInput} />
            <Input icon="musical-notes-outline" placeholder="Link do áudio (opcional)" value={audio} onChangeText={setAudio} autoCapitalize="none" containerStyle={styles.modalInput} />
            <Button title="Salvar" onPress={salvarMusica} loading={salvando} style={styles.modalBtn} />
            <Button title="Cancelar" variant="outline" onPress={fecharModalMusica} disabled={salvando} style={styles.modalBtn} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal: nova pasta */}
      <Modal visible={modalPasta} animationType="slide" transparent onRequestClose={() => setModalPasta(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Nova pasta</Text>
            <Input icon="folder-outline" placeholder="Nome da pasta" value={nomePasta} onChangeText={setNomePasta} />
            <Button title="Salvar" onPress={salvarPasta} loading={salvando} style={styles.modalBtn} />
            <Button title="Cancelar" variant="outline" onPress={() => setModalPasta(false)} disabled={salvando} style={styles.modalBtn} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  abas: {
    flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
    width: '100%', maxWidth: LARGURA_CONTEUDO, alignSelf: 'center',
  },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  erroTexto: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  lista: { width: '100%', maxWidth: LARGURA_CONTEUDO, alignSelf: 'center', padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  novo: { marginBottom: spacing.sm },
  filtroChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, marginBottom: spacing.sm,
  },
  filtroTexto: { ...typography.caption, color: colors.primary, fontFamily: fonts.semibold },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.xl },
  cardIcone: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardCapa: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  cardInfo: { flex: 1, gap: 2 },
  cardNome: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
  cardMeta: { ...typography.caption, color: colors.textMuted },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, gap: spacing.md, maxHeight: '90%' },
  fechar: { position: 'absolute', top: spacing.md, right: spacing.md, zIndex: 1 },
  modalTitulo: { ...typography.h3, color: colors.text, paddingRight: spacing.xl },
  modalInput: { marginTop: 0 },
  modalBtn: { marginTop: spacing.xs },
  buscaWrap: { position: 'relative' },
  buscaSpinner: { position: 'absolute', right: spacing.md, top: 18 },
  resultadosLista: {
    marginTop: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  resultadoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultadoCapa: { width: 36, height: 36, borderRadius: radius.sm },
  resultadoCapaFallback: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultadoTextos: { flex: 1, minWidth: 0, gap: 2 },
  resultadoTitulo: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
  resultadoMeta: { ...typography.caption, color: colors.textMuted },
  buscaErro: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  capaPreviewLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  capaPreview: { width: 40, height: 40, borderRadius: radius.md },
  capaPreviewTexto: { ...typography.caption, color: colors.textSecondary, flex: 1, minWidth: 0 },
});
