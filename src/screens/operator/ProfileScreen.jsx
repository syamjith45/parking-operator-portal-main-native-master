import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';

const InfoRow = ({ icon, label, value, action, isDark }) => {
  const textPrimary = isDark ? COLORS.textPrimaryDark : COLORS.textPrimary;
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color={textMuted} style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={[styles.infoValue, { color: textPrimary }]}>{value || '—'}</Text>
        <Text style={[styles.infoLabel, { color: textMuted }]}>{label}</Text>
      </View>
      {action}
    </View>
  );
};

export default function ProfileScreen() {
  const { user, staffProfile, role, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigation = useNavigation();

  const displayName =
    staffProfile?.name || (user?.email ? user.email.split('@')[0] : 'Staff Member');

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const bg = isDark ? COLORS.bgPrimaryDark : COLORS.bgPrimary;
  const cardBg = isDark ? COLORS.bgCardDark : COLORS.bgCard;
  const border = isDark ? COLORS.borderDark : COLORS.borderLight;
  const textPrimary = isDark ? COLORS.textPrimaryDark : COLORS.textPrimary;
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;

  const roleColors = {
    manager: COLORS.brandBlue,
    operator: textMuted,
  };
  const roleDesc = {
    manager: 'Space Management Rights',
    operator: 'Standard Terminal Rights',
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: isDark ? COLORS.bgMutedDark : '#e2e8f0' }]}>
            <Ionicons name="person" size={40} color={textMuted} />
          </View>
          <Text style={[styles.name, { color: textPrimary }]}>{displayName}</Text>
          <Text style={[styles.role, { color: COLORS.brandBlue }]}>{role || 'Operator'}</Text>
        </View>

        {/* Contact Info Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.cardTitle, { color: textMuted }]}>Contact Information</Text>
          <InfoRow
            icon="mail-outline"
            label="Email Address"
            value={user?.email}
            isDark={isDark}
          />
          <View style={[styles.divider, { backgroundColor: border }]} />
          <InfoRow
            icon="call-outline"
            label="Phone Number"
            value={staffProfile?.phone || '+91 XXXXX XXXXX'}
            isDark={isDark}
          />
          <View style={[styles.divider, { backgroundColor: border }]} />
          <InfoRow
            icon="location-outline"
            label="Assigned Space"
            value={staffProfile?.space?.name || 'No Space Assigned'}
            isDark={isDark}
            action={
              role === 'manager' ? (
                <TouchableOpacity
                  style={[styles.changeBtn, { borderColor: isDark ? COLORS.borderDark : COLORS.border }]}
                  onPress={() => {}}
                >
                  <Text style={[styles.changeBtnText, { color: COLORS.brandBlue }]}>Change</Text>
                </TouchableOpacity>
              ) : null
            }
          />
          <View style={[styles.divider, { backgroundColor: border }]} />
          <InfoRow
            icon="business-outline"
            label="Organization"
            value={staffProfile?.organization?.name || 'No Organization'}
            isDark={isDark}
          />
        </View>

        {/* Security Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.cardTitle, { color: textMuted }]}>Security</Text>
          <View style={styles.infoRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={roleColors[role] || textMuted}
            />
            <View style={styles.infoContent}>
              <Text style={[styles.infoValue, { color: textPrimary }]}>
                {role === 'manager' ? 'Manager Access' : 'Operator Access'}
              </Text>
              <Text style={[styles.infoLabel, { color: textMuted }]}>{roleDesc[role]}</Text>
            </View>
          </View>
        </View>

        {/* Manager Quick Links */}
        {role === 'manager' && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.cardTitle, { color: textMuted }]}>Quick Links</Text>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => navigation.navigate('Pricing')}
            >
              <Ionicons name="pricetag-outline" size={20} color={textMuted} />
              <Text style={[styles.quickLinkText, { color: textPrimary }]}>Pricing Management</Text>
              <Ionicons name="chevron-forward" size={16} color={textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: border }]} />
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={20} color={textMuted} />
              <Text style={[styles.quickLinkText, { color: textPrimary }]}>Settings & Configuration</Text>
              <Ionicons name="chevron-forward" size={16} color={textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Device Settings */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.cardTitle, { color: textMuted }]}>Device Settings</Text>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => navigation.navigate('PrinterSettings')}
          >
            <Ionicons name="print-outline" size={20} color={textMuted} />
            <Text style={[styles.quickLinkText, { color: textPrimary }]}>Bluetooth Printer Setup</Text>
            <Ionicons name="chevron-forward" size={16} color={textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Theme Toggle */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <TouchableOpacity style={styles.themeRow} onPress={toggleTheme}>
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={textMuted}
            />
            <Text style={[styles.themeText, { color: textPrimary }]}>
              {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <Button
          variant="destructive"
          size="lg"
          onPress={handleLogout}
          style={styles.logoutBtn}
        >
          <View style={styles.logoutInner}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </View>
        </Button>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 16 },
  avatarSection: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  role: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: {},
  infoContent: { flex: 1 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  infoLabel: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  divider: { height: 1, marginVertical: 4 },
  changeBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  changeBtnText: { fontSize: 12, fontWeight: '700' },
  quickLink: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quickLinkText: { fontSize: 14, fontWeight: '600', flex: 1 },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  themeText: { fontSize: 14, fontWeight: '600', flex: 1 },
  logoutBtn: { borderRadius: 20 },
  logoutInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});
