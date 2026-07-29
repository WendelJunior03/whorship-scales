import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '@/screens/home/HomeScreen';

export type MainStackParamList = {
  Home: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}
