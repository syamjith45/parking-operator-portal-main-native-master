import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';

const GET_PRICING_RULES = gql`
  query GetPricingRules {
    pricingRules {
      id
      vehicle_type
      base_fee
      base_hours
      extra_hour_rate
    }
  }
`;

const UPDATE_PRICING_RULES = gql`
  mutation UpdatePricingRules($rules: [PricingRuleInput!]!) {
    updatePricingRules(rules: $rules) {
      id
      vehicle_type
      base_fee
      base_hours
      extra_hour_rate
    }
  }
`;

const FormInput = ({ label, value, onChange, prefix, isDark }) => {
  const textPrimary = isDark ? COLORS.textPrimaryDark : COLORS.textPrimary;
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;
  const inputBg = isDark ? COLORS.bgCardDark : COLORS.bgCard;
  const border = isDark ? COLORS.borderDark : COLORS.border;

  return (
    <View style={styles.formGroup}>
      <Text style={[styles.formLabel, { color: textMuted }]}>{label}</Text>
      <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: border }]}>
        {prefix && (
          <View style={[styles.inputPrefix, { borderRightColor: border, backgroundColor: isDark ? COLORS.bgMutedDark : '#f8fafc' }]}>
            <Text style={[styles.prefixText, { color: textMuted }]}>{prefix}</Text>
          </View>
        )}
        <TextInput
          style={[styles.input, { color: textPrimary }]}
          value={String(value)}
          onChangeText={(t) => onChange(t)}
          keyboardType="decimal-pad"
        />
      </View>
    </View>
  );
};

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();

  const [rules, setRules] = useState({
    bike: { baseCharge: 0, hourlyRate: 10, overstayRate: 15, baseHours: 2 },
    car: { baseCharge: 0, hourlyRate: 20, overstayRate: 30, baseHours: 2 },
  });
  const [isSaving, setIsSaving] = useState(false);

  const { data, loading } = useQuery(GET_PRICING_RULES, { fetchPolicy: 'network-only' });
  const [updateRules] = useMutation(UPDATE_PRICING_RULES);

  useEffect(() => {
    if (data?.pricingRules) {
      const newRules = { ...rules };
      data.pricingRules.forEach((r) => {
        const type = r.vehicle_type.toLowerCase();
        if (newRules[type]) {
          newRules[type] = {
            ...newRules[type],
            baseCharge: r.base_fee,
            hourlyRate: r.extra_hour_rate,
            baseHours: r.base_hours,
          };
        }
      });
      setRules(newRules);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleChange = (type, field, val) => {
    setRules((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: Number(val) || 0 },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = [];
      Object.entries(rules).forEach(([type, d]) => {
        payload.push({ vehicle_type: type, base_fee: d.baseCharge, base_hours: d.baseHours, extra_hour_rate: d.hourlyRate });
        const backendType = type === 'car' ? 'four_wheeler' : type === 'bike' ? 'two_wheeler' : type;
        if (backendType !== type) {
          payload.push({ vehicle_type: backendType, base_fee: d.baseCharge, base_hours: d.baseHours, extra_hour_rate: d.hourlyRate });
        }
      });
      await updateRules({ variables: { rules: payload }, refetchQueries: ['GetPricingRules'] });
      Alert.alert('Success', 'Configuration saved successfully!');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const bg = isDark ? COLORS.bgPrimaryDark : COLORS.bgPrimary;
  const cardBg = isDark ? COLORS.bgCardDark : COLORS.bgCard;
  const border = isDark ? COLORS.borderDark : COLORS.borderLight;
  const textPrimary = isDark ? COLORS.textPrimaryDark : COLORS.textPrimary;
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: textPrimary }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: textMuted }]}>Configure parking charges</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.brandBlue} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Two Wheeler */}
          <View style={[styles.section, { backgroundColor: isDark ? COLORS.bgMutedDark : '#f8fafc', borderColor: border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bicycle" size={22} color={textPrimary} />
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>Two Wheeler (2W)</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.half}>
                <FormInput
                  label="Base Charge"
                  prefix="₹"
                  value={rules.bike.baseCharge}
                  onChange={(v) => handleChange('bike', 'baseCharge', v)}
                  isDark={isDark}
                />
              </View>
              <View style={styles.half}>
                <FormInput
                  label="Hourly Rate"
                  prefix="₹"
                  value={rules.bike.hourlyRate}
                  onChange={(v) => handleChange('bike', 'hourlyRate', v)}
                  isDark={isDark}
                />
              </View>
            </View>
            <FormInput
              label="Overstay Rate / Hr"
              prefix="₹"
              value={rules.bike.overstayRate}
              onChange={(v) => handleChange('bike', 'overstayRate', v)}
              isDark={isDark}
            />
          </View>

          {/* Four Wheeler */}
          <View style={[styles.section, { backgroundColor: isDark ? COLORS.bgCardDark : '#eff6ff', borderColor: isDark ? COLORS.borderDark : '#bfdbfe' }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="car" size={22} color={COLORS.brandBlue} />
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>Four Wheeler (4W)</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.half}>
                <FormInput
                  label="Base Charge"
                  prefix="₹"
                  value={rules.car.baseCharge}
                  onChange={(v) => handleChange('car', 'baseCharge', v)}
                  isDark={isDark}
                />
              </View>
              <View style={styles.half}>
                <FormInput
                  label="Hourly Rate"
                  prefix="₹"
                  value={rules.car.hourlyRate}
                  onChange={(v) => handleChange('car', 'hourlyRate', v)}
                  isDark={isDark}
                />
              </View>
            </View>
            <FormInput
              label="Overstay Rate / Hr"
              prefix="₹"
              value={rules.car.overstayRate}
              onChange={(v) => handleChange('car', 'overstayRate', v)}
              isDark={isDark}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: isDark ? COLORS.white : COLORS.black, opacity: isSaving ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={isDark ? COLORS.black : COLORS.white} />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color={isDark ? COLORS.black : COLORS.white} />
                <Text style={[styles.saveBtnText, { color: isDark ? COLORS.black : COLORS.white }]}>
                  Save Configuration
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  scroll: { padding: 16, gap: 16 },
  section: { borderRadius: 24, borderWidth: 1, padding: 20, gap: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  formGroup: { gap: 8 },
  formLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputPrefix: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRightWidth: 1,
  },
  prefixText: { fontSize: 14, fontWeight: '700' },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, fontWeight: '700' },
  saveBtn: {
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
