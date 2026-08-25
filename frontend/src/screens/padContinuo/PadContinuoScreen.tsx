import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useFocusEffect } from '@react-navigation/native';
import { Icon } from '@/components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { BarraDeslizante } from '@/components/BarraDeslizante';
import { Card } from '@/components/Card';
import { usePadContinuo } from '@/hooks/usePadContinuo';
import { usePadAparencia } from '@/hooks/usePadAparencia';
import { Note } from './padContinuoEngine';
import { NOTA_LABEL } from './notasLabel';
import { PainelPersonalizarPads } from './PainelPersonalizarPads';
import { corEhClara, hexParaRgba, misturarHex } from '@/utils/cor';
import { fonts, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

// Coluna centralizada com largura máxima (não estica no desktop/PWA).
const MAX_LARGURA = 640;
// Faixa de opacidade aplicada à cor do pad ativo conforme o brilho (nunca some de vez).
const ALPHA_FUNDO_MIN = 0.35;
const ALPHA_BORDA_MIN = 0.5;
// Opacidade da cor personalizada do pad inativo — mais sutil que a do pad ativo.
const ALPHA_INATIVO = 0.35;
const KEEP_AWAKE_TAG = 'pad-continuo';

export function PadContinuoScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const { notas, ativos, alternar, volumeGeral, ajustarVolumeGeral, pararTudo } = usePadContinuo();
  const { aparencia, atualizar, restaurarPadrao } = usePadAparencia();
  const [painelAberto, setPainelAberto] = useState(false);

  // `pararTudo` muda a cada toque em um pad (depende de `ativos`) — se ele entrasse direto nas
  // deps do useFocusEffect, a limpeza rodaria a CADA clique (não só ao sair da tela) e desligava
  // o pad na hora. Por isso guarda a versão mais recente numa ref e mantém o efeito estável.
  const pararTudoRef = useRef(pararTudo);
  useEffect(() => {
    pararTudoRef.current = pararTudo;
  }, [pararTudo]);

  // Mantém a tela ligada só enquanto tiver algum pad tocando (evita o celular travar sozinho
  // no meio do culto). No web usa a Wake Lock API do navegador — sem suporte, é um no-op.
  const algumPadAtivo = notas.some((nota) => ativos[nota]);
  useEffect(() => {
    if (algumPadAtivo) {
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    } else {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    }
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    };
  }, [algumPadAtivo]);

  // Ao sair da tela (voltar, trocar de aba, etc.) desliga qualquer pad que tenha ficado tocando.
  useFocusEffect(
    useCallback(() => {
      return () => pararTudoRef.current();
    }, []),
  );

  const corAtiva = aparencia.corAtivo ?? colors.primary;
  const alphaFundoAtivo = ALPHA_FUNDO_MIN + aparencia.brilho * (1 - ALPHA_FUNDO_MIN);
  // Degradê bem sutil (claro → escuro) pra não achatar a cor, só dar uma leve profundidade.
  // `misturarHex(cor, x, fracao)` = `fracao` de peso pra `cor` — por isso o valor alto (perto
  // de 1): queremos MANTER a cor principal, só clareando/escurecendo levemente as pontas.
  const gradienteAtivo: [string, string] = [
    hexParaRgba(misturarHex(corAtiva, '#FFFFFF', 0.92), alphaFundoAtivo),
    hexParaRgba(misturarHex(corAtiva, '#000000', 0.88), alphaFundoAtivo),
  ];
  const bordaAtiva = hexParaRgba(corAtiva, ALPHA_BORDA_MIN + aparencia.brilho * (1 - ALPHA_BORDA_MIN));
  // Cor personalizada do pad inativo entra translúcida (por cima do fundo da tela), não sólida.
  const corInativa = aparencia.corInativo ? hexParaRgba(aparencia.corInativo, ALPHA_INATIVO) : colors.surfaceElevated;
  // Com fundo idle personalizado, o texto/led do tema pode ficar ilegível (ex.: branco no tema
  // escuro) — recalcula o contraste com base na cor já misturada (translúcida) com a tela atrás.
  const corTextoIdle = aparencia.corInativo
    ? corEhClara(misturarHex(aparencia.corInativo, colors.background, ALPHA_INATIVO))
      ? '#1E2340'
      : '#FFFFFF'
    : null;
  const corLedIdle = corTextoIdle ? hexParaRgba(corTextoIdle, 0.55) : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header
        title="Pads Contínuos"
        subtitle="Banco de Pads"
        showBack
        rightIcon="settings-outline"
        rightIconLabel="Personalizar aparência dos pads"
        onRightPress={() => setPainelAberto(true)}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Card style={styles.aviso}>
            <Icon name="information-circle-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.avisoTexto}>Toque nos pads para iniciar/parar as notas contínuas.</Text>
          </Card>

          <View style={styles.grid}>
            {notas.map((nota: Note) => {
              const on = ativos[nota];
              return (
                <TouchableOpacity
                  key={nota}
                  activeOpacity={0.9}
                  onPress={() => alternar(nota)}
                  style={[styles.pad, { backgroundColor: corInativa }, on && { borderColor: bordaAtiva }]}
                >
                  {on && (
                    <>
                      <LinearGradient
                        colors={gradienteAtivo}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                      {/* Sheen diagonal — textura de brilho, não mexe na cor de base. */}
                      <LinearGradient
                        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']}
                        locations={[0.25, 0.5, 0.75]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                    </>
                  )}
                  <View
                    style={[styles.led, on && styles.ledOn, !on && corLedIdle ? { backgroundColor: corLedIdle } : null]}
                  />
                  <Text style={[styles.padNota, on && styles.padNotaAtiva, !on && corTextoIdle ? { color: corTextoIdle } : null]}>
                    {nota}
                  </Text>
                  <Text
                    style={[
                      styles.padLabel,
                      on && styles.padLabelAtiva,
                      !on && corTextoIdle ? { color: corTextoIdle, opacity: 0.75 } : null,
                    ]}
                  >
                    {NOTA_LABEL[nota]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.secao}>Volume geral</Text>
          <View style={styles.volumeLinha}>
            <BarraDeslizante
              valor={volumeGeral}
              onChange={ajustarVolumeGeral}
              corPreenchida={corAtiva}
              corBolinha={corAtiva}
            />
            <Text style={styles.volumeTexto}>{Math.round(volumeGeral * 100)}%</Text>
          </View>
        </View>
      </ScrollView>

      <PainelPersonalizarPads
        visible={painelAberto}
        onClose={() => setPainelAberto(false)}
        aparencia={aparencia}
        atualizar={atualizar}
        restaurarPadrao={restaurarPadrao}
      />
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: MAX_LARGURA,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
  },
  avisoTexto: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  // Idle: escuro liso, sem glow.
  pad: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    overflow: 'hidden',
  },
  led: {
    position: 'absolute',
    top: 7,
    left: 7,
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  ledOn: {
    backgroundColor: colors.textInverse,
  },
  padNota: {
    ...typography.h3,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  padNotaAtiva: {
    color: colors.textInverse,
  },
  padLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  padLabelAtiva: {
    color: 'rgba(255,255,255,0.85)',
  },
  secao: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
  },
  volumeLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  volumeTexto: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    width: 44,
    textAlign: 'right',
  },
});
