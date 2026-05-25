import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';
import { EntryFormRouter } from '../../components/entry/EntryFormRouter';
import { ScreenHeader } from '../../components/ui/ScreenHeader';

export default function AddEntryScreen() {
  const { isDark } = useTheme();
  const { organization } = useAuth();

  const bg = isDark ? COLORS.bgPrimaryDark : COLORS.bgPrimary;
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;

  if (!organization) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
        <View style={styles.centered}>
          <Text style={[styles.noOrgText, { color: textMuted }]}>
            No organization assigned. Contact your manager.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <ScreenHeader
        title="New Entry"
        subtitle="Create a new parking session"
      />
      <EntryFormRouter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  noOrgText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
});
