import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../lib/utils';

const GET_STATS_DATA = gql`
  query GetStatsData($period: String) {
    dashboardStats(period: $period) {
      active_vehicles
      completed_today
      base_fees_collected
      overstay_fees_collected
      total_revenue_today
      cash_transactions
      gpay_transactions
      cash_fees_collected
      gpay_fees_collected
    }
    activeVehicles {
      id
      vehicle_type
      is_overstay
    }
  }
`;

const StatCard = ({ title, value, sub, icon, iconBg, isDark }) => {
  const cardBg = isDark ? COLORS.bgCardDark : COLORS.bgCard;
  const border = isDark ? COLORS.borderDark : COLORS.borderLight;
  const textPrimary = isDark ? COLORS.textPrimaryDark : COLORS.textPrimary;
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;

  return (
    <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: border }]}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={COLORS.white} />
      </View>
      <Text style={[styles.statValue, { color: textPrimary }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: textMuted }]}>{title}</Text>
      {sub && <Text style={[styles.statSub, { color: textMuted }]}>{sub}</Text>}
    </View>
  );
};

const PeriodButton = ({ label, active, onPress, isDark }) => {
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;
  return (
    <TouchableOpacity
      style={[
        styles.periodBtn,
        active && { backgroundColor: COLORS.brandBlue },
        !active && { borderColor: isDark ? COLORS.borderDark : COLORS.border, borderWidth: 1 },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.periodText,
          { color: active ? COLORS.white : textMuted },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const PaymentBar = ({ cashCount, gpayCount, cashRevenue, gpayRevenue, isDark }) => {
  const total = (cashCount || 0) + (gpayCount || 0);
  const cashPct = total > 0 ? Math.round((cashCount / total) * 100) : 0;
  const gpayPct = total > 0 ? 100 - cashPct : 0;
  const textPrimary = isDark ? COLORS.textPrimaryDark : COLORS.textPrimary;
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;
  const cardBg = isDark ? COLORS.bgCardDark : COLORS.bgCard;
  const border = isDark ? COLORS.borderDark : COLORS.borderLight;

  return (
    <View style={[styles.payCard, { backgroundColor: cardBg, borderColor: border }]}>
      <Text style={[styles.sectionTitle, { color: textPrimary }]}>Payment Methods</Text>
      <View style={[styles.payBar, { backgroundColor: isDark ? COLORS.bgMutedDark : '#f1f5f9' }]}>
        {cashPct > 0 && (
          <View style={[styles.payBarFill, { width: `${cashPct}%`, backgroundColor: COLORS.cashGreen }]} />
        )}
        {gpayPct > 0 && (
          <View style={[styles.payBarFill, { width: `${gpayPct}%`, backgroundColor: COLORS.gpayBlue }]} />
        )}
      </View>
      <View style={styles.payStats}>
        <View>
          <Text style={[styles.payLabel, { color: textMuted }]}>💵 Cash</Text>
          <Text style={[styles.payCount, { color: COLORS.cashGreen }]}>{cashCount || 0}</Text>
          <Text style={[styles.payRevenue, { color: textPrimary }]}>{formatCurrency(cashRevenue)}</Text>
          <Text style={[styles.payPct, { color: textMuted }]}>{cashPct}%</Text>
        </View>
        <View style={[styles.dividerV, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.payLabel, { color: textMuted }]}>📱 GPay</Text>
          <Text style={[styles.payCount, { color: COLORS.gpayBlue }]}>{gpayCount || 0}</Text>
          <Text style={[styles.payRevenue, { color: textPrimary }]}>{formatCurrency(gpayRevenue)}</Text>
          <Text style={[styles.payPct, { color: textMuted }]}>{gpayPct}%</Text>
        </View>
      </View>
    </View>
  );
};

export default function StatsScreen() {
  const { isDark } = useTheme();
  const { staffProfile } = useAuth();
  const [activePeriod, setActivePeriod] = useState('today');

  const { data, loading, error } = useQuery(GET_STATS_DATA, {
    variables: { period: activePeriod },
    pollInterval: activePeriod === 'today' ? 30000 : 0,
    fetchPolicy: 'cache-and-network',
  });

  const bg = isDark ? COLORS.bgPrimaryDark : COLORS.bgPrimary;
  const textPrimary = isDark ? COLORS.textPrimaryDark : COLORS.textPrimary;
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;
  const cardBg = isDark ? COLORS.bgCardDark : COLORS.bgCard;
  const border = isDark ? COLORS.borderDark : COLORS.borderLight;

  const stats = data?.dashboardStats;
  const vehicles = data?.activeVehicles || [];
  const overstayCount = useMemo(
    () => vehicles.filter((v) => v.is_overstay).length,
    [vehicles]
  );
  const bikeCount = useMemo(() => vehicles.filter((v) => v.vehicle_type === 'bike' || v.vehicle_type === 'two_wheeler').length, [vehicles]);
  const carCount = vehicles.length - bikeCount;

  const periodLabel = { today: "Today's Overview", week: 'Weekly Overview', month: 'Monthly Overview' }[activePeriod];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textPrimary }]}>{periodLabel}</Text>
          <View style={styles.periods}>
            <PeriodButton label="Today" active={activePeriod === 'today'} onPress={() => setActivePeriod('today')} isDark={isDark} />
            <PeriodButton label="Week" active={activePeriod === 'week'} onPress={() => setActivePeriod('week')} isDark={isDark} />
            <PeriodButton label="Month" active={activePeriod === 'month'} onPress={() => setActivePeriod('month')} isDark={isDark} />
          </View>
        </View>

        {loading && !data ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.brandBlue} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={[styles.errorText, { color: COLORS.error }]}>{error.message}</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Revenue Card */}
            <View style={[styles.revenueCard, { backgroundColor: isDark ? '#0f172a' : '#0f172a' }]}>
              <Text style={styles.revenueLabel}>Total Revenue</Text>
              <Text style={styles.revenueAmount}>₹{stats?.total_revenue_today || '0.00'}</Text>
              <View style={styles.revenueRow}>
                <View style={styles.revenueItem}>
                  <Text style={styles.revenueItemLabel}>Base Fees</Text>
                  <Text style={styles.revenueItemValue}>{formatCurrency(stats?.base_fees_collected)}</Text>
                </View>
                <View style={styles.revenueItem}>
                  <Text style={styles.revenueItemLabel}>Overstay Fees</Text>
                  <Text style={styles.revenueItemValue}>{formatCurrency(stats?.overstay_fees_collected)}</Text>
                </View>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard title="Active Vehicles" value={stats?.active_vehicles || 0} icon="car" iconBg={COLORS.brandBlue} isDark={isDark} />
              <StatCard title="Completed Today" value={stats?.completed_today || 0} icon="checkmark-circle" iconBg={COLORS.success} isDark={isDark} />
              <StatCard
                title="Overstay Alerts"
                value={overstayCount}
                icon="warning"
                iconBg={overstayCount > 0 ? COLORS.error : COLORS.textMuted}
                isDark={isDark}
              />
              <StatCard title="Total Sessions" value={(stats?.active_vehicles || 0) + (stats?.completed_today || 0)} icon="stats-chart" iconBg={COLORS.gpayBlue} isDark={isDark} />
            </View>

            {/* Vehicle Distribution */}
            <View style={[styles.distCard, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>Active Distribution</Text>
              <View style={styles.distBars}>
                <View style={styles.distItem}>
                  <View style={styles.distBarWrap}>
                    <View
                      style={[
                        styles.distBar,
                        {
                          height: bikeCount > 0 ? `${(bikeCount / Math.max(bikeCount, carCount, 1)) * 80}%` : 4,
                          backgroundColor: isDark ? '#475569' : '#334155',
                          minHeight: 4,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.distCount, { color: textPrimary }]}>{bikeCount}</Text>
                  <Text style={[styles.distLabel, { color: textMuted }]}>2W (Bike)</Text>
                </View>
                <View style={styles.distItem}>
                  <View style={styles.distBarWrap}>
                    <View
                      style={[
                        styles.distBar,
                        {
                          height: carCount > 0 ? `${(carCount / Math.max(bikeCount, carCount, 1)) * 80}%` : 4,
                          backgroundColor: COLORS.brandBlue,
                          minHeight: 4,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.distCount, { color: textPrimary }]}>{carCount}</Text>
                  <Text style={[styles.distLabel, { color: textMuted }]}>4W (Car)</Text>
                </View>
              </View>
              <Text style={[styles.distTotal, { color: textMuted }]}>
                Total Active: {vehicles.length}
              </Text>
            </View>

            {/* Payment Methods */}
            <PaymentBar
              cashCount={stats?.cash_transactions}
              gpayCount={stats?.gpay_transactions}
              cashRevenue={stats?.cash_fees_collected}
              gpayRevenue={stats?.gpay_fees_collected}
              isDark={isDark}
            />
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16 },
  header: { marginBottom: 20, gap: 12 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  periods: { flexDirection: 'row', gap: 8 },
  periodBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  periodText: { fontSize: 13, fontWeight: '700' },
  content: { gap: 16 },
  revenueCard: {
    borderRadius: 24,
    padding: 20,
    gap: 4,
  },
  revenueLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  revenueAmount: { fontSize: 40, fontWeight: '900', color: COLORS.white, letterSpacing: -1 },
  revenueRow: { flexDirection: 'row', gap: 24, marginTop: 8 },
  revenueItem: { gap: 2 },
  revenueItemLabel: { fontSize: 10, color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
  revenueItemValue: { fontSize: 16, color: '#e2e8f0', fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '800' },
  statTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statSub: { fontSize: 10, fontWeight: '500' },
  distCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  distBars: { flexDirection: 'row', justifyContent: 'space-around', height: 100, alignItems: 'flex-end' },
  distItem: { alignItems: 'center', gap: 6, flex: 1 },
  distBarWrap: { height: 80, justifyContent: 'flex-end', alignItems: 'center' },
  distBar: { width: 32, borderRadius: 6 },
  distCount: { fontSize: 18, fontWeight: '800' },
  distLabel: { fontSize: 10, fontWeight: '600' },
  distTotal: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  payCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  payBar: { height: 8, borderRadius: 4, overflow: 'hidden', flexDirection: 'row' },
  payBarFill: { height: '100%' },
  payStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  payLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  payCount: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  payRevenue: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  payPct: { fontSize: 10, fontWeight: '600' },
  dividerV: { width: 1, alignSelf: 'stretch' },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  errorText: { fontSize: 14, fontWeight: '500' },
});
