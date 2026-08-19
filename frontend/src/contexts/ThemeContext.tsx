import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cores, ModoTema, Sombras, temas } from '@/theme/palettes';

export type PreferenciaTema = 'claro' | 'escuro' | 'sistema';

const CHAVE = '@deepscales:preferencia-tema';

interface ThemeData {
  /** O que o usuário escolheu (claro/escuro/sistema). */
  preferencia: PreferenciaTema;
  /** O modo efetivo aplicado agora (resolve "sistema"). */
  modo: ModoTema;
  colors: Cores;
  shadows: Sombras;
  definirPreferencia: (p: PreferenciaTema) => void;
}

const ThemeContext = createContext<ThemeData | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const sistema = useColorScheme(); // 'light' | 'dark' | null — reativo a mudanças do SO
  const [preferencia, setPreferencia] = useState<PreferenciaTema>('sistema');

  useEffect(() => {
    AsyncStorage.getItem(CHAVE)
      .then((v) => {
        if (v === 'claro' || v === 'escuro' || v === 'sistema') {
          setPreferencia(v);
        }
      })
      .catch(() => undefined);
  }, []);

  const definirPreferencia = useCallback((p: PreferenciaTema) => {
    setPreferencia(p);
    AsyncStorage.setItem(CHAVE, p).catch(() => undefined);
  }, []);

  // "sistema" segue o SO; sem info (null) cai no escuro (tema padrão do app).
  const modo: ModoTema =
    preferencia === 'sistema' ? (sistema === 'light' ? 'claro' : 'escuro') : preferencia;
  const { colors, shadows } = temas[modo];

  const valor = useMemo(
    () => ({ preferencia, modo, colors, shadows, definirPreferencia }),
    [preferencia, modo, colors, shadows, definirPreferencia],
  );

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeData {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme precisa ser usado dentro de um ThemeProvider');
  }
  return ctx;
}

/**
 * Cria estilos temáticos. Uso:
 *   const styles = useThemedStyles(criarEstilos);
 *   const criarEstilos = (colors: Cores, shadows: Sombras) => StyleSheet.create({ ... });
 * O corpo do StyleSheet continua usando `colors.x` / `shadows.md` (agora são parâmetros).
 */
export function useThemedStyles<T>(factory: (colors: Cores, shadows: Sombras) => T): T {
  const { colors, shadows } = useTheme();
  return useMemo(() => factory(colors, shadows), [colors, shadows]);
}
