import React, { useState, useMemo } from 'react';
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
import { useQuery } from '@apollo/client/react';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';
import { SelectPicker } from '../../components/ui/SelectPicker';
import { Badge } from '../../components/ui/Badge';
import { formatDate, normalizeVehicleType, formatCurrency } from '../../lib/utils';

const GET_TRANSACTION_HISTORY = gql`
  query transactionHistory(
    $page: Int
    $page_size: Int
    $status: String
    $vehicle_type: String
    $start_date: DateTime
    $end_date: DateTime
    $search: String
  ) {
    transactionHistory(
      page: $page
      page_size: $page_size
      status: $status
      vehicle_type: $vehicle_type
      start_date: $start_date
      end_date: $end_date
      search: $search
    ) {
      records {
        session_id
        vehicle_number
        vehicle_type
        driver_phone
        status
        entry_time
        exit_time
        duration_minutes
        declared_duration_hours
        overstay_minutes
        overstay_fee
        total_amount
        created_by_staff {
          name
          role
        }
      }
      total_count
      total_pages
      page
      page_size
    }
  }
`;

const TransactionRow = ({ tx, isDark }) => {
  const textPrimary = isDark ? COLORS.textPrimaryDark : COLORS.textPrimary;
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;
  const cardBg = isDark ? COLORS.bgCardDark : COLORS.bgCard;
  const border = isDark ? COLORS.borderDark : COLORS.borderLight;

  const isActive = tx.status !== 'EXITED' && tx.status !== 'EXPIRED';
  const isCar = normalizeVehicleType(tx.vehicle_type) === 'car';

  return (
    <View style={[styles.txRow, { backgroundColor: cardBg, borderColor: border }]}>
      <View style={styles.txHeader}>
        <View style={styles.txLeft}>
          <Ionicons
            name={isCar ? 'car' : 'bicycle'}
            size={16}
            color={isCar ? COLORS.brandBlue : textMuted}
          />
          <Text style={[styles.txPlate, { color: textPrimary }]}>{tx.vehicle_number || 'N/A'}</Text>
          <Badge variant={isActive ? 'success' : 'muted'}>{tx.status}</Badge>
        </View>
        <Text style={[styles.txAmount, { color: COLORS.brandBlue }]}>
          {formatCurrency(tx.total_amount)}
        </Text>
      </View>

      <View style={styles.txDetails}>
        <View style={styles.txDetail}>
          <Ionicons name="time-outline" size={12} color={textMuted} />
          <Text style={[styles.txDetailText, { color: textMuted }]}>
            In: {formatDate(tx.entry_time)}
          </Text>
        </View>
        {tx.exit_time && (
          <View style={styles.txDetail}>
            <Ionicons name="exit-outline" size={12} color={textMuted} />
            <Text style={[styles.txDetailText, { color: textMuted }]}>
              Out: {formatDate(tx.exit_time)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.txFooter}>
        <Text style={[styles.txMeta, { color: textMuted }]}>
          {(tx.duration_minutes / 60).toFixed(1)}h / {tx.declared_duration_hours || 0}h
        </Text>
        {tx.overstay_minutes > 0 && (
          <Text style={[styles.txOverstay, { color: COLORS.error }]}>
            +{(tx.overstay_minutes / 60).toFixed(1)}h overstay
          </Text>
        )}
        <Text style={[styles.txPhone, { color: textMuted }]}>{tx.driver_phone || 'N/A'}</Text>
      </View>
    </View>
  );
};

export default function HistoryScreen() {
  const { isDark } = useTheme();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const queryVariables = useMemo(
    () => ({
      page,
      page_size: 20,
      ...(status && { status }),
      ...(vehicleType && { vehicle_type: vehicleType }),
      ...(search && { search }),
    }),
    [page, status, vehicleType, search]
  );

  const { data, loading, error, refetch } = useQuery(GET_TRANSACTION_HISTORY, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network',
  });

  const transactions = data?.transactionHistory?.records || [];
  const totalPages = data?.transactionHistory?.total_pages || 1;
  const totalCount = data?.transactionHistory?.total_count || 0;

  const bg = isDark ? COLORS.bgPrimaryDark : COLORS.bgPrimary;
  const cardBg = isDark ? COLORS.bgCardDark : COLORS.bgCard;
  const border = isDark ? COLORS.borderDark : COLORS.border;
  const textPrimary = isDark ? COLORS.textPrimaryDark : COLORS.textPrimary;
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;

  const hasFilters = !!(status || vehicleType);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: textPrimary }]}>Transaction History</Text>
            <Text style={[styles.subtitle, { color: textMuted }]}>View and filter records.</Text>
          </View>
        </View>

        {/* Search + Filter Row */}
        <View style={styles.controls}>
          <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: border }]}>
            <Ionicons name="search-outline" size={16} color={textMuted} />
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Search vehicle, phone..."
              placeholderTextColor={textMuted}
              value={search}
              onChangeText={(t) => { setSearch(t); setPage(1); }}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              {
                backgroundColor: hasFilters || showFilters
                  ? COLORS.brandBlue + '15'
                  : cardBg,
                borderColor: hasFilters || showFilters ? COLORS.brandBlue : border,
              },
            ]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={hasFilters || showFilters ? COLORS.brandBlue : textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: cardBg, borderColor: border }]}
            onPress={() => refetch()}
          >
            <Ionicons name="refresh-outline" size={18} color={textMuted} />
          </TouchableOpacity>
        </View>

        {/* Filters Panel */}
        {showFilters && (
          <View style={[styles.filtersPanel, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.filterRow}>
              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: textMuted }]}>Status</Text>
                <SelectPicker
                  value={status}
                  onValueChange={(v) => { setStatus(v); setPage(1); }}
                  placeholder="All"
                  items={[
                    { label: 'All', value: '' },
                    { label: 'Active', value: 'ACTIVE' },
                    { label: 'Exited', value: 'EXITED' },
                  ]}
                />
              </View>
              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: textMuted }]}>Vehicle</Text>
                <SelectPicker
                  value={vehicleType}
                  onValueChange={(v) => { setVehicleType(v); setPage(1); }}
                  placeholder="All"
                  items={[
                    { label: 'All', value: '' },
                    { label: 'Car', value: 'car' },
                    { label: 'Bike', value: 'bike' },
                  ]}
                />
              </View>
            </View>
            {hasFilters && (
              <TouchableOpacity
                style={styles.clearFilters}
                onPress={() => { setStatus(''); setVehicleType(''); setPage(1); }}
              >
                <Text style={[styles.clearFiltersText, { color: COLORS.error }]}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* List */}
        {loading && !data ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.brandBlue} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Ionicons name="alert-circle-outline" size={40} color={COLORS.error} />
            <Text style={[styles.errorText, { color: COLORS.error }]}>{error.message}</Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.session_id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={COLORS.brandBlue} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={40} color={textMuted} />
                <Text style={[styles.emptyText, { color: textMuted }]}>No Records Found</Text>
              </View>
            }
            renderItem={({ item }) => <TransactionRow tx={item} isDark={isDark} />}
            ListFooterComponent={
              totalPages > 1 ? (
                <View style={[styles.pagination, { borderTopColor: border }]}>
                  <TouchableOpacity
                    onPress={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    style={[styles.pageBtn, { opacity: page === 1 ? 0.4 : 1 }]}
                  >
                    <Ionicons name="chevron-back" size={20} color={textPrimary} />
                  </TouchableOpacity>
                  <Text style={[styles.pageText, { color: textMuted }]}>
                    {page} / {totalPages}
                    <Text style={{ color: textMuted }}> ({totalCount} total)</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    style={[styles.pageBtn, { opacity: page === totalPages ? 0.4 : 1 }]}
                  >
                    <Ionicons name="chevron-forward" size={20} color={textPrimary} />
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  controls: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '500' },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersPanel: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  filterRow: { flexDirection: 'row', gap: 10 },
  filterItem: { flex: 1, gap: 6 },
  filterLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  clearFilters: { alignSelf: 'flex-end' },
  clearFiltersText: { fontSize: 12, fontWeight: '600' },
  list: { gap: 10, paddingBottom: 24 },
  txRow: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txPlate: { fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  txAmount: { fontSize: 15, fontWeight: '800' },
  txDetails: { gap: 4 },
  txDetail: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  txDetailText: { fontSize: 11, fontWeight: '500' },
  txFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txMeta: { fontSize: 11, fontWeight: '600' },
  txOverstay: { fontSize: 11, fontWeight: '700' },
  txPhone: { fontSize: 11, fontWeight: '500', marginLeft: 'auto' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '600' },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 16,
    marginTop: 8,
  },
  pageBtn: { padding: 4 },
  pageText: { fontSize: 13, fontWeight: '600' },
});
