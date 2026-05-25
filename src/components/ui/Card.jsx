import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';

export const Card = ({ children, style }) => {
  const { isDark } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? COLORS.bgCardDark : COLORS.bgCard,
          borderColor: isDark ? COLORS.borderDark : COLORS.border,
          shadowColor: isDark ? 'transparent' : '#000',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export const CardHeader = ({ children, style }) => (
  <View style={[styles.header, style]}>{children}</View>
);

export const CardTitle = ({ children, style }) => {
  const { isDark } = useTheme();
  return (
    <Text
      style={[
        styles.title,
        { color: isDark ? COLORS.textPrimaryDark : COLORS.textPrimary },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

export const CardContent = ({ children, style }) => (
  <View style={[styles.content, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  content: {},
});
