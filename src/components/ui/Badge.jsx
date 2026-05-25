import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const variantMap = {
  default: { bg: COLORS.brandBlue + '20', text: COLORS.brandBlue },
  success: { bg: COLORS.successBg, text: COLORS.success },
  error: { bg: COLORS.errorBg, text: COLORS.error },
  warning: { bg: '#fef3c7', text: '#92400e' },
  muted: { bg: '#f1f5f9', text: '#64748b' },
};

export const Badge = ({ children, variant = 'default', style }) => {
  const colors = variantMap[variant] || variantMap.default;
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
