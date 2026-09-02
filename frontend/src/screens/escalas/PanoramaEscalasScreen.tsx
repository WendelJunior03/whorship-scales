import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import * as panoramaService from '@/services/panorama';
import { ApiError } from '@/services/api';
import { MainStackParamList } from '@/navigation/types';
import { Panorama, PanoramaMembro } from '@/types';
import { radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const LARGURA_FUNCAO = 96;
const LARGURA_CELULA = 150;

function mesAtual(): string {
  const agora = new Date();
  return `${agora.getUTCFullYear()}-${String(agora.getUTCMonth() + 1).padStart(2, '0')}`;
}

function rotuloMes(mes: string): string {
  const [ano, m] = mes.split('-').map(Number);
  return `${MESES[(m ?? 1) - 1]} de ${ano}`;
}

function mesVizinho(mes: string, delta: number): string {
  const [ano, m] = mes.split('-').map(Number);
  const d = new Date(Date.UTC(ano, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function PanoramaEscalasScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();

  const [mes, setMes] = useState<string>(mesAtual());
  const [dados, setDados] = useState<Panorama | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async (mesAlvo: string) => {
    setIsLoading(true);
    setError(null);
    try {
      setDados(await panoramaService.getPanorama(mesAlvo));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar o panorama.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar(mes);
  }, [mes, carregar]);

  function abrirCulto(cultoId: number) {
    navigation.navigate('DetalhesCulto', { cultoId });
  }

  const cultos = dados?.cultos ?? [];
  const funcoes = dados?.funcoes ?? [];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Panorama de escalas" showBack />

      <View style={styles.navMes}>
        <TouchableOpacity onPress={() => setMes((m) => mesVizinho(m, -1))} hitSlop={10} accessibilityLabel="Mês anterior">
          <Icon name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navMesLabel}>{rotuloMes(mes)}</Text>
        <TouchableOpacity onPress={() => setMes((m) => mesVizinho(m, 1))} hitSlop={10} accessibilityLabel="Próximo mês">
          <Icon name="chevron-forward" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={64} radius={radius.lg} />
          ))}
        </View>
      ) : error ? (
        <View style={[styles.centered, { flex: 1 }]}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Tentar novamente" variant="outline" onPress={() => carregar(mes)} style={styles.retryButton} />
        </View>
      ) : cultos.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Nenhum culto neste mês"
          description="Troque de mês na seta acima ou crie um culto para ver o panorama."
        />
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              {/* Cabeçalho: coluna de funções + colunas de cultos */}
              <View style={styles.linha}>
                <View style={[styles.celulaFuncaoHeader, styles.celulaBorda]}>
                  <Icon name="calendar-outline" size={16} color={colors.textMuted} />
                </View>
                {cultos.map((c) => {
                  const d = new Date(c.data_hora);
                  const dia = String(d.getUTCDate());
                  const semana = DIAS_SEMANA[d.getUTCDay()];
                  const hora = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.celulaCultoHeader, styles.celulaBorda]}
                      onPress={() => abrirCulto(c.id)}
                    >
                      <Text style={styles.cultoDia}>
                        {dia} <Text style={styles.cultoSemana}>{semana}</Text>
                      </Text>
                      <Text style={styles.cultoHora}>{hora}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Uma linha por função */}
              {funcoes.map((f) => (
                <View key={f} style={styles.linha}>
                  <View style={[styles.celulaFuncao, styles.celulaBorda]}>
                    <Icon name="musical-notes" size={14} color={colors.primary} />
                    <Text style={styles.funcaoNome} numberOfLines={2}>{f}</Text>
                  </View>
                  {cultos.map((c) => {
                    const membros: PanoramaMembro[] = dados?.celulas?.[f]?.[String(c.id)] ?? [];
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.celula, styles.celulaBorda]}
                        onPress={() => abrirCulto(c.id)}
                        activeOpacity={0.7}
                      >
                        {membros.length === 0 ? (
                          <Icon name="add-circle-outline" size={18} color={colors.textMuted} />
                        ) : (
                          membros.map((m) => (
                            <View key={m.membro_id} style={styles.membroRow}>
                              <Avatar nome={m.nome} fotoUrl={m.foto} size={26} />
                              <Text style={styles.membroNome} numberOfLines={1}>{m.nome}</Text>
                            </View>
                          ))
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
          <Text style={styles.dica}>Toque numa coluna ou célula para abrir o culto.</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
    errorText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
    retryButton: { minWidth: 200 },
    navMes: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.lg,
      paddingVertical: spacing.sm,
    },
    navMesLabel: { ...typography.h3, color: colors.text, minWidth: 180, textAlign: 'center' },
    list: { flex: 1 },
    listContent: { padding: spacing.md },
    linha: { flexDirection: 'row' },
    celulaBorda: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
    celulaFuncaoHeader: {
      width: LARGURA_FUNCAO,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    celulaCultoHeader: {
      width: LARGURA_CELULA,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    cultoDia: { ...typography.body, color: colors.text, fontWeight: '700' },
    cultoSemana: { ...typography.caption, color: colors.textSecondary, fontWeight: '400' },
    cultoHora: { ...typography.caption, color: colors.textMuted },
    celulaFuncao: {
      width: LARGURA_FUNCAO,
      minHeight: 64,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      padding: spacing.xs,
      backgroundColor: colors.surface,
    },
    funcaoNome: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
    celula: {
      width: LARGURA_CELULA,
      minHeight: 64,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
      padding: spacing.xs,
    },
    membroRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'stretch' },
    membroNome: { ...typography.caption, color: colors.text, flex: 1 },
    dica: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
  });
