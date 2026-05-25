import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';

import MonitorScreen from '../screens/operator/MonitorScreen';
import HistoryScreen from '../screens/operator/HistoryScreen';
import AddEntryScreen from '../screens/operator/AddEntryScreen';
import StatsScreen from '../screens/operator/StatsScreen';
import ProfileScreen from '../screens/operator/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function OperatorTabNavigator() {
  const { isDark } = useTheme();
  const { role } = useAuth();
  const insets = useSafeAreaInsets();

  const bg = isDark ? COLORS.bgCardDark : COLORS.bgCard;
  const border = isDark ? COLORS.borderDark : COLORS.border;
  const inactive = isDark ? COLORS.textMutedDark : COLORS.textMuted;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: bg,
          borderTopColor: border,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.brandBlue,
        tabBarInactiveTintColor: inactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Monitor') iconName = focused ? 'car' : 'car-outline';
          else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
          else if (route.name === 'Add') iconName = focused ? 'add-circle' : 'add-circle-outline';
          else if (route.name === 'Stats') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Monitor" component={MonitorScreen} options={{ tabBarLabel: 'Monitor' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'History' }} />
      <Tab.Screen name="Add" component={AddEntryScreen} options={{ tabBarLabel: 'Add Entry' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ tabBarLabel: 'Stats' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}
