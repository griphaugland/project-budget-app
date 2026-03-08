import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="onboarding"
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="transaction/[id]"
          options={{
            headerShown: true,
            headerTitle: 'Transaksjon',
            headerBackTitle: 'Tilbake',
            presentation: 'card',
          }}
        />
      </Stack>
    </>
  );
}
