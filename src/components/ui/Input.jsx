import React from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';

export const Input = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  style,
  inputStyle,
  editable = true,
  maxLength,
  multiline,
  numberOfLines,
  onSubmitEditing,
  returnKeyType,
  autoFocus,
}) => {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? COLORS.bgMutedDark : COLORS.bgCard,
          borderColor: isDark ? COLORS.borderDark : COLORS.border,
        },
        style,
      ]}
    >
      <TextInput
        style={[
          styles.input,
          { color: isDark ? COLORS.textPrimaryDark : COLORS.textPrimary },
          inputStyle,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? COLORS.textMutedDark : COLORS.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        editable={editable}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        autoFocus={autoFocus}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
    margin: 0,
  },
});
