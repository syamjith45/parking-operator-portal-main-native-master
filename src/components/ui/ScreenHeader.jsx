import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';

export const ScreenHeader = ({ title, subtitle, onBack, rightAction }) => {
  const { isDark } = useTheme();
  return (
    <View style={[styles.header, { borderBottomColor: isDark ? COLORS.borderDark : COLORS.borderLight }]}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={isDark ? COLORS.textPrimaryDark : COLORS.textPrimary} />
        </TouchableOpacity>
      )}
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: isDark ? COLORS.textPrimaryDark : COLORS.textPrimary }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: isDark ? COLORS.textMutedDark : COLORS.textMuted }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightAction && <View style={styles.right}>{rightAction}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0,
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  right: {
    marginLeft: 'auto',
  },
});
