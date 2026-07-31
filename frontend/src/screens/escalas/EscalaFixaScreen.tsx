import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import * as escalaFixaService from '@/services/escalaFixa';
import * as membrosService from '@/services/membros';
import { ApiError } from '@/services/api';
import { DiaSemana, EscalaFixaMontada, Membro } from '@/types';
import { colors, spacing, typography } from '@/theme';
import { papelLabel } from '@/utils/papel';

const DIAS: DiaSemana[] = ['quarta', 'sabado', 'domingo'];

const diaLabel: Record<DiaSemana, string> = {
  quarta: 'Quarta-feira',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

export function EscalaFixaScreen() {
  const { user } = useAuth();

  const [escalaFixa, setEscalaFixa] = useState<EscalaFixaMontada[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [novaEscalaAberta, setNovaEscalaAberta] = useState(false);
  const [novoDia, setNovoDia] = useState<DiaSemana>('domingo');
  const [novaFuncao, setNovaFuncao] = useState('');
  const [novoMembro, setNovoMembro] = useState<Membro | null>(null);
  const [membroPickerAberto, setMembroPickerAberto] = useState(false);
  const [todosMembrosAtivos, setTodosMembrosAtivos] = useState<Membro[]>([]);
  const [carregandoMembros, setCarregandoMembros] = useState(false);
  const [criandoEscala, setCriandoEscala] = useState(false);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dados = await escalaFixaService.getEscalaFixaMontada();
      setEscalaFixa(dados);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar a escala fixa.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  async function abrirNovaEscala() {
    setNovoDia('domingo');
    setNovaFuncao('');
    setNovoMembro(null);
    setNovaEscalaAberta(true);

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

  async function handleCriarEscalaFixa() {
    if (!novoMembro || !novaFuncao.trim()) {
      Alert.alert('Preencha tudo', 'Selecione o membro e informe a função antes de criar.');
      return;
    }

    setCriandoEscala(true);
    try {
      await escalaFixaService.criarEscalaFixa({
        membroId: novoMembro.id,
        diaSemana: novoDia,
        funcao: novaFuncao.trim(),
      });
      Alert.alert(
        'Escala fixa criada',
        `${novoMembro.nome} foi vinculado como "${novaFuncao.trim()}" toda ${diaLabel[novoDia]} e recebeu uma notificação por e-mail.`,
      );
      setNovaEscalaAberta(false);
      await carregarDados();
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof ApiError ? err.message : 'Não foi possível criar a escala fixa.',
      );
    } finally {
      setCriandoEscala(false);
    }
  }

  if (user && user.papel !== 'admin' && user.papel !== 'ministro') {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <Header title="Escala Fixa" showBack />
        <View style={[styles.content, styles.centered]}>
          <Text style={styles.errorText}>Essa tela é exclusiva para admin e ministro.</Text>
        </View>
      </SafeAreaView>
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
      <Header title="Escala Fixa" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {DIAS.map((dia) => {
          const itens = escalaFixa.filter((item) => item.dia_semana === dia);
          return (
            <View key={dia}>
              <Text style={styles.sectionTitle}>{diaLabel[dia]}</Text>
              {itens.length === 0 ? (
                <Card style={styles.card}>
                  <Text style={styles.emptyText}>Ninguém vinculado ainda.</Text>
                </Card>
              ) : (
                <Card style={styles.card}>
                  {itens.map((item, index) => (
                    <View
                      key={`${item.funcao}-${item.nome}-${index}`}
                      style={[styles.itemRow, index > 0 && styles.itemRowBorda]}
                    >
                      <Text style={styles.itemNome}>{item.nome}</Text>
                      <Text style={styles.itemFuncao}>{item.funcao}</Text>
                    </View>
                  ))}
                </Card>
              )}
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={abrirNovaEscala}>
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </TouchableOpacity>

      <Modal
        visible={novaEscalaAberta}
        animationType="slide"
        transparent
        onRequestClose={() => setNovaEscalaAberta(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova escala fixa</Text>

            <Text style={styles.formLabel}>Dia da semana</Text>
            <View style={styles.diasRow}>
              {DIAS.map((dia) => {
                const ativo = novoDia === dia;
                return (
                  <TouchableOpacity
                    key={dia}
                    style={[styles.diaChip, ativo && styles.diaChipAtivo]}
                    onPress={() => setNovoDia(dia)}
                  >
                    <Text style={[styles.diaChipText, ativo && styles.diaChipTextAtivo]}>
                      {diaLabel[dia]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.formLabel}>Membro</Text>
            <TouchableOpacity
              style={styles.selectorInput}
              onPress={() => setMembroPickerAberto(true)}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.selectorIcon}
              />
              <Text
                style={novoMembro ? styles.selectorText : styles.selectorPlaceholder}
                numberOfLines={1}
              >
                {novoMembro ? novoMembro.nome : 'Selecionar membro'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <Text style={styles.formLabel}>Função</Text>
            <View style={styles.selectorInput}>
              <Ionicons
                name="musical-notes-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.selectorIcon}
              />
              <TextInput
                style={styles.selectorTextInput}
                placeholder="Ex: Teclado"
                placeholderTextColor={colors.textMuted}
                value={novaFuncao}
                onChangeText={setNovaFuncao}
              />
            </View>

            <Button
              title="Criar escala fixa"
              onPress={handleCriarEscalaFixa}
              loading={criandoEscala}
              style={styles.modalButton}
            />
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setNovaEscalaAberta(false)}
              disabled={criandoEscala}
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
                        setNovoMembro(membro);
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
  content: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  card: {
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  itemRowBorda: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemNome: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  itemFuncao: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
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
  },
  modalContentPicker: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '70%',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  formLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  diasRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  diaChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  diaChipAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  diaChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  diaChipTextAtivo: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  selectorInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorIcon: {
    marginRight: spacing.sm,
  },
  selectorTextInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  selectorText: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  selectorPlaceholder: {
    flex: 1,
    ...typography.body,
    color: colors.textMuted,
  },
  modalButton: {
    marginTop: spacing.md,
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
