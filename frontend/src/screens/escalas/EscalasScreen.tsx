import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@/components/Icon';
import { Calendar, DateData } from 'react-native-calendars';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EntradaHorario } from '@/components/EntradaHorario';
import { Header } from '@/components/Header';
import { OptionsMenu } from '@/components/OptionsMenu';
import { useAuth } from '@/contexts/AuthContext';
import { MainStackParamList } from '@/navigation/MainNavigator';
import * as cultosService from '@/services/cultos';
import { ApiError } from '@/services/api';
import { CultoResumo } from '@/types';
import { LARGURA_CONTEUDO, radius, spacing, typography, fonts } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { formatDiaSemana, formatHora, montarDataHoraISO } from '@/utils/date';
import { confirmAction } from '@/utils/confirm';

type Aba = 'proximas' | 'anteriores';

function inicioDoDia(d: Date): number {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c.getTime();
}

function diaMesCurto(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
    .format(new Date(iso))
    .replace('.', '');
}

function rotuloRelativo(iso: string): string {
  const dias = Math.round((inicioDoDia(new Date(iso)) - inicioDoDia(new Date())) / 86400000);
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Amanhã';
  if (dias === -1) return 'Ontem';
  return dias > 0 ? `daqui a ${dias} dias` : `há ${Math.abs(dias)} dias`;
}

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

interface Grupo {
  chave: string;
  cultos: CultoResumo[];
}

export function EscalasScreen() {
  const { colors, modo } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const { user } = useAuth();

  const [cultos, setCultos] = useState<CultoResumo[]>([]);
  const [aba, setAba] = useState<Aba>('proximas');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [novoCultoAberto, setNovoCultoAberto] = useState(false);
  const [novaData, setNovaData] = useState<string | null>(null);
  const [novaHora, setNovaHora] = useState('');
  const [novoTipo, setNovoTipo] = useState('');
  const [criandoCulto, setCriandoCulto] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCultos(await cultosService.getResumoCultos());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar as escalas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados]),
  );

  const grupos = useMemo<Grupo[]>(() => {
    const hoje = inicioDoDia(new Date());
    const proximas = aba === 'proximas';
    const filtrados = cultos
      .filter((c) => (proximas ? inicioDoDia(new Date(c.data_hora)) >= hoje : inicioDoDia(new Date(c.data_hora)) < hoje))
      .sort((a, b) => {
        const diff = new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime();
        return proximas ? diff : -diff; // anteriores: mais recente primeiro
      });

    const mapa = new Map<string, CultoResumo[]>();
    for (const c of filtrados) {
      const chave = c.data_hora.slice(0, 10);
      const arr = mapa.get(chave);
      if (arr) arr.push(c);
      else mapa.set(chave, [c]);
    }
    return Array.from(mapa.entries()).map(([chave, lista]) => ({ chave, cultos: lista }));
  }, [cultos, aba]);

  function abrirNovoCulto() {
    setNovaData(null);
    setNovaHora('');
    setNovoTipo('');
    setNovoCultoAberto(true);
  }

  async function handleCriarCulto() {
    if (!novaData || !novaHora.trim()) {
      Alert.alert('Preencha tudo', 'Selecione o dia e informe o horário antes de criar.');
      return;
    }
    const dataHora = montarDataHoraISO(novaData, novaHora.trim());
    if (!dataHora) {
      Alert.alert('Horário inválido', 'Use o formato HH:mm, por exemplo 19:00.');
      return;
    }
    setCriandoCulto(true);
    try {
      const novoCulto = await cultosService.criarCulto({ dataHora, tipo: novoTipo.trim() || null });
      setNovoCultoAberto(false);
      navigation.navigate('DetalhesCulto', { cultoId: novoCulto.id });
    } catch (err) {
      Alert.alert('Erro', err instanceof ApiError ? err.message : 'Não foi possível criar o culto.');
    } finally {
      setCriandoCulto(false);
    }
  }

  function handleExcluirCulto(culto: CultoResumo) {
    confirmAction(
      {
        title: 'Excluir culto',
        message: `Isso apaga "${culto.tipo ?? `Culto de ${formatDiaSemana(culto.data_hora)}`}" e tudo vinculado a ele (repertório, escala de vocal e avulsa). Não tem como desfazer. Confirmar?`,
        confirmLabel: 'Excluir',
      },
      async () => {
        setExcluindoId(culto.id);
        try {
          await cultosService.deletarCulto(culto.id);
          setCultos((prev) => prev.filter((c) => c.id !== culto.id));
        } catch (err) {
          Alert.alert('Erro', err instanceof ApiError ? err.message : 'Não foi possível excluir o culto.');
        } finally {
          setExcluindoId(null);
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

  if (error) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={['top']}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Tentar novamente" onPress={carregarDados} variant="outline" style={styles.retryButton} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Escalas" showBack />

      <ScrollView style={styles.list} contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.panoramaBtn}
          onPress={() => navigation.navigate('PanoramaEscalas')}
          activeOpacity={0.8}
        >
          <Icon name="stats-chart-outline" size={18} color={colors.text} />
          <Text style={styles.panoramaBtnText}>Panorama de escalas</Text>
        </TouchableOpacity>

        <View style={styles.abas}>
          <AbaBotao label="Próximas" ativo={aba === 'proximas'} onPress={() => setAba('proximas')} styles={styles} />
          <AbaBotao label="Anteriores" ativo={aba === 'anteriores'} onPress={() => setAba('anteriores')} styles={styles} />
        </View>

        {grupos.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>
              {aba === 'proximas' ? 'Nenhuma escala futura.' : 'Nenhuma escala anterior.'}
            </Text>
          </Card>
        ) : (
          grupos.map((grupo) => {
            const iso = grupo.cultos[0].data_hora;
            return (
              <View key={grupo.chave} style={styles.grupo}>
                <View style={styles.grupoHeader}>
                  <Text style={styles.grupoData}>{diaMesCurto(iso)}</Text>
                  <Text style={styles.grupoMeta}>
                    {formatDiaSemana(iso)} · {rotuloRelativo(iso)}
                  </Text>
                </View>

                {grupo.cultos.map((culto) => (
                  <Card key={culto.id} style={styles.cultoCard}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('DetalhesCulto', { cultoId: culto.id })}
                      activeOpacity={0.8}
                    >
                      <View style={styles.cultoTopo}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cultoTitulo}>
                            {culto.tipo ?? `Culto de ${formatDiaSemana(culto.data_hora)}`}
                          </Text>
                          <Text style={styles.cultoHora}>{formatHora(culto.data_hora)}</Text>
                        </View>
                        {user?.papel === 'admin' && (
                          <OptionsMenu
                            loading={excluindoId === culto.id}
                            actions={[
                              {
                                label: 'Excluir culto',
                                icon: 'trash-outline',
                                destructive: true,
                                onPress: () => handleExcluirCulto(culto),
                              },
                            ]}
                          />
                        )}
                      </View>

                      {culto.participantes.length > 0 && (
                        <View style={styles.avatares}>
                          {culto.participantes.slice(0, 5).map((p, i) => (
                            <View key={p.membro_id} style={[styles.avatar, i > 0 && styles.avatarSobreposto]}>
                              <Text style={styles.avatarText}>{iniciais(p.nome)}</Text>
                            </View>
                          ))}
                          {culto.participantes.length > 5 && (
                            <View style={[styles.avatar, styles.avatarSobreposto, styles.avatarMais]}>
                              <Text style={styles.avatarText}>+{culto.participantes.length - 5}</Text>
                            </View>
                          )}
                        </View>
                      )}

                      <View style={styles.cultoRodape}>
                        {culto.minha_situacao === 'confirmado' ? (
                          <Badge label="Confirmado" tone="success" />
                        ) : culto.minha_situacao === 'pendente' ? (
                          <Badge label="Pendente" tone="warning" />
                        ) : null}
                        <View style={styles.contador}>
                          <Icon name="musical-notes" size={14} color={colors.textMuted} />
                          <Text style={styles.contadorText}>{culto.total_musicas}</Text>
                        </View>
                        <View style={styles.contador}>
                          <Icon name="chatbubble-ellipses-outline" size={14} color={colors.textMuted} />
                          <Text style={styles.contadorText}>{culto.total_comentarios}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Card>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {user?.papel === 'admin' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={abrirNovoCulto}
          accessibilityRole="button"
          accessibilityLabel="Criar novo culto"
        >
          <Icon name="add" size={28} color={colors.textInverse} />
        </TouchableOpacity>
      )}

      <Modal
        visible={novoCultoAberto}
        animationType="slide"
        transparent
        onRequestClose={() => setNovoCultoAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo culto</Text>

            <Text style={styles.formLabel}>Dia</Text>
            <Calendar
              key={modo}
              current={novaData ?? undefined}
              markedDates={novaData ? { [novaData]: { selected: true, selectedColor: colors.primary } } : {}}
              onDayPress={(day: DateData) => setNovaData(day.dateString)}
              theme={{
                backgroundColor: colors.surface,
                calendarBackground: colors.surface,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.textInverse,
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textMuted,
                monthTextColor: colors.text,
                arrowColor: colors.primary,
              }}
              style={styles.calendar}
            />

            <Text style={styles.formLabel}>Horário</Text>
            <View style={styles.modalInput}>
              <EntradaHorario
                style={styles.modalTextInput}
                placeholder="19:00"
                placeholderTextColor={colors.textMuted}
                value={novaHora}
                onChangeText={setNovaHora}
              />
            </View>

            <Text style={styles.formLabel}>Tipo do culto (opcional)</Text>
            <View style={styles.modalInput}>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Ex: Culto de Oração"
                placeholderTextColor={colors.textMuted}
                value={novoTipo}
                onChangeText={setNovoTipo}
              />
            </View>

            <Button title="Criar culto" onPress={handleCriarCulto} loading={criandoCulto} style={styles.modalButton} />
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setNovoCultoAberto(false)}
              disabled={criandoCulto}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
    list: { flex: 1 },
    content: {
      width: '100%',
      maxWidth: LARGURA_CONTEUDO,
      alignSelf: 'center',
      padding: spacing.lg,
      paddingTop: spacing.sm,
      gap: spacing.sm,
      flexGrow: 1,
    },
    panoramaBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    panoramaBtnText: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
    abas: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
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
    emptyText: { ...typography.bodySmall, color: colors.textSecondary },
    grupo: { gap: spacing.sm },
    grupoHeader: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.sm },
    grupoData: { ...typography.h3, color: colors.text },
    grupoMeta: { ...typography.caption, color: colors.textSecondary },
    cultoCard: { gap: spacing.sm },
    cultoTopo: { flexDirection: 'row', alignItems: 'flex-start' },
    cultoTitulo: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
    cultoHora: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
    avatares: { flexDirection: 'row', marginTop: spacing.xs },
    avatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    avatarSobreposto: { marginLeft: -8 },
    avatarMais: { backgroundColor: colors.surfaceElevated },
    avatarText: { ...typography.caption, color: colors.primary, fontWeight: '700', fontSize: 10 },
    cultoRodape: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
    contador: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    contadorText: { ...typography.caption, color: colors.textMuted },
    fab: {
      position: 'absolute',
      right: spacing.lg,
      bottom: spacing.lg,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: spacing.lg,
      maxHeight: '90%',
    },
    modalTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
    formLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
    calendar: { borderRadius: 14, overflow: 'hidden' },
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
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
    },
    modalButton: { marginTop: spacing.md },
  });
