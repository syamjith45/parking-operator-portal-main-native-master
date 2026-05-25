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
import { formatVehicleType } from '../../lib/utils';
import { usePrinter } from '../../context/PrinterContext';
import { printReceiptEscPos } from '../../lib/receiptEscPos';

const GET_ALL_SLABS = gql`
  query GetAllSlabs($org_id: ID!) {
    overstaySlabs(organization_id: $org_id) {
      id
      slab_hours
      slab_fee
      vehicle_type
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
      slab_id_used
      pricing_type_used
    }
  }
`;

export const SlabBasedEntryForm = ({ organization, onComplete, onCancel }) => {
  const { staffProfile } = useAuth();
  const { isDark } = useTheme();
  const { printReceipt } = usePrinter();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [declaredHours, setDeclaredHours] = useState(2);
  const [selectedSpace, setSelectedSpace] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [error, setError] = useState('');
  const [successEntry, setSuccessEntry] = useState(null);
  const [parkingMode, setParkingMode] = useState(PARKING_MODES.HOURLY);

  const { data: slabsData, loading: slabsLoading } = useQuery(GET_ALL_SLABS, {
    variables: { org_id: organization.id },
  });

  const { data: spacesData, loading: spacesLoading } = useQuery(GET_SPACES, {
    variables: { organization_id: organization.id },
    skip: staffProfile?.role !== 'manager',
  });

  const [logEntry, { loading: submitting }] = useMutation(LOG_ENTRY);

  const allSlabs = slabsData?.overstaySlabs || [];
  const spaces = spacesData?.spaces || [];

  const uniqueVehicleTypes = useMemo(() => {
    const types = [...new Set(allSlabs.map((s) => s.vehicle_type))].sort();
    return types;
  }, [allSlabs]);

  useMemo(() => {
    if (uniqueVehicleTypes.length > 0 && !vehicleType) {
      setVehicleType(uniqueVehicleTypes[0]);
    }
  }, [uniqueVehicleTypes, vehicleType]);

  const slabs = useMemo(
    () => allSlabs.filter((s) => s.vehicle_type === vehicleType),
    [allSlabs, vehicleType]
  );

  const matchedSlab = useMemo(() => {
    if (!declaredHours || slabs.length === 0) return null;
    let matched = slabs.find((s) => s.slab_hours >= declaredHours);
    if (!matched && slabs.length > 0) {
      matched = slabs.reduce((max, s) => (s.slab_hours > max.slab_hours ? s : max));
    }
    return matched;
  }, [declaredHours, slabs]);

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
    setPaymentMethod('');
    setSuccessEntry(null);
    if (onComplete) onComplete();
  };

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

  if (slabsLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.brandBlue} />
        <Text style={[styles.loadingText, { color: textMuted }]}>Loading pricing slabs...</Text>
      </View>
    );
  }

  if (successEntry) {
    return (
      <View style={[styles.successContainer, { backgroundColor: bg }]}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
        </View>
        <Text style={[styles.successTitle, { color: textPrimary }]}>Entry Confirmed</Text>
        <Text style={[styles.successSub, { color: textMuted }]}>
          Vehicle {successEntry.vehicle_number} has been logged.
        </Text>
        <View style={[styles.successCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={styles.successRow}>
            <Text style={[styles.successLabel, { color: textMuted }]}>Base Fee Paid</Text>
            <Text style={[styles.successValue, { color: COLORS.success }]}>
              ₹{successEntry.base_fee_paid || 0}
            </Text>
          </View>
          <View style={styles.successRow}>
            <Text style={[styles.successLabel, { color: textMuted }]}>Duration</Text>
            <Text style={[styles.successValue, { color: textPrimary }]}>
              {successEntry.declared_duration_hours}h
            </Text>
          </View>
        </View>
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

      {/* Available Slabs */}
      {slabs.length > 0 && (
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: textMuted }]}>AVAILABLE SLABS</Text>
          <View style={styles.slabsGrid}>
            {slabs.map((slab) => (
              <View
                key={slab.id}
                style={[
                  styles.slabItem,
                  {
                    backgroundColor:
                      matchedSlab?.id === slab.id
                        ? COLORS.brandBlue + '15'
                        : isDark ? COLORS.bgMutedDark : '#f8fafc',
                    borderColor:
                      matchedSlab?.id === slab.id
                        ? COLORS.brandBlue
                        : isDark ? COLORS.borderDark : COLORS.border,
                  },
                ]}
              >
                <Text style={[styles.slabHours, { color: matchedSlab?.id === slab.id ? COLORS.brandBlue : textMuted }]}>
                  {slab.slab_hours}h
                </Text>
                <Text style={[styles.slabFee, { color: matchedSlab?.id === slab.id ? COLORS.brandBlue : textPrimary }]}>
                  ₹{slab.slab_fee}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Parking Mode */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: textMuted }]}>PARKING MODE</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              { borderColor: border },
              parkingMode === PARKING_MODES.HOURLY && styles.modeBtnActive,
            ]}
            onPress={() => setParkingMode(PARKING_MODES.HOURLY)}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={parkingMode === PARKING_MODES.HOURLY ? COLORS.white : textMuted}
            />
            <Text
              style={[
                styles.modeBtnText,
                { color: parkingMode === PARKING_MODES.HOURLY ? COLORS.white : textPrimary },
              ]}
            >
              Duration
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              { borderColor: border },
              parkingMode === PARKING_MODES.CUSTOM_DATE && styles.modeBtnActive,
            ]}
            onPress={() => setParkingMode(PARKING_MODES.CUSTOM_DATE)}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={parkingMode === PARKING_MODES.CUSTOM_DATE ? COLORS.white : textMuted}
            />
            <Text
              style={[
                styles.modeBtnText,
                { color: parkingMode === PARKING_MODES.CUSTOM_DATE ? COLORS.white : textPrimary },
              ]}
            >
              Custom Date
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Duration Picker */}
      <View style={styles.fieldGroup}>
        <View style={styles.durationHeader}>
          <Text style={[styles.fieldLabel, { color: textMuted }]}>PARKING DURATION</Text>
          <Text style={[styles.durationValue, { color: textPrimary }]}>
            {declaredHours}
            <Text style={[styles.durationUnit, { color: textMuted }]}> hrs</Text>
          </Text>
        </View>
        <View style={styles.durationControls}>
          <TouchableOpacity
            style={[styles.durationBtn, { borderColor: border, backgroundColor: cardBg }]}
            onPress={() => setDeclaredHours(Math.max(1, declaredHours - 1))}
          >
            <Ionicons name="remove" size={20} color={textPrimary} />
          </TouchableOpacity>
          <View style={[styles.durationBar, { backgroundColor: isDark ? COLORS.bgMutedDark : '#f1f5f9' }]}>
            <View
              style={[
                styles.durationFill,
                {
                  backgroundColor: COLORS.brandBlue,
                  width: `${((declaredHours - 1) / 23) * 100}%`,
                },
              ]}
            />
          </View>
          <TouchableOpacity
            style={[styles.durationBtn, { borderColor: border, backgroundColor: cardBg }]}
            onPress={() => setDeclaredHours(Math.min(24, declaredHours + 1))}
          >
            <Ionicons name="add" size={20} color={textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.durationLabels}>
          <Text style={[styles.durationMinMax, { color: textMuted }]}>1h</Text>
          <Text style={[styles.durationMinMax, { color: textMuted }]}>24h</Text>
        </View>
      </View>

      {/* Matched Slab Fee */}
      {matchedSlab && (
        <View style={[styles.feeCard, { backgroundColor: COLORS.successBg, borderColor: COLORS.successBorder }]}>
          <View>
            <Text style={[styles.feeLabel, { color: '#065f46' }]}>ENTRY FEE</Text>
            <Text style={[styles.feeSub, { color: '#059669' }]}>
              {matchedSlab.slab_hours}h slab • Covers {declaredHours}h parking
            </Text>
          </View>
          <Text style={[styles.feeAmount, { color: '#065f46' }]}>₹{matchedSlab.slab_fee}</Text>
        </View>
      )}

      {/* Error */}
      {!!error && (
        <View style={[styles.errorBox, { backgroundColor: COLORS.errorBg, borderColor: COLORS.errorBorder }]}>
          <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
          <Text style={[styles.errorText, { color: COLORS.error }]}>{error}</Text>
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          {
            backgroundColor: isDark ? COLORS.brandBlue : '#0f172a',
            opacity: !phoneNumber || !numberPlate || !paymentMethod || submitting || slabs.length === 0 ? 0.5 : 1,
          },
        ]}
        onPress={handleSubmit}
        disabled={!phoneNumber || !numberPlate || !paymentMethod || submitting || slabs.length === 0}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <>
            <Text style={styles.submitText}>
              {slabs.length === 0 ? 'No Slabs Configured' : 'Confirm Entry'}
            </Text>
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
  bigInput: {
    fontSize: 32,
    fontWeight: '800',
    borderBottomWidth: 2,
    paddingVertical: 6,
    letterSpacing: 2,
  },
  paymentRow: { flexDirection: 'row', gap: 10 },
  payBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  payBtnCash: { backgroundColor: COLORS.cashGreen, borderColor: COLORS.cashGreen },
  payBtnGpay: { backgroundColor: COLORS.gpayBlue, borderColor: COLORS.gpayBlue },
  payBtnText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  payBtnTextActive: { color: COLORS.white },
  slabsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slabItem: {
    width: '30%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  slabHours: { fontSize: 11, fontWeight: '700' },
  slabFee: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  modeBtnActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  modeBtnText: { fontSize: 13, fontWeight: '700' },
  durationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  durationValue: { fontSize: 24, fontWeight: '800' },
  durationUnit: { fontSize: 13, fontWeight: '400' },
  durationControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  durationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  durationFill: { height: '100%', borderRadius: 3 },
  durationLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  durationMinMax: { fontSize: 11, fontWeight: '600' },
  feeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  feeLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  feeSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  feeAmount: { fontSize: 32, fontWeight: '800' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: { fontSize: 13, fontWeight: '500', flex: 1 },
  submitBtn: {
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  submitText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  successIcon: {},
  successTitle: { fontSize: 24, fontWeight: '800' },
  successSub: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  successCard: { width: '100%', borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  successRow: { flexDirection: 'row', justifyContent: 'space-between' },
  successLabel: { fontSize: 13, fontWeight: '500' },
  successValue: { fontSize: 15, fontWeight: '700' },
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
  newEntryBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginTop: 8,
  },
  newEntryText: { fontSize: 15, fontWeight: '700', color: '#374151' },
});
