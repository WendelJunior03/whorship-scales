import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { MainStackParamList } from '@/navigation/MainNavigator';
import * as musicasService from '@/services/musicas';
import { ApiError } from '@/services/api';
import { podeGerir } from '@/utils/papel';
import { Musica } from '@/types';
import { fonts, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

export function BibliotecaScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const { user } = useAuth();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const gestor = user ? podeGerir(user) : false;

  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modal, setModal] = useState(false);
  const [nome, setNome] = useState('');
  const [tom, setTom] = useState('');
  const [bpm, setBpm] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setMusicas(await musicasService.listarMusicas());
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar as músicas.');
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
        tomPadrao: tom.trim() || null,
        bpm: bpm.trim() ? Number(bpm) : null,
      });
      setModal(false);
      setNome('');
      setTom('');
      setBpm('');
      await carregar();
    } catch (e) {
      Alert.alert('Erro', e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Biblioteca" showBack />

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
        <FlatList
          data={musicas}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={
            gestor ? (
              <Button title="+ Nova música" onPress={() => setModal(true)} style={styles.novo} />
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhuma música cadastrada ainda.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('DetalheMusica', { musicaId: item.id, nome: item.nome })
              }
            >
              <View style={styles.cardIcone}>
                <Icon name="musical-notes-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardNome}>{item.nome}</Text>
                <Text style={styles.cardMeta}>
                  {[item.tom_padrao ? `Tom ${item.tom_padrao}` : null, item.bpm ? `${item.bpm} BPM` : null]
                    .filter(Boolean)
                    .join(' · ') || 'Sem tom/BPM'}
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Nova música</Text>
            <Input icon="musical-note-outline" placeholder="Nome da música" value={nome} onChangeText={setNome} />
            <Input icon="key-outline" placeholder="Tom (ex.: G) — opcional" value={tom} onChangeText={setTom} containerStyle={styles.modalInput} />
            <Input icon="speedometer-outline" placeholder="BPM (opcional)" value={bpm} onChangeText={setBpm} keyboardType="number-pad" containerStyle={styles.modalInput} />
            <Button title="Salvar" onPress={salvarMusica} loading={salvando} style={styles.modalBtn} />
            <Button title="Cancelar" variant="outline" onPress={() => setModal(false)} disabled={salvando} style={styles.modalBtn} />
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
  lista: { padding: spacing.lg, gap: spacing.sm },
  novo: { marginBottom: spacing.sm },
  vazio: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardIcone: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 2 },
  cardNome: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
  cardMeta: { ...typography.caption, color: colors.textMuted },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitulo: { ...typography.h3, color: colors.text },
  modalInput: { marginTop: 0 },
  modalBtn: { marginTop: spacing.xs },
});
