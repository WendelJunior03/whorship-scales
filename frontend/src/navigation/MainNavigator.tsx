import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainTabs } from './MainTabs';
import { DetalhesCultoScreen } from '@/screens/escalas/DetalhesCultoScreen';
import { GerarEscalaScreen } from '@/screens/escalas/GerarEscalaScreen';
import { MembrosScreen } from '@/screens/membros/MembrosScreen';
import { DetalheMembroScreen } from '@/screens/membros/DetalheMembroScreen';

export type MainStackParamList = {
  MainTabs: undefined;
  DetalhesCulto: { cultoId: number };
  GerarEscala: { cultoId: number };
  Membros: undefined;
  DetalheMembro: { membroId?: number };
};

const Stack = createStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="DetalhesCulto" component={DetalhesCultoScreen} />
      <Stack.Screen name="GerarEscala" component={GerarEscalaScreen} />
      <Stack.Screen name="Membros" component={MembrosScreen} />
      <Stack.Screen name="DetalheMembro" component={DetalheMembroScreen} />
    </Stack.Navigator>
  );
}
