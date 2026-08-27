import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@/components/Icon';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { MainStackParamList } from '@/navigation/MainNavigator';
import * as musicasService from '@/services/musicas';
import * as pastasService from '@/services/pastas';
import { ApiError } from '@/services/api';
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

  async function salvarMusica() {
    if (!nome.trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome da música.');
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
      });
      setModalMusica(false);
      setNome(''); setArtista(''); setTom(''); setBpm(''); setCifra(''); setAudio('');
      await carregar();
    } catch (e) {
      Alert.alert('Erro', e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  async function salvarPasta() {
    if (!nomePasta.trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome da pasta.');
      return;
    }
    setSalvando(true);
    try {
      await pastasService.criarPasta(nomePasta.trim());
      setModalPasta(false);
      setNomePasta('');
      await carregar();
    } catch (e) {
      Alert.alert('Erro', e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  const musicasFiltradas = filtroArtista
    ? musicas.filter((m) => m.artista === filtroArtista)
    : musicas;

  function abaBtn(chave: Aba, label: string) {
    const ativo = aba === chave;
    return (
      <TouchableOpacity
        style={[styles.aba, ativo && styles.abaAtiva]}
        onPress={() => {
          setAba(chave);
          if (chave !== 'musicas') setFiltroArtista(null);
        }}
      >
        <Text style={[styles.abaTexto, ativo && styles.abaTextoAtivo]}>{label}</Text>
      </TouchableOpacity>
    );
  }

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
          ListEmptyComponent={<Text style={styles.vazio}>Nenhuma música por aqui ainda.</Text>}
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
          ListEmptyComponent={<Text style={styles.vazio}>Nenhuma pasta criada ainda.</Text>}
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
        ListEmptyComponent={<Text style={styles.vazio}>Nenhum artista ainda. Adicione o artista nas músicas.</Text>}
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

      <View style={styles.abas}>
        {abaBtn('musicas', 'Músicas')}
        {abaBtn('pastas', 'Pastas')}
        {abaBtn('artistas', 'Artistas')}
      </View>

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={colors.primary} />
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
      <Modal visible={modalMusica} animationType="slide" transparent onRequestClose={() => setModalMusica(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Nova música</Text>
            <Input icon="musical-note-outline" placeholder="Nome da música" value={nome} onChangeText={setNome} />
            <Input icon="person-outline" placeholder="Artista (opcional)" value={artista} onChangeText={setArtista} containerStyle={styles.modalInput} />
            <Input icon="key-outline" placeholder="Tom (ex.: G) — opcional" value={tom} onChangeText={setTom} containerStyle={styles.modalInput} />
            <Input icon="speedometer-outline" placeholder="BPM (opcional)" value={bpm} onChangeText={setBpm} keyboardType="number-pad" containerStyle={styles.modalInput} />
            <Input icon="text-outline" placeholder="Link da cifra (opcional)" value={cifra} onChangeText={setCifra} autoCapitalize="none" containerStyle={styles.modalInput} />
            <Input icon="musical-notes-outline" placeholder="Link do áudio (opcional)" value={audio} onChangeText={setAudio} autoCapitalize="none" containerStyle={styles.modalInput} />
            <Button title="Salvar" onPress={salvarMusica} loading={salvando} style={styles.modalBtn} />
            <Button title="Cancelar" variant="outline" onPress={() => setModalMusica(false)} disabled={salvando} style={styles.modalBtn} />
          </View>
        </View>
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
  aba: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: 'center', backgroundColor: colors.surfaceMuted },
  abaAtiva: { backgroundColor: colors.primary },
  abaTexto: { ...typography.bodySmall, color: colors.textSecondary, fontFamily: fonts.semibold },
  abaTextoAtivo: { color: colors.textInverse },
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
  vazio: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.xl },
  cardIcone: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardCapa: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  cardInfo: { flex: 1, gap: 2 },
  cardNome: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
  cardMeta: { ...typography.caption, color: colors.textMuted },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, gap: spacing.md, maxHeight: '90%' },
  modalTitulo: { ...typography.h3, color: colors.text },
  modalInput: { marginTop: 0 },
  modalBtn: { marginTop: spacing.xs },
});
