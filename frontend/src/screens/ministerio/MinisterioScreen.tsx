import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/Icon';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { ministeriosService, membrosService } from '@/services';
import { ApiError } from '@/services/api';
import { papelOrgDe } from '@/utils/papel';
import { Ministerio, MinisterioMembro, Funcao, Equipe, Classificacao, Membro } from '@/types';
import { spacing, radius, typography, fonts } from '@/theme';
import { Cores } from '@/theme/palettes';

type Aba = 'info' | 'membros';
type ModalAberto = 'addMembro' | 'membroAcoes' | 'funcoes' | 'equipes' | 'classificacoes' | null;

export function MinisterioScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const { user } = useAuth();

  // Backend: gerir membros/funções do ministério = administrador OU líder.
  const podeGerenciar = !!user && ['administrador', 'lider'].includes(papelOrgDe(user));
  // Listar todos os membros da org (para adicionar) é restrito a administrador.
  const podeAdicionar = !!user && papelOrgDe(user) === 'administrador';

  const [ministerio, setMinisterio] = useState<Ministerio | null>(null);
  const [membros, setMembros] = useState<MinisterioMembro[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [classificacoes, setClassificacoes] = useState<Classificacao[]>([]);
  const [aba, setAba] = useState<Aba>('info');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalAberto>(null);
  const [membroSelecionadoId, setMembroSelecionadoId] = useState<number | null>(null);
  const [membrosOrg, setMembrosOrg] = useState<Membro[]>([]);
  const [novoNome, setNovoNome] = useState('');
  const [novaCor, setNovaCor] = useState('');
  const [busy, setBusy] = useState(false);
  // Confirmação in-app (dialog próprio, sem Alert/confirm nativo do web).
  const [confirmacao, setConfirmacao] = useState<{
    titulo: string;
    mensagem: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const carregar = useCallback(async (silencioso = false) => {
    if (!silencioso) setIsLoading(true);
    setError(null);
    try {
      const lista = await ministeriosService.listarMinisterios();
      const atual = lista[0] ?? null;
      setMinisterio(atual);
      if (atual) {
        const [ms, fs, es, cs] = await Promise.all([
          ministeriosService.listarMembros(atual.id),
          ministeriosService.listarFuncoes(atual.id),
          ministeriosService.listarEquipes(atual.id),
          ministeriosService.listarClassificacoes(atual.id),
        ]);
        setMembros(ms);
        setFuncoes(fs);
        setEquipes(es);
        setClassificacoes(cs);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar o ministério.');
    } finally {
      if (!silencioso) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const erroAlerta = (e: unknown, fallback: string) => {
    const msg = e instanceof ApiError ? e.message : fallback;
    // Alert.alert do react-native-web não exibe de forma confiável; usa window.alert no web.
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Erro', msg);
    }
  };

  function fecharModal() {
    setModal(null);
    setNovoNome('');
    setNovaCor('');
    setMembroSelecionadoId(null);
  }

  // --- Ações ---

  async function abrirAdicionarMembro() {
    setModal('addMembro');
    try {
      setMembrosOrg(await membrosService.getTodosMembros());
    } catch (e) {
      erroAlerta(e, 'Não foi possível carregar os membros da organização.');
    }
  }

  async function adicionarMembro(membroId: number) {
    if (!ministerio) return;
    setBusy(true);
    try {
      await ministeriosService.adicionarMembro(ministerio.id, membroId);
      fecharModal();
      await carregar(true);
    } catch (e) {
      erroAlerta(e, 'Não foi possível adicionar o membro.');
    } finally {
      setBusy(false);
    }
  }

  function confirmarRemoverMembro(membro: MinisterioMembro) {
    setConfirmacao({
      titulo: 'Remover membro',
      mensagem: `Remover ${membro.nome} deste ministério?`,
      confirmLabel: 'Remover',
      onConfirm: async () => {
        if (!ministerio) return;
        try {
          await ministeriosService.removerMembro(ministerio.id, membro.id);
          fecharModal();
          await carregar(true);
        } catch (e) {
          erroAlerta(e, 'Não foi possível remover o membro.');
        }
      },
    });
  }

  async function alternarFuncao(membro: MinisterioMembro, funcao: Funcao) {
    if (!ministerio) return;
    const tem = membro.funcoes.includes(funcao.nome);
    setBusy(true);
    try {
      if (tem) {
        await ministeriosService.removerFuncaoDoMembro(ministerio.id, membro.id, funcao.id);
      } else {
        await ministeriosService.atribuirFuncao(ministerio.id, membro.id, funcao.id);
      }
      await carregar(true);
    } catch (e) {
      erroAlerta(e, 'Não foi possível atualizar a função.');
    } finally {
      setBusy(false);
    }
  }

  async function criarItem(tipo: 'funcoes' | 'equipes' | 'classificacoes') {
    if (!ministerio || !novoNome.trim()) return;
    setBusy(true);
    try {
      if (tipo === 'funcoes') await ministeriosService.criarFuncao(ministerio.id, novoNome.trim());
      if (tipo === 'equipes') await ministeriosService.criarEquipe(ministerio.id, novoNome.trim());
      if (tipo === 'classificacoes')
        await ministeriosService.criarClassificacao(ministerio.id, novoNome.trim(), novaCor.trim() || null);
      setNovoNome('');
      setNovaCor('');
      await carregar(true);
    } catch (e) {
      erroAlerta(e, 'Não foi possível criar.');
    } finally {
      setBusy(false);
    }
  }

  function apagarItem(tipo: 'funcoes' | 'equipes' | 'classificacoes', id: number) {
    if (!ministerio) return;
    const rotulo = { funcoes: 'função', equipes: 'equipe', classificacoes: 'classificação' }[tipo];
    const nome =
      tipo === 'funcoes'
        ? funcoes.find((f) => f.id === id)?.nome
        : tipo === 'equipes'
          ? equipes.find((e) => e.id === id)?.nome
          : classificacoes.find((c) => c.id === id)?.nome;
    setConfirmacao({
      titulo: `Remover ${rotulo}`,
      mensagem: `Remover a ${rotulo} "${nome ?? ''}"?`,
      confirmLabel: 'Remover',
      onConfirm: async () => {
        try {
          if (tipo === 'funcoes') await ministeriosService.apagarFuncao(ministerio.id, id);
          if (tipo === 'equipes') await ministeriosService.apagarEquipe(ministerio.id, id);
          if (tipo === 'classificacoes') await ministeriosService.apagarClassificacao(ministerio.id, id);
          await carregar(true);
        } catch (e) {
          erroAlerta(e, 'Não foi possível remover.');
        }
      },
    });
  }

  // --- Render ---

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={['top']}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Tentar novamente" onPress={() => carregar()} variant="outline" style={styles.retryButton} />
      </SafeAreaView>
    );
  }

  if (!ministerio) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <Header title="Ministério" showBack />
        <View style={[styles.centered, { flex: 1 }]}>
          <Text style={styles.errorText}>Nenhum ministério encontrado nesta organização.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalMembros = ministerio.total_membros ?? membros.length;
  const vagasTotal = ministerio.vagas_total ?? ministerio.vagas_gratis + ministerio.vagas_extras;
  const membroSelecionado = membros.find((m) => m.id === membroSelecionadoId) ?? null;
  const membrosDisponiveis = membrosOrg.filter((mo) => !membros.some((mm) => mm.id === mo.id));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Ministério" subtitle={ministerio.nome} showBack />

      <View style={styles.abas}>
        <AbaBotao label="Informações" ativo={aba === 'info'} onPress={() => setAba('info')} styles={styles} />
        <AbaBotao
          label={`Membros (${totalMembros}/${vagasTotal})`}
          ativo={aba === 'membros'}
          onPress={() => setAba('membros')}
          styles={styles}
        />
      </View>

      {aba === 'info' ? (
        <FlatList
          style={styles.list}
          data={[]}
          renderItem={null}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.secoes}>
              <Card style={styles.identCard}>
                <View style={styles.identIcon}>
                  <Icon name="business-outline" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.identNome}>{ministerio.nome}</Text>
                  {ministerio.descricao ? <Text style={styles.identDescricao}>{ministerio.descricao}</Text> : null}
                </View>
              </Card>

              <Card>
                <Text style={styles.vagasTitulo}>Vagas</Text>
                <Text style={styles.vagasNumero}>
                  {totalMembros}
                  <Text style={styles.vagasTotalTexto}> / {vagasTotal} membros</Text>
                </Text>
                <View style={styles.vagasBarraFundo}>
                  <View
                    style={[
                      styles.vagasBarra,
                      { width: `${Math.min(100, vagasTotal ? (totalMembros / vagasTotal) * 100 : 0)}%` },
                    ]}
                  />
                </View>
              </Card>

              <Card style={styles.grupoCard}>
                <LinhaInfo
                  icon="grid-outline"
                  label="Equipes"
                  valor={String(equipes.length)}
                  onPress={podeGerenciar ? () => setModal('equipes') : undefined}
                  styles={styles}
                  colors={colors}
                />
                <View style={styles.separador} />
                <LinhaInfo
                  icon="musical-note-outline"
                  label="Funções"
                  valor={String(funcoes.length)}
                  onPress={podeGerenciar ? () => setModal('funcoes') : undefined}
                  styles={styles}
                  colors={colors}
                />
                <View style={styles.separador} />
                <LinhaInfo
                  icon="bookmark-outline"
                  label="Classificações"
                  valor={String(classificacoes.length)}
                  onPress={podeGerenciar ? () => setModal('classificacoes') : undefined}
                  styles={styles}
                  colors={colors}
                />
              </Card>

              <Text style={styles.grupoTitulo}>Integrações</Text>
              <Card style={styles.grupoCard}>
                <LinhaInfo
                  icon="globe-outline"
                  label="Holyrics"
                  descricao="Disponível apenas para administradores do ministério."
                  bloqueado
                  styles={styles}
                  colors={colors}
                />
                <View style={styles.separador} />
                <LinhaInfo
                  icon="key-outline"
                  label="Tokens de API"
                  descricao="Gerenciar chaves de acesso externas."
                  bloqueado
                  styles={styles}
                  colors={colors}
                />
              </Card>
            </View>
          }
        />
      ) : (
        <FlatList
          style={styles.list}
          data={membros}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            podeAdicionar ? (
              <Button title="+ Adicionar membro" onPress={abrirAdicionarMembro} style={styles.addBtn} />
            ) : null
          }
          ListEmptyComponent={
            <Card>
              <Text style={styles.emptyText}>Nenhum membro neste ministério.</Text>
            </Card>
          }
          renderItem={({ item }) => (
            <Card
              style={styles.membroCard}
              onPress={
                podeGerenciar
                  ? () => {
                      setMembroSelecionadoId(item.id);
                      setModal('membroAcoes');
                    }
                  : undefined
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.nome[0]?.toUpperCase()}</Text>
              </View>
              <View style={styles.membroInfo}>
                <Text style={styles.membroNome}>{item.nome}</Text>
                <Text style={styles.membroFuncoes}>
                  {item.funcoes.length ? item.funcoes.join(', ') : 'Sem função'}
                </Text>
              </View>
              {item.papel === 'administrador' ? <Badge label="Admin" tone="primary" /> : null}
              {podeGerenciar ? <Icon name="chevron-forward" size={18} color={colors.textMuted} /> : null}
            </Card>
          )}
        />
      )}

      {/* Modal: adicionar membro */}
      <ModalSheet visible={modal === 'addMembro'} onClose={fecharModal} styles={styles} titulo="Adicionar membro">
        {membrosDisponiveis.length === 0 ? (
          <Text style={styles.emptyText}>Todos os membros da organização já estão no ministério.</Text>
        ) : (
          <FlatList
            data={membrosDisponiveis}
            keyExtractor={(m) => String(m.id)}
            style={styles.modalLista}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickRow}
                disabled={busy}
                onPress={() => adicionarMembro(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.pickNome}>{item.nome}</Text>
                <Icon name="add-circle-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
            )}
          />
        )}
        <Button title="Fechar" variant="outline" onPress={fecharModal} style={styles.modalBtn} />
      </ModalSheet>

      {/* Modal: ações do membro (funções + remover) */}
      <ModalSheet
        visible={modal === 'membroAcoes'}
        onClose={fecharModal}
        styles={styles}
        titulo={membroSelecionado?.nome ?? 'Membro'}
      >
        <Text style={styles.modalSub}>Funções</Text>
        <View style={styles.chips}>
          {funcoes.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma função criada. Crie em Informações → Funções.</Text>
          ) : (
            funcoes.map((f) => {
              const ativo = !!membroSelecionado && membroSelecionado.funcoes.includes(f.nome);
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.chip, ativo && styles.chipAtivo]}
                  disabled={busy || !membroSelecionado}
                  onPress={() => membroSelecionado && alternarFuncao(membroSelecionado, f)}
                >
                  <Text style={[styles.chipText, ativo && styles.chipTextAtivo]}>{f.nome}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        <Button
          title="Remover do ministério"
          variant="outline"
          onPress={() => membroSelecionado && confirmarRemoverMembro(membroSelecionado)}
          style={styles.modalBtn}
        />
        <Button title="Fechar" variant="outline" onPress={fecharModal} style={styles.modalBtn} />
      </ModalSheet>

      {/* Modais de listas: funções / equipes / classificações */}
      <ModalListaGerenciavel
        visible={modal === 'funcoes'}
        onClose={fecharModal}
        titulo="Funções"
        itens={funcoes.map((f) => ({ id: f.id, nome: f.nome }))}
        placeholder="Nova função (ex.: Baixo)"
        novoNome={novoNome}
        setNovoNome={setNovoNome}
        onCriar={() => criarItem('funcoes')}
        onApagar={(id) => apagarItem('funcoes', id)}
        busy={busy}
        styles={styles}
        colors={colors}
      />
      <ModalListaGerenciavel
        visible={modal === 'equipes'}
        onClose={fecharModal}
        titulo="Equipes"
        itens={equipes.map((e) => ({ id: e.id, nome: e.nome, meta: e.total_membros != null ? `${e.total_membros} membro(s)` : undefined }))}
        placeholder="Nova equipe"
        novoNome={novoNome}
        setNovoNome={setNovoNome}
        onCriar={() => criarItem('equipes')}
        onApagar={(id) => apagarItem('equipes', id)}
        busy={busy}
        styles={styles}
        colors={colors}
      />
      <ModalListaGerenciavel
        visible={modal === 'classificacoes'}
        onClose={fecharModal}
        titulo="Classificações"
        itens={classificacoes.map((c) => ({ id: c.id, nome: c.nome }))}
        placeholder="Nova classificação (ex.: Titular)"
        novoNome={novoNome}
        setNovoNome={setNovoNome}
        onCriar={() => criarItem('classificacoes')}
        onApagar={(id) => apagarItem('classificacoes', id)}
        busy={busy}
        styles={styles}
        colors={colors}
      />

      {/* Dialog de confirmação (in-app, sem Alert/confirm nativo) */}
      <Modal
        visible={!!confirmacao}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmacao(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitulo}>{confirmacao?.titulo}</Text>
            <Text style={styles.confirmMensagem}>{confirmacao?.mensagem}</Text>
            <View style={styles.confirmBotoes}>
              <Button
                title="Cancelar"
                variant="outline"
                onPress={() => setConfirmacao(null)}
                style={styles.confirmBotao}
              />
              <Button
                title={confirmacao?.confirmLabel ?? 'Confirmar'}
                onPress={() => {
                  const fn = confirmacao?.onConfirm;
                  setConfirmacao(null);
                  fn?.();
                }}
                style={styles.confirmBotao}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- Subcomponentes ---

function AbaBotao({
  label,
  ativo,
  onPress,
  styles,
}: {
  label: string;
  ativo: boolean;
  onPress: () => void;
  styles: ReturnType<typeof criarEstilos>;
}) {
  return (
    <TouchableOpacity style={[styles.aba, ativo && styles.abaAtiva]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.abaText, ativo && styles.abaTextAtivo]}>{label}</Text>
    </TouchableOpacity>
  );
}

function LinhaInfo({
  icon,
  label,
  valor,
  styles,
  colors,
  bloqueado,
  descricao,
  onPress,
}: {
  icon: IconName;
  label: string;
  valor?: string;
  styles: ReturnType<typeof criarEstilos>;
  colors: Cores;
  bloqueado?: boolean;
  descricao?: string;
  onPress?: () => void;
}) {
  const conteudo = (
    <View style={styles.linha}>
      <View style={[styles.linhaIcon, bloqueado && styles.linhaIconBloqueada]}>
        <Icon name={icon} size={18} color={bloqueado ? colors.textMuted : colors.primary} />
      </View>
      <View style={styles.linhaInfo}>
        <Text style={[styles.linhaLabel, bloqueado && styles.linhaLabelBloqueada]}>{label}</Text>
        {descricao ? <Text style={styles.linhaDescricao}>{descricao}</Text> : null}
      </View>
      {valor ? <Text style={styles.linhaValor}>{valor}</Text> : null}
      {bloqueado ? <Icon name="lock-closed-outline" size={16} color={colors.textMuted} /> : null}
      {onPress ? <Icon name="chevron-forward" size={16} color={colors.textMuted} /> : null}
    </View>
  );
  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {conteudo}
    </TouchableOpacity>
  ) : (
    conteudo
  );
}

function ModalSheet({
  visible,
  onClose,
  titulo,
  children,
  styles,
}: {
  visible: boolean;
  onClose: () => void;
  titulo: string;
  children: React.ReactNode;
  styles: ReturnType<typeof criarEstilos>;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitulo}>{titulo}</Text>
          {children}
        </View>
      </View>
    </Modal>
  );
}

function ModalListaGerenciavel({
  visible,
  onClose,
  titulo,
  itens,
  placeholder,
  novoNome,
  setNovoNome,
  onCriar,
  onApagar,
  busy,
  styles,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  titulo: string;
  itens: { id: number; nome: string; meta?: string }[];
  placeholder: string;
  novoNome: string;
  setNovoNome: (v: string) => void;
  onCriar: () => void;
  onApagar: (id: number) => void;
  busy: boolean;
  styles: ReturnType<typeof criarEstilos>;
  colors: Cores;
}) {
  return (
    <ModalSheet visible={visible} onClose={onClose} titulo={titulo} styles={styles}>
      {itens.length === 0 ? (
        <Text style={styles.emptyText}>Nada criado ainda.</Text>
      ) : (
        <View style={styles.modalLista}>
          {itens.map((it) => (
            <View key={it.id} style={styles.pickRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickNome}>{it.nome}</Text>
                {it.meta ? <Text style={styles.linhaDescricao}>{it.meta}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => onApagar(it.id)} hitSlop={8}>
                <Icon name="trash-outline" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <Input icon="create-outline" placeholder={placeholder} value={novoNome} onChangeText={setNovoNome} containerStyle={styles.modalInput} />
      <Button title="Adicionar" onPress={onCriar} loading={busy} disabled={!novoNome.trim()} style={styles.modalBtn} />
      <Button title="Fechar" variant="outline" onPress={onClose} style={styles.modalBtn} />
    </ModalSheet>
  );
}

const criarEstilos = (colors: Cores) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    errorText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
    retryButton: { minWidth: 200 },
    abas: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    aba: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    abaAtiva: { backgroundColor: colors.primary, borderColor: colors.primary },
    abaText: { ...typography.bodySmall, color: colors.textSecondary },
    abaTextAtivo: { color: colors.textInverse, fontFamily: fonts.semibold },
    list: { flex: 1 },
    listContent: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm, flexGrow: 1 },
    secoes: { gap: spacing.sm },
    identCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    identIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    identNome: { ...typography.h3, color: colors.text },
    identDescricao: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    vagasTitulo: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase' },
    vagasNumero: { ...typography.h2, color: colors.text, marginTop: 2 },
    vagasTotalTexto: { ...typography.body, color: colors.textSecondary },
    vagasBarraFundo: {
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceElevated,
      marginTop: spacing.sm,
      overflow: 'hidden',
    },
    vagasBarra: { height: 6, borderRadius: radius.pill, backgroundColor: colors.primary },
    grupoTitulo: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
    grupoCard: { gap: 0, paddingVertical: spacing.xs },
    linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
    linhaIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    linhaIconBloqueada: { backgroundColor: colors.surfaceElevated },
    linhaInfo: { flex: 1 },
    linhaLabel: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
    linhaLabelBloqueada: { color: colors.textSecondary },
    linhaDescricao: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
    linhaValor: { ...typography.body, color: colors.textSecondary },
    separador: { height: 1, backgroundColor: colors.border },
    emptyText: { ...typography.bodySmall, color: colors.textSecondary },
    addBtn: { marginBottom: spacing.sm },
    membroCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { ...typography.body, color: colors.primary, fontWeight: '700' },
    membroInfo: { flex: 1 },
    membroNome: { ...typography.body, color: colors.text, fontWeight: '600' },
    membroFuncoes: { ...typography.caption, color: colors.textSecondary },
    // Modais
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modal: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: spacing.lg,
      gap: spacing.sm,
      maxHeight: '80%',
    },
    modalTitulo: { ...typography.h3, color: colors.text },
    modalSub: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase' },
    modalLista: { maxHeight: 320 },
    modalInput: { marginTop: spacing.xs },
    modalBtn: { marginTop: spacing.xs },
    pickRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickNome: { ...typography.body, color: colors.text },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { ...typography.bodySmall, color: colors.textSecondary },
    chipTextAtivo: { color: colors.textInverse, fontFamily: fonts.semibold },
    // Dialog de confirmação (centralizado)
    confirmOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    confirmCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    confirmTitulo: { ...typography.h3, color: colors.text },
    confirmMensagem: { ...typography.body, color: colors.textSecondary },
    confirmBotoes: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    confirmBotao: { flex: 1 },
  });
