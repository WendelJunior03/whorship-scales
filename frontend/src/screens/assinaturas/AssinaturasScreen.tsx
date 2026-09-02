import React, { useCallback, useState } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { notifyAction } from '@/utils/confirm';
import * as billing from '@/services/billing';
import { ApiError } from '@/services/api';
import { spacing, radius, typography, fonts } from '@/theme';
import { Cores } from '@/theme/palettes';

// Preços de exibição (a cobrança real é o Price configurado no Stripe).
const PRECO_MENSAL = 'R$ 39/mês';
const PRECO_ANUAL = 'R$ 390/ano';

const BENEFICIOS_PRO = [
  'Vagas ilimitadas em todos os ministérios',
  'Todos os recursos liberados',
  'Sem o limite de 10 pessoas por ministério',
];

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativa',
  trialing: 'Em período de teste',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelada',
  unpaid: 'Não paga',
};

function abrirUrl(url: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.assign(url);
  } else {
    Linking.openURL(url).catch(() => notifyAction('Erro', 'Não foi possível abrir o pagamento.'));
  }
}

export function AssinaturasScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);

  const [info, setInfo] = useState<billing.PlanoInfo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busy, setBusy] = useState<'mensal' | 'anual' | 'portal' | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setInfo(await billing.getPlano());
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar seu plano.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function assinar(ciclo: 'mensal' | 'anual') {
    setBusy(ciclo);
    try {
      abrirUrl(await billing.iniciarCheckout(ciclo));
    } catch (e) {
      notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível iniciar o pagamento.');
    } finally {
      setBusy(null);
    }
  }

  async function gerenciar() {
    setBusy('portal');
    try {
      abrirUrl(await billing.abrirPortal());
    } catch (e) {
      notifyAction('Erro', e instanceof ApiError ? e.message : 'Não foi possível abrir o gerenciamento.');
    } finally {
      setBusy(null);
    }
  }

  const ehPro = info?.plano === 'pro';
  const semGateway = info != null && !info.billingConfigurado;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Meu plano" subtitle="Assinatura da organização" showBack />

      {carregando ? (
        <View style={styles.conteudo}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={96} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
          {erro && <Text style={styles.erro}>{erro}</Text>}

          {/* Estado atual do plano */}
          <Card style={styles.planoCard}>
            <View style={styles.planoTopo}>
              <View style={styles.planoInfo}>
                <Text style={styles.planoLabel}>Plano atual</Text>
                <Text style={styles.planoNome}>{ehPro ? 'PRO' : 'Free'}</Text>
              </View>
              <View style={[styles.selo, { backgroundColor: ehPro ? colors.primary : colors.surfaceMuted }]}>
                <Icon
                  name={ehPro ? 'shield-checkmark-outline' : 'shield-outline'}
                  size={16}
                  color={ehPro ? colors.textInverse : colors.textSecondary}
                />
                <Text style={[styles.seloTexto, { color: ehPro ? colors.textInverse : colors.textSecondary }]}>
                  {ehPro ? 'Ativo' : 'Gratuito'}
                </Text>
              </View>
            </View>

            {ehPro ? (
              <>
                <Text style={styles.planoDesc}>
                  {info?.ciclo === 'anual' ? 'Cobrança anual' : 'Cobrança mensal'}
                  {info?.status ? ` · ${STATUS_LABEL[info.status] ?? info.status}` : ''}
                </Text>
                {info?.expiraEm && (
                  <Text style={styles.planoMeta}>
                    Renova em {new Date(info.expiraEm).toLocaleDateString('pt-BR')}
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.planoDesc}>
                Limitado a 10 pessoas por ministério e a alguns recursos.
              </Text>
            )}
          </Card>

          {semGateway && (
            <Card style={styles.avisoCard}>
              <Icon name="information-circle-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.avisoTexto}>
                Pagamentos ainda não estão habilitados neste ambiente.
              </Text>
            </Card>
          )}

          {ehPro ? (
            <Button
              title={busy === 'portal' ? 'Abrindo…' : 'Gerenciar assinatura'}
              variant="outline"
              onPress={gerenciar}
              disabled={busy !== null || semGateway}
              style={styles.acaoBtn}
            />
          ) : (
            <Card style={styles.ofertaCard}>
              <Text style={styles.ofertaTitulo}>Assine o PRO</Text>
              <View style={styles.beneficios}>
                {BENEFICIOS_PRO.map((b) => (
                  <View key={b} style={styles.beneficioLinha}>
                    <Icon name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={styles.beneficioTexto}>{b}</Text>
                  </View>
                ))}
              </View>
              <Button
                title={busy === 'mensal' ? 'Abrindo…' : `Assinar mensal · ${PRECO_MENSAL}`}
                onPress={() => assinar('mensal')}
                disabled={busy !== null || semGateway}
                style={styles.acaoBtn}
              />
              <Button
                title={busy === 'anual' ? 'Abrindo…' : `Assinar anual · ${PRECO_ANUAL}`}
                variant="outline"
                onPress={() => assinar('anual')}
                disabled={busy !== null || semGateway}
                style={styles.acaoBtn}
              />
              <Text style={styles.ofertaNota}>No plano anual você ganha ~2 meses grátis.</Text>
            </Card>
          )}

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    conteudo: { padding: spacing.lg, gap: spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
    erro: { ...typography.bodySmall, color: colors.error, textAlign: 'center' },

    planoCard: { gap: spacing.sm, padding: spacing.lg },
    planoTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    planoInfo: { gap: 2 },
    planoLabel: { ...typography.caption, color: colors.textSecondary },
    planoNome: { ...typography.h2, color: colors.text, fontFamily: fonts.bold },
    selo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    seloTexto: { ...typography.caption, fontFamily: fonts.semibold },
    planoDesc: { ...typography.body, color: colors.textSecondary },
    planoMeta: { ...typography.caption, color: colors.textMuted },

    avisoCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
    avisoTexto: { ...typography.bodySmall, color: colors.textSecondary, flexShrink: 1 },

    ofertaCard: { gap: spacing.md, padding: spacing.lg },
    ofertaTitulo: { ...typography.h3, color: colors.text, fontFamily: fonts.semibold },
    beneficios: { gap: spacing.sm },
    beneficioLinha: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    beneficioTexto: { ...typography.body, color: colors.text, flexShrink: 1 },
    ofertaNota: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },

    acaoBtn: {},
  });
