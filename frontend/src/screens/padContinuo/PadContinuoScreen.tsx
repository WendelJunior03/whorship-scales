import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useFocusEffect } from '@react-navigation/native';
import { Icon } from '@/components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { FaderVertical } from '@/components/FaderVertical';
import { KnobGiratorio } from '@/components/KnobGiratorio';
import { Card } from '@/components/Card';
import { SeloPro } from '@/components/SeloPro';
import { useRecurso } from '@/hooks/useRecurso';
import { usePadContinuo } from '@/hooks/usePadContinuo';
import { usePadAparencia } from '@/hooks/usePadAparencia';
import { PainelPersonalizarPads } from './PainelPersonalizarPads';
import { EstadoCamada, NOTAS } from '@/audio/padContinuo';
import { hexParaRgba } from '@/utils/cor';
import { fonts, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

const KEEP_AWAKE_TAG = 'pad-continuo';
const LARGURA_COLUNA = 108;
const ALTURA_FADER = 140;
// Intensidade mínima da cor de destaque (brilho=0 nunca some de vez).
const ALPHA_DESTAQUE_MIN = 0.4;

export function PadContinuoScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const {
    camadas,
    notaGlobal,
    selecionarNotaGlobal,
    estados,
    carregando,
    alternarLigada,
    ajustarVolume,
    ajustarCutoff,
    alternarMudo,
    alternarSolo,
    volumeMaster,
    ajustarVolumeMaster,
    cutoffMaster,
    ajustarCutoffMaster,
    loFilterMaster,
    ajustarLoFilterMaster,
    pararTudo,
  } = usePadContinuo();
  const { liberado: camadasExtrasLiberadas, isPro } = useRecurso('pads.camadas_extras');
  const { aparencia, atualizar, restaurarPadrao } = usePadAparencia();
  const [painelAberto, setPainelAberto] = useState(false);

  const camadasVisiveis = camadas.filter((c) => !c.somenteNoPro || camadasExtrasLiberadas);

  // Cor de destaque (fader, knob, banco de pads, SOLO) — personalizável; `brilho`
  // modula a intensidade sem nunca deixar totalmente apagada.
  const corDestaqueBase = aparencia.corAtivo ?? colors.primary;
  const corDestaque = hexParaRgba(corDestaqueBase, ALPHA_DESTAQUE_MIN + aparencia.brilho * (1 - ALPHA_DESTAQUE_MIN));
  const corInativa = aparencia.corInativo ?? undefined;

  const pararTudoRef = useRef(pararTudo);
  useEffect(() => {
    pararTudoRef.current = pararTudo;
  }, [pararTudo]);

  // Mantém a tela ligada enquanto QUALQUER camada estiver ligada (evita o celular travar
  // sozinho no meio do culto). No web usa a Wake Lock API do navegador — sem suporte, é um no-op.
  const algumaCamadaLigada = Object.values(estados).some((estado) => estado.ligada);
  useEffect(() => {
    if (algumaCamadaLigada) {
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    } else {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    }
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    };
  }, [algumaCamadaLigada]);

  // Ao sair da tela (voltar, trocar de aba, etc.) desliga qualquer camada que tenha ficado tocando.
  useFocusEffect(
    useCallback(() => {
      return () => pararTudoRef.current();
    }, []),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header
        title="Pads Contínuos"
        subtitle="Banco de Pads"
        showBack
        rightIcon="palette-outline"
        rightIconLabel="Personalizar aparência dos pads"
        onRightPress={() => setPainelAberto(true)}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.aviso}>
          <Icon name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.avisoTexto}>
            Escolha uma nota lá embaixo e ligue as camadas que quiser — todas tocam essa mesma nota, em loop contínuo.
          </Text>
        </Card>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colunasScroll}>
          <View style={styles.colunas}>
            {camadasVisiveis.map((camada) => (
              <ColunaCamada
                key={camada.id}
                rotulo={camada.rotulo}
                estado={estados[camada.id]}
                carregando={!!carregando[camada.id]}
                corDestaque={corDestaque}
                corInativa={corInativa}
                onAlternarLigada={() => alternarLigada(camada.id)}
                onAjustarVolume={(v) => ajustarVolume(camada.id, v)}
                onAjustarCutoff={(v) => ajustarCutoff(camada.id, v)}
                onAlternarMudo={() => alternarMudo(camada.id)}
                onAlternarSolo={() => alternarSolo(camada.id)}
              />
            ))}

            {!camadasExtrasLiberadas && (
              <Card style={styles.colunaBloqueada}>
                <Icon name="grid-outline" size={22} color={colors.textSecondary} />
                <Text style={styles.colunaBloqueadaTexto}>+7 camadas</Text>
                <SeloPro />
              </Card>
            )}
          </View>
        </ScrollView>

        <Text style={styles.secaoTitulo}>Banco de pads</Text>
        <Card style={styles.notasCard}>
          <View style={styles.notasGrid}>
            {NOTAS.map((nota) => {
              const ativa = notaGlobal === nota;
              return (
                <TouchableOpacity
                  key={nota}
                  style={[
                    styles.notaBotao,
                    corInativa ? { backgroundColor: hexParaRgba(corInativa, 0.18), borderColor: corInativa } : null,
                    ativa && { backgroundColor: corDestaque, borderColor: corDestaque },
                  ]}
                  onPress={() => selecionarNotaGlobal(nota)}
                >
                  <Text style={[styles.notaBotaoTexto, ativa && styles.notaBotaoTextoAtivo]}>{nota}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <View style={styles.masterHeader}>
          <Text style={styles.secaoTitulo}>Master</Text>
          {isPro && <SeloPro />}
        </View>
        <Card style={styles.masterCard}>
          <View style={styles.masterKnob}>
            <KnobGiratorio valor={loFilterMaster} onChange={ajustarLoFilterMaster} cor={corDestaque} corInativa={corInativa} />
            <Text style={styles.masterValor}>{Math.round(loFilterMaster * 100)}</Text>
            <Text style={styles.masterLabel}>FILTER</Text>
          </View>
          <View style={styles.masterKnob}>
            <KnobGiratorio valor={cutoffMaster} onChange={ajustarCutoffMaster} cor={corDestaque} corInativa={corInativa} />
            <Text style={styles.masterValor}>{Math.round(cutoffMaster * 100)}</Text>
            <Text style={styles.masterLabel}>CUTOFF</Text>
          </View>
          <View style={styles.masterKnob}>
            <KnobGiratorio valor={volumeMaster} onChange={ajustarVolumeMaster} cor={corDestaque} corInativa={corInativa} />
            <Text style={styles.masterValor}>{Math.round(volumeMaster * 100)}</Text>
            <Text style={styles.masterLabel}>VOLUME</Text>
          </View>
        </Card>
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

interface ColunaCamadaProps {
  rotulo: string;
  estado: EstadoCamada;
  carregando: boolean;
  corDestaque: string;
  corInativa?: string;
  onAlternarLigada: () => void;
  onAjustarVolume: (v: number) => void;
  onAjustarCutoff: (v: number) => void;
  onAlternarMudo: () => void;
  onAlternarSolo: () => void;
}

/**
 * Uma coluna de camada — fader vertical (volume), botões ON/MUTE/SOLO (grandes, todos
 * clicáveis de verdade) e knob de CUTOFF. A nota é global (banco de pads, abaixo das
 * colunas) — aqui só decide se a camada está ligada (tocando a nota atual) ou não.
 */
function ColunaCamada({
  rotulo,
  estado,
  carregando,
  corDestaque,
  corInativa,
  onAlternarLigada,
  onAjustarVolume,
  onAjustarCutoff,
  onAlternarMudo,
  onAlternarSolo,
}: ColunaCamadaProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const estiloInativo = corInativa ? { backgroundColor: hexParaRgba(corInativa, 0.18), borderColor: corInativa } : null;

  return (
    <Card style={styles.coluna}>
      <Text style={styles.colunaRotulo} numberOfLines={1}>
        {rotulo}
      </Text>
      <Text style={styles.valorTexto}>{Math.round(estado.volume * 100)}</Text>

      <View style={styles.faderBloco}>
        <FaderVertical
          valor={estado.volume}
          onChange={onAjustarVolume}
          corPreenchida={corDestaque}
          corBolinha={corDestaque}
          corTrilha={corInativa}
        />
      </View>

      <View style={styles.botoesBloco}>
        <TouchableOpacity
          style={[
            styles.botaoToggle,
            estiloInativo,
            estado.ligada && { backgroundColor: colors.success, borderColor: colors.success },
          ]}
          onPress={onAlternarLigada}
        >
          {carregando ? (
            <Icon name="cloud-download-outline" size={14} color={estado.ligada ? colors.textInverse : colors.textSecondary} />
          ) : (
            <Text style={[styles.botaoToggleTexto, estado.ligada && styles.botaoToggleTextoAtivo]}>
              {estado.ligada ? 'ON' : 'OFF'}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.botaoToggle,
            estiloInativo,
            estado.mudo && { backgroundColor: colors.error, borderColor: colors.error },
          ]}
          onPress={onAlternarMudo}
        >
          <Text style={[styles.botaoToggleTexto, estado.mudo && styles.botaoToggleTextoAtivo]}>MUTE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.botaoToggle, estiloInativo, estado.solo && { backgroundColor: colors.warning, borderColor: colors.warning }]}
          onPress={onAlternarSolo}
        >
          <Text style={[styles.botaoToggleTexto, estado.solo && styles.botaoToggleTextoAtivo]}>SOLO</Text>
        </TouchableOpacity>
      </View>

      <KnobGiratorio valor={estado.cutoff} onChange={onAjustarCutoff} cor={corDestaque} corInativa={corInativa} />
      <Text style={styles.ledTexto}>CUTOFF</Text>
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
    gap: spacing.md,
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
  colunasScroll: {
    flexGrow: 0,
  },
  colunas: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  coluna: {
    width: LARGURA_COLUNA,
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.lg,
  },
  colunaRotulo: {
    ...typography.caption,
    color: colors.text,
    fontFamily: fonts.semibold,
  },
  faderBloco: {
    height: ALTURA_FADER,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  valorTexto: {
    ...typography.caption,
    color: colors.textMuted,
  },
  botoesBloco: {
    width: '100%',
    gap: 6,
  },
  botaoToggle: {
    width: '100%',
    height: 30,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoToggleTexto: {
    ...typography.caption,
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  botaoToggleTextoAtivo: {
    color: colors.textInverse,
  },
  ledTexto: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  secaoTitulo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
  },
  notasCard: {
    borderRadius: radius.lg,
  },
  notasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  notaBotao: {
    width: '14%',
    minWidth: 44,
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notaBotaoTexto: {
    ...typography.body,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  notaBotaoTextoAtivo: {
    color: colors.textInverse,
  },
  masterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  masterCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: radius.lg,
  },
  masterKnob: {
    alignItems: 'center',
    gap: 4,
  },
  masterValor: {
    ...typography.bodySmall,
    color: colors.text,
    fontFamily: fonts.semibold,
  },
  masterLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  colunaBloqueada: {
    width: LARGURA_COLUNA,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
  },
  colunaBloqueadaTexto: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
