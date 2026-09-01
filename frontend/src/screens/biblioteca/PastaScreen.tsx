import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@/components/Icon';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { MainStackParamList } from '@/navigation/MainNavigator';
import * as pastasService from '@/services/pastas';
import * as musicasService from '@/services/musicas';
import { ApiError } from '@/services/api';
import { podeGerir } from '@/utils/papel';
import { confirmAction, notifyAction } from '@/utils/confirm';
import { Musica } from '@/types';
import { fonts, LARGURA_CONTEUDO, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

export function PastaScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const { user } = useAuth();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'Pasta'>>();
  const { pastaId, nome } = route.params;
  const gestor = user ? podeGerir(user) : false;

  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [todas, setTodas] = useState<Musica[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAdd, setModalAdd] = useState(false);
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const [daPasta, catalogo] = await Promise.all([
        pastasService.listarMusicasDaPasta(pastaId),
        musicasService.listarMusicas(),
      ]);
      setMusicas(daPasta);
      setTodas(catalogo);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar a pasta.');
    } finally {
      setCarregando(false);
    }
  }, [pastaId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function adicionar(musicaId: number) {
    setBusy(true);
    try {
      setMusicas(await pastasService.adicionarMusica(pastaId, musicaId));
    } catch (e) {
      notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível adicionar.');
    } finally {
      setBusy(false);
    }
  }

  function remover(m: Musica) {
    confirmAction(
      { title: 'Remover da pasta', message: `Tirar "${m.nome}" desta pasta?`, confirmLabel: 'Remover', destructive: true },
      async () => {
        try {
          await pastasService.removerMusica(pastaId, m.id);
          await carregar();
        } catch (e) {
          notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível remover.');
        }
      },
    );
  }

  function excluirPasta() {
    confirmAction(
      { title: 'Excluir pasta', message: `Excluir a pasta "${nome ?? ''}"? As músicas continuam na biblioteca.`, confirmLabel: 'Excluir', destructive: true },
      async () => {
        try {
          await pastasService.apagarPasta(pastaId);
          navigation.goBack();
        } catch (e) {
          notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível excluir.');
        }
      },
    );
  }

  const idsNaPasta = new Set(musicas.map((m) => m.id));
  const disponiveis = todas.filter((m) => !idsNaPasta.has(m.id));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header
        title={nome ?? 'Pasta'}
        showBack
        rightActions={
          gestor ? [{ icon: 'trash-outline', label: 'Excluir pasta', onPress: excluirPasta }] : []
        }
      />

      {carregando ? (
        <View style={styles.lista}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={64} radius={radius.lg} />
          ))}
        </View>
      ) : erro ? (
        <View style={styles.centro}>
          <Text style={styles.erroTexto}>{erro}</Text>
          <Button title="Tentar novamente" onPress={carregar} variant="outline" />
        </View>
      ) : (
        <FlatList
          data={musicas}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={
            gestor ? <Button title="+ Adicionar música" onPress={() => setModalAdd(true)} style={styles.novo} /> : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="musical-notes"
              title="Nenhuma música nesta pasta"
              description="Adicione músicas da biblioteca para organizá-las aqui."
            />
          }
          renderItem={({ item }) => (
            <Card
              style={styles.card}
              onPress={() => navigation.navigate('DetalheMusica', { musicaId: item.id, nome: item.nome })}
            >
              <View style={styles.cardIcone}>
                <Icon name="musical-notes-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardNome}>{item.nome}</Text>
                <Text style={styles.cardMeta}>
                  {[item.artista, item.tom_padrao ? `Tom ${item.tom_padrao}` : null].filter(Boolean).join(' · ') || '—'}
                </Text>
              </View>
              {gestor && (
                <TouchableOpacity onPress={() => remover(item)} hitSlop={8}>
                  <Icon name="trash-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </Card>
          )}
        />
      )}

      {/* Modal: adicionar música à pasta */}
      <Modal visible={modalAdd} animationType="slide" transparent onRequestClose={() => setModalAdd(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Adicionar música</Text>
            <FlatList
              data={disponiveis}
              keyExtractor={(m) => String(m.id)}
              style={styles.modalLista}
              ListEmptyComponent={<Text style={styles.vazio}>Todas as músicas já estão na pasta.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.addRow}
                  disabled={busy}
                  onPress={() => adicionar(item.id)}
                >
                  <Icon name="add-circle-outline" size={20} color={colors.primary} />
                  <Text style={styles.addNome} numberOfLines={1}>{item.nome}</Text>
                </TouchableOpacity>
              )}
            />
            <Button title="Fechar" variant="outline" onPress={() => setModalAdd(false)} style={styles.modalBtn} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  erroTexto: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  lista: { width: '100%', maxWidth: LARGURA_CONTEUDO, alignSelf: 'center', padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  novo: { marginBottom: spacing.sm },
  vazio: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.xl },
  cardIcone: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, gap: 2 },
  cardNome: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
  cardMeta: { ...typography.caption, color: colors.textMuted },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, gap: spacing.md, maxHeight: '80%' },
  modalTitulo: { ...typography.h3, color: colors.text },
  modalLista: { maxHeight: 360 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  addNome: { ...typography.body, color: colors.text, flex: 1 },
  modalBtn: { marginTop: spacing.xs },
});
