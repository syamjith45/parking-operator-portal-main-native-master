import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';
import { ExitModal } from '../../components/monitor/ExitModal';
import { normalizeVehicleType, formatTime } from '../../lib/utils';

const GET_MONITOR_DATA = gql`
  query GetMonitorData {
    activeVehicles {
      id
      session_id
      driver_phone
      vehicle_type
      vehicle_number
      entry_time
      status
      base_fee_paid
      duration_minutes
      is_overstay
      overstay_minutes
      declared_duration_hours
    }
    pricingRules {
      id
      vehicle_type
      base_fee
      base_hours
      extra_hour_rate
    }
  }
`;

const PROCESS_EXIT = gql`
  mutation ProcessExit($sessionId: String!) {
    processVehicleExit(session_id: $sessionId) {
      session_id
      total_amount
      overstay_fee
      overstay_record {
        id
        fee_amount
      }
    }
  }
`;

const COLLECT_PAYMENT = gql`
  mutation CollectPayment($chargeId: ID!, $paymentMethodCode: String!) {
    collectOverstayPayment(overstay_charge_id: $chargeId, payment_method_code: $paymentMethodCode) {
      id
      is_collected
      payment_method_code
    }
  }
`;

const VehicleCard = ({ vehicle, onExit, baseHours, isDark }) => {
  const now = new Date();
  const entry = new Date(vehicle.entry_time);
  const elapsedHrs = vehicle.duration_minutes
    ? vehicle.duration_minutes / 60
    : (now - entry) / 3600000;
  const isOverstaying = vehicle.is_overstay;
  const effectiveBaseHours = vehicle.declared_duration_hours || baseHours;
  const isCar = normalizeVehicleType(vehicle.vehicle_type) === 'car';

  const bg = isDark ? COLORS.bgCardDark : COLORS.bgCard;
  const border = isOverstaying
    ? isDark ? '#4c1d2420' : '#ffe4e6'
    : isDark ? COLORS.borderDark : COLORS.borderLight;
  const textPrimary = isDark ? COLORS.textPrimaryDark : COLORS.textPrimary;
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;

  return (
    <TouchableOpacity
      onPress={() => onExit(vehicle)}
      activeOpacity={0.8}
      style={[styles.card, { backgroundColor: bg, borderColor: border }]}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.vehicleIcon,
              {
                backgroundColor: isDark ? COLORS.bgMutedDark : COLORS.bgMuted,
                borderColor: isDark ? COLORS.borderDark : COLORS.borderLight,
              },
            ]}
          >
            <Ionicons
              name={isCar ? 'car' : 'bicycle'}
              size={22}
              color={isCar ? COLORS.brandBlue : textMuted}
            />
          </View>
          <View>
            <Text style={[styles.plateText, { color: textPrimary }]}>
              {vehicle.vehicle_number || 'NO PLATE'}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: textMuted }]}>{vehicle.driver_phone || 'N/A'}</Text>
              <View style={[styles.metaDot, { backgroundColor: textMuted }]} />
              <Text style={[styles.metaText, { color: textMuted }]}>In: {formatTime(vehicle.entry_time)}</Text>
            </View>
          </View>
        </View>
        {isOverstaying && (
          <View style={styles.lateBadge}>
            <Text style={styles.lateText}>LATE</Text>
          </View>
        )}
      </View>

      <View style={[styles.cardBottom, { borderTopColor: isDark ? COLORS.borderDark + '80' : '#f5f5f4' }]}>
        <View style={styles.durationRow}>
          <Ionicons
            name="time-outline"
            size={16}
            color={isOverstaying ? COLORS.error : textMuted}
          />
          <Text
            style={[
              styles.durationText,
              { color: isOverstaying ? COLORS.error : textMuted },
            ]}
          >
            {elapsedHrs.toFixed(1)}
            <Text style={{ color: textMuted }}> / </Text>
            {effectiveBaseHours}h
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onExit(vehicle)}
          style={[styles.exitBtn, { backgroundColor: isDark ? COLORS.bgMutedDark : COLORS.bgMuted }]}
        >
          <Ionicons name="arrow-forward" size={20} color={textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function MonitorScreen() {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [exitModalCtx, setExitModalCtx] = useState(null);

  const { data, loading, error, refetch, startPolling, stopPolling } = useQuery(GET_MONITOR_DATA, {
    fetchPolicy: 'cache-and-network',
  });

  const [processExit] = useMutation(PROCESS_EXIT, {
    refetchQueries: [{ query: GET_MONITOR_DATA }],
    awaitRefetchQueries: true,
  });
  const [collectPayment] = useMutation(COLLECT_PAYMENT);

  useEffect(() => {
    startPolling(30000);
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  const pricingRuleMap = useMemo(() => {
    if (!data?.pricingRules) return {};
    const aliases = {
      four_wheeler: 'car',
      'four-wheeler': 'car',
      two_wheeler: 'bike',
      'two-wheeler': 'bike',
    };
    const map = {};
    for (const rule of data.pricingRules) {
      const key = rule.vehicle_type.toLowerCase();
      map[key] = rule;
      const alias = aliases[key];
      if (alias) map[alias] = rule;
    }
    return map;
  }, [data?.pricingRules]);

  const getPricingRule = (type) => {
    if (!type) return null;
    const lower = type.toLowerCase();
    const aliases = { four_wheeler: 'car', 'four-wheeler': 'car', two_wheeler: 'bike', 'two-wheeler': 'bike' };
    const mapped = aliases[lower] || lower;
    return pricingRuleMap[lower] || pricingRuleMap[mapped] || null;
  };

  const activeVehicles = useMemo(() => {
    if (!data?.activeVehicles) return [];
    const upper = search.toUpperCase();
    return data.activeVehicles
      .filter(
        (v) =>
          (v.driver_phone || '').includes(search) ||
          (v.vehicle_number && v.vehicle_number.includes(upper))
      )
      .sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time));
  }, [data?.activeVehicles, search]);

  const handleExitClick = (vehicle) => {
    const rule = getPricingRule(vehicle.vehicle_type);
    if (!rule) return;
    const now = new Date();
    const entry = new Date(vehicle.entry_time);
    const durationHours = (now - entry) / (1000 * 60 * 60);
    const actualDuration = Math.ceil(durationHours);
    const baseHours = Math.max(rule.base_hours, vehicle.declared_duration_hours || 0);
    const overstayHours = Math.max(0, actualDuration - baseHours);
    const baseFee = rule.base_fee;
    const overstayFee = overstayHours * rule.extra_hour_rate;
    const totalCost = baseFee + overstayFee;
    const balanceDue = overstayFee;
    setExitModalCtx({
      vehicle,
      exitData: { actualDuration, overstayHours, totalCost, balanceDue, declaredDuration: baseHours },
      rule,
    });
  };

  const handleConfirmExit = async (paymentMethod) => {
    if (!exitModalCtx) return;
    try {
      const result = await processExit({
        variables: { sessionId: exitModalCtx.vehicle.session_id },
      });
      const exitResult = result.data.processVehicleExit;
      const overstayFee = parseFloat(exitResult.overstay_fee) || 0;
      if (overstayFee > 0 && exitResult.overstay_record?.id) {
        await collectPayment({
          variables: { chargeId: exitResult.overstay_record.id, paymentMethodCode: paymentMethod },
        });
      }
      refetch();
      setExitModalCtx(null);
    } catch (e) {
      console.error('Exit processing failed', e);
    }
  };

  const bg = isDark ? COLORS.bgPrimaryDark : COLORS.bgPrimary;
  const textPrimary = isDark ? COLORS.textPrimaryDark : COLORS.textPrimary;
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;
  const searchBg = isDark ? COLORS.bgCardDark : COLORS.bgCard;
  const searchBorder = isDark ? COLORS.borderDark : COLORS.border;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: textPrimary }]}>Live Monitor</Text>
            <Text style={[styles.subtitle, { color: textMuted }]}>Manage active sessions.</Text>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: searchBg, borderColor: searchBorder }]}>
          <Ionicons name="search-outline" size={18} color={textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: textPrimary }]}
            placeholder="Search vehicle or phone..."
            placeholderTextColor={textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        {loading && !data && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.brandBlue} />
          </View>
        )}

        {error && (
          <View style={styles.centered}>
            <Ionicons name="alert-circle-outline" size={40} color={COLORS.error} />
            <Text style={[styles.errorText, { color: COLORS.error }]}>{error.message}</Text>
          </View>
        )}

        {!loading && !error && (
          <FlatList
            data={activeVehicles}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={refetch}
                tintColor={COLORS.brandBlue}
              />
            }
            renderItem={({ item }) => {
              const rule = getPricingRule(item.vehicle_type);
              return (
                <VehicleCard
                  vehicle={item}
                  onExit={handleExitClick}
                  baseHours={rule ? rule.base_hours : 2}
                  isDark={isDark}
                />
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: isDark ? COLORS.bgCardDark : '#f1f5f9' }]}>
                  <Ionicons name="car-outline" size={32} color={textMuted} />
                </View>
                <Text style={[styles.emptyText, { color: textMuted }]}>No active vehicles</Text>
              </View>
            }
          />
        )}
      </View>

      <ExitModal
        isOpen={!!exitModalCtx}
        onClose={() => setExitModalCtx(null)}
        vehicle={exitModalCtx?.vehicle}
        exitData={exitModalCtx?.exitData}
        onConfirm={handleConfirmExit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchIcon: {},
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  list: { gap: 12, paddingBottom: 24 },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateText: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  metaText: { fontSize: 11, fontWeight: '500' },
  metaDot: { width: 3, height: 3, borderRadius: 2 },
  lateBadge: {
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  lateText: { fontSize: 9, fontWeight: '800', color: COLORS.error, letterSpacing: 0.5 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  durationText: { fontSize: 13, fontWeight: '700' },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, fontWeight: '600' },
});
