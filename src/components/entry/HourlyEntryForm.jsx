import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';
import { PARKING_MODES } from '../../constants/parkingModes';
import { SelectPicker } from '../ui/SelectPicker';
import DateTimePickerMobile from '../ui/DateTimePickerMobile';
import { formatVehicleType } from '../../lib/utils';
import { usePrinter } from '../../context/PrinterContext';
import { printReceiptEscPos } from '../../lib/receiptEscPos';

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

const GET_SPACES = gql`
  query GetSpaces($organization_id: ID!) {
    spaces(organization_id: $organization_id) {
      id
      name
      location
      capacity
    }
  }
`;

const LOG_ENTRY = gql`
  mutation LogEntry($input: VehicleEntryInput!) {
    logVehicleEntry(input: $input) {
      id
      session_id
      base_fee_paid
      vehicle_number
      declared_duration_hours
    }
  }
`;

export const HourlyEntryForm = ({ organization, onComplete, onCancel }) => {
  const { staffProfile } = useAuth();
  const { isDark } = useTheme();
  const { printReceipt } = usePrinter();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [selectedSpace, setSelectedSpace] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [error, setError] = useState('');
  const [successEntry, setSuccessEntry] = useState(null);
  const [declaredHours, setDeclaredHours] = useState(2);
  const [parkingMode, setParkingMode] = useState(PARKING_MODES.HOURLY);
  const [expectedExitDate, setExpectedExitDate] = useState('');

  const { data, loading: rulesLoading } = useQuery(GET_PRICING_RULES);
  const { data: spacesData, loading: spacesLoading } = useQuery(GET_SPACES, {
    variables: { organization_id: organization.id },
    skip: staffProfile?.role !== 'manager',
  });
  const [logEntry, { loading: submitting }] = useMutation(LOG_ENTRY);

  const pricingRules = data?.pricingRules || [];
  const spaces = spacesData?.spaces || [];

  const uniqueVehicleTypes = useMemo(
    () => [...new Set(pricingRules.map((r) => r.vehicle_type))].sort(),
    [pricingRules]
  );

  useMemo(() => {
    if (uniqueVehicleTypes.length > 0 && !vehicleType) {
      setVehicleType(uniqueVehicleTypes[0]);
    }
  }, [uniqueVehicleTypes, vehicleType]);

  const rule = useMemo(
    () => pricingRules.find((r) => r.vehicle_type === vehicleType),
    [pricingRules, vehicleType]
  );

  const computedFee = useMemo(() => {
    if (!rule) return null;
    const hours = declaredHours || rule.base_hours;
    if (hours <= rule.base_hours) return rule.base_fee;
    return rule.base_fee + (hours - rule.base_hours) * rule.extra_hour_rate;
  }, [rule, declaredHours]);

  React.useEffect(() => {
    if (parkingMode === PARKING_MODES.CUSTOM_DATE && expectedExitDate) {
      const exitTime = new Date(expectedExitDate);
      const currentTime = new Date();
      const durationMs = exitTime - currentTime;
      const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
      setDeclaredHours(Math.max(1, durationHours));
    }
  }, [expectedExitDate, parkingMode]);

  const handleSubmit = async () => {
    if (staffProfile?.role === 'manager' && !selectedSpace) {
      setError('Please select a parking space');
      return;
    }
    if (!phoneNumber || phoneNumber.length < 10 || !numberPlate) {
      setError('Please fill all required fields');
      return;
    }
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }
    setError('');
    try {
      const entryInput = {
        driver_phone: phoneNumber,
        vehicle_number: numberPlate.toUpperCase(),
        vehicle_type: vehicleType,
        declared_duration_hours: declaredHours,
        parking_mode: parkingMode,
        payment_method_code: paymentMethod,
      };
      if (parkingMode === PARKING_MODES.CUSTOM_DATE) {
        if (!expectedExitDate) {
          setError('Please select an expected exit date and time');
          return;
        }
        // Send as full ISO string for backend
        entryInput.expected_exit_date = new Date(expectedExitDate).toISOString();
      }
      
      if (staffProfile?.role === 'manager') {
        entryInput.space_id = selectedSpace;
      } else if (staffProfile?.space_id) {
        entryInput.space_id = staffProfile.space_id;
      }
      const result = await logEntry({
        variables: { input: entryInput },
        refetchQueries: ['GetMonitorData', 'GetStatsData'],
      });
      const entry = result.data.logVehicleEntry;
      setSuccessEntry({
        ...entry,
        vehicle_type: vehicleType,
        driver_phone: phoneNumber,
        entry_time: new Date().toISOString(),
      });
    } catch (e) {
      setError(e.message || 'Failed to log entry');
    }
  };

  const resetForm = () => {
    setPhoneNumber('');
    setNumberPlate('');
    setVehicleType(uniqueVehicleTypes[0] || '');
    setDeclaredHours(2);
    setParkingMode(PARKING_MODES.HOURLY);
    setExpectedExitDate('');
    setPaymentMethod('');
    setSuccessEntry(null);
    if (onComplete) onComplete();
  };

  const minDateTime = new Date().toISOString().slice(0, 16);
  const maxDateTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const handlePrintEntryReceipt = async () => {
    await printReceipt(async (device) => {
      await printReceiptEscPos({
        type: 'entry',
        vehicle: successEntry,
        organization,
        device,
      });
    });
  };

  const bg = isDark ? COLORS.bgPrimaryDark : COLORS.bgPrimary;
  const cardBg = isDark ? COLORS.bgCardDark : COLORS.bgCard;
  const border = isDark ? COLORS.borderDark : COLORS.borderLight;
  const textPrimary = isDark ? COLORS.textPrimaryDark : COLORS.textPrimary;
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;
  const inputBorder = isDark ? COLORS.borderDark : '#e2e8f0';

  if (rulesLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.brandBlue} />
        <Text style={[styles.loadingText, { color: textMuted }]}>Loading pricing rules...</Text>
      </View>
    );
  }

  if (successEntry) {
    return (
      <View style={[styles.successContainer, { backgroundColor: bg }]}>
        <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
        <Text style={[styles.successTitle, { color: textPrimary }]}>Entry Confirmed</Text>
        <Text style={[styles.successSub, { color: textMuted }]}>
          Vehicle {successEntry.vehicle_number} logged.
        </Text>
        <TouchableOpacity
          style={[styles.printBtn, { borderColor: isDark ? COLORS.borderDark : COLORS.border }]}
          onPress={handlePrintEntryReceipt}
        >
          <Ionicons name="print-outline" size={18} color={textPrimary} />
          <Text style={[styles.printBtnText, { color: textPrimary }]}>Print Entry Slip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.newEntryBtn} onPress={resetForm}>
          <Text style={styles.newEntryText}>New Entry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: bg }}
      contentContainerStyle={styles.form}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Number Plate */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: textMuted }]}>NUMBER PLATE</Text>
        <TextInput
          style={[styles.bigInput, { color: textPrimary, borderBottomColor: inputBorder }]}
          value={numberPlate}
          onChangeText={(t) => setNumberPlate(t.toUpperCase())}
          placeholder="KL-00-XX-0000"
          placeholderTextColor={isDark ? '#334155' : '#cbd5e1'}
          autoCapitalize="characters"
          autoFocus
        />
      </View>

      {/* Phone */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: textMuted }]}>MOBILE NUMBER</Text>
        <TextInput
          style={[styles.bigInput, { color: textPrimary, borderBottomColor: inputBorder }]}
          value={phoneNumber}
          onChangeText={(t) => setPhoneNumber(t.replace(/\D/g, '').slice(0, 10))}
          placeholder="00000 00000"
          placeholderTextColor={isDark ? '#334155' : '#cbd5e1'}
          keyboardType="phone-pad"
        />
      </View>

      {/* Space selector for managers */}
      {staffProfile?.role === 'manager' && (
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: textMuted }]}>PARKING SPACE</Text>
          {spacesLoading ? (
            <ActivityIndicator size="small" color={COLORS.brandBlue} />
          ) : (
            <SelectPicker
              value={selectedSpace}
              onValueChange={setSelectedSpace}
              placeholder="Select a parking space"
              items={spaces.map((s) => ({
                label: s.location ? `${s.name} • ${s.location}` : s.name,
                value: s.id,
              }))}
            />
          )}
        </View>
      )}

      {/* Vehicle Type */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: textMuted }]}>VEHICLE CLASS</Text>
        <SelectPicker
          value={vehicleType}
          onValueChange={setVehicleType}
          placeholder="Select vehicle type"
          items={uniqueVehicleTypes.map((t) => ({ label: formatVehicleType(t), value: t }))}
        />
      </View>

      {/* Pricing info */}
      {rule && (
        <View style={[styles.pricingCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
          <Text style={styles.pricingTitle}>Pricing Structure</Text>
          <View style={styles.pricingRow}>
            <View>
              <Text style={styles.pricingLabel}>Base Fee</Text>
              <Text style={styles.pricingValue}>₹{rule.base_fee}</Text>
              <Text style={styles.pricingNote}>({rule.base_hours}h)</Text>
            </View>
            <View style={styles.dividerV} />
            <View>
              <Text style={styles.pricingLabel}>Extra/Hour</Text>
              <Text style={styles.pricingValue}>₹{rule.extra_hour_rate}</Text>
              <Text style={styles.pricingNote}>per hour</Text>
            </View>
          </View>
        </View>
      )}

      {/* Payment Method */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: textMuted }]}>PAYMENT METHOD</Text>
        <View style={styles.paymentRow}>
          <TouchableOpacity
            style={[
              styles.payBtn,
              { borderColor: border, backgroundColor: isDark ? COLORS.bgMutedDark : '#f8fafc' },
              paymentMethod === 'cash' && styles.payBtnCash,
            ]}
            onPress={() => setPaymentMethod('cash')}
          >
            <Text style={[styles.payBtnText, paymentMethod === 'cash' && styles.payBtnTextActive]}>
              💵 Cash
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.payBtn,
              { borderColor: border, backgroundColor: isDark ? COLORS.bgMutedDark : '#f8fafc' },
              paymentMethod === 'gpay' && styles.payBtnGpay,
            ]}
            onPress={() => setPaymentMethod('gpay')}
          >
            <Text style={[styles.payBtnText, paymentMethod === 'gpay' && styles.payBtnTextActive]}>
              📱 GPay/UPI
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Duration & Mode */}
      <View style={styles.fieldGroup}>
        <View style={styles.durationHeader}>
          <Text style={[styles.fieldLabel, { color: textMuted }]}>PARKING DURATION</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[
                styles.modeTab,
                parkingMode === PARKING_MODES.HOURLY && { backgroundColor: isDark ? COLORS.brandBlue : '#0f172a' }
              ]}
              onPress={() => setParkingMode(PARKING_MODES.HOURLY)}
            >
              <Text style={[
                styles.modeTabText,
                parkingMode === PARKING_MODES.HOURLY ? { color: COLORS.white } : { color: textMuted }
              ]}>Hourly</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeTab,
                parkingMode === PARKING_MODES.CUSTOM_DATE && { backgroundColor: isDark ? COLORS.brandBlue : '#0f172a' }
              ]}
              onPress={() => setParkingMode(PARKING_MODES.CUSTOM_DATE)}
            >
              <Text style={[
                styles.modeTabText,
                parkingMode === PARKING_MODES.CUSTOM_DATE ? { color: COLORS.white } : { color: textMuted }
              ]}>Custom</Text>
            </TouchableOpacity>
          </View>
        </View>

        {parkingMode === PARKING_MODES.HOURLY ? (
          <View style={styles.durationControls}>
            <TouchableOpacity
              style={[styles.durationBtn, { borderColor: border, backgroundColor: cardBg }]}
              onPress={() => setDeclaredHours(Math.max(1, declaredHours - 1))}
            >
              <Ionicons name="remove" size={20} color={textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[styles.durationValue, { color: textPrimary }]}>
                {declaredHours}<Text style={{ color: textMuted, fontWeight: '400', fontSize: 16 }}> hrs</Text>
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.durationBtn, { borderColor: border, backgroundColor: cardBg }]}
              onPress={() => setDeclaredHours(Math.min(24, declaredHours + 1))}
            >
              <Ionicons name="add" size={20} color={textPrimary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginTop: 8 }}>
            <DateTimePickerMobile
              value={expectedExitDate}
              onChange={setExpectedExitDate}
              placeholder="Select exit date and time"
              minDateTime={minDateTime}
              maxDateTime={maxDateTime}
            />
            {!!expectedExitDate && (
              <Text style={{ marginTop: 8, color: textMuted, fontSize: 13, textAlign: 'center' }}>
                Estimated Duration: <Text style={{ fontWeight: '600', color: textPrimary }}>{declaredHours} hrs</Text>
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Computed Fee */}
      <View style={[styles.feeCard, { backgroundColor: COLORS.successBg, borderColor: COLORS.successBorder }]}>
        <View>
          <Text style={[styles.feeLabel]}>ENTRY FEE</Text>
          <Text style={styles.feeSub}>Covers {declaredHours} hours</Text>
        </View>
        <Text style={styles.feeAmount}>₹{computedFee ?? '-'}</Text>
      </View>

      {!!error && (
        <View style={[styles.errorBox, { backgroundColor: COLORS.errorBg, borderColor: COLORS.errorBorder }]}>
          <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
          <Text style={[styles.errorText, { color: COLORS.error }]}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.submitBtn,
          {
            backgroundColor: isDark ? COLORS.brandBlue : '#0f172a',
            opacity: !phoneNumber || !numberPlate || !paymentMethod || submitting ? 0.5 : 1,
          },
        ]}
        onPress={handleSubmit}
        disabled={
          !phoneNumber || 
          !numberPlate || 
          !paymentMethod || 
          submitting || 
          (parkingMode === PARKING_MODES.CUSTOM_DATE && !expectedExitDate)
        }
      >
        {submitting ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <>
            <Text style={styles.submitText}>Confirm Entry</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </>
        )}
      </TouchableOpacity>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '500' },
  form: { padding: 16, gap: 24 },
  fieldGroup: { gap: 10 },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  bigInput: { fontSize: 32, fontWeight: '800', borderBottomWidth: 2, paddingVertical: 6, letterSpacing: 2 },
  paymentRow: { flexDirection: 'row', gap: 10 },
  payBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  payBtnCash: { backgroundColor: COLORS.cashGreen, borderColor: COLORS.cashGreen },
  payBtnGpay: { backgroundColor: COLORS.gpayBlue, borderColor: COLORS.gpayBlue },
  payBtnText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  payBtnTextActive: { color: COLORS.white },
  pricingCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  pricingTitle: { fontSize: 10, fontWeight: '700', color: '#1e40af', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  pricingRow: { flexDirection: 'row', gap: 16 },
  pricingLabel: { fontSize: 12, color: '#2563eb', fontWeight: '500' },
  pricingValue: { fontSize: 20, fontWeight: '800', color: '#1e3a8a', marginTop: 2 },
  pricingNote: { fontSize: 10, color: '#3b82f6', marginTop: 1 },
  dividerV: { width: 1, backgroundColor: '#bfdbfe', alignSelf: 'stretch' },
  durationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  durationValue: { fontSize: 24, fontWeight: '800' },
  durationControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  durationBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  durationBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  durationFill: { height: '100%', borderRadius: 3, backgroundColor: COLORS.brandBlue },
  feeCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1 },
  feeLabel: { fontSize: 10, fontWeight: '700', color: '#065f46', letterSpacing: 1, textTransform: 'uppercase' },
  feeSub: { fontSize: 11, fontWeight: '500', color: '#059669', marginTop: 2 },
  feeAmount: { fontSize: 32, fontWeight: '800', color: '#065f46' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  errorText: { fontSize: 13, fontWeight: '500', flex: 1 },
  submitBtn: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  submitText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  successTitle: { fontSize: 24, fontWeight: '800' },
  successSub: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 4,
  },
  printBtnText: { fontSize: 14, fontWeight: '700' },
  newEntryBtn: { backgroundColor: '#f1f5f9', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16, marginTop: 8 },
  newEntryText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  modeTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#f1f5f9' },
  modeTabText: { fontSize: 12, fontWeight: '600' },
});
