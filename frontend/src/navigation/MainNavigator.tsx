import React from 'react';
import { View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { MainTabs } from './MainTabs';
import { PersistentSidebar } from '@/components/PersistentSidebar';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { EscalasScreen } from '@/screens/escalas/EscalasScreen';
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
import { PastaScreen } from '@/screens/biblioteca/PastaScreen';
import { PadContinuoScreen } from '@/screens/padContinuo/PadContinuoScreen';
import { MinisterioScreen } from '@/screens/ministerio/MinisterioScreen';
import { PanoramaEscalasScreen } from '@/screens/escalas/PanoramaEscalasScreen';
import { IndisponibilidadesScreen } from '@/screens/indisponibilidades/IndisponibilidadesScreen';
import { AniversariantesScreen } from '@/screens/membros/AniversariantesScreen';
import { ComunicadosScreen } from '@/screens/comunicados/ComunicadosScreen';
import { AssinaturasScreen } from '@/screens/assinaturas/AssinaturasScreen';
import { MultitrackScreen } from '@/screens/multitrack/MultitrackScreen';
import { IntegracoesScreen } from '@/screens/integracoes/IntegracoesScreen';

export type MainStackParamList = {
  MainTabs: undefined;
  Escalas: undefined;
  Confirmacoes: undefined;
  DetalhesCulto: { cultoId: number; abrirEdicaoVocal?: boolean };
  Membros: undefined;
  DetalheMembro: { membroId?: number };
  Octapad: undefined;
  BibliotecaDrums: { padId?: string } | undefined;
  Afinador: undefined;
  Metronomo: { bpm?: number } | undefined;
  Biblioteca: undefined;
  DetalheMusica: { musicaId: number; nome?: string };
  Pasta: { pastaId: number; nome?: string };
  PadContinuo: undefined;
  Ministerio: undefined;
  PanoramaEscalas: undefined;
  Indisponibilidades: undefined;
  Aniversariantes: undefined;
  Comunicados: { abrirId?: number } | undefined;
  Assinaturas: undefined;
  Multitrack: undefined;
  Integracoes: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();

function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { flex: 1 } }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Escalas" component={EscalasScreen} />
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
      <Stack.Screen name="Pasta" component={PastaScreen} />
      <Stack.Screen name="PadContinuo" component={PadContinuoScreen} />
      <Stack.Screen name="Ministerio" component={MinisterioScreen} />
      <Stack.Screen name="PanoramaEscalas" component={PanoramaEscalasScreen} />
      <Stack.Screen name="Indisponibilidades" component={IndisponibilidadesScreen} />
      <Stack.Screen name="Aniversariantes" component={AniversariantesScreen} />
      <Stack.Screen name="Comunicados" component={ComunicadosScreen} />
      <Stack.Screen name="Assinaturas" component={AssinaturasScreen} />
      <Stack.Screen name="Multitrack" component={MultitrackScreen} />
      <Stack.Screen name="Integracoes" component={IntegracoesScreen} />
    </Stack.Navigator>
  );
}

export function MainNavigator() {
  // No desktop a sidebar fica FIXA ao lado do Stack — assim ela persiste em
  // qualquer tela (inclusive nas de stack, tipo detalhe do culto), não só nas
  // abas. No mobile, cada tela usa a bottom tab normal.
  const { isDesktop } = useBreakpoint();

  // `<StackNavigator/>` fica SEMPRE na mesma posição da árvore (só a Sidebar entra/sai
  // como irmã) — antes isDesktop trocava entre dois retornos com o Stack em profundidades
  // diferentes, e toda vez que `isDesktop` mudava (ex.: resize/scrollbar assentando logo
  // depois da página carregar, perto do breakpoint) o React desmontava e remontava o Stack
  // inteiro (e a tela atual dentro dele) do zero. Isso duplicava qualquer coisa que uma
  // tela faça "sozinha" ao montar (ex.: o popover de presets do Pad Contínuo abrindo
  // automaticamente) uma vez por remontagem.
  return (
    <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
      {isDesktop && <PersistentSidebar />}
      <View style={{ flex: 1 }}>
        <StackNavigator />
      </View>
    </View>
  );
}
