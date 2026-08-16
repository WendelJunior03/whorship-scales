import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { fonts, colors, spacing, radius } from '@/theme';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { AgendaScreen } from '@/screens/escalas/AgendaScreen';
import { NotificacoesScreen } from '@/screens/notificacoes/NotificacoesScreen';
import { PerfilScreen } from '@/screens/perfil/PerfilScreen';

export type MainTabParamList = {
  Home: undefined;
  Agenda: undefined;
  Notificacoes: undefined;
  Perfil: undefined;
};

const tabIcon: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Agenda: 'calendar',
  Notificacoes: 'notifications',
  Perfil: 'person',
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { flex: 1, backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.bar,
        tabBarItemStyle: styles.item,
        tabBarIcon: ({ color, focused }) => (
          <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
            <Ionicons
              name={
                focused
                  ? tabIcon[route.name]
                  : (`${tabIcon[route.name]}-outline` as keyof typeof Ionicons.glyphMap)
              }
              size={22}
              color={color}
            />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Agenda" component={AgendaScreen} options={{ title: 'Agenda' }} />
      <Tab.Screen
        name="Notificacoes"
        component={NotificacoesScreen}
        options={{ title: 'Avisos' }}
      />
      <Tab.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
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
    fontFamily: fonts.semibold,
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
