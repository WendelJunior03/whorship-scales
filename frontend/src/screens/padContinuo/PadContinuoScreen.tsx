import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useFocusEffect } from '@react-navigation/native';
import { Icon } from '@/components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { BarraDeslizante } from '@/components/BarraDeslizante';
import { FaderVertical } from '@/components/FaderVertical';
import { KnobGiratorio } from '@/components/KnobGiratorio';
import { Card } from '@/components/Card';
import { SeloPro } from '@/components/SeloPro';
import { useRecurso } from '@/hooks/useRecurso';
import { usePadContinuo } from '@/hooks/usePadContinuo';
import { EstadoCamada, NOTAS, Note } from '@/audio/padContinuo';
import { fonts, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

const KEEP_AWAKE_TAG = 'pad-continuo';
const LARGURA_COLUNA = 104;
const ALTURA_FADER = 140;

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
  const { liberado: camadasExtrasLiberadas, isPro } = useRecurso('pads.camadas_extras');

  const camadasVisiveis = camadas.filter((c) => !c.somenteNoPro || camadasExtrasLiberadas);

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

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Pads Contínuos" subtitle="Banco de Pads" showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.aviso}>
          <Icon name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.avisoTexto}>
            Escolha a nota de cada camada e toque em play. Elas tocam juntas, em loop contínuo.
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
                corDestaque={colors.primary}
                onSelecionarNota={(nota) => selecionarNota(camada.id, nota)}
                onAjustarVolume={(v) => ajustarVolume(camada.id, v)}
                onAjustarCutoff={(v) => ajustarCutoff(camada.id, v)}
                onAlternarMudo={() => alternarMudo(camada.id)}
                onAlternarSolo={() => alternarSolo(camada.id)}
              />
            ))}

            {!camadasExtrasLiberadas && (
              <Card style={styles.colunaBloqueada}>
                <Icon name="grid-outline" size={22} color={colors.textSecondary} />
                <Text style={styles.colunaBloqueadaTexto}>+5 camadas</Text>
                <SeloPro />
              </Card>
            )}
          </View>
        </ScrollView>

        <View style={styles.masterHeader}>
          <Text style={styles.masterTitulo}>Master</Text>
          {isPro && <SeloPro />}
        </View>
        <Card style={styles.masterCard}>
          <View style={styles.masterLinha}>
            <BarraDeslizante
              valor={volumeMaster}
              onChange={ajustarVolumeMaster}
              corPreenchida={colors.primary}
              corBolinha={colors.primary}
            />
            <Text style={styles.masterValor}>{Math.round(volumeMaster * 100)}</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

interface ColunaCamadaProps {
  rotulo: string;
  estado: EstadoCamada;
  carregando: boolean;
  corDestaque: string;
  onSelecionarNota: (nota: Note) => void;
  onAjustarVolume: (v: number) => void;
  onAjustarCutoff: (v: number) => void;
  onAlternarMudo: () => void;
  onAlternarSolo: () => void;
}

/**
 * Uma coluna de camada — visual inspirado em plugins de pad (fader vertical, ON/OFF,
 * MUTE, SOLO, knob de CUTOFF). A nota é independente por camada (decisão do projeto):
 * o stepper (◀ nota ▶) só ARMA qual nota o play/stop vai tocar — navegar não troca o
 * som sozinho, evita mudar a nota tocando sem querer ao só passar o olho pelas outras.
 */
function ColunaCamada({
  rotulo,
  estado,
  carregando,
  corDestaque,
  onSelecionarNota,
  onAjustarVolume,
  onAjustarCutoff,
  onAlternarMudo,
  onAlternarSolo,
}: ColunaCamadaProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const [notaArmada, setNotaArmada] = useState<Note>(estado.notaAtiva ?? 'C');

  const tocando = estado.notaAtiva === notaArmada;

  function irParaNota(direcao: 1 | -1) {
    const indiceAtual = NOTAS.indexOf(notaArmada);
    const proximoIndice = (indiceAtual + direcao + NOTAS.length) % NOTAS.length;
    setNotaArmada(NOTAS[proximoIndice]);
  }

  return (
    <Card style={styles.coluna}>
      <Text style={styles.colunaRotulo} numberOfLines={1}>
        {rotulo}
      </Text>

      <View style={styles.notaStepper}>
        <TouchableOpacity onPress={() => irParaNota(-1)} hitSlop={6} accessibilityLabel="Nota anterior">
          <Icon name="chevron-back" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.notaTexto}>{notaArmada}</Text>
        <TouchableOpacity onPress={() => irParaNota(1)} hitSlop={6} accessibilityLabel="Próxima nota">
          <Icon name="chevron-forward" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.playBotao, tocando && { backgroundColor: corDestaque }]}
        onPress={() => onSelecionarNota(notaArmada)}
        accessibilityRole="button"
        accessibilityLabel={tocando ? 'Parar' : 'Tocar'}
      >
        {carregando ? (
          <Icon name="cloud-download-outline" size={16} color={tocando ? colors.textInverse : colors.textSecondary} />
        ) : (
          <Icon name={tocando ? 'stop' : 'play'} size={16} color={tocando ? colors.textInverse : colors.textSecondary} />
        )}
      </TouchableOpacity>

      <View style={styles.faderBloco}>
        <FaderVertical
          valor={estado.volume}
          onChange={onAjustarVolume}
          corPreenchida={corDestaque}
          corBolinha={corDestaque}
        />
      </View>
      <Text style={styles.valorTexto}>{Math.round(estado.volume * 100)}</Text>

      <View style={styles.ledLinha}>
        <View style={[styles.led, tocando && { backgroundColor: colors.success }]} />
        <Text style={styles.ledTexto}>ON</Text>
      </View>
      <TouchableOpacity style={styles.ledLinha} onPress={onAlternarMudo}>
        <View style={[styles.led, estado.mudo && { backgroundColor: colors.error }]} />
        <Text style={styles.ledTexto}>MUTE</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.ledLinha} onPress={onAlternarSolo}>
        <View style={[styles.led, estado.solo && { backgroundColor: corDestaque }]} />
        <Text style={styles.ledTexto}>SOLO</Text>
      </TouchableOpacity>

      <KnobGiratorio valor={estado.cutoff} onChange={onAjustarCutoff} cor={corDestaque} />
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
  notaStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  notaTexto: {
    ...typography.body,
    color: colors.text,
    fontFamily: fonts.bold,
    minWidth: 24,
    textAlign: 'center',
  },
  playBotao: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faderBloco: {
    height: ALTURA_FADER,
    paddingVertical: spacing.xs,
  },
  valorTexto: {
    ...typography.caption,
    color: colors.textMuted,
  },
  ledLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  led: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ledTexto: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  masterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  masterTitulo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
  },
  masterCard: {
    borderRadius: radius.lg,
  },
  masterLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  masterValor: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    width: 32,
    textAlign: 'right',
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
