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
import { SeloPro } from '@/components/SeloPro';
import { useRecurso } from '@/hooks/useRecurso';
import { usePadContinuo } from '@/hooks/usePadContinuo';
import { usePadAparencia } from '@/hooks/usePadAparencia';
import { CamadaId, NOTAS, Note } from '@/audio/padContinuo';
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
const CAMADA_PRINCIPAL: CamadaId = 'base1';

export function PadContinuoScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const {
    camadas,
    estados,
    carregando,
    selecionarNota,
    ajustarVolume,
    ajustarCutoff,
    alternarMudo,
    alternarSolo,
    volumeMaster,
    ajustarVolumeMaster,
    pararTudo,
  } = usePadContinuo();
  const { aparencia, atualizar, restaurarPadrao } = usePadAparencia();
  const { liberado: camadasExtrasLiberadas, isPro } = useRecurso('pads.camadas_extras');
  const [painelAberto, setPainelAberto] = useState(false);

  const camadaPrincipal = estados[CAMADA_PRINCIPAL];
  const camadasExtras = camadas.filter((c) => c.somenteNoPro);

  // `pararTudo` é estável (useCallback sem deps no hook), mas mantemos o padrão de ref
  // por segurança — se um dia passar a depender de estado, a limpeza continua só
  // rodando ao sair da tela, não a cada interação.
  const pararTudoRef = useRef(pararTudo);
  useEffect(() => {
    pararTudoRef.current = pararTudo;
  }, [pararTudo]);

  // Mantém a tela ligada enquanto QUALQUER camada tiver nota tocando (evita o celular
  // travar sozinho no meio do culto). No web usa a Wake Lock API do navegador — sem
  // suporte, é um no-op.
  const algumaCamadaAtiva = Object.values(estados).some((estado) => estado.notaAtiva !== null);
  useEffect(() => {
    if (algumaCamadaAtiva) {
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    } else {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    }
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    };
  }, [algumaCamadaAtiva]);

  // Ao sair da tela (voltar, trocar de aba, etc.) desliga qualquer camada que tenha ficado tocando.
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
            {NOTAS.map((nota: Note) => {
              const on = camadaPrincipal.notaAtiva === nota;
              return (
                <TouchableOpacity
                  key={nota}
                  activeOpacity={0.9}
                  onPress={() => selecionarNota(CAMADA_PRINCIPAL, nota)}
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

          {/* Camadas extras (PRO) — spec 06, D-06.6/D-06.7. FREE vê um card de convite. */}
          <View style={styles.secaoHeader}>
            <Text style={styles.secao}>Camadas</Text>
            {isPro && <SeloPro />}
          </View>

          {camadasExtrasLiberadas ? (
            camadasExtras.map((camada) => (
              <FaixaCamada
                key={camada.id}
                rotulo={camada.rotulo}
                estado={estados[camada.id]}
                carregando={!!carregando[camada.id]}
                corDestaque={corAtiva}
                onSelecionarNota={(nota) => selecionarNota(camada.id, nota)}
                onAjustarVolume={(v) => ajustarVolume(camada.id, v)}
                onAjustarCutoff={(v) => ajustarCutoff(camada.id, v)}
                onAlternarMudo={() => alternarMudo(camada.id)}
                onAlternarSolo={() => alternarSolo(camada.id)}
              />
            ))
          ) : (
            <Card style={styles.avisoPro}>
              <Icon name="grid-outline" size={20} color={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.avisoProTitulo}>5 camadas extras no PRO</Text>
                <Text style={styles.avisoProTexto}>
                  Base 2, Base 3, Atmosfera, Reverse e Guitarra — todas tocando junto com a de cima.
                </Text>
              </View>
              <SeloPro />
            </Card>
          )}

          <Text style={styles.secao}>Master</Text>
          <View style={styles.volumeLinha}>
            <BarraDeslizante
              valor={volumeMaster}
              onChange={ajustarVolumeMaster}
              corPreenchida={corAtiva}
              corBolinha={corAtiva}
            />
            <Text style={styles.volumeTexto}>{Math.round(volumeMaster * 100)}%</Text>
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

interface FaixaCamadaProps {
  rotulo: string;
  estado: { notaAtiva: Note | null; volume: number; cutoff: number; mudo: boolean; solo: boolean };
  carregando: boolean;
  corDestaque: string;
  onSelecionarNota: (nota: Note) => void;
  onAjustarVolume: (v: number) => void;
  onAjustarCutoff: (v: number) => void;
  onAlternarMudo: () => void;
  onAlternarSolo: () => void;
}

/**
 * Uma camada extra (PRO): mute/solo, cutoff e volume próprios, e uma faixa horizontal
 * compacta de notas (mesma interação do grid principal — tocar liga, tocar de novo na
 * mesma nota desliga — só visualmente mais enxuta pra caber 5 delas na tela).
 */
function FaixaCamada({
  rotulo,
  estado,
  carregando,
  corDestaque,
  onSelecionarNota,
  onAjustarVolume,
  onAjustarCutoff,
  onAlternarMudo,
  onAlternarSolo,
}: FaixaCamadaProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);

  return (
    <Card style={styles.faixa}>
      <View style={styles.faixaTopo}>
        <Text style={styles.faixaRotulo}>{rotulo}</Text>
        {carregando && <Icon name="cloud-download-outline" size={16} color={colors.textMuted} />}
        <View style={styles.faixaBotoes}>
          <TouchableOpacity
            onPress={onAlternarMudo}
            style={[styles.faixaBotao, estado.mudo && styles.faixaBotaoMudoAtivo]}
            accessibilityRole="button"
            accessibilityLabel="Mudo"
          >
            <Text style={[styles.faixaBotaoTexto, estado.mudo && styles.faixaBotaoTextoAtivo]}>M</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onAlternarSolo}
            style={[styles.faixaBotao, estado.solo && { backgroundColor: corDestaque }]}
            accessibilityRole="button"
            accessibilityLabel="Solo"
          >
            <Text style={[styles.faixaBotaoTexto, estado.solo && styles.faixaBotaoTextoAtivo]}>S</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.faixaSliders}>
        <View style={styles.faixaSliderBloco}>
          <Text style={styles.faixaSliderLabel}>Cutoff</Text>
          <BarraDeslizante
            valor={estado.cutoff}
            onChange={onAjustarCutoff}
            corPreenchida={corDestaque}
            corBolinha={corDestaque}
          />
        </View>
        <View style={styles.faixaSliderBloco}>
          <Text style={styles.faixaSliderLabel}>Volume</Text>
          <BarraDeslizante
            valor={estado.volume}
            onChange={onAjustarVolume}
            corPreenchida={corDestaque}
            corBolinha={corDestaque}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.faixaNotasScroll}>
        {NOTAS.map((nota) => {
          const ativa = estado.notaAtiva === nota;
          return (
            <TouchableOpacity
              key={nota}
              onPress={() => onSelecionarNota(nota)}
              style={[
                styles.faixaNota,
                ativa && { backgroundColor: corDestaque, borderColor: corDestaque },
              ]}
            >
              <Text style={[styles.faixaNotaTexto, ativa && styles.faixaNotaTextoAtiva]}>{nota}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Card>
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
  secaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  secao: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
  },
  avisoPro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
  },
  avisoProTitulo: {
    ...typography.body,
    color: colors.text,
    fontFamily: fonts.semibold,
  },
  avisoProTexto: {
    ...typography.caption,
    color: colors.textSecondary,
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
  // Faixa de camada extra
  faixa: {
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  faixaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  faixaRotulo: {
    ...typography.body,
    color: colors.text,
    fontFamily: fonts.semibold,
    flex: 1,
  },
  faixaBotoes: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  faixaBotao: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faixaBotaoMudoAtivo: {
    backgroundColor: colors.error,
  },
  faixaBotaoTexto: {
    ...typography.caption,
    color: colors.textSecondary,
    fontFamily: fonts.bold,
  },
  faixaBotaoTextoAtivo: {
    color: colors.textInverse,
  },
  faixaSliders: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  faixaSliderBloco: {
    flex: 1,
    gap: 4,
  },
  faixaSliderLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  faixaNotasScroll: {
    flexDirection: 'row',
  },
  faixaNota: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  faixaNotaTexto: {
    ...typography.caption,
    color: colors.text,
    fontFamily: fonts.semibold,
  },
  faixaNotaTextoAtiva: {
    color: colors.textInverse,
  },
});
