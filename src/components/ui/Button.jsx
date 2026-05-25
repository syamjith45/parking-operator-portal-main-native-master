import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';

export const Button = ({
  children,
  onPress,
  variant = 'default',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const { isDark } = useTheme();
  const isDisabled = disabled || isLoading;

  const variantStyles = {
    default: {
      backgroundColor: COLORS.brandBlue,
      borderWidth: 0,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: isDark ? COLORS.borderDark : COLORS.border,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    destructive: {
      backgroundColor: COLORS.error,
      borderWidth: 0,
    },
    dark: {
      backgroundColor: isDark ? COLORS.white : COLORS.black,
      borderWidth: 0,
    },
  };

  const textVariantStyles = {
    default: { color: COLORS.white },
    outline: { color: isDark ? COLORS.textPrimaryDark : COLORS.textPrimary },
    ghost: { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary },
    destructive: { color: COLORS.white },
    dark: { color: isDark ? COLORS.black : COLORS.white },
  };

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
    md: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14 },
    lg: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16 },
  };

  const textSizeStyles = {
    sm: { fontSize: 13, fontWeight: '600' },
    md: { fontSize: 14, fontWeight: '700' },
    lg: { fontSize: 16, fontWeight: '700' },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'default' || variant === 'destructive' ? COLORS.white : COLORS.brandBlue}
        />
      ) : (
        <View style={styles.content}>
          {typeof children === 'string' ? (
            <Text style={[textVariantStyles[variant], textSizeStyles[size], textStyle]}>
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
