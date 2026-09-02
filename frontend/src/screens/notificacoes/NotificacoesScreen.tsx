import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon, IconName } from '@/components/Icon';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { showToast } from '@/utils/toast';
import * as notificacoesService from '@/services/notificacoes';
import * as escalaVocalService from '@/services/escalaVocal';
import * as escalaAvulsaService from '@/services/escalaAvulsa';
import * as ensaioService from '@/services/ensaio';
import { ApiError } from '@/services/api';
import { MainTabScreenNavigationProp } from '@/navigation/types';
import {
  MembroCandidato,
  MinhaEscalaAvulsaItem,
  MinhaEscalaVocalItem,
  MinhaParticipacaoEnsaio,
  Notificacao,
  TipoNotificacao,
} from '@/types';
import { LARGURA_CONTEUDO, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { formatDataRelativa, formatHora } from '@/utils/date';
import { confirmAction } from '@/utils/confirm';

const iconePorTipo: Record<TipoNotificacao, IconName> = {
  escala: 'calendar',
  substituicao: 'swap-horizontal',
  confirmacao: 'checkmark-circle',
  falta: 'alert-circle-outline',
  comentario: 'chatbubble-ellipses-outline',
  repertorio: 'musical-notes',
  ensaio: 'calendar-outline',
  lembrete: 'alarm',
};

interface Secao {
  title: string;
  data: Notificacao[];
}

function agruparPorData(notificacoes: Notificacao[]): Secao[] {
  const grupos = new Map<string, Secao>();
  for (const notificacao of notificacoes) {
    const chave = notificacao.created_at.slice(0, 10);
    const grupo = grupos.get(chave);
    if (grupo) {
      grupo.data.push(notificacao);
    } else {
      grupos.set(chave, { title: formatDataRelativa(notificacao.created_at), data: [notificacao] });
    }
  }
  return Array.from(grupos.values());
}

export function NotificacoesScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const navigation = useNavigation<MainTabScreenNavigationProp<'Notificacoes'>>();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [escalaVocal, setEscalaVocal] = useState<MinhaEscalaVocalItem[]>([]);
  const [escalaAvulsa, setEscalaAvulsa] = useState<MinhaEscalaAvulsaItem[]>([]);
  const [participacoesEnsaio, setParticipacoesEnsaio] = useState<MinhaParticipacaoEnsaio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  type Indicacao =
    | { tipo: 'vocal'; item: MinhaEscalaVocalItem }
    | { tipo: 'avulsa'; item: MinhaEscalaAvulsaItem };
  const [indicacao, setIndicacao] = useState<Indicacao | null>(null);
  const [mostrarListaCandidatos, setMostrarListaCandidatos] = useState(false);
  const [candidatos, setCandidatos] = useState<MembroCandidato[]>([]);
  const [carregandoCandidatos, setCarregandoCandidatos] = useState(false);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dados, vocal, avulsa, ensaios] = await Promise.all([
        notificacoesService.getMinhasNotificacoes(),
        escalaVocalService.getMinhaEscalaVocal(),
        escalaAvulsaService.getMinhaEscalaAvulsa(),
        ensaioService.getMinhasParticipacoesEnsaio(),
      ]);
      setNotificacoes(dados);
      setEscalaVocal(vocal);
      setEscalaAvulsa(avulsa);
      setParticipacoesEnsaio(ensaios);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar as notificações.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados]),
  );

  function itemPendenteDaNotificacao(
    item: Notificacao,
  ): MinhaEscalaVocalItem | MinhaEscalaAvulsaItem | MinhaParticipacaoEnsaio | null {
    if (!item.referencia_id) return null;
    if (item.referencia_tipo === 'escala_vocal') {
      const encontrado = escalaVocal.find((e) => e.id === item.referencia_id);
      return encontrado && encontrado.status === 'pendente' ? encontrado : null;
    }
    if (item.referencia_tipo === 'escala_avulsa') {
      const encontrado = escalaAvulsa.find((e) => e.id === item.referencia_id);
      return encontrado && encontrado.status === 'pendente' ? encontrado : null;
    }
    if (item.referencia_tipo === 'ensaio_participante') {
      const encontrado = participacoesEnsaio.find((e) => e.id === item.referencia_id);
      return encontrado && encontrado.status === 'pendente' ? encontrado : null;
    }
    return null;
  }

  function marcarComoLida(item: Notificacao) {
    if (item.lida) return;
    setNotificacoes((prev) => prev.map((n) => (n.id === item.id ? { ...n, lida: true } : n)));
    notificacoesService.marcarComoLida(item.id).catch(() => {
      setNotificacoes((prev) => prev.map((n) => (n.id === item.id ? { ...n, lida: false } : n)));
    });
  }

  function handleAbrir(item: Notificacao) {
    marcarComoLida(item);

    if (item.tipo === 'substituicao' && item.culto_id && !itemPendenteDaNotificacao(item)) {
      navigation.navigate('DetalhesCulto', { cultoId: item.culto_id, abrirEdicaoVocal: true });
    }
  }

  function handleLimpar() {
    confirmAction(
      {
        title: 'Limpar notificações',
        message: 'Isso remove todas as suas notificações. Essa ação não pode ser desfeita.',
        confirmLabel: 'Limpar',
      },
      () => {
        const anteriores = notificacoes;
        setNotificacoes([]);
        notificacoesService.limparNotificacoes().catch(() => {
          setNotificacoes(anteriores);
        });
      },
    );
  }

  async function handleConfirmar(item: Notificacao) {
    const escala = itemPendenteDaNotificacao(item);
    if (!escala) return;
    setActionLoadingId(item.id);
    try {
      if (item.referencia_tipo === 'escala_vocal') {
        await escalaVocalService.confirmarPresenca(escala.id, 'confirmado');
        setEscalaVocal((prev) => prev.map((e) => (e.id === escala.id ? { ...e, status: 'confirmado' } : e)));
      } else if (item.referencia_tipo === 'escala_avulsa') {
        await escalaAvulsaService.confirmarPresencaAvulsa(escala.id, 'confirmado');
        setEscalaAvulsa((prev) => prev.map((e) => (e.id === escala.id ? { ...e, status: 'confirmado' } : e)));
      } else {
        await ensaioService.confirmarPresencaEnsaio(escala.id, 'confirmado');
        setParticipacoesEnsaio((prev) =>
          prev.map((e) => (e.id === escala.id ? { ...e, status: 'confirmado' } : e)),
        );
      }
      marcarComoLida(item);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Não foi possível confirmar.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  }

  // Ensaio não tem "indicar substituto" (não ocupa uma vaga de função) — recusa
  // direto, sem abrir o modal de indicação usado por vocal/avulsa.
  function handleRecusarEnsaio(item: Notificacao) {
    const participacao = itemPendenteDaNotificacao(item);
    if (!participacao) return;

    confirmAction(
      {
        title: 'Recusar presença',
        message: 'Confirmar a recusa de presença nesse ensaio?',
        confirmLabel: 'Recusar',
      },
      async () => {
        setActionLoadingId(item.id);
        try {
          await ensaioService.confirmarPresencaEnsaio(participacao.id, 'recusado');
          setParticipacoesEnsaio((prev) =>
            prev.map((e) => (e.id === participacao.id ? { ...e, status: 'recusado' } : e)),
          );
          marcarComoLida(item);
        } catch (err) {
          showToast(
            err instanceof ApiError ? err.message : 'Não foi possível registrar a recusa.',
            'error',
          );
        } finally {
          setActionLoadingId(null);
        }
      },
    );
  }

  function abrirIndicacao(item: Notificacao) {
    const escala = itemPendenteDaNotificacao(item);
    if (!escala) return;
    if (item.referencia_tipo === 'escala_vocal') {
      setIndicacao({ tipo: 'vocal', item: escala as MinhaEscalaVocalItem });
    } else {
      setIndicacao({ tipo: 'avulsa', item: escala as MinhaEscalaAvulsaItem });
    }
    setMostrarListaCandidatos(false);
  }

  async function abrirListaCandidatos() {
    if (!indicacao) return;
    setMostrarListaCandidatos(true);
    setCandidatos([]);
    setCarregandoCandidatos(true);
    try {
      const buscar =
        indicacao.tipo === 'vocal'
          ? () => escalaVocalService.getCandidatosVocais(indicacao.item.culto_id)
          : () => escalaAvulsaService.getCandidatosAvulsa(indicacao.item.culto_id);
      setCandidatos(await buscar());
    } catch {
      // sem candidatos pra indicar não impede a recusa — só some a lista
    } finally {
      setCarregandoCandidatos(false);
    }
  }

  function fecharIndicacao() {
    setIndicacao(null);
    setMostrarListaCandidatos(false);
    setCandidatos([]);
  }

  function executarRecusa(indicado: MembroCandidato | null) {
    if (!indicacao) return;
    const atual = indicacao;
    fecharIndicacao();

    confirmAction(
      {
        title: 'Recusar presença',
        message: indicado
          ? `Recusar essa escala e indicar ${indicado.nome} pra te substituir?`
          : 'Confirmar a recusa dessa escala?',
        confirmLabel: 'Recusar',
      },
      async () => {
        setActionLoadingId(atual.item.id);
        try {
          if (atual.tipo === 'vocal') {
            await escalaVocalService.confirmarPresenca(atual.item.id, 'recusado', indicado?.id);
            setEscalaVocal((prev) =>
              prev.map((e) => (e.id === atual.item.id ? { ...e, status: 'recusado' } : e)),
            );
          } else {
            await escalaAvulsaService.confirmarPresencaAvulsa(atual.item.id, 'recusado', indicado?.id);
            setEscalaAvulsa((prev) =>
              prev.map((e) => (e.id === atual.item.id ? { ...e, status: 'recusado' } : e)),
            );
          }
        } catch (err) {
          showToast(
            err instanceof ApiError ? err.message : 'Não foi possível registrar a recusa.',
            'error',
          );
        } finally {
          setActionLoadingId(null);
        }
      },
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Notificações</Text>
        </View>
        <View style={styles.listContent}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={72} radius={radius.lg} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={['top']}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Tentar novamente"
          onPress={carregarDados}
          variant="outline"
          style={styles.retryButton}
        />
      </SafeAreaView>
    );
  }

  const secoes = agruparPorData(notificacoes);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Notificações</Text>
        {notificacoes.length > 0 && (
          <TouchableOpacity
            onPress={handleLimpar}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Limpar notificações"
          >
            <Icon name="trash-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <SectionList
        style={styles.list}
        sections={secoes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="Nenhuma notificação"
            description="Quando algo acontecer nas suas escalas, aparece por aqui."
          />
        }
        renderSectionHeader={({ section }) => <SectionHeader titulo={section.title} />}
        renderItem={({ item }) => {
          const pendente = itemPendenteDaNotificacao(item);
          return (
            <Card style={styles.item}>
              <TouchableOpacity style={styles.itemLinha} onPress={() => handleAbrir(item)} activeOpacity={0.7}>
                <View style={styles.itemIcon}>
                  <Icon name={iconePorTipo[item.tipo]} size={18} color={colors.primary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemTitulo, !item.lida && styles.itemTituloNaoLido]}>
                    {item.titulo}
                  </Text>
                  <Text style={styles.itemDescricao}>{item.descricao}</Text>
                </View>
                <View style={styles.itemLado}>
                  <Text style={styles.itemHora}>{formatHora(item.created_at)}</Text>
                  {!item.lida && <View style={styles.dotNaoLido} />}
                </View>
              </TouchableOpacity>
              {pendente && (
                <View style={styles.acoes}>
                  <Button
                    title="Confirmar"
                    onPress={() => handleConfirmar(item)}
                    loading={actionLoadingId === item.id}
                    style={styles.acaoBotao}
                  />
                  <Button
                    title="Recusar"
                    onPress={() =>
                      item.referencia_tipo === 'ensaio_participante'
                        ? handleRecusarEnsaio(item)
                        : abrirIndicacao(item)
                    }
                    loading={actionLoadingId === item.id}
                    variant="outline"
                    style={styles.acaoBotao}
                  />
                </View>
              )}
            </Card>
          );
        }}
      />

      <Modal
        visible={!!indicacao}
        onClose={fecharIndicacao}
        title={mostrarListaCandidatos ? 'Quem você indica pra sua vaga?' : 'Recusar presença'}
      >
        <View style={styles.modalCorpo}>
            {!mostrarListaCandidatos ? (
              <>
                <Button title="Indicar alguém" onPress={abrirListaCandidatos} style={styles.modalButton} />
                <Button
                  title="Recusar sem indicar"
                  variant="outline"
                  onPress={() => executarRecusa(null)}
                  style={styles.modalButton}
                />
              </>
            ) : (
              <>
                {carregandoCandidatos ? (
                  <ActivityIndicator color={colors.primary} style={styles.modalLoading} />
                ) : (
                  <ScrollView style={styles.modalList}>
                    {candidatos.length === 0 ? (
                      <Text style={styles.emptyText}>Nenhum candidato disponível no momento.</Text>
                    ) : (
                      candidatos.map((candidato) => (
                        <TouchableOpacity
                          key={candidato.id}
                          style={styles.modalItem}
                          onPress={() => executarRecusa(candidato)}
                        >
                          <Text style={styles.modalItemText}>{candidato.nome}</Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                )}

                <Button
                  title="Voltar"
                  variant="outline"
                  onPress={() => setMostrarListaCandidatos(false)}
                  style={styles.modalButton}
                />
              </>
            )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  list: {
    flex: 1,
  },
  listContent: {
    width: '100%',
    maxWidth: LARGURA_CONTEUDO,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    flexGrow: 1,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  item: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  itemLinha: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitulo: {
    ...typography.body,
    color: colors.text,
  },
  itemTituloNaoLido: {
    fontWeight: '700',
  },
  itemDescricao: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemLado: {
    alignItems: 'flex-end',
    gap: 6,
  },
  itemHora: {
    ...typography.caption,
    color: colors.textMuted,
  },
  dotNaoLido: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  acoes: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acaoBotao: {
    flex: 1,
  },
  modalCorpo: {
    gap: spacing.md,
  },
  modalLoading: {
    marginVertical: spacing.lg,
  },
  modalList: {
    maxHeight: 280,
  },
  modalItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    ...typography.body,
    color: colors.text,
  },
  modalButton: {
    marginTop: spacing.xs,
  },
});
