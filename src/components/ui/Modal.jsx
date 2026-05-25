import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';

export const Modal = ({ isOpen, onClose, title, children }) => {
  const { isDark } = useTheme();

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: isDark ? COLORS.bgCardDark : COLORS.bgCard },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />
          {title && (
            <View style={styles.header}>
              <Text
                style={[styles.title, { color: isDark ? COLORS.textPrimaryDark : COLORS.textPrimary }]}
              >
                {title}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons
                  name="close"
                  size={22}
                  color={isDark ? COLORS.textSecondaryDark : COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
          )}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: 32,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
});
