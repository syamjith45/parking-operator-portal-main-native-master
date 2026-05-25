import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ApolloProvider } from '@apollo/client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { client, setAuthTokenGetter } from './src/lib/apolloClient';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

import { PrinterProvider } from './src/context/PrinterContext';

function AppContent() {
  const { token } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ApolloProvider client={client}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <PrinterProvider>
                <AppContent />
              </PrinterProvider>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </ApolloProvider>
    </GestureHandlerRootView>
  );
}
