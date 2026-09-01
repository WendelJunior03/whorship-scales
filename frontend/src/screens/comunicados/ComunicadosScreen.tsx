import React, { useCallback, useEffect, useState } from 'react';
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
import { RouteProp, useRoute } from '@react-navigation/native';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { AnimatedItem } from '@/components/AnimatedItem';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { papelOrgDe } from '@/utils/papel';
import { confirmAction, notifyAction } from '@/utils/confirm';
import * as avisosService from '@/services/avisos';
import { ApiError } from '@/services/api';
import { MainStackParamList } from '@/navigation/MainNavigator';
import { Aviso } from '@/types';
import { spacing, radius, typography, fonts } from '@/theme';
import { Cores } from '@/theme/palettes';

function dataHoraLonga(iso: string): string {
  const dt = new Date(iso);
  const data = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(dt);
  const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(dt);
  return `${data} · ${hora}`;
}

export function ComunicadosScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const route = useRoute<RouteProp<MainStackParamList, 'Comunicados'>>();
  const abrirId = route.params?.abrirId;

  const podePublicar = !!user && ['administrador', 'lider'].includes(papelOrgDe(user));

  const [lista, setLista] = useState<Aviso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [detalhe, setDetalhe] = useState<Aviso | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [fTitulo, setFTitulo] = useState('');
  const [fCorpo, setFCorpo] = useState('');
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setLista(await avisosService.listarAvisos());
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar os comunicados.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Abre direto um comunicado quando veio da Home (?abrirId).
  useEffect(() => {
    if (abrirId) abrirDetalhe(abrirId);
  }, [abrirId]);

  async function abrirDetalhe(id: number) {
    try {
      const aviso = await avisosService.getAviso(id); // marca como lido
      setDetalhe(aviso);
      // Atualiza o "lido" na lista sem refetch completo.
      setLista((atual) => atual.map((a) => (a.id === id ? { ...a, lido: true } : a)));
    } catch (e) {
      notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível abrir o comunicado.');
    }
  }

  function abrirNovo() {
    setEditId(null);
    setFTitulo('');
    setFCorpo('');
    setFormAberto(true);
  }

  function abrirEdicao(aviso: Aviso) {
    setEditId(aviso.id);
    setFTitulo(aviso.titulo);
    setFCorpo(aviso.corpo ?? '');
    setDetalhe(null);
    setFormAberto(true);
  }

  async function salvar() {
    if (!fTitulo.trim()) {
      notifyAction('Título obrigatório', 'Escreva um título para o comunicado.');
      return;
    }
    setBusy(true);
    try {
      const input = { titulo: fTitulo.trim(), corpo: fCorpo.trim() || null };
      if (editId) await avisosService.atualizarAviso(editId, input);
      else await avisosService.criarAviso(input);
      setFormAberto(false);
      await carregar();
    } catch (e) {
      notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    } finally {
      setBusy(false);
    }
  }

  function excluir(aviso: Aviso) {
    confirmAction(
      {
        title: 'Excluir comunicado',
        message: `Remover "${aviso.titulo}"?`,
        confirmLabel: 'Excluir',
        destructive: true,
      },
      async () => {
        try {
          await avisosService.deletarAviso(aviso.id);
          setDetalhe(null);
          await carregar();
        } catch (e) {
          notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível remover.');
        }
      },
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Comunicados" subtitle="Avisos da organização" showBack />

      {isLoading ? (
        <View style={styles.conteudo}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={72} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
          {erro && <Text style={styles.erro}>{erro}</Text>}

          {lista.length === 0 ? (
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="Nenhum comunicado ainda"
              description="Os avisos da organização aparecem aqui quando publicados."
            />
          ) : (
            lista.map((a, i) => (
              <AnimatedItem key={a.id} index={i}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => abrirDetalhe(a.id)}>
                <Card style={styles.itemCard}>
                  <View style={[styles.pontoLido, !a.lido && styles.pontoNaoLido]} />
                  <View style={styles.itemTextos}>
                    <Text style={[styles.itemTitulo, !a.lido && styles.itemTituloNaoLido]} numberOfLines={1}>
                      {a.titulo}
                    </Text>
                    {a.corpo ? (
                      <Text style={styles.itemPreview} numberOfLines={1}>
                        {a.corpo}
                      </Text>
                    ) : null}
                    <Text style={styles.itemMeta}>
                      {a.autor_nome ? `${a.autor_nome} · ` : ''}
                      {dataHoraLonga(a.publicado_em)}
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={18} color={colors.textMuted} />
                </Card>
                </TouchableOpacity>
              </AnimatedItem>
            ))
          )}
          <View style={{ height: 96 }} />
        </ScrollView>
      )}

      {podePublicar && (
        <TouchableOpacity style={styles.fab} onPress={abrirNovo} accessibilityRole="button">
          <Icon name="add-circle-outline" size={22} color={colors.textInverse} />
          <Text style={styles.fabTexto}>Novo</Text>
        </TouchableOpacity>
      )}

      {/* Detalhe */}
      <Modal visible={!!detalhe} animationType="slide" transparent onRequestClose={() => setDetalhe(null)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setDetalhe(null)} hitSlop={8}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detalheScroll}>
              <Text style={styles.detalheTitulo}>{detalhe?.titulo}</Text>
              <Text style={styles.detalheMeta}>
                {detalhe?.autor_nome ? `${detalhe.autor_nome} · ` : ''}
                {detalhe ? dataHoraLonga(detalhe.publicado_em) : ''}
              </Text>
              {detalhe?.corpo ? (
                <Text style={styles.detalheCorpo}>{detalhe.corpo}</Text>
              ) : (
                <Text style={styles.detalheVazio}>Sem detalhes.</Text>
              )}
            </ScrollView>
            {podePublicar && detalhe && (
              <View style={styles.modalAcoes}>
                <Button title="Editar" variant="outline" onPress={() => abrirEdicao(detalhe)} style={styles.btnFlex} />
                <Button title="Excluir" variant="outline" onPress={() => excluir(detalhe)} style={styles.btnFlex} />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Publicar / Editar */}
      <Modal visible={formAberto} animationType="slide" transparent onRequestClose={() => setFormAberto(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setFormAberto(false)} hitSlop={8}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitulo}>{editId ? 'Editar comunicado' : 'Novo comunicado'}</Text>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              <TextInput
                value={fTitulo}
                onChangeText={(t) => setFTitulo(t.slice(0, 120))}
                placeholder="Título *"
                placeholderTextColor={colors.textMuted}
                style={styles.inputTitulo}
              />
              <TextInput
                value={fCorpo}
                onChangeText={setFCorpo}
                placeholder="Escreva o comunicado..."
                placeholderTextColor={colors.textMuted}
                style={styles.inputCorpo}
                multiline
              />
            </ScrollView>
            <Button
              title={busy ? 'Salvando...' : editId ? 'Salvar' : 'Publicar'}
              onPress={salvar}
              disabled={busy}
            />
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

    itemCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
    pontoLido: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'transparent' },
    pontoNaoLido: { backgroundColor: colors.primary },
    itemTextos: { flex: 1, gap: 2 },
    itemTitulo: { ...typography.body, color: colors.text },
    itemTituloNaoLido: { fontFamily: fonts.semibold },
    itemPreview: { ...typography.bodySmall, color: colors.textSecondary },
    itemMeta: { ...typography.caption, color: colors.textMuted },


    fab: {
      position: 'absolute', right: spacing.lg, bottom: spacing.lg,
      flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
      backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
    },
    fabTexto: { ...typography.body, color: colors.textInverse, fontFamily: fonts.semibold },

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modal: {
      backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg,
      maxHeight: '90%', gap: spacing.sm,
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    modalTitulo: { ...typography.h3, color: colors.text },

    detalheScroll: { gap: spacing.sm, paddingBottom: spacing.md },
    detalheTitulo: { ...typography.h2, color: colors.text },
    detalheMeta: { ...typography.caption, color: colors.textMuted },
    detalheCorpo: { ...typography.body, color: colors.text, marginTop: spacing.sm, lineHeight: 22 },
    detalheVazio: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.sm },

    modalAcoes: { flexDirection: 'row', gap: spacing.sm },
    btnFlex: { flex: 1 },

    formScroll: { gap: spacing.sm, paddingBottom: spacing.md },
    inputTitulo: {
      ...typography.body, color: colors.text, borderWidth: 1, borderColor: colors.border,
      borderRadius: radius.md, paddingHorizontal: spacing.md, height: 48,
    },
    inputCorpo: {
      ...typography.body, color: colors.text, borderWidth: 1, borderColor: colors.border,
      borderRadius: radius.md, paddingHorizontal: spacing.md, paddingTop: spacing.sm,
      minHeight: 140, textAlignVertical: 'top',
    },
  });
