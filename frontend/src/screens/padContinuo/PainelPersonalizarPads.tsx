import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { BarraDeslizante } from '@/components/BarraDeslizante';
import { AparenciaPads } from '@/hooks/usePadAparencia';
import { PALETA_ATIVO, PALETA_INATIVO } from './paletasPad';
import { corEhClara } from '@/utils/cor';
import { fonts, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

interface PainelPersonalizarPadsProps {
  visible: boolean;
  onClose: () => void;
  aparencia: AparenciaPads;
  atualizar: (parcial: Partial<AparenciaPads>) => void;
  restaurarPadrao: () => void;
}

function Amostra({ corReal, selecionada, onPress }: { corReal: string; selecionada: boolean; onPress: () => void }) {
  const styles = useThemedStyles(criarEstilos);
  const corCheck = corEhClara(corReal) ? '#1E2340' : '#FFFFFF';
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.amostra, { backgroundColor: corReal }, selecionada && styles.amostraSelecionada]}
      activeOpacity={0.8}
    >
      {selecionada && <Icon name="checkmark" size={16} color={corCheck} />}
    </TouchableOpacity>
  );
}

/** Painel de personalização visual dos Pads Contínuos (cores idle/ativo + brilho). */
export function PainelPersonalizarPads({ visible, onClose, aparencia, atualizar, restaurarPadrao }: PainelPersonalizarPadsProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.cabecalho}>
            <Text style={styles.titulo}>Aparência dos pads</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Icon name="close-circle" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.secao}>Cor do pad inativo</Text>
          <View style={styles.amostras}>
            {PALETA_INATIVO.map((opcao) => (
              <Amostra
                key={opcao.label}
                corReal={opcao.cor ?? colors.surfaceElevated}
                selecionada={aparencia.corInativo === opcao.cor}
                onPress={() => atualizar({ corInativo: opcao.cor })}
              />
            ))}
          </View>

          <Text style={styles.secao}>Cor do pad ativo</Text>
          <View style={styles.amostras}>
            {PALETA_ATIVO.map((opcao) => (
              <Amostra
                key={opcao.label}
                corReal={opcao.cor ?? colors.primary}
                selecionada={aparencia.corAtivo === opcao.cor}
                onPress={() => atualizar({ corAtivo: opcao.cor })}
              />
            ))}
          </View>

          <Text style={styles.secao}>Brilho do pad</Text>
          <View style={styles.brilhoLinha}>
            <BarraDeslizante
              valor={aparencia.brilho}
              onChange={(v) => atualizar({ brilho: v })}
              corPreenchida={aparencia.corAtivo ?? colors.primary}
              corBolinha={aparencia.corAtivo ?? colors.primary}
            />
            <Text style={styles.brilhoTexto}>{Math.round(aparencia.brilho * 100)}%</Text>
          </View>

          <Button title="Restaurar padrão" variant="outline" onPress={restaurarPadrao} style={styles.restaurarButton} />
        </View>
      </View>
    </Modal>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: {
    ...typography.h3,
    color: colors.text,
  },
  secao: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
  },
  amostras: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amostra: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amostraSelecionada: {
    borderColor: colors.text,
  },
  brilhoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  brilhoTexto: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    width: 44,
    textAlign: 'right',
  },
  restaurarButton: {
    marginTop: spacing.sm,
  },
});
