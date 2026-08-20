import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon, IconName } from '@/components/Icon';
import { spacing, radius } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { AgendaScreen } from '@/screens/escalas/AgendaScreen';
import { RecursosScreen } from '@/screens/recursos/RecursosScreen';
import { NotificacoesScreen } from '@/screens/notificacoes/NotificacoesScreen';
import { PerfilScreen } from '@/screens/perfil/PerfilScreen';

export type MainTabParamList = {
  Home: undefined;
  Agenda: undefined;
  Recursos: undefined;
  Notificacoes: undefined;
  Perfil: undefined;
};

const tabIcon: Record<keyof MainTabParamList, IconName> = {
  Home: 'home',
  Agenda: 'calendar',
  Recursos: 'grid',
  Notificacoes: 'notifications',
  Perfil: 'person',
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  // A partir do breakpoint `lg` (desktop / tablet paisagem) as bottom tabs viram
  // uma sidebar fixa à esquerda (navigation rail do react-navigation v7).
  const { isDesktop } = useBreakpoint();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { flex: 1, backgroundColor: colors.background },
        tabBarPosition: isDesktop ? 'left' : 'bottom',
        tabBarVariant: isDesktop ? 'material' : 'uikit',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarStyle: isDesktop ? styles.sidebar : styles.bar,
        tabBarItemStyle: isDesktop ? styles.itemSidebar : styles.item,
        tabBarIcon: ({ color, focused }) => (
          <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
            <Icon name={tabIcon[route.name]} size={22} color={color} />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Agenda" component={AgendaScreen} options={{ title: 'Agenda' }} />
      <Tab.Screen name="Recursos" component={RecursosScreen} options={{ title: 'Recursos' }} />
      <Tab.Screen
        name="Notificacoes"
        component={NotificacoesScreen}
        options={{ title: 'Avisos' }}
      />
      <Tab.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 68,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  // Sidebar (desktop): rail vertical à esquerda com borda de separação.
  sidebar: {
    backgroundColor: colors.surface,
    borderRightColor: colors.border,
    borderRightWidth: 1,
    width: 104,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  item: {
    paddingTop: 2,
  },
  itemSidebar: {
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconWrap: {
    width: 52,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.primarySoft,
  },
});
