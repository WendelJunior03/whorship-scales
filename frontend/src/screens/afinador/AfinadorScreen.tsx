import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon, IconName } from '@/components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { SeloPro } from '@/components/SeloPro';
import { useAfinador } from '@/hooks/useAfinador';
import { useRecurso } from '@/hooks/useRecurso';
import { freqParaNota } from '@/utils/notas';
import { AFINACOES, cordaMaisProxima, RECURSO_AFINADOR_AVANCADO } from '@/config/afinacoes';
import { fonts, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

const AFINADO_CENTS = 5; // tolerância pra considerar "afinado"

function Aviso({
  icon,
  titulo,
  texto,
  acao,
}: {
  icon: IconName;
  titulo: string;
  texto: string;
  acao?: { label: string; onPress: () => void };
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  return (
    <View style={styles.aviso}>
      <Icon name={icon} size={44} color={colors.textMuted} />
      <Text style={styles.avisoTitulo}>{titulo}</Text>
      <Text style={styles.avisoTexto}>{texto}</Text>
      {acao && <Button title={acao.label} onPress={acao.onPress} style={styles.avisoBotao} />}
    </View>
  );
}

function Medidor({ cents, temNota }: { cents: number; temNota: boolean }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const pct = Math.max(-50, Math.min(50, cents)) + 50; // 0..100
  const afinado = Math.abs(cents) <= AFINADO_CENTS;
  return (
    <View style={styles.medidor}>
      <View style={styles.medidorTrack} />
      <View style={styles.medidorCentro} />
      {temNota && (
        <View
          style={[
            styles.medidorAgulha,
            { left: `${pct}%`, backgroundColor: afinado ? colors.success : colors.warning },
          ]}
        />
      )}
    </View>
  );
}

export function AfinadorScreen() {
  const { shadows } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const { estado, freq, iniciar, parar } = useAfinador();
  const [afinacaoId, setAfinacaoId] = useState(AFINACOES[0].id);
  // Afinações avançadas são PRO (spec 03) — na v1 ficam liberadas, mas com selo.
  useRecurso(RECURSO_AFINADOR_AVANCADO);

  const afinacao = AFINACOES.find((a) => a.id === afinacaoId) ?? AFINACOES[0];
  const nota = freq ? freqParaNota(freq) : null;
  const cordaAlvo = freq ? cordaMaisProxima(afinacao, freq) : null;
  const afinado = nota ? Math.abs(nota.cents) <= AFINADO_CENTS : false;
  const ativo = estado === 'ativo';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Afinador" showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {AFINACOES.map((a) => {
            const sel = a.id === afinacaoId;
            return (
              <TouchableOpacity
                key={a.id}
                onPress={() => setAfinacaoId(a.id)}
                style={[styles.chip, sel && styles.chipAtivo]}
              >
                <Text style={[styles.chipTexto, sel && styles.chipTextoAtivo]}>{a.nome}</Text>
                {a.pro && <SeloPro style={styles.chipSelo} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {estado === 'indisponivel' ? (
          <Aviso
            icon="globe-outline"
            titulo="Disponível na versão web"
            texto="O afinador usa o microfone via navegador. No app nativo chega numa próxima fase — abra o Deep Scales no navegador pra usar agora."
          />
        ) : estado === 'negado' ? (
          <Aviso
            icon="mic-off-outline"
            titulo="Microfone bloqueado"
            texto="Libere a permissão do microfone nas configurações do navegador e tente de novo."
            acao={{ label: 'Tentar de novo', onPress: iniciar }}
          />
        ) : estado === 'erro' ? (
          <Aviso
            icon="alert-circle-outline"
            titulo="Algo deu errado"
            texto="Não consegui acessar o microfone. Tente de novo."
            acao={{ label: 'Tentar de novo', onPress: iniciar }}
          />
        ) : (
          <>
            <View style={[styles.mostrador, shadows.md]}>
              <Text style={[styles.nota, afinado && styles.notaAfinada]}>
                {nota ? nota.nome : '—'}
              </Text>
              <Text style={styles.subnota}>
                {nota ? nota.rotulo : ativo ? 'Toque uma corda…' : 'Microfone desligado'}
              </Text>
              <Text style={styles.hz}>{freq ? `${freq.toFixed(1)} Hz` : ' '}</Text>

              <Medidor cents={nota?.cents ?? 0} temNota={!!nota} />

              <Text
                style={[
                  styles.status,
                  afinado ? styles.statusAfinado : nota ? styles.statusDesafinado : styles.statusNeutro,
                ]}
              >
                {!nota ? ' ' : afinado ? 'Afinado ✓' : nota.cents < 0 ? 'Um pouco baixo ♭' : 'Um pouco alto ♯'}
              </Text>
            </View>

            <View style={styles.cordas}>
              {afinacao.cordas.map((c) => {
                const alvo = cordaAlvo?.rotulo === c.rotulo;
                return (
                  <View key={c.rotulo} style={[styles.corda, alvo && styles.cordaAtiva]}>
                    <Text style={[styles.cordaTexto, alvo && styles.cordaTextoAtivo]}>{c.rotulo}</Text>
                  </View>
                );
              })}
            </View>

            <Button
              title={ativo ? 'Parar' : 'Ligar microfone'}
              variant={ativo ? 'outline' : 'primary'}
              onPress={ativo ? parar : iniciar}
              loading={estado === 'pedindo'}
            />
            <Text style={styles.dica}>Toque uma corda de cada vez, perto do microfone.</Text>
          </>
        )}
      </ScrollView>
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
    gap: spacing.lg,
  },
  chips: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipTexto: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  chipTextoAtivo: {
    color: colors.primary,
    fontFamily: fonts.semibold,
  },
  chipSelo: {
    marginLeft: spacing.xs,
  },
  mostrador: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  nota: {
    fontFamily: fonts.bold,
    fontSize: 72,
    color: colors.text,
  },
  notaAfinada: {
    color: colors.success,
  },
  subnota: {
    ...typography.body,
    color: colors.textSecondary,
  },
  hz: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  medidor: {
    width: '100%',
    height: 48,
    marginTop: spacing.md,
    justifyContent: 'center',
  },
  medidorTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  medidorCentro: {
    position: 'absolute',
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 24,
    backgroundColor: colors.border,
  },
  medidorAgulha: {
    position: 'absolute',
    marginLeft: -3,
    width: 6,
    height: 32,
    borderRadius: radius.pill,
  },
  status: {
    ...typography.body,
    fontFamily: fonts.semibold,
    marginTop: spacing.sm,
  },
  statusAfinado: {
    color: colors.success,
  },
  statusDesafinado: {
    color: colors.warning,
  },
  statusNeutro: {
    color: colors.textMuted,
  },
  cordas: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  corda: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cordaAtiva: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cordaTexto: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
  },
  cordaTextoAtivo: {
    color: colors.textInverse,
  },
  dica: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  aviso: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  avisoTitulo: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  avisoTexto: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  avisoBotao: {
    marginTop: spacing.md,
  },
});
