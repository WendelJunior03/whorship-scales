import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/Icon';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { ministeriosService } from '@/services';
import { ApiError } from '@/services/api';
import { Ministerio, MinisterioMembro, Funcao, Equipe, Classificacao } from '@/types';
import { spacing, radius, typography, fonts } from '@/theme';
import { Cores } from '@/theme/palettes';

type Aba = 'info' | 'membros';

export function MinisterioScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);

  const [ministerio, setMinisterio] = useState<Ministerio | null>(null);
  const [membros, setMembros] = useState<MinisterioMembro[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [classificacoes, setClassificacoes] = useState<Classificacao[]>([]);
  const [aba, setAba] = useState<Aba>('info');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Na v1 há um ministério por organização; usa o primeiro.
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
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

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
        <Button title="Tentar novamente" onPress={carregar} variant="outline" style={styles.retryButton} />
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
        <InfoTab
          ministerio={ministerio}
          totalMembros={totalMembros}
          vagasTotal={vagasTotal}
          funcoes={funcoes}
          equipes={equipes}
          classificacoes={classificacoes}
          styles={styles}
          colors={colors}
        />
      ) : (
        <MembrosTab membros={membros} styles={styles} colors={colors} />
      )}
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

function LinhaInfo({
  icon,
  label,
  valor,
  styles,
  colors,
  bloqueado,
  descricao,
}: {
  icon: IconName;
  label: string;
  valor?: string;
  styles: ReturnType<typeof criarEstilos>;
  colors: Cores;
  bloqueado?: boolean;
  descricao?: string;
}) {
  return (
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
    </View>
  );
}

function InfoTab({
  ministerio,
  totalMembros,
  vagasTotal,
  funcoes,
  equipes,
  classificacoes,
  styles,
  colors,
}: {
  ministerio: Ministerio;
  totalMembros: number;
  vagasTotal: number;
  funcoes: Funcao[];
  equipes: Equipe[];
  classificacoes: Classificacao[];
  styles: ReturnType<typeof criarEstilos>;
  colors: Cores;
}) {
  return (
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
              {ministerio.descricao ? (
                <Text style={styles.identDescricao}>{ministerio.descricao}</Text>
              ) : null}
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
            <LinhaInfo icon="grid-outline" label="Equipes" valor={String(equipes.length)} styles={styles} colors={colors} />
            <View style={styles.separador} />
            <LinhaInfo icon="musical-note-outline" label="Funções" valor={String(funcoes.length)} styles={styles} colors={colors} />
            <View style={styles.separador} />
            <LinhaInfo icon="bookmark-outline" label="Classificações" valor={String(classificacoes.length)} styles={styles} colors={colors} />
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
  );
}

function MembrosTab({
  membros,
  styles,
  colors,
}: {
  membros: MinisterioMembro[];
  styles: ReturnType<typeof criarEstilos>;
  colors: Cores;
}) {
  return (
    <FlatList
      style={styles.list}
      data={membros}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <Card>
          <Text style={styles.emptyText}>Nenhum membro neste ministério.</Text>
        </Card>
      }
      renderItem={({ item }) => (
        <Card style={styles.membroCard}>
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
          <Icon name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      )}
    />
  );
}

const criarEstilos = (colors: Cores) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
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
    abaAtiva: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    abaText: {
      ...typography.bodySmall,
      color: colors.textSecondary,
    },
    abaTextAtivo: {
      color: colors.textInverse,
      fontFamily: fonts.semibold,
    },
    list: {
      flex: 1,
    },
    listContent: {
      padding: spacing.lg,
      paddingTop: spacing.sm,
      gap: spacing.sm,
      flexGrow: 1,
    },
    secoes: {
      gap: spacing.sm,
    },
    identCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    identIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    identNome: {
      ...typography.h3,
      color: colors.text,
    },
    identDescricao: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    vagasTitulo: {
      ...typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    vagasNumero: {
      ...typography.h2,
      color: colors.text,
      marginTop: 2,
    },
    vagasTotalTexto: {
      ...typography.body,
      color: colors.textSecondary,
    },
    vagasBarraFundo: {
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceElevated,
      marginTop: spacing.sm,
      overflow: 'hidden',
    },
    vagasBarra: {
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
    },
    grupoTitulo: {
      ...typography.h3,
      color: colors.text,
      marginTop: spacing.sm,
    },
    grupoCard: {
      gap: 0,
      paddingVertical: spacing.xs,
    },
    linha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    linhaIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    linhaIconBloqueada: {
      backgroundColor: colors.surfaceElevated,
    },
    linhaInfo: {
      flex: 1,
    },
    linhaLabel: {
      ...typography.body,
      color: colors.text,
      fontFamily: fonts.semibold,
    },
    linhaLabelBloqueada: {
      color: colors.textSecondary,
    },
    linhaDescricao: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 1,
    },
    linhaValor: {
      ...typography.body,
      color: colors.textSecondary,
    },
    separador: {
      height: 1,
      backgroundColor: colors.border,
    },
    emptyText: {
      ...typography.bodySmall,
      color: colors.textSecondary,
    },
    membroCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '700',
    },
    membroInfo: {
      flex: 1,
    },
    membroNome: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    membroFuncoes: {
      ...typography.caption,
      color: colors.textSecondary,
    },
  });
