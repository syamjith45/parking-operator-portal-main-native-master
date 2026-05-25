import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../constants/colors';

import LoginScreen from '../screens/auth/LoginScreen';
import OperatorTabNavigator from './OperatorTabNavigator';
import PricingScreen from '../screens/operator/PricingScreen';
import SettingsScreen from '../screens/operator/SettingsScreen';
import PrinterSettingsScreen from '../screens/operator/PrinterSettingsScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, loading, role } = useAuth();
  const { isDark } = useTheme();

  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: isDark ? COLORS.bgPrimaryDark : COLORS.bgPrimary,
      }}>
        <ActivityIndicator size="large" color={COLORS.brandBlue} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="OperatorTabs" component={OperatorTabNavigator} />
            <Stack.Screen
              name="Pricing"
              component={PricingScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="PrinterSettings"
              component={PrinterSettingsScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
