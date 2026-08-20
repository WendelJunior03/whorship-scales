import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon, IconName } from '@/components/Icon';
import { spacing, radius, fonts } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

const LARGURA_EXPANDIDA = 240;
const LARGURA_RECOLHIDA = 76;
const CHAVE = '@deepscales:sidebar-expandida';

type Props = BottomTabBarProps & {
  /** Mapa nome-da-rota → ícone, definido no MainTabs. */
  tabIcon: Record<string, IconName>;
};

/**
 * Sidebar do desktop (substitui o navigation rail nativo) com botão de
 * expandir/recolher. Recebe os props padrão de tab bar do react-navigation.
 */
export function SidebarNav({ state, navigation, descriptors, tabIcon }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const insets = useSafeAreaInsets();
  const [expandida, setExpandida] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE)
      .then((v) => {
        if (v === '0') setExpandida(false);
      })
      .catch(() => undefined);
  }, []);

  const alternar = () => {
    setExpandida((atual) => {
      const proximo = !atual;
      AsyncStorage.setItem(CHAVE, proximo ? '1' : '0').catch(() => undefined);
      return proximo;
    });
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
        style={[styles.item, styles.toggle, !expandida && styles.itemRecolhido]}
        accessibilityRole="button"
        accessibilityLabel={expandida ? 'Recolher menu' : 'Expandir menu'}
      >
        <View style={styles.iconWrap}>
          <Icon name={expandida ? 'chevron-back' : 'list-outline'} size={22} color={colors.textSecondary} />
        </View>
        {expandida && <Text style={[styles.label, { color: colors.textSecondary }]}>Recolher</Text>}
      </Pressable>

      <View style={styles.nav}>
        {state.routes.map((route, index) => {
          const focado = state.index === index;
          const { options } = descriptors[route.key];
          const titulo = (options.title ?? route.name) as string;
          const cor = focado ? colors.primary : colors.textMuted;

          const aoPressionar = () => {
            const evento = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focado && !evento.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={aoPressionar}
              style={[styles.item, focado && styles.itemAtivo, !expandida && styles.itemRecolhido]}
              accessibilityRole="button"
              accessibilityState={{ selected: focado }}
              accessibilityLabel={titulo}
            >
              <View style={styles.iconWrap}>
                <Icon name={tabIcon[route.name]} size={22} color={cor} />
              </View>
              {expandida && (
                <Text numberOfLines={1} style={[styles.label, { color: cor }]}>
                  {titulo}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRightColor: colors.border,
    borderRightWidth: 1,
    paddingRight: spacing.sm,
  },
  nav: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  itemRecolhido: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    gap: 0,
  },
  itemAtivo: {
    backgroundColor: colors.primarySoft,
  },
  toggle: {
    alignSelf: 'flex-start',
  },
  iconWrap: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
});
