import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { RootStackParamList } from './src/navigation';
import { AlarmEditScreen } from './src/screens/AlarmEditScreen';
import { AlarmListScreen } from './src/screens/AlarmListScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { PermissionsScreen } from './src/screens/PermissionsScreen';
import { SoundPickerScreen } from './src/screens/SoundPickerScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AlarmList"
              component={AlarmListScreen}
              options={{ title: '알람' }}
            />
            <Stack.Screen
              name="AlarmEdit"
              component={AlarmEditScreen}
              options={{ title: '알람' }}
            />
            <Stack.Screen
              name="SoundPicker"
              component={SoundPickerScreen}
              options={{ title: '알람 소리' }}
            />
            <Stack.Screen
              name="Permissions"
              component={PermissionsScreen}
              options={{ title: '권한 확인' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
