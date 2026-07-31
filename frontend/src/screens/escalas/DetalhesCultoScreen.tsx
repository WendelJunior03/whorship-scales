import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { MainStackParamList } from '@/navigation/types';
import * as cultosService from '@/services/cultos';
import * as escalaAvulsaService from '@/services/escalaAvulsa';
import * as escalaFixaService from '@/services/escalaFixa';
import * as escalaVocalService from '@/services/escalaVocal';
import * as excecoesService from '@/services/excecoes';
import * as membrosService from '@/services/membros';
import * as repertorioService from '@/services/repertorio';
import { ApiError } from '@/services/api';
import {
  Culto,
  EscalaAvulsaDoCultoItem,
  EscalaVocalDoCultoItem,
  Membro,
  Repertorio,
  StatusEscalaVocal,
} from '@/types';
import { colors, spacing, typography } from '@/theme';
import { formatDiaCompleto, formatDiaSemana, formatHora } from '@/utils/date';
import { isGestor, papelLabel } from '@/utils/papel';
import { confirmAction } from '@/utils/confirm';

const statusLabel: Record<StatusEscalaVocal, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  recusado: 'Recusado',
};

const statusTone: Record<StatusEscalaVocal, 'warning' | 'success' | 'error'> = {
  pendente: 'warning',
  confirmado: 'success',
  recusado: 'error',
};

interface EquipeItem {
  chave: string;
  nome: string;
  funcao: string;
  status?: StatusEscalaVocal;
  origem: 'fixa' | 'vocal' | 'avulsa';
  origemId: number;
}

export function DetalhesCultoScreen() {
  const route = useRoute<RouteProp<MainStackParamList, 'DetalhesCulto'>>();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const { cultoId } = route.params;
  const { user } = useAuth();

  const [culto, setCulto] = useState<Culto | null>(null);
  const [repertorios, setRepertorios] = useState<Repertorio[]>([]);
  const [equipe, setEquipe] = useState<EquipeItem[]>([]);
  const [suaFuncao, setSuaFuncao] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [repertorioModalAberto, setRepertorioModalAberto] = useState(false);
  const [novoNomeMusica, setNovoNomeMusica] = useState('');
  const [novoTom, setNovoTom] = useState('');
  const [novoLink, setNovoLink] = useState('');
  const [salvandoMusica, setSalvandoMusica] = useState(false);
  const [excluindoMusicaId, setExcluindoMusicaId] = useState<number | null>(null);

  const [equipeModalAberto, setEquipeModalAberto] = useState(false);
  const [novoMembroEquipe, setNovoMembroEquipe] = useState<Membro | null>(null);
  const [novaFuncaoEquipe, setNovaFuncaoEquipe] = useState('');
  const [membroPickerAberto, setMembroPickerAberto] = useState(false);
  const [todosMembrosAtivos, setTodosMembrosAtivos] = useState<Membro[]>([]);
  const [carregandoMembros, setCarregandoMembros] = useState(false);
  const [salvandoEquipe, setSalvandoEquipe] = useState(false);
  const [excluindoEquipeChave, setExcluindoEquipeChave] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cultoEncontrado = await cultosService.getCultoById(cultoId);
      const dataDoCulto = cultoEncontrado.data_hora.slice(0, 10);

      const [repertoriosEncontrados, escalaVocalDoCulto, escalaFixaEfetiva, escalaAvulsaDoCulto] =
        await Promise.all([
          repertorioService.getRepertorioDoCulto(cultoId),
          escalaVocalService.getEscalaVocalDoCulto(cultoId),
          escalaFixaService.getEscalaEfetiva(dataDoCulto),
          escalaAvulsaService.getEscalaAvulsaDoCulto(cultoId),
        ]);

      const equipeFixa: EquipeItem[] = escalaFixaEfetiva.map((item) => ({
        chave: `fixa-${item.funcao}-${item.quem_toca}`,
        nome: item.quem_toca,
        funcao: item.funcao,
        origem: 'fixa',
        origemId: item.escala_fixa_id,
      }));
      const equipeVocal: EquipeItem[] = escalaVocalDoCulto.map((item) => ({
        chave: `vocal-${item.id}`,
        nome: item.nome,
        funcao: 'Vocal',
        status: item.status,
        origem: 'vocal',
        origemId: item.id,
      }));
      const equipeAvulsa: EquipeItem[] = escalaAvulsaDoCulto.map((item) => ({
        chave: `avulsa-${item.id}`,
        nome: item.nome,
        funcao: item.funcao,
        status: item.status,
        origem: 'avulsa',
        origemId: item.id,
      }));

      const minhaFuncaoFixa = equipeFixa.find((item) => item.nome === user?.nome);
      const minhaEscalaVocal = escalaVocalDoCulto.find(
        (item: EscalaVocalDoCultoItem) => item.membro_id === user?.id,
      );
      const minhaEscalaAvulsa = escalaAvulsaDoCulto.find(
        (item: EscalaAvulsaDoCultoItem) => item.membro_id === user?.id,
      );

      setCulto(cultoEncontrado);
      setRepertorios(repertoriosEncontrados);
      setEquipe([...equipeFixa, ...equipeVocal, ...equipeAvulsa]);
      setSuaFuncao(
        minhaFuncaoFixa?.funcao ?? minhaEscalaAvulsa?.funcao ?? (minhaEscalaVocal ? 'Vocal' : null),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar o culto.');
    } finally {
      setIsLoading(false);
    }
  }, [cultoId, user]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  function handleAbrirMusica(link: string) {
    Linking.openURL(link).catch(() => {});
  }

  function abrirRepertorioModal() {
    setNovoNomeMusica('');
    setNovoTom('');
    setNovoLink('');
    setRepertorioModalAberto(true);
  }

  async function handleAdicionarMusica() {
    if (!novoNomeMusica.trim() || !novoTom.trim() || !novoLink.trim()) {
      Alert.alert('Preencha tudo', 'Nome, tom e link da música são obrigatórios.');
      return;
    }

    setSalvandoMusica(true);
    try {
      await repertorioService.criarRepertorio({
        cultoId,
        nome: novoNomeMusica.trim(),
        tom: novoTom.trim(),
        linkMusica: novoLink.trim(),
      });
      setRepertorioModalAberto(false);
      await carregarDados();
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof ApiError ? err.message : 'Não foi possível adicionar a música.',
      );
    } finally {
      setSalvandoMusica(false);
    }
  }

  function handleExcluirMusica(musica: Repertorio) {
    confirmAction(
      {
        title: 'Excluir música',
        message: `Remover "${musica.nome}" do repertório?`,
        confirmLabel: 'Excluir',
      },
      async () => {
        setExcluindoMusicaId(musica.id);
        try {
          await repertorioService.deletarRepertorio(musica.id);
          setRepertorios((prev) => prev.filter((r) => r.id !== musica.id));
        } catch (err) {
          Alert.alert(
            'Erro',
            err instanceof ApiError ? err.message : 'Não foi possível excluir a música.',
          );
        } finally {
          setExcluindoMusicaId(null);
        }
      },
    );
  }

  async function abrirEquipeModal() {
    setNovoMembroEquipe(null);
    setNovaFuncaoEquipe('');
    setEquipeModalAberto(true);

    if (todosMembrosAtivos.length > 0) return;
    setCarregandoMembros(true);
    try {
      const todos = await membrosService.getTodosMembros();
      setTodosMembrosAtivos(todos.filter((m) => m.ativo !== false));
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof ApiError ? err.message : 'Não foi possível carregar os membros.',
      );
    } finally {
      setCarregandoMembros(false);
    }
  }

  async function handleAdicionarNaEquipe() {
    if (!novoMembroEquipe || !novaFuncaoEquipe.trim()) {
      Alert.alert('Preencha tudo', 'Selecione o membro e informe a função antes de adicionar.');
      return;
    }

    setSalvandoEquipe(true);
    try {
      await escalaAvulsaService.criarEscalaAvulsa({
        membroId: novoMembroEquipe.id,
        cultoId,
        funcao: novaFuncaoEquipe.trim(),
      });
      setEquipeModalAberto(false);
      await carregarDados();
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof ApiError ? err.message : 'Não foi possível adicionar à equipe.',
      );
    } finally {
      setSalvandoEquipe(false);
    }
  }

  function handleExcluirDaEquipe(item: EquipeItem) {
    if (!culto) return;

    const mensagem =
      item.origem === 'fixa'
        ? `Isso marca a falta de "${item.nome}" só neste culto (${item.funcao}) — a escala fixa semanal dele não é alterada. Confirmar?`
        : `Remover "${item.nome}" (${item.funcao}) da equipe deste culto?`;

    confirmAction(
      {
        title: 'Remover da equipe',
        message: mensagem,
        confirmLabel: 'Remover',
      },
      async () => {
        setExcluindoEquipeChave(item.chave);
        try {
          if (item.origem === 'vocal') {
            await escalaVocalService.deletarEscalaVocal(item.origemId);
          } else if (item.origem === 'avulsa') {
            await escalaAvulsaService.deletarEscalaAvulsa(item.origemId);
          } else {
            await excecoesService.criarExcecao({
              escalaFixaId: item.origemId,
              data: culto.data_hora.slice(0, 10),
            });
          }
          await carregarDados();
        } catch (err) {
          Alert.alert(
            'Erro',
            err instanceof ApiError ? err.message : 'Não foi possível remover da equipe.',
          );
        } finally {
          setExcluindoEquipeChave(null);
        }
      },
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !culto) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={['top']}>
        <Text style={styles.errorText}>{error ?? 'Culto não encontrado.'}</Text>
        <Button
          title="Tentar novamente"
          onPress={carregarDados}
          variant="outline"
          style={styles.retryButton}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Detalhes do Culto" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <Text style={styles.data}>{formatDiaCompleto(culto.data_hora)}</Text>
          <Text style={styles.hora}>{formatHora(culto.data_hora)}</Text>
          <View style={styles.tipoRow}>
            <Ionicons name="bookmark-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.tipo}>{culto.tipo ?? `Culto de ${formatDiaSemana(culto.data_hora)}`}</Text>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Repertório</Text>
          {user && isGestor(user.papel) && (
            <TouchableOpacity onPress={abrirRepertorioModal}>
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        {repertorios.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Nenhuma música cadastrada ainda.</Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {repertorios.map((musica, index) => (
              <TouchableOpacity
                key={musica.id}
                style={styles.musicaRow}
                activeOpacity={musica.link_musica ? 0.7 : 1}
                disabled={!musica.link_musica}
                onPress={() => musica.link_musica && handleAbrirMusica(musica.link_musica)}
              >
                <Text style={styles.musicaNumero}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={styles.musicaNome}>{musica.nome}</Text>
                <Badge label={musica.tom} tone="neutral" />
                {user &&
                  isGestor(user.papel) &&
                  (excluindoMusicaId === musica.id ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <TouchableOpacity onPress={() => handleExcluirMusica(musica)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  ))}
              </TouchableOpacity>
            ))}
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Equipe</Text>
          {user && isGestor(user.papel) && (
            <TouchableOpacity onPress={abrirEquipeModal}>
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        {equipe.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Nenhum membro escalado ainda.</Text>
          </Card>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.equipeRow}
          >
            {equipe.map((membro) => {
              const podeExcluir =
                membro.origem === 'fixa'
                  ? user?.papel === 'admin'
                  : Boolean(user && isGestor(user.papel));

              return (
                <View key={membro.chave} style={styles.membroAvatarBlock}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{membro.nome[0]}</Text>
                  </View>
                  <Text style={styles.membroNome} numberOfLines={1}>
                    {membro.nome}
                  </Text>
                  <Text style={styles.membroFuncao} numberOfLines={1}>
                    {membro.funcao}
                  </Text>
                  {membro.status && (
                    <Badge label={statusLabel[membro.status]} tone={statusTone[membro.status]} />
                  )}
                  {podeExcluir &&
                    (excluindoEquipeChave === membro.chave ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <TouchableOpacity onPress={() => handleExcluirDaEquipe(membro)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </TouchableOpacity>
                    ))}
                </View>
              );
            })}
          </ScrollView>
        )}

        {user?.papel === 'admin' && (
          <Button
            title="Gerar escala de vocais"
            onPress={() => navigation.navigate('GerarEscala', { cultoId })}
            variant="outline"
          />
        )}

        {suaFuncao && (
          <Card style={styles.suaFuncaoCard}>
            <Text style={styles.suaFuncaoLabel}>Sua função</Text>
            <View style={styles.suaFuncaoRow}>
              <Ionicons name="musical-notes" size={20} color={colors.primary} />
              <Text style={styles.suaFuncaoValor}>{suaFuncao}</Text>
            </View>
          </Card>
        )}
      </ScrollView>

      <Modal
        visible={repertorioModalAberto}
        animationType="slide"
        transparent
        onRequestClose={() => setRepertorioModalAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar música</Text>

            <View style={styles.modalInput}>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Nome da música"
                placeholderTextColor={colors.textMuted}
                value={novoNomeMusica}
                onChangeText={setNovoNomeMusica}
              />
            </View>
            <View style={styles.modalInput}>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Tom (ex: G, Em)"
                placeholderTextColor={colors.textMuted}
                value={novoTom}
                onChangeText={setNovoTom}
              />
            </View>
            <View style={styles.modalInput}>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Link de referência"
                placeholderTextColor={colors.textMuted}
                value={novoLink}
                onChangeText={setNovoLink}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            <Button
              title="Adicionar"
              onPress={handleAdicionarMusica}
              loading={salvandoMusica}
              style={styles.modalButton}
            />
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setRepertorioModalAberto(false)}
              disabled={salvandoMusica}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={equipeModalAberto}
        animationType="slide"
        transparent
        onRequestClose={() => setEquipeModalAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar à equipe</Text>

            <TouchableOpacity
              style={styles.modalInput}
              onPress={() => setMembroPickerAberto(true)}
            >
              <Text style={novoMembroEquipe ? styles.modalTextInput : styles.modalPlaceholder}>
                {novoMembroEquipe ? novoMembroEquipe.nome : 'Selecionar membro'}
              </Text>
            </TouchableOpacity>
            <View style={styles.modalInput}>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Função (ex: Baixo, Ministro)"
                placeholderTextColor={colors.textMuted}
                value={novaFuncaoEquipe}
                onChangeText={setNovaFuncaoEquipe}
              />
            </View>

            <Button
              title="Adicionar"
              onPress={handleAdicionarNaEquipe}
              loading={salvandoEquipe}
              style={styles.modalButton}
            />
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setEquipeModalAberto(false)}
              disabled={salvandoEquipe}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={membroPickerAberto}
        animationType="slide"
        transparent
        onRequestClose={() => setMembroPickerAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentPicker}>
            <Text style={styles.modalTitle}>Escolher membro</Text>
            {carregandoMembros ? (
              <ActivityIndicator color={colors.primary} style={styles.modalLoading} />
            ) : (
              <ScrollView style={styles.modalList}>
                {todosMembrosAtivos.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhum membro disponível.</Text>
                ) : (
                  todosMembrosAtivos.map((membro) => (
                    <TouchableOpacity
                      key={membro.id}
                      style={styles.modalItem}
                      onPress={() => {
                        setNovoMembroEquipe(membro);
                        setMembroPickerAberto(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>{membro.nome}</Text>
                      <Text style={styles.modalItemSubtext}>{papelLabel[membro.papel]}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
            <Button title="Cancelar" variant="outline" onPress={() => setMembroPickerAberto(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 200,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  data: {
    ...typography.h2,
    color: colors.text,
  },
  hora: {
    ...typography.h1,
    color: colors.primary,
    marginTop: 2,
  },
  tipoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  tipo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  listCard: {
    gap: spacing.sm,
  },
  musicaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  musicaNumero: {
    ...typography.caption,
    color: colors.textMuted,
    width: 20,
  },
  musicaNome: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  equipeRow: {
    gap: spacing.md,
  },
  membroAvatarBlock: {
    alignItems: 'center',
    width: 72,
    gap: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  membroNome: {
    ...typography.caption,
    color: colors.text,
  },
  membroFuncao: {
    ...typography.caption,
    color: colors.textMuted,
  },
  suaFuncaoCard: {
    borderColor: colors.primary,
  },
  suaFuncaoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  suaFuncaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  suaFuncaoValor: {
    ...typography.h3,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  modalTextInput: {
    ...typography.body,
    color: colors.text,
  },
  modalPlaceholder: {
    ...typography.body,
    color: colors.textMuted,
  },
  modalButton: {
    marginTop: spacing.xs,
  },
  modalContentPicker: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '70%',
  },
  modalLoading: {
    marginVertical: spacing.lg,
  },
  modalList: {
    maxHeight: 320,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    ...typography.body,
    color: colors.text,
  },
  modalItemSubtext: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
