import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export const Logo = ({ size = 'md' }) => {
  const sizes = {
    sm: { icon: 28, text: 14, sub: 8 },
    md: { icon: 40, text: 20, sub: 10 },
    lg: { icon: 56, text: 28, sub: 12 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <View style={styles.container}>
      <View style={[styles.icon, { width: s.icon, height: s.icon, borderRadius: s.icon / 4 }]}>
        <Text style={[styles.iconText, { fontSize: s.icon * 0.5 }]}>K</Text>
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.name, { fontSize: s.text }]}>Kera AI</Text>
        <Text style={[styles.sub, { fontSize: s.sub }]}>Parking Portal</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    backgroundColor: COLORS.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: COLORS.white,
    fontWeight: '900',
    letterSpacing: -1,
  },
  textBlock: {
    gap: 1,
  },
  name: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  sub: {
    fontWeight: '500',
    color: COLORS.textMuted,
  },
});
