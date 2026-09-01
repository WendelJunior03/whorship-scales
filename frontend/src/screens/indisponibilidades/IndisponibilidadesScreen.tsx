import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { podeGerir } from '@/utils/papel';
import { confirmAction, notifyAction } from '@/utils/confirm';
import { ministeriosService } from '@/services';
import * as indispService from '@/services/indisponibilidades';
import { ApiError } from '@/services/api';
import {
  Indisponibilidade,
  Ministerio,
  MinisterioMembro,
  PeriodoIndisp,
} from '@/types';
import { spacing, radius, typography, fonts } from '@/theme';
import { Cores } from '@/theme/palettes';

// --- Helpers de data (parse local, sem fuso, YYYY-MM-DD) ---

const DIAS_SEMANA = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado',
];
const DIAS_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function dataDe(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}
function isoDe(dt: Date): string {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}
function hojeIso(): string {
  return isoDe(new Date());
}
function dataLonga(iso: string): string {
  const dt = dataDe(iso);
  return `${DIAS_SEMANA[dt.getDay()]}, ${dt.getDate()} de ${MESES[dt.getMonth()]}`;
}
function dataCurta(iso: string): string {
  const dt = dataDe(iso);
  return `${DIAS_CURTO[dt.getDay()]}, ${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}
function diasDoIntervalo(inicio: string, fim: string): string[] {
  const res: string[] = [];
  const dt = dataDe(inicio);
  const f = dataDe(fim);
  while (dt <= f) {
    res.push(isoDe(dt));
    dt.setDate(dt.getDate() + 1);
  }
  return res;
}
/** `alvo` está dentro de [inicio, fim]? (comparação lexicográfica de ISO). */
function noIntervalo(alvo: string, inicio: string, fim: string): boolean {
  return alvo >= inicio && alvo <= fim;
}

// --- Metadados de período ---

interface MetaPeriodo {
  label: string;
  icon: IconName;
  inicio: string;
  fim: string;
}
const PERIODOS: { key: PeriodoIndisp; meta: MetaPeriodo }[] = [
  { key: 'dia_inteiro', meta: { label: 'Dia inteiro', icon: 'calendar-outline', inicio: '00:00', fim: '23:59' } },
  { key: 'matutino', meta: { label: 'Matutino', icon: 'sunny-outline', inicio: '00:00', fim: '11:59' } },
  { key: 'vespertino', meta: { label: 'Vespertino', icon: 'partly-sunny-outline', inicio: '12:00', fim: '17:59' } },
  { key: 'noturno', meta: { label: 'Noturno', icon: 'moon-outline', inicio: '18:00', fim: '23:59' } },
];
function metaDe(p: PeriodoIndisp): MetaPeriodo {
  return PERIODOS.find((x) => x.key === p)?.meta ?? PERIODOS[0].meta;
}

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

export function IndisponibilidadesScreen() {
  const { user } = useAuth();
  const { colors, modo } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const { isDesktop } = useBreakpoint();
  const gestor = !!user && podeGerir(user);

  const [ministerio, setMinisterio] = useState<Ministerio | null>(null);
  const [membros, setMembros] = useState<MinisterioMembro[]>([]);
  const [lista, setLista] = useState<Indisponibilidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [busca, setBusca] = useState('');
  const [verTodos, setVerTodos] = useState(false); // gestor: agregado do ministério
  const [membroSelId, setMembroSelId] = useState<number | null>(user?.id ?? null);
  const [diaSel, setDiaSel] = useState<string>(hojeIso());

  // Modal / formulário
  const [modalAberto, setModalAberto] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [fDescricao, setFDescricao] = useState('');
  const [fPeriodo, setFPeriodo] = useState<PeriodoIndisp>('dia_inteiro');
  const [fInicio, setFInicio] = useState<string>(hojeIso());
  const [fFim, setFFim] = useState<string>(hojeIso());
  const [pickerAlvo, setPickerAlvo] = useState<'inicio' | 'fim' | null>(null);
  const [busy, setBusy] = useState(false);

  const carregarLista = useCallback(
    async (min: Ministerio | null) => {
      try {
        let dados: Indisponibilidade[];
        if (gestor && verTodos && min) {
          dados = await indispService.listarPorMinisterio(min.id);
        } else if (membroSelId) {
          dados = await indispService.listarPorMembro(membroSelId);
        } else {
          dados = await indispService.listarMinhas();
        }
        setLista(dados);
      } catch (e) {
        setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar as indisponibilidades.');
      }
    },
    [gestor, verTodos, membroSelId],
  );

  const carregarBase = useCallback(async () => {
    setIsLoading(true);
    setErro(null);
    try {
      const ministerios = await ministeriosService.listarMinisterios();
      const atual = ministerios[0] ?? null;
      setMinisterio(atual);
      if (gestor && atual) {
        setMembros(await ministeriosService.listarMembros(atual.id));
      }
      await carregarLista(atual);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar as indisponibilidades.');
    } finally {
      setIsLoading(false);
    }
  }, [gestor, carregarLista]);

  useEffect(() => {
    carregarBase();
  }, []);

  // Recarrega a lista quando muda o membro/agregação selecionado.
  useEffect(() => {
    if (!isLoading) carregarLista(ministerio);
  }, [membroSelId, verTodos]);

  const membroSel = membros.find((m) => m.id === membroSelId) ?? null;

  const marcados = useMemo(() => {
    const mapa: Record<
      string,
      { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string; selectedTextColor?: string }
    > = {};
    for (const ind of lista) {
      for (const dia of diasDoIntervalo(ind.data_inicio, ind.data_fim)) {
        mapa[dia] = { ...mapa[dia], marked: true, dotColor: colors.primary };
      }
    }
    mapa[diaSel] = {
      ...mapa[diaSel],
      selected: true,
      selectedColor: colors.primary,
      selectedTextColor: colors.textInverse,
    };
    return mapa;
  }, [lista, diaSel, colors]);

  const doDia = useMemo(
    () => lista.filter((i) => noIntervalo(diaSel, i.data_inicio, i.data_fim)),
    [lista, diaSel],
  );

  const membrosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? membros.filter((m) => m.nome.toLowerCase().includes(q)) : membros;
  }, [membros, busca]);

  function abrirNovo() {
    setEditId(null);
    setFDescricao('');
    setFPeriodo('dia_inteiro');
    setFInicio(diaSel);
    setFFim(diaSel);
    setPickerAlvo(null);
    setModalAberto(true);
  }

  function abrirEdicao(ind: Indisponibilidade) {
    setEditId(ind.id);
    setFDescricao(ind.descricao ?? '');
    setFPeriodo(ind.periodo);
    setFInicio(ind.data_inicio);
    setFFim(ind.data_fim);
    setPickerAlvo(null);
    setModalAberto(true);
  }

  function escolherData(iso: string) {
    if (pickerAlvo === 'inicio') {
      setFInicio(iso);
      if (iso > fFim) setFFim(iso);
    } else if (pickerAlvo === 'fim') {
      if (iso < fInicio) setFInicio(iso);
      setFFim(iso);
    }
    setPickerAlvo(null);
  }

  async function salvar() {
    if (!fDescricao.trim()) {
      notifyAction('Descrição obrigatória', 'Escreva um motivo para a indisponibilidade.');
      return;
    }
    setBusy(true);
    try {
      const input: indispService.SalvarIndispInput = {
        descricao: fDescricao.trim(),
        periodo: fPeriodo,
        dataInicio: fInicio,
        dataFim: fFim,
        recorrencia: 'nenhuma',
        ministerioId: ministerio?.id ?? null,
        // Gestor pode criar pra outro membro; senão, o back usa o próprio.
        ...(gestor && membroSelId && membroSelId !== user?.id ? { membroId: membroSelId } : {}),
      };
      if (editId) {
        await indispService.atualizar(editId, input);
      } else {
        await indispService.criar(input);
      }
      setModalAberto(false);
      setDiaSel(fInicio);
      await carregarLista(ministerio);
    } catch (e) {
      notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    } finally {
      setBusy(false);
    }
  }

  function excluir(ind: Indisponibilidade) {
    confirmAction(
      {
        title: 'Remover indisponibilidade',
        message: 'Deseja mesmo remover esta indisponibilidade?',
        confirmLabel: 'Remover',
        destructive: true,
      },
      async () => {
        try {
          await indispService.deletar(ind.id);
          await carregarLista(ministerio);
        } catch (e) {
          notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível remover.');
        }
      },
    );
  }

  const tituloSub = verTodos
    ? `${ministerio?.nome ?? ''} · todos`
    : gestor && membroSel && membroSel.id !== user?.id
      ? membroSel.nome
      : ministerio?.nome ?? 'Minhas datas';

  const podeAdicionar = !verTodos;

  const calendarTheme = {
    backgroundColor: colors.surface,
    calendarBackground: colors.surface,
    textSectionTitleColor: colors.textSecondary,
    selectedDayBackgroundColor: colors.primary,
    selectedDayTextColor: colors.textInverse,
    todayTextColor: colors.primary,
    dayTextColor: colors.text,
    textDisabledColor: colors.textMuted,
    dotColor: colors.primary,
    monthTextColor: colors.text,
    arrowColor: colors.primary,
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <Header title="Indisponibilidades" subtitle={ministerio?.nome} showBack />
        <View style={styles.scrollConteudo}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={64} radius={radius.lg} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const painelMembros = gestor ? (
    <View style={[styles.painel, isDesktop && styles.painelDesktop]}>
      <Text style={styles.painelTitulo}>Membros</Text>
      <Button
        title={verTodos ? 'Ver por membro' : 'Selecionar todos'}
        variant={verTodos ? 'primary' : 'outline'}
        onPress={() => setVerTodos((v) => !v)}
        style={styles.selTodos}
      />
      <View style={styles.buscaWrap}>
        <Icon name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Pesquisar"
          placeholderTextColor={colors.textMuted}
          style={styles.buscaInput}
        />
      </View>
      <ScrollView style={styles.membrosLista} showsVerticalScrollIndicator={false}>
        {membrosFiltrados.map((m) => {
          const ativo = !verTodos && m.id === membroSelId;
          return (
            <TouchableOpacity
              key={m.id}
              style={[styles.membroRow, ativo && styles.membroRowAtivo]}
              onPress={() => {
                setVerTodos(false);
                setMembroSelId(m.id);
              }}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{iniciais(m.nome)}</Text>
              </View>
              <Text style={styles.membroNome} numberOfLines={2}>
                {m.nome}
              </Text>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          );
        })}
        {membrosFiltrados.length === 0 && <Text style={styles.vazioTexto}>Nenhum membro encontrado.</Text>}
      </ScrollView>
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Indisponibilidades" subtitle={tituloSub} showBack />

      {erro && (
        <View style={styles.erroBanner}>
          <Text style={styles.erroTexto}>{erro}</Text>
        </View>
      )}

      <View style={[styles.corpo, isDesktop && styles.corpoDesktop]}>
        <View style={styles.colEsquerda}>
          <ScrollView contentContainerStyle={styles.scrollConteudo} showsVerticalScrollIndicator={false}>
            <Card style={styles.calendarCard}>
              <Calendar
                key={modo}
                current={diaSel}
                markedDates={marcados}
                onDayPress={(d: { dateString: string }) => setDiaSel(d.dateString)}
                theme={calendarTheme}
              />
            </Card>

            {doDia.length > 0 ? (
              doDia.map((ind) => (
                <TouchableOpacity key={ind.id} activeOpacity={0.7} onPress={() => abrirEdicao(ind)}>
                  <Card style={styles.itemDia}>
                    <View style={styles.itemIcone}>
                      <Icon name={metaDe(ind.periodo).icon} size={22} color={colors.primary} />
                    </View>
                    <View style={styles.itemTextos}>
                      <Text style={styles.itemTitulo}>
                        {ind.data_inicio === ind.data_fim
                          ? dataLonga(ind.data_inicio)
                          : `${dataLonga(ind.data_inicio)} — ${dataLonga(ind.data_fim)}`}
                      </Text>
                      <Text style={styles.itemSub}>
                        {metaDe(ind.periodo).label}
                        {verTodos && ind.membro_nome ? ` · ${ind.membro_nome}` : ''}
                        {ministerio ? ` · ${ministerio.nome}` : ''}
                      </Text>
                      {ind.descricao ? <Text style={styles.itemDesc}>{ind.descricao}</Text> : null}
                    </View>
                    {!verTodos && (
                      <TouchableOpacity onPress={() => excluir(ind)} hitSlop={8} style={styles.itemLixo}>
                        <Icon name="trash-outline" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </Card>
                </TouchableOpacity>
              ))
            ) : (
              <EmptyState
                icon="calendar-off"
                title="Nenhuma indisponibilidade"
                description={`Nada registrado em ${dataLonga(diaSel)}.`}
              />
            )}

            {/* No mobile o painel de membros entra AQUI dentro (rola junto com o calendário) —
                fora, como no desktop, ele brigava por altura com essa coluna (ambos dentro de
                um `corpo` de altura fixa) e espremia o calendário, fazendo o FAB flutuar em
                cima dele em vez de no rodapé da tela. */}
            {!isDesktop && painelMembros}
            <View style={{ height: 96 }} />
          </ScrollView>

          {podeAdicionar && (
            <TouchableOpacity style={styles.fab} onPress={abrirNovo} accessibilityRole="button">
              <Icon name="add-circle-outline" size={22} color={colors.textInverse} />
              <Text style={styles.fabTexto}>Adicionar</Text>
            </TouchableOpacity>
          )}
        </View>

        {isDesktop && painelMembros}
      </View>

      {/* Modal: Nova / Editar indisponibilidade */}
      <Modal visible={modalAberto} animationType="slide" transparent onRequestClose={() => setModalAberto(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalAberto(false)} hitSlop={8}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitulo}>{editId ? 'Editar Indisponibilidade' : 'Nova Indisponibilidade'}</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {/* Descrição */}
              <View style={styles.campoDesc}>
                <TextInput
                  value={fDescricao}
                  onChangeText={(t) => setFDescricao(t.slice(0, 500))}
                  placeholder="Descrição *"
                  placeholderTextColor={colors.textMuted}
                  style={styles.descInput}
                  multiline
                />
                <Text style={styles.contador}>{fDescricao.length}/500</Text>
              </View>
              <Text style={styles.ajuda}>
                Apenas os administradores do ministério podem visualizar a descrição da indisponibilidade.
              </Text>

              {/* Período do dia */}
              <View style={styles.secTitulo}>
                <Icon name="time-outline" size={18} color={colors.text} />
                <Text style={styles.secTituloTexto}>Período do dia</Text>
              </View>
              <View style={styles.periodos}>
                {PERIODOS.map(({ key, meta }) => {
                  const ativo = fPeriodo === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.periodoChip, ativo && styles.periodoChipAtivo]}
                      onPress={() => setFPeriodo(key)}
                    >
                      <Icon name={meta.icon} size={16} color={ativo ? colors.textInverse : colors.textSecondary} />
                      <Text style={[styles.periodoTexto, ativo && styles.periodoTextoAtivo]}>{meta.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Início / Término */}
              <View style={styles.intervalo}>
                <Pressable
                  style={styles.intervaloRow}
                  onPress={() => setPickerAlvo((a) => (a === 'inicio' ? null : 'inicio'))}
                >
                  <View>
                    <Text style={styles.intervaloLabel}>Início</Text>
                    <Text style={styles.intervaloData}>{dataCurta(fInicio)}</Text>
                  </View>
                  <Text style={styles.intervaloHora}>{metaDe(fPeriodo).inicio}</Text>
                </Pressable>
                <View style={styles.divisor} />
                <Pressable
                  style={styles.intervaloRow}
                  onPress={() => setPickerAlvo((a) => (a === 'fim' ? null : 'fim'))}
                >
                  <View>
                    <Text style={styles.intervaloLabel}>Término</Text>
                    <Text style={styles.intervaloData}>{dataCurta(fFim)}</Text>
                  </View>
                  <Text style={styles.intervaloHora}>{metaDe(fPeriodo).fim}</Text>
                </Pressable>
              </View>

              {pickerAlvo && (
                <Card style={styles.pickerCard}>
                  <Calendar
                    key={`${modo}-${pickerAlvo}`}
                    current={pickerAlvo === 'inicio' ? fInicio : fFim}
                    markedDates={{
                      [pickerAlvo === 'inicio' ? fInicio : fFim]: {
                        selected: true,
                        selectedColor: colors.primary,
                        selectedTextColor: colors.textInverse,
                      },
                    }}
                    onDayPress={(d: { dateString: string }) => escolherData(d.dateString)}
                    theme={calendarTheme}
                  />
                </Card>
              )}

              {/* Recorrência (v1: só "Não se repete") */}
              <View style={styles.recorrencia}>
                <Icon name="repeat-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.recorrenciaTexto}>Não se repete</Text>
              </View>
            </ScrollView>

            <View style={styles.modalAcoes}>
              {editId && (
                <Button
                  title="Excluir"
                  variant="outline"
                  onPress={() => {
                    const alvo = lista.find((i) => i.id === editId);
                    setModalAberto(false);
                    if (alvo) excluir(alvo);
                  }}
                  style={styles.btnExcluir}
                />
              )}
              <Button
                title={busy ? 'Salvando...' : 'Salvar'}
                onPress={salvar}
                disabled={busy}
                style={styles.btnSalvar}
              />
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
    corpo: { flex: 1 },
    corpoDesktop: { flexDirection: 'row' },
    colEsquerda: { flex: 1 },
    scrollConteudo: { padding: spacing.lg, gap: spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
    calendarCard: { padding: spacing.sm },

    erroBanner: { backgroundColor: colors.error, padding: spacing.sm, margin: spacing.md, borderRadius: radius.md },
    erroTexto: { ...typography.bodySmall, color: colors.textInverse, textAlign: 'center' },

    // Item do dia
    itemDia: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
    itemIcone: {
      width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primarySoft,
      alignItems: 'center', justifyContent: 'center',
    },
    itemTextos: { flex: 1, gap: 2 },
    itemTitulo: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
    itemSub: { ...typography.caption, color: colors.textSecondary },
    itemDesc: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    itemLixo: { padding: spacing.xs },

    // FAB Adicionar
    fab: {
      position: 'absolute', right: spacing.lg, bottom: spacing.lg,
      flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
      backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
    },
    fabTexto: { ...typography.body, color: colors.textInverse, fontFamily: fonts.semibold },

    // Painel de membros
    painel: { borderTopColor: colors.border, borderTopWidth: 1, padding: spacing.lg, gap: spacing.sm, maxHeight: 320 },
    painelDesktop: {
      width: 320, borderTopWidth: 0, borderLeftColor: colors.border, borderLeftWidth: 1, maxHeight: undefined,
    },
    painelTitulo: { ...typography.h3, color: colors.text },
    selTodos: {},
    buscaWrap: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
      backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: spacing.md, height: 44,
    },
    buscaInput: { flex: 1, ...typography.body, color: colors.text },
    membrosLista: { flex: 1 },
    membroRow: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm, borderRadius: radius.md,
    },
    membroRowAtivo: { backgroundColor: colors.primarySoft },
    avatar: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { ...typography.caption, color: colors.primary, fontFamily: fonts.semibold },
    membroNome: { flex: 1, ...typography.body, color: colors.text },
    vazioTexto: { ...typography.bodySmall, color: colors.textMuted, paddingVertical: spacing.md },

    // Modal
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modal: {
      backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg,
      maxHeight: '92%', gap: spacing.sm,
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    modalTitulo: { ...typography.h3, color: colors.text },
    modalScroll: { gap: spacing.md, paddingBottom: spacing.md },

    campoDesc: {
      borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
      paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs,
    },
    descInput: { ...typography.body, color: colors.text, minHeight: 48, textAlignVertical: 'top' },
    contador: { ...typography.caption, color: colors.textMuted, alignSelf: 'flex-end' },
    ajuda: { ...typography.caption, color: colors.textSecondary },

    secTitulo: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
    secTituloTexto: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
    periodos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    periodoChip: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
      paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
      borderRadius: radius.pill, backgroundColor: colors.surfaceMuted,
    },
    periodoChipAtivo: { backgroundColor: colors.primary },
    periodoTexto: { ...typography.bodySmall, color: colors.textSecondary },
    periodoTextoAtivo: { color: colors.textInverse, fontFamily: fonts.semibold },

    intervalo: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
    intervaloRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md,
    },
    intervaloLabel: { ...typography.caption, color: colors.textSecondary },
    intervaloData: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
    intervaloHora: { ...typography.body, color: colors.primary, fontFamily: fonts.semibold },
    divisor: { height: 1, backgroundColor: colors.border },
    pickerCard: { padding: spacing.sm },

    recorrencia: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md,
    },
    recorrenciaTexto: { ...typography.body, color: colors.textSecondary },

    modalAcoes: { flexDirection: 'row', gap: spacing.sm },
    btnExcluir: { flex: 1 },
    btnSalvar: { flex: 1 },
  });
