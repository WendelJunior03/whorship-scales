import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon, IconName } from '@/components/Icon';
import { spacing, radius, fonts } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { navigationRef } from '@/navigation/navigationRef';
import type { MainTabParamList } from '@/navigation/MainTabs';

const LARGURA_EXPANDIDA = 240;
const LARGURA_RECOLHIDA = 76;
const CHAVE = '@deepscales:sidebar-expandida';

// Abas (nested em MainTabs) ou telas de stack acessíveis direto pelo menu.
type RotaMenu = keyof MainTabParamList | 'Indisponibilidades';

interface ItemNav {
  rota: RotaMenu;
  label: string;
  icon: IconName;
}

// As 5 abas + atalhos de stack fixos em qualquer tela (desktop).
const ITENS: ItemNav[] = [
  { rota: 'Home', label: 'Início', icon: 'home' },
  { rota: 'Agenda', label: 'Agenda', icon: 'calendar' },
  { rota: 'Indisponibilidades', label: 'Indisponibilidades', icon: 'calendar-off' },
  { rota: 'Recursos', label: 'Recursos', icon: 'grid' },
  { rota: 'Notificacoes', label: 'Avisos', icon: 'notifications' },
  { rota: 'Perfil', label: 'Perfil', icon: 'person' },
];

/**
 * Sidebar do desktop que fica **fixa em todas as telas** (inclusive nas telas de
 * stack, como detalhe do culto). Renderizada no MainNavigator, ao lado do Stack;
 * como está fora do contexto de navegação, usa o `navigationRef` para navegar e
 * pra saber a rota ativa.
 */
export function PersistentSidebar() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const insets = useSafeAreaInsets();
  const [expandida, setExpandida] = useState(true);
  const [rotaAtual, setRotaAtual] = useState<string | undefined>();

  useEffect(() => {
    AsyncStorage.getItem(CHAVE)
      .then((v) => {
        if (v === '0') setExpandida(false);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const atualizar = () => {
      if (navigationRef.isReady()) {
        setRotaAtual(navigationRef.getCurrentRoute()?.name);
      }
    };
    atualizar();
    const unsub = navigationRef.addListener('state', atualizar);
    return unsub;
  }, []);

  const alternar = () => {
    setExpandida((atual) => {
      const proximo = !atual;
      AsyncStorage.setItem(CHAVE, proximo ? '1' : '0').catch(() => undefined);
      return proximo;
    });
  };

  const navegar = (rota: RotaMenu) => {
    if (navigationRef.isReady()) {
      // Nome da aba resolve o navegador aninhado (MainTabs); nome de tela de
      // stack (ex.: Indisponibilidades) navega direto na stack raiz.
      navigationRef.navigate(rota as never);
    }
  };

  const largura = (expandida ? LARGURA_EXPANDIDA : LARGURA_RECOLHIDA) + insets.left;

  return (
    <View
      style={[
        styles.container,
        {
          width: largura,
          paddingTop: spacing.md + insets.top,
          paddingBottom: spacing.md + insets.bottom,
          paddingLeft: spacing.sm + insets.left,
        },
      ]}
    >
      <Pressable
        onPress={alternar}
        style={[styles.item, !expandida && styles.itemRecolhido]}
        accessibilityRole="button"
        accessibilityLabel={expandida ? 'Recolher menu' : 'Expandir menu'}
      >
        <View style={styles.iconWrap}>
          <Icon name={expandida ? 'chevron-back' : 'list-outline'} size={22} color={colors.textSecondary} />
        </View>
        {expandida && <Text style={[styles.label, { color: colors.textSecondary }]}>Recolher</Text>}
      </Pressable>

      <View style={styles.nav}>
        {ITENS.map((item) => {
          const focado = rotaAtual === item.rota;
          const cor = focado ? colors.primary : colors.textMuted;
          return (
            <Pressable
              key={item.rota}
              onPress={() => navegar(item.rota)}
              style={[styles.item, focado && styles.itemAtivo, !expandida && styles.itemRecolhido]}
              accessibilityRole="button"
              accessibilityState={{ selected: focado }}
              accessibilityLabel={item.label}
            >
              <View style={styles.iconWrap}>
                <Icon name={item.icon} size={22} color={cor} />
              </View>
              {expandida && (
                <Text numberOfLines={1} style={[styles.label, { color: cor }]}>
                  {item.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const criarEstilos = (colors: Cores) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRightColor: colors.border,
      borderRightWidth: 1,
      paddingRight: spacing.sm,
    },
    nav: { marginTop: spacing.md, gap: spacing.xs },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      height: 48,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pill,
    },
    itemRecolhido: { justifyContent: 'center', paddingHorizontal: 0, gap: 0 },
    itemAtivo: { backgroundColor: colors.primarySoft },
    iconWrap: { width: 40, alignItems: 'center', justifyContent: 'center' },
    label: { fontFamily: fonts.semibold, fontSize: 15 },
  });
