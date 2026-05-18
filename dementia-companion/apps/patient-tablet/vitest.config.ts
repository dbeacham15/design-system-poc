import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
  },
  resolve: {
    alias: {
      // Stub React Native and Expo modules that don't run in jsdom
      'react-native': './src/tests/mocks/react-native.ts',
      'expo-keep-awake': './src/tests/mocks/expo-keep-awake.ts',
      'expo-screen-orientation': './src/tests/mocks/expo-screen-orientation.ts',
      'expo-notifications': './src/tests/mocks/expo-notifications.ts',
    },
  },
})
