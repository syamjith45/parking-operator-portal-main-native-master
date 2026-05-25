import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';
import { formatTime } from '../../lib/utils';
import { usePrinter } from '../../context/PrinterContext';
import { printReceiptEscPos } from '../../lib/receiptEscPos';

export const ExitModal = ({ isOpen, onClose, onConfirm, vehicle, exitData, organization }) => {
  const { isDark } = useTheme();
  const { printReceipt } = usePrinter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  if (!vehicle || !exitData) return null;

  const handleConfirm = async () => {
    if (!paymentMethod) return;
    setIsProcessing(true);
    await onConfirm(paymentMethod);
    setIsProcessing(false);
    setPaymentMethod('');
  };

  const handleClose = () => {
    setPaymentMethod('');
    onClose();
  };

  const handlePrintReceipt = async () => {
    await printReceipt(async (device) => {
      await printReceiptEscPos({
        type: 'exit',
        vehicle,
        exitData,
        organization,
        device,
      });
    });
  };

  const normalizedType = vehicle.vehicle_type?.toLowerCase();
  const isCar =
    normalizedType === 'car' ||
    normalizedType?.includes('four_wheeler') ||
    normalizedType?.includes('four-wheeler');

  const textPrimary = isDark ? COLORS.textPrimaryDark : COLORS.textPrimary;
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;
  const cardBg = isDark ? COLORS.bgMutedDark : COLORS.bgMuted;
  const border = isDark ? COLORS.borderDark : COLORS.border;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Complete Session">
      <View style={styles.container}>
        {/* Vehicle Header */}
        <View style={styles.vehicleHeader}>
          <View>
            <Text style={[styles.plate, { color: textPrimary }]}>
              {vehicle.vehicle_number || 'NO PLATE'}
            </Text>
            <Text style={[styles.phone, { color: textMuted }]}>Ph: {vehicle.driver_phone || 'N/A'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.printIconBtn, { backgroundColor: isDark ? COLORS.bgMutedDark : '#f1f5f9' }]}
              onPress={handlePrintReceipt}
            >
              <Ionicons name="print-outline" size={18} color={textMuted} />
            </TouchableOpacity>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor: isCar ? COLORS.brandBlue + '15' : '#a855f715',
                  borderColor: isCar ? COLORS.brandBlue + '30' : '#a855f730',
                },
              ]}
            >
              <Text style={[styles.typeText, { color: isCar ? COLORS.brandBlue : '#a855f7' }]}>
                {isCar ? 'Car' : 'Bike'}
              </Text>
            </View>
          </View>
        </View>

        {/* Time Block */}
        <View style={[styles.timeBlock, { backgroundColor: cardBg, borderColor: border }]}>
          <View>
            <Text style={[styles.timeLabel, { color: textMuted }]}>ENTRY TIME</Text>
            <Text style={[styles.timeValue, { color: textPrimary }]}>
              {formatTime(vehicle.entry_time)}
            </Text>
            <Text style={[styles.dateSub, { color: textMuted }]}>
              {new Date(vehicle.entry_time).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.dividerV, { backgroundColor: border }]} />
          <View style={styles.timeRight}>
            <Text style={[styles.timeLabel, { color: textMuted }]}>EXIT TIME</Text>
            <Text style={[styles.timeValue, { color: textPrimary }]}>
              {formatTime(new Date().toISOString())}
            </Text>
            <Text style={[styles.dateSub, { color: textMuted }]}>Present</Text>
          </View>
        </View>

        {/* Duration + Cost */}
        <View style={[styles.summaryBlock, { backgroundColor: cardBg, borderColor: border }]}>
          <View>
            <Text style={[styles.summaryLabel, { color: textMuted }]}>TOTAL DURATION</Text>
            <Text style={[styles.summaryValue, { color: textPrimary }]}>
              {exitData.actualDuration}h{' '}
              <Text style={{ fontSize: 13, color: textMuted }}>/ {exitData.declaredDuration}h</Text>
            </Text>
          </View>
          <View>
            <Text style={[styles.summaryLabel, { color: textMuted }]}>TOTAL COST</Text>
            <Text style={[styles.summaryValue, { color: textPrimary }]}>₹{exitData.totalCost}</Text>
          </View>
        </View>

        {/* Balance */}
        <View style={styles.balanceRow}>
          <View>
            <Text style={[styles.balanceLabel, { color: textPrimary }]}>Balance Due</Text>
            {exitData.overstayHours > 0 && (
              <View style={styles.overstayRow}>
                <Ionicons name="warning-outline" size={12} color={COLORS.error} />
                <Text style={[styles.overstayText, { color: COLORS.error }]}>
                  {exitData.overstayHours}h Overstay
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.balanceAmount, { color: textPrimary }]}>₹{exitData.balanceDue}</Text>
        </View>

        <View style={[styles.dividerH, { backgroundColor: border }]} />

        {/* Paid upfront row */}
        <View style={styles.paidRow}>
          <Text style={[styles.paidLabel, { color: textMuted }]}>Paid Upfront</Text>
          <Text style={[styles.paidAmount, { color: COLORS.success }]}>
            - ₹{vehicle.base_fee_paid || 0}
          </Text>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentSection}>
          <Text style={[styles.paymentTitle, { color: textPrimary }]}>Select Payment Method:</Text>
          <View style={styles.paymentButtons}>
            <TouchableOpacity
              style={[
                styles.payBtn,
                { borderColor: border },
                paymentMethod === 'cash' && styles.payBtnCash,
              ]}
              onPress={() => setPaymentMethod('cash')}
            >
              <Text
                style={[
                  styles.payBtnText,
                  { color: paymentMethod === 'cash' ? COLORS.white : textPrimary },
                ]}
              >
                💵 Cash
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.payBtn,
                { borderColor: border },
                paymentMethod === 'gpay' && styles.payBtnGpay,
              ]}
              onPress={() => setPaymentMethod('gpay')}
            >
              <Text
                style={[
                  styles.payBtnText,
                  { color: paymentMethod === 'gpay' ? COLORS.white : textPrimary },
                ]}
              >
                📱 GPay/UPI
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Button variant="ghost" style={styles.cancelBtn} onPress={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              {
                backgroundColor: exitData.balanceDue > 0 ? COLORS.error : COLORS.brandBlue,
                opacity: !paymentMethod || isProcessing ? 0.5 : 1,
              },
            ]}
            onPress={handleConfirm}
            disabled={!paymentMethod || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.confirmBtnText}>
                  {exitData.balanceDue > 0 ? 'Collect & Exit' : 'Confirm Exit'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  printIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plate: { fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: 1 },
  phone: { fontSize: 13, fontWeight: '500', marginTop: 4 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  typeText: { fontSize: 11, fontWeight: '700' },
  timeBlock: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  timeLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  timeValue: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 4 },
  dateSub: { fontSize: 10, fontWeight: '500', marginTop: 2 },
  dividerV: { width: 1, alignSelf: 'stretch' },
  timeRight: { alignItems: 'flex-end', flex: 1 },
  summaryBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  summaryLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: 16, fontWeight: '700' },
  balanceAmount: { fontSize: 36, fontWeight: '800' },
  overstayRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  overstayText: { fontSize: 11, fontWeight: '700' },
  dividerH: { height: 1 },
  paidRow: { flexDirection: 'row', justifyContent: 'space-between' },
  paidLabel: { fontSize: 13, fontWeight: '500' },
  paidAmount: { fontSize: 13, fontWeight: '700' },
  paymentSection: { gap: 10 },
  paymentTitle: { fontSize: 14, fontWeight: '700' },
  paymentButtons: { flexDirection: 'row', gap: 10 },
  payBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  payBtnCash: { backgroundColor: COLORS.cashGreen, borderColor: COLORS.cashGreen },
  payBtnGpay: { backgroundColor: COLORS.gpayBlue, borderColor: COLORS.gpayBlue },
  payBtnText: { fontSize: 13, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1 },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  confirmBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});
