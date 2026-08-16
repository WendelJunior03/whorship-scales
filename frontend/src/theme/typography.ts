// Fonte do app: Plus Jakarta Sans (carregada em App.tsx via @expo-google-fonts).
// Com fontes custom no RN, o PESO vem da família (não do fontWeight numérico),
// por isso cada estilo aponta a variante certa.
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

export const typography = {
  h1: { fontFamily: fonts.bold, fontSize: 28 },
  h2: { fontFamily: fonts.bold, fontSize: 22 },
  h3: { fontFamily: fonts.semibold, fontSize: 18 },
  body: { fontFamily: fonts.regular, fontSize: 16 },
  bodySmall: { fontFamily: fonts.regular, fontSize: 14 },
  caption: { fontFamily: fonts.regular, fontSize: 12 },
};
