import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
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
  // No desktop a navegação principal fica na `PersistentSidebar` (fixa, no
  // MainNavigator, ao lado do Stack) — então aqui escondemos a tab bar. No
  // mobile mantemos a bottom tab bar padrão.
  const { isDesktop } = useBreakpoint();

  return (
    <Tab.Navigator
      tabBar={(props) => (isDesktop ? null : <BottomTabBar {...props} />)}
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { flex: 1, backgroundColor: colors.background },
        tabBarPosition: 'bottom',
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.bar,
        tabBarItemStyle: styles.item,
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
  item: {
    paddingTop: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconWrap: {
    width: 60,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.accentSoft,
    // Glow teal por trás do ícone ativo (RN Web traduz p/ box-shadow).
    shadowColor: colors.glow,
    shadowOpacity: 0.7,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
});
