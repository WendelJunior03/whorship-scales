import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
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
import * as repertorioService from '@/services/repertorio';
import { ApiError } from '@/services/api';
import {
  Culto,
  EscalaAvulsaDoCultoItem,
  EscalaVocalDoCultoItem,
  Repertorio,
  StatusEscalaVocal,
} from '@/types';
import { colors, spacing, typography } from '@/theme';
import { formatDiaCompleto, formatDiaSemana, formatHora } from '@/utils/date';

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
      }));
      const equipeVocal: EquipeItem[] = escalaVocalDoCulto.map((item) => ({
        chave: `vocal-${item.id}`,
        nome: item.nome,
        funcao: 'Vocal',
        status: item.status,
      }));
      const equipeAvulsa: EquipeItem[] = escalaAvulsaDoCulto.map((item) => ({
        chave: `avulsa-${item.id}`,
        nome: item.nome,
        funcao: item.funcao,
        status: item.status,
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
              </TouchableOpacity>
            ))}
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Equipe</Text>
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
            {equipe.map((membro) => (
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
              </View>
            ))}
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
});
