import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={
              focused
                ? tabIcon[route.name]
                : (`${tabIcon[route.name]}-outline` as keyof typeof Ionicons.glyphMap)
            }
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Agenda" component={AgendaScreen} options={{ title: 'Agenda' }} />
      <Tab.Screen
        name="Notificacoes"
        component={NotificacoesScreen}
        options={{ title: 'Notificações' }}
      />
      <Tab.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
