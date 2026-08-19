import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { InitialState, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { AuthProvider } from '@/contexts/AuthContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { linking } from '@/navigation/linking';
import { NAVIGATION_PERSISTENCE_KEY } from '@/navigation/persistence';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState<InitialState | undefined>();
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    async function restoreState() {
      try {
        const saved = await AsyncStorage.getItem(NAVIGATION_PERSISTENCE_KEY);
        if (saved) {
          setInitialState(JSON.parse(saved));
        }
      } finally {
        setIsReady(true);
      }
    }
    restoreState();
  }, []);

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <RaizApp pronto={isReady && fontsLoaded} initialState={initialState} />
        </AuthProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

// Fica dentro do ThemeProvider pra ler o tema (loading temático + StatusBar dinâmico).
function RaizApp({ pronto, initialState }: { pronto: boolean; initialState?: InitialState }) {
  const { colors, modo } = useTheme();

  if (!pronto) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      linking={linking}
      initialState={initialState}
      onStateChange={(state) =>
        AsyncStorage.setItem(NAVIGATION_PERSISTENCE_KEY, JSON.stringify(state))
      }
    >
      <RootNavigator />
      <StatusBar style={modo === 'escuro' ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}
