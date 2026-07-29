import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList } from './MainTabs';
import { MainStackParamList } from './MainNavigator';

export type { AuthStackParamList } from './AuthNavigator';
export type { MainStackParamList } from './MainNavigator';
export type { MainTabParamList } from './MainTabs';

/**
 * Navegação disponível dentro de uma tela que vive dentro das tabs
 * (Home, Agenda, etc.) — permite navegar tanto pra outras abas
 * (ex: 'Agenda') quanto pra telas empilhadas na stack por cima das
 * tabs (ex: 'DetalhesCulto', 'Membros').
 */
export type MainTabScreenNavigationProp<TTab extends keyof MainTabParamList> =
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, TTab>,
    StackNavigationProp<MainStackParamList>
  >;
