import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainTabs } from './MainTabs';
import { EscalasScreen } from '@/screens/escalas/EscalasScreen';
import { EscalaFixaScreen } from '@/screens/escalas/EscalaFixaScreen';
import { ConfirmacoesScreen } from '@/screens/escalas/ConfirmacoesScreen';
import { DetalhesCultoScreen } from '@/screens/escalas/DetalhesCultoScreen';
import { MembrosScreen } from '@/screens/membros/MembrosScreen';
import { DetalheMembroScreen } from '@/screens/membros/DetalheMembroScreen';
import { OctapadScreen } from '@/screens/octapad/OctapadScreen';
import { BibliotecaDrumsScreen } from '@/screens/octapad/BibliotecaDrumsScreen';
import { AfinadorScreen } from '@/screens/afinador/AfinadorScreen';
import { MetronomoScreen } from '@/screens/metronomo/MetronomoScreen';
import { BibliotecaScreen } from '@/screens/biblioteca/BibliotecaScreen';
import { DetalheMusicaScreen } from '@/screens/biblioteca/DetalheMusicaScreen';
import { PadContinuoScreen } from '@/screens/padContinuo/PadContinuoScreen';
import { MinisterioScreen } from '@/screens/ministerio/MinisterioScreen';

export type MainStackParamList = {
  MainTabs: undefined;
  Escalas: undefined;
  EscalaFixa: undefined;
  Confirmacoes: undefined;
  DetalhesCulto: { cultoId: number };
  Membros: undefined;
  DetalheMembro: { membroId?: number };
  Octapad: undefined;
  BibliotecaDrums: { padId?: string } | undefined;
  Afinador: undefined;
  Metronomo: { bpm?: number } | undefined;
  Biblioteca: undefined;
  DetalheMusica: { musicaId: number; nome?: string };
  PadContinuo: undefined;
  Ministerio: undefined;
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
      <Stack.Screen name="Octapad" component={OctapadScreen} />
      <Stack.Screen name="BibliotecaDrums" component={BibliotecaDrumsScreen} />
      <Stack.Screen name="Afinador" component={AfinadorScreen} />
      <Stack.Screen name="Metronomo" component={MetronomoScreen} />
      <Stack.Screen name="Biblioteca" component={BibliotecaScreen} />
      <Stack.Screen name="DetalheMusica" component={DetalheMusicaScreen} />
      <Stack.Screen name="PadContinuo" component={PadContinuoScreen} />
      <Stack.Screen name="Ministerio" component={MinisterioScreen} />
    </Stack.Navigator>
  );
}
