import { createNavigationContainerRef } from '@react-navigation/native';
import type { AuthStackParamList } from './AuthNavigator';
import type { MainStackParamList } from './MainNavigator';
import type { MainTabParamList } from './MainTabs';

/** União de todas as rotas do app — mesma base do `linking`. */
export type RootNavParamList = AuthStackParamList & MainStackParamList & MainTabParamList;

/**
 * Ref do NavigationContainer — permite navegar de fora da árvore de navegadores
 * (ex.: a sidebar persistente do desktop, que fica ao lado do Stack e não tem
 * contexto de navegação próprio).
 */
export const navigationRef = createNavigationContainerRef<RootNavParamList>();
