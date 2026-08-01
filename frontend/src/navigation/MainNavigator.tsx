import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainTabs } from './MainTabs';
import { EscalasScreen } from '@/screens/escalas/EscalasScreen';
import { EscalaFixaScreen } from '@/screens/escalas/EscalaFixaScreen';
import { ConfirmacoesScreen } from '@/screens/escalas/ConfirmacoesScreen';
import { DetalhesCultoScreen } from '@/screens/escalas/DetalhesCultoScreen';
import { MembrosScreen } from '@/screens/membros/MembrosScreen';
import { DetalheMembroScreen } from '@/screens/membros/DetalheMembroScreen';

export type MainStackParamList = {
  MainTabs: undefined;
  Escalas: undefined;
  EscalaFixa: undefined;
  Confirmacoes: undefined;
  DetalhesCulto: { cultoId: number };
  Membros: undefined;
  DetalheMembro: { membroId?: number };
};

const Stack = createStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { flex: 1 } }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Escalas" component={EscalasScreen} />
      <Stack.Screen name="EscalaFixa" component={EscalaFixaScreen} />
      <Stack.Screen name="Confirmacoes" component={ConfirmacoesScreen} />
      <Stack.Screen name="DetalhesCulto" component={DetalhesCultoScreen} />
      <Stack.Screen name="Membros" component={MembrosScreen} />
      <Stack.Screen name="DetalheMembro" component={DetalheMembroScreen} />
    </Stack.Navigator>
  );
}
