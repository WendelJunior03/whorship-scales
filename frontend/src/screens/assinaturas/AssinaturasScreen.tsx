import React, { useCallback, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { confirmAction, notifyAction } from '@/utils/confirm';
import * as assinaturasService from '@/services/assinaturas';
import { ApiError } from '@/services/api';
import { Assinatura, Ministerio } from '@/types';
import { spacing, radius, typography, fonts } from '@/theme';
import { Cores } from '@/theme/palettes';

export function AssinaturasScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);

  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [resumo, setResumo] = useState({ comprado: 0, alocado: 0, disponivel: 0 });
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modal, setModal] = useState(false);
  const [qtd, setQtd] = useState('10');
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const dados = await assinaturasService.getAssinaturas();
      setAssinaturas(dados.assinaturas);
      setResumo(dados.resumo);
      setMinisterios(dados.ministerios);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar as assinaturas.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function comprar() {
    const n = Number(qtd);
    if (!Number.isInteger(n) || n <= 0) {
      notifyAction('Quantidade inválida', 'Informe um número de vagas maior que zero.');
      return;
    }
    setBusy(true);
    try {
      await assinaturasService.comprarPacote(n);
      setModal(false);
      setQtd('10');
      await carregar();
    } catch (e) {
      notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível registrar o pacote.');
    } finally {
      setBusy(false);
    }
  }

  function cancelar(a: Assinatura) {
    confirmAction(
      { title: 'Cancelar pacote', message: `Cancelar o pacote ${a.plano ?? a.vagas_total} vagas?`, confirmLabel: 'Cancelar pacote', destructive: true },
      async () => {
        try {
          await assinaturasService.cancelarAssinatura(a.id);
          await carregar();
        } catch (e) {
          notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível cancelar.');
        }
      },
    );
  }

  async function ajustarVagas(m: Ministerio, delta: number) {
    const novo = (m.vagas_extras ?? 0) + delta;
    if (novo < 0) return;
    try {
      await assinaturasService.distribuirVagas(m.id, novo);
      await carregar();
    } catch (e) {
      notifyAction('Sem vagas', e instanceof ApiError ? e.message : 'Não foi possível ajustar.');
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Vagas e planos" subtitle="Assinaturas da organização" showBack />

      {carregando ? (
        <View style={styles.conteudo}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={64} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
          {erro && <Text style={styles.erro}>{erro}</Text>}

          {/* Resumo do pool */}
          <Card style={styles.resumoCard}>
            <View style={styles.resumoLinha}>
              <View style={styles.resumoItem}>
                <Text style={styles.resumoNum}>{resumo.comprado}</Text>
                <Text style={styles.resumoLabel}>Compradas</Text>
              </View>
              <View style={styles.resumoItem}>
                <Text style={styles.resumoNum}>{resumo.alocado}</Text>
                <Text style={styles.resumoLabel}>Alocadas</Text>
              </View>
              <View style={styles.resumoItem}>
                <Text style={[styles.resumoNum, { color: colors.primary }]}>{resumo.disponivel}</Text>
                <Text style={styles.resumoLabel}>Disponíveis</Text>
              </View>
            </View>
            <Text style={styles.resumoNota}>
              Cada ministério tem 10 vagas grátis. Vagas extras compradas são distribuídas abaixo.
            </Text>
            <Button title="+ Adicionar pacote de vagas" onPress={() => setModal(true)} style={styles.compraBtn} />
          </Card>

          {/* Distribuição por ministério */}
          <Text style={styles.secao}>Distribuir vagas</Text>
          {ministerios.map((m) => {
            const usados = m.total_membros ?? 0;
            const total = m.vagas_total ?? (m.vagas_gratis + m.vagas_extras);
            return (
              <Card key={m.id} style={styles.minCard}>
                <View style={styles.minInfo}>
                  <Text style={styles.minNome}>{m.nome}</Text>
                  <Text style={styles.minMeta}>
                    {usados}/{total} membros · {m.vagas_extras ?? 0} vaga{(m.vagas_extras ?? 0) === 1 ? '' : 's'} extra
                  </Text>
                </View>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => ajustarVagas(m, -1)}
                    disabled={(m.vagas_extras ?? 0) <= 0}
                  >
                    <Icon name="chevron-down" size={18} color={(m.vagas_extras ?? 0) <= 0 ? colors.textMuted : colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.stepVal}>{m.vagas_extras ?? 0}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => ajustarVagas(m, 1)}
                    disabled={resumo.disponivel <= 0}
                  >
                    <Icon name="chevron-up" size={18} color={resumo.disponivel <= 0 ? colors.textMuted : colors.primary} />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}

          {/* Pacotes comprados */}
          <Text style={styles.secao}>Pacotes</Text>
          {assinaturas.filter((a) => a.status !== 'cancelada').length === 0 ? (
            <EmptyState
              icon="card-outline"
              title="Nenhum pacote ativo"
              description="As vagas grátis de cada ministério seguem valendo."
            />
          ) : (
            assinaturas
              .filter((a) => a.status !== 'cancelada')
              .map((a) => (
                <Card key={a.id} style={styles.pacoteCard}>
                  <View style={styles.minInfo}>
                    <Text style={styles.minNome}>{a.plano ?? `+${a.vagas_total}`} vagas</Text>
                    <Text style={styles.minMeta}>{a.ciclo} · {a.status}</Text>
                  </View>
                  <TouchableOpacity onPress={() => cancelar(a)} hitSlop={8} accessibilityLabel="Cancelar pacote">
                    <Icon name="trash-outline" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </Card>
              ))
          )}
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      )}

      {/* Modal: adicionar pacote (stub, sem gateway) */}
      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Adicionar pacote de vagas</Text>
            <Text style={styles.modalNota}>
              O pagamento em loja/gateway entra numa próxima etapa. Por ora o pacote é registrado direto.
            </Text>
            <Text style={styles.label}>Quantidade de vagas</Text>
            <TextInput
              value={qtd}
              onChangeText={setQtd}
              keyboardType="number-pad"
              style={styles.input}
              placeholder="10"
              placeholderTextColor={colors.textMuted}
            />
            <Button title={busy ? 'Registrando...' : 'Registrar pacote'} onPress={comprar} disabled={busy} style={styles.modalBtn} />
            <Button title="Cancelar" variant="outline" onPress={() => setModal(false)} disabled={busy} style={styles.modalBtn} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    conteudo: { padding: spacing.lg, gap: spacing.sm, maxWidth: 720, width: '100%', alignSelf: 'center' },
    erro: { ...typography.bodySmall, color: colors.error, textAlign: 'center' },

    resumoCard: { gap: spacing.md, padding: spacing.lg },
    resumoLinha: { flexDirection: 'row', justifyContent: 'space-around' },
    resumoItem: { alignItems: 'center', gap: 2 },
    resumoNum: { ...typography.h2, color: colors.text },
    resumoLabel: { ...typography.caption, color: colors.textSecondary },
    resumoNota: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
    compraBtn: {},

    secao: { ...typography.h3, color: colors.text, marginTop: spacing.md },

    minCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
    minInfo: { flex: 1, gap: 2 },
    minNome: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
    minMeta: { ...typography.caption, color: colors.textSecondary },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    stepBtn: {
      width: 34, height: 34, borderRadius: radius.md, backgroundColor: colors.surfaceMuted,
      alignItems: 'center', justifyContent: 'center',
    },
    stepVal: { ...typography.body, color: colors.text, fontFamily: fonts.semibold, minWidth: 20, textAlign: 'center' },

    pacoteCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, gap: spacing.sm },
    modalTitulo: { ...typography.h3, color: colors.text },
    modalNota: { ...typography.caption, color: colors.textMuted },
    label: { ...typography.bodySmall, color: colors.textSecondary, fontFamily: fonts.semibold, marginTop: spacing.xs },
    input: {
      ...typography.body, color: colors.text, borderWidth: 1, borderColor: colors.border,
      borderRadius: radius.md, paddingHorizontal: spacing.md, height: 48,
    },
    modalBtn: { marginTop: spacing.xs },
  });
