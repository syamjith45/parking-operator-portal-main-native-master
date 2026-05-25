import React, { createContext, useContext, useState } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

const PrinterContext = createContext();

export function usePrinter() {
  return useContext(PrinterContext);
}

export function PrinterProvider({ children }) {
  const [pairedDevices, setPairedDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return (
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const scanDevices = async () => {
    setIsScanning(true);
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission required', 'Bluetooth permissions are required to scan for printers.');
        return;
      }
      const devices = await RNBluetoothClassic.getBondedDevices();
      setPairedDevices(devices.map(d => ({ name: d.name || 'Unknown Printer', address: d.address })));
    } catch (e) {
      Alert.alert('Scan Failed', e.message || 'Could not scan for Bluetooth devices');
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (address) => {
    setIsConnecting(true);
    try {
      if (connectedDevice) {
        try { await connectedDevice.disconnect(); } catch (_) {}
        setConnectedDevice(null);
      }
      const device = await RNBluetoothClassic.connectToDevice(address);
      setConnectedDevice(device);
      Alert.alert('Success', 'Printer connected successfully');
    } catch (e) {
      Alert.alert('Connection Failed', e.message || 'Could not connect to printer');
    } finally {
      setIsConnecting(false);
    }
  };

  const printReceipt = async (printCommandsCallback) => {
    if (!connectedDevice) {
      Alert.alert('No Printer', 'Please connect a Bluetooth printer from settings first.');
      return false;
    }
    try {
      await printCommandsCallback(connectedDevice);
      return true;
    } catch (e) {
      Alert.alert('Print Error', e.message || 'Printing failed. Is the printer on?');
      return false;
    }
  };

  return (
    <PrinterContext.Provider
      value={{
        pairedDevices,
        foundDevices: [],
        connectedDevice,
        isScanning,
        isConnecting,
        scanDevices,
        connectToDevice,
        printReceipt,
      }}
    >
      {children}
    </PrinterContext.Provider>
  );
}
