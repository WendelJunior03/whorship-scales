import React, { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Tabs } from '@/components/Tabs';
import { Modal } from '@/components/Modal';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { confirmAction, notifyAction } from '@/utils/confirm';
import { showToast } from '@/utils/toast';
import * as integracoes from '@/services/integracoes';
import * as ministeriosService from '@/services/ministerios';
import { ApiError } from '@/services/api';
import { Ministerio } from '@/types';
import { spacing, radius, typography, fonts } from '@/theme';
import { Cores } from '@/theme/palettes';

function copiar(texto: string) {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(texto).then(() => showToast('Token copiado', 'success')).catch(() => {});
  } else {
    showToast('Selecione e copie o token manualmente', 'info');
  }
}

const ABAS = [
  { key: 'tokens', label: 'Tokens de API' },
  { key: 'holyrics', label: 'Holyrics' },
];

export function IntegracoesScreen() {
  const styles = useThemedStyles(criarEstilos);
  const [aba, setAba] = useState('tokens');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Integrações" subtitle="Tokens de API e Holyrics" showBack />
      <View style={styles.conteudo}>
        <Tabs tabs={ABAS} active={aba} onChange={setAba} />
      </View>
      {aba === 'tokens' ? <AbaTokens /> : <AbaHolyrics />}
    </SafeAreaView>
  );
}

// ------------------------------------------------------------------ Tokens de API

function AbaTokens() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);

  const [tokens, setTokens] = useState<integracoes.ApiToken[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(false);
  const [nome, setNome] = useState('');
  const [busy, setBusy] = useState(false);
  const [criado, setCriado] = useState<(integracoes.ApiToken & { token: string }) | null>(null);

  const carregar = useCallback(async () => {
    try {
      setTokens(await integracoes.listarApiTokens());
    } catch (e) {
      notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível carregar os tokens.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  async function criar() {
    if (!nome.trim()) {
      notifyAction('Nome obrigatório', 'Dê um nome ao token (ex.: "Integração X").');
      return;
    }
    setBusy(true);
    try {
      const novo = await integracoes.criarApiToken(nome.trim());
      setCriado(novo);
      setModal(false);
      setNome('');
      await carregar();
    } catch (e) {
      notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível criar o token.');
    } finally {
      setBusy(false);
    }
  }

  function revogar(t: integracoes.ApiToken) {
    confirmAction(
      { title: 'Revogar token', message: `Revogar "${t.nome}"? Integrações que o usam vão parar de funcionar.`, confirmLabel: 'Revogar', destructive: true },
      async () => {
        try {
          await integracoes.revogarApiToken(t.id);
          await carregar();
        } catch (e) {
          notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível revogar.');
        }
      },
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
      <Text style={styles.nota}>
        Tokens dão acesso de <Text style={styles.negrito}>leitura</Text> aos dados da sua organização via API
        (Authorization: Bearer). Guardamos só o hash — o valor aparece uma única vez.
      </Text>

      {/* Token recém-criado (mostrado uma vez) */}
      {criado && (
        <Card style={styles.tokenNovo}>
          <Text style={styles.tokenNovoTitulo}>Token criado — copie agora</Text>
          <Text style={styles.tokenNovoValor} selectable>{criado.token}</Text>
          <View style={styles.linhaBtns}>
            <Button title="Copiar" onPress={() => copiar(criado.token)} style={styles.flex1} />
            <Button title="Ok, guardei" variant="outline" onPress={() => setCriado(null)} style={styles.flex1} />
          </View>
        </Card>
      )}

      <Button title="+ Novo token" onPress={() => setModal(true)} />

      {carregando ? (
        <View style={{ gap: spacing.sm }}>
          {[0, 1].map((i) => <Skeleton key={i} height={64} radius={radius.lg} />)}
        </View>
      ) : tokens.length === 0 ? (
        <EmptyState icon="key-outline" title="Nenhum token" description="Crie um token para integrar sistemas externos." />
      ) : (
        tokens.map((t) => (
          <Card key={t.id} style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemNome}>{t.nome}</Text>
              <Text style={styles.itemMeta}>
                {t.prefixo}… · {t.ultimo_uso_em ? `usado em ${new Date(t.ultimo_uso_em).toLocaleDateString('pt-BR')}` : 'nunca usado'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => revogar(t)} hitSlop={8} accessibilityLabel="Revogar token">
              <Icon name="trash-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </Card>
        ))
      )}

      <Modal visible={modal} onClose={() => setModal(false)} title="Novo token de API">
        <Text style={styles.label}>Nome</Text>
        <TextInput
          value={nome}
          onChangeText={setNome}
          placeholder='Ex.: "Planilha da secretaria"'
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <Button title={busy ? 'Criando…' : 'Criar token'} onPress={criar} disabled={busy} />
      </Modal>
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

// ------------------------------------------------------------------ Holyrics

function AbaHolyrics() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);

  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [selId, setSelId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [host, setHost] = useState('');
  const [porta, setPorta] = useState('8091');
  const [token, setToken] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [temToken, setTemToken] = useState(false);
  const [busy, setBusy] = useState(false);

  const carregarMinisterios = useCallback(async () => {
    try {
      const lista = await ministeriosService.listarMinisterios();
      setMinisterios(lista);
      setSelId((atual) => atual ?? lista[0]?.id ?? null);
    } catch (e) {
      notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível carregar os ministérios.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregarMinisterios(); }, [carregarMinisterios]));

  const carregarConfig = useCallback(async (ministerioId: number) => {
    try {
      const cfg = await integracoes.getHolyrics(ministerioId);
      setHost(cfg?.host ?? '');
      setPorta(cfg?.porta ? String(cfg.porta) : '8091');
      setAtivo(cfg?.ativo ?? true);
      setTemToken(cfg?.temToken ?? false);
      setToken('');
    } catch {
      // silencioso: sem config ainda
    }
  }, []);

  useEffect(() => {
    if (selId) carregarConfig(selId);
  }, [selId, carregarConfig]);

  async function salvar() {
    if (!selId) return;
    if (!host.trim()) {
      notifyAction('Host obrigatório', 'Informe o IP/host do computador com o Holyrics.');
      return;
    }
    const p = Number(porta);
    if (!Number.isInteger(p) || p < 1 || p > 65535) {
      notifyAction('Porta inválida', 'Use um valor entre 1 e 65535.');
      return;
    }
    setBusy(true);
    try {
      await integracoes.salvarHolyrics(selId, { host: host.trim(), porta: p, ...(token.trim() ? { token: token.trim() } : {}), ativo });
      setToken('');
      showToast('Configuração salva', 'success');
      await carregarConfig(selId);
    } catch (e) {
      notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    } finally {
      setBusy(false);
    }
  }

  async function testar() {
    if (!selId) return;
    setBusy(true);
    try {
      const r = await integracoes.testarHolyrics(selId);
      showToast(r.message, r.ok ? 'success' : 'info', 5000);
    } catch (e) {
      notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível testar.');
    } finally {
      setBusy(false);
    }
  }

  function remover() {
    if (!selId) return;
    confirmAction(
      { title: 'Remover Holyrics', message: 'Remover a integração deste ministério?', confirmLabel: 'Remover', destructive: true },
      async () => {
        try {
          await integracoes.removerHolyrics(selId);
          showToast('Integração removida', 'success');
          await carregarConfig(selId);
        } catch (e) {
          notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível remover.');
        }
      },
    );
  }

  if (carregando) {
    return (
      <View style={styles.conteudo}>
        {[0, 1, 2].map((i) => <Skeleton key={i} height={56} radius={radius.lg} />)}
      </View>
    );
  }

  if (ministerios.length === 0) {
    return (
      <View style={styles.conteudo}>
        <EmptyState icon="people-outline" title="Sem ministérios" description="Crie um ministério para configurar o Holyrics." />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
      <Text style={styles.nota}>
        O Holyrics roda na rede local da igreja. Guardamos host/porta/token (cifrado) por ministério.
      </Text>

      {/* Seletor de ministério */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {ministerios.map((m) => {
          const sel = m.id === selId;
          return (
            <TouchableOpacity
              key={m.id}
              onPress={() => setSelId(m.id)}
              style={[styles.chip, { backgroundColor: sel ? colors.primary : colors.surfaceMuted }]}
            >
              <Text style={[styles.chipTexto, { color: sel ? colors.textInverse : colors.textSecondary }]} numberOfLines={1}>
                {m.nome}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Card style={styles.form}>
        <Text style={styles.label}>Host / IP</Text>
        <TextInput value={host} onChangeText={setHost} placeholder="192.168.0.10" placeholderTextColor={colors.textMuted} style={styles.input} autoCapitalize="none" />

        <Text style={styles.label}>Porta</Text>
        <TextInput value={porta} onChangeText={setPorta} placeholder="8091" placeholderTextColor={colors.textMuted} style={styles.input} keyboardType="number-pad" />

        <Text style={styles.label}>Token do Holyrics {temToken ? '(salvo — preencha só para trocar)' : ''}</Text>
        <TextInput value={token} onChangeText={setToken} placeholder={temToken ? '••••••••' : 'token da API do Holyrics'} placeholderTextColor={colors.textMuted} style={styles.input} secureTextEntry autoCapitalize="none" />

        <View style={styles.switchLinha}>
          <Text style={styles.label}>Ativo</Text>
          <Switch value={ativo} onValueChange={setAtivo} />
        </View>

        <Button title={busy ? 'Salvando…' : 'Salvar'} onPress={salvar} disabled={busy} />
        <View style={styles.linhaBtns}>
          <Button title="Testar conexão" variant="outline" onPress={testar} disabled={busy} style={styles.flex1} />
          <Button title="Remover" variant="outline" onPress={remover} disabled={busy} style={styles.flex1} />
        </View>
      </Card>
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const criarEstilos = (colors: Cores) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    conteudo: { padding: spacing.lg, gap: spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
    nota: { ...typography.bodySmall, color: colors.textSecondary },
    negrito: { fontFamily: fonts.semibold, color: colors.text },

    label: { ...typography.caption, color: colors.textSecondary },
    input: {
      ...typography.body,
      color: colors.text,
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },

    linhaBtns: { flexDirection: 'row', gap: spacing.sm },
    flex1: { flex: 1 },

    tokenNovo: { gap: spacing.sm, padding: spacing.lg, borderWidth: 1, borderColor: colors.success },
    tokenNovoTitulo: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
    tokenNovoValor: { ...typography.bodySmall, color: colors.text, fontFamily: fonts.regular },

    item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
    itemInfo: { flex: 1, gap: 2 },
    itemNome: { ...typography.body, color: colors.text, fontFamily: fonts.semibold },
    itemMeta: { ...typography.caption, color: colors.textSecondary },

    chips: { gap: spacing.sm, paddingVertical: spacing.xs },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, maxWidth: 200 },
    chipTexto: { ...typography.bodySmall, fontFamily: fonts.semibold },

    form: { gap: spacing.sm, padding: spacing.lg },
    switchLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  });
