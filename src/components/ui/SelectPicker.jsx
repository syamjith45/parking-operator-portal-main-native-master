import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';

export const SelectPicker = ({
  value,
  onValueChange,
  items,
  placeholder = 'Select...',
  style,
  disabled = false,
}) => {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(false);

  const selected = items.find((i) => i.value === value);

  return (
    <>
      <TouchableOpacity
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={0.7}
        style={[
          styles.trigger,
          {
            backgroundColor: isDark ? COLORS.bgMutedDark : COLORS.bgCard,
            borderColor: value
              ? COLORS.brandBlue
              : isDark ? COLORS.borderDark : COLORS.border,
          },
          disabled && styles.disabled,
          style,
        ]}
      >
        <Text
          style={[
            styles.triggerText,
            {
              color: selected
                ? isDark ? COLORS.textPrimaryDark : COLORS.textPrimary
                : isDark ? COLORS.textMutedDark : COLORS.textMuted,
            },
          ]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={isDark ? COLORS.textMutedDark : COLORS.textMuted}
        />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setVisible(false)} />
        <SafeAreaView
          style={[styles.sheet, { backgroundColor: isDark ? COLORS.bgCardDark : COLORS.bgCard }]}
        >
          <View style={styles.sheetHandle}>
            <View style={[styles.handle, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.value)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.option,
                  item.value === value && { backgroundColor: COLORS.brandBlue + '15' },
                ]}
                onPress={() => {
                  onValueChange(item.value);
                  setVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: item.value === value
                        ? COLORS.brandBlue
                        : isDark ? COLORS.textPrimaryDark : COLORS.textPrimary,
                      fontWeight: item.value === value ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
                {item.value === value && (
                  <Ionicons name="checkmark" size={18} color={COLORS.brandBlue} />
                )}
              </TouchableOpacity>
            )}
            style={styles.list}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  disabled: { opacity: 0.5 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    paddingBottom: 32,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  list: {
    paddingHorizontal: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  optionText: {
    fontSize: 15,
    flex: 1,
  },
});
