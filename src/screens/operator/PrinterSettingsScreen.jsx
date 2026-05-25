import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePrinter } from '../../context/PrinterContext';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';

export default function PrinterSettingsScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const {
    pairedDevices,
    foundDevices,
    connectedDevice,
    isScanning,
    isConnecting,
    scanDevices,
    connectToDevice,
    printReceipt,
  } = usePrinter();

  const bg = isDark ? COLORS.bgPrimaryDark : COLORS.bgPrimary;
  const cardBg = isDark ? COLORS.bgCardDark : COLORS.bgCard;
  const border = isDark ? COLORS.borderDark : COLORS.borderLight;
  const textPrimary = isDark ? COLORS.textPrimaryDark : COLORS.textPrimary;
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;

  const handleTestPrint = () => {
    printReceipt(async (device) => {
      await device.write(
        '\x1B\x40\x1B\x61\x01\x1B\x45\x01KeraAI Mobility\x1B\x45\x00\n\nPrinter Test Successful!\n\n\n\x1B\x69'
      );
    });
  };

  const renderDevice = ({ item }) => {
    const isConnected = connectedDevice?.address === item.address;

    return (
      <TouchableOpacity
        style={[
          styles.deviceCard,
          { backgroundColor: cardBg, borderColor: isConnected ? COLORS.brandBlue : border },
        ]}
        onPress={() => connectToDevice(item.address)}
        disabled={isConnected || isConnecting}
      >
        <View style={styles.deviceInfo}>
          <Text style={[styles.deviceName, { color: textPrimary }]}>{item.name || 'Unknown Device'}</Text>
          <Text style={[styles.deviceMac, { color: textMuted }]}>{item.address}</Text>
        </View>
        {isConnected ? (
          <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
        ) : (
          <Ionicons name="bluetooth" size={24} color={textMuted} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textPrimary }]}>Printer Settings</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.btn, styles.scanBtn]}
            onPress={scanDevices}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="search" size={20} color={COLORS.white} />
                <Text style={styles.btnText}>Scan Printers</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.testBtn, !connectedDevice && styles.disabledBtn]}
            onPress={handleTestPrint}
            disabled={!connectedDevice}
          >
            <Ionicons name="print" size={20} color={COLORS.white} />
            <Text style={styles.btnText}>Test Print</Text>
          </TouchableOpacity>
        </View>

        {isConnecting && (
          <View style={styles.connecting}>
            <ActivityIndicator size="small" color={COLORS.brandBlue} />
            <Text style={[styles.connectingText, { color: textMuted }]}>Connecting...</Text>
          </View>
        )}

        <FlatList
          data={[...pairedDevices, ...foundDevices.filter(fd => !pairedDevices.find(pd => pd.address === fd.address))]}
          keyExtractor={(item) => item.address}
          renderItem={renderDevice}
          contentContainerStyle={styles.list}
          ListHeaderComponent={() => (
            <Text style={[styles.sectionTitle, { color: textMuted }]}>
              {pairedDevices.length > 0 || foundDevices.length > 0 ? 'AVAILABLE DEVICES' : 'NO DEVICES FOUND'}
            </Text>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: '800' },
  container: { flex: 1, padding: 16 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  scanBtn: { backgroundColor: COLORS.brandBlue },
  testBtn: { backgroundColor: COLORS.success },
  disabledBtn: { opacity: 0.5 },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  list: { gap: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  deviceMac: { fontSize: 12, fontWeight: '500' },
  connecting: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  connectingText: { fontSize: 14, fontWeight: '600' },
});
