export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
};

// Padrão oficial do React Navigation para tipar useNavigation/Link globalmente:
// https://reactnavigation.org/docs/typescript/#specifying-default-types-for-usenavigation-link-ref-etc
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
