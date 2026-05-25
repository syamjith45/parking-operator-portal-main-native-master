import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';

const GET_MY_ORGANIZATION = gql`
  query GetMyOrganization {
    myOrganization {
      id
      name
      pricing_type {
        id
        code
        label
      }
    }
  }
`;

const GET_SLABS = gql`
  query GetSlabs($org_id: ID!) {
    overstaySlabs(organization_id: $org_id) {
      id
      slab_hours
      slab_fee
      vehicle_type
    }
  }
`;

const CREATE_SLAB = gql`
  mutation CreateOverstaySlab($organization_id: ID!, $input: OverstaySlabInput!) {
    createOverstaySlab(organization_id: $organization_id, input: $input) {
      id
      slab_hours
      slab_fee
      vehicle_type
    }
  }
`;

const UPDATE_SLAB = gql`
  mutation UpdateOverstaySlab($id: ID!, $input: OverstaySlabInput!) {
    updateOverstaySlab(id: $id, input: $input) {
      id
      slab_hours
      slab_fee
      vehicle_type
    }
  }
`;

const DELETE_SLAB = gql`
  mutation DeleteOverstaySlab($id: ID!) {
    deleteOverstaySlab(id: $id) {
      id
    }
  }
`;

const SlabFormModal = ({ visible, onClose, onSubmit, initial, isLoading, title }) => {
  const { isDark } = useTheme();
  const [hours, setHours] = useState(initial?.slab_hours?.toString() || '');
  const [fee, setFee] = useState(initial?.slab_fee?.toString() || '');
  const [vehicleType, setVehicleType] = useState(initial?.vehicle_type || 'bike');

  const textPrimary = isDark ? COLORS.textPrimaryDark : COLORS.textPrimary;
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;
  const cardBg = isDark ? COLORS.bgCardDark : COLORS.bgCard;
  const border = isDark ? COLORS.borderDark : COLORS.border;
  const inputBg = isDark ? COLORS.bgMutedDark : '#f8fafc';

  const handleSubmit = () => {
    if (!hours || !fee || !vehicleType) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    onSubmit(parseFloat(hours), parseFloat(fee), vehicleType);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: cardBg }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textPrimary }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: textMuted }]}>HOURS</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: inputBg, color: textPrimary, borderColor: border }]}
              value={hours}
              onChangeText={setHours}
              keyboardType="decimal-pad"
              placeholder="e.g. 2"
              placeholderTextColor={textMuted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: textMuted }]}>FEE (₹)</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: inputBg, color: textPrimary, borderColor: border }]}
              value={fee}
              onChangeText={setFee}
              keyboardType="decimal-pad"
              placeholder="e.g. 50"
              placeholderTextColor={textMuted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: textMuted }]}>VEHICLE TYPE</Text>
            <View style={styles.typeRow}>
              {['bike', 'car', 'four_wheeler', 'two_wheeler'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeBtn,
                    { borderColor: border },
                    vehicleType === t && { backgroundColor: COLORS.brandBlue, borderColor: COLORS.brandBlue },
                  ]}
                  onPress={() => setVehicleType(t)}
                >
                  <Text style={[styles.typeBtnText, { color: vehicleType === t ? COLORS.white : textPrimary }]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.modalSubmit, { backgroundColor: COLORS.brandBlue, opacity: isLoading ? 0.6 : 1 }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.modalSubmitText}>Save Slab</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function PricingScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const { role } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedSlab, setSelectedSlab] = useState(null);

  const { data: orgData, loading: orgLoading } = useQuery(GET_MY_ORGANIZATION);
  const org = orgData?.myOrganization;

  const { data: slabsData, loading: slabsLoading, refetch } = useQuery(GET_SLABS, {
    variables: { org_id: org?.id },
    skip: !org?.id,
  });

  const [createSlab, { loading: createLoading }] = useMutation(CREATE_SLAB, {
    refetchQueries: [{ query: GET_SLABS, variables: { org_id: org?.id } }],
  });
  const [updateSlab, { loading: updateLoading }] = useMutation(UPDATE_SLAB, {
    refetchQueries: [{ query: GET_SLABS, variables: { org_id: org?.id } }],
  });
  const [deleteSlab, { loading: deleteLoading }] = useMutation(DELETE_SLAB, {
    refetchQueries: [{ query: GET_SLABS, variables: { org_id: org?.id } }],
  });

  const slabs = slabsData?.overstaySlabs || [];

  const bg = isDark ? COLORS.bgPrimaryDark : COLORS.bgPrimary;
  const cardBg = isDark ? COLORS.bgCardDark : COLORS.bgCard;
  const border = isDark ? COLORS.borderDark : COLORS.borderLight;
  const textPrimary = isDark ? COLORS.textPrimaryDark : COLORS.textPrimary;
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;

  if (role !== 'manager') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
        <View style={styles.centered}>
          <Text style={{ color: textMuted }}>Not authorized</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCreate = async (hours, fee, vehicleType) => {
    try {
      await createSlab({
        variables: { organization_id: org.id, input: { slab_hours: hours, slab_fee: fee, vehicle_type: vehicleType } },
      });
      setShowCreate(false);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleUpdate = async (hours, fee, vehicleType) => {
    try {
      await updateSlab({
        variables: { id: selectedSlab.id, input: { slab_hours: hours, slab_fee: fee, vehicle_type: vehicleType } },
      });
      setShowEdit(false);
      setSelectedSlab(null);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = (slabId) => {
    Alert.alert('Delete Slab', 'Are you sure you want to delete this slab?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSlab({ variables: { id: slabId } });
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: textPrimary }]}>Pricing Management</Text>
          <Text style={[styles.subtitle, { color: textMuted }]}>
            Manage slabs for {org?.name || 'your organization'}
          </Text>
        </View>
      </View>

      {orgLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.brandBlue} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Org Info */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.cardLabel, { color: textMuted }]}>Pricing Type</Text>
            <Text style={[styles.cardValue, { color: textPrimary }]}>
              {org?.pricing_type?.label || 'Not Set'}
            </Text>
          </View>

          {/* Slabs */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.slabsHeader}>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>Overstay Slabs</Text>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: COLORS.brandBlue }]}
                onPress={() => setShowCreate(true)}
              >
                <Ionicons name="add" size={16} color={COLORS.white} />
                <Text style={styles.addBtnText}>New Slab</Text>
              </TouchableOpacity>
            </View>

            {slabsLoading ? (
              <ActivityIndicator size="small" color={COLORS.brandBlue} />
            ) : slabs.length === 0 ? (
              <Text style={[styles.noSlabs, { color: textMuted }]}>No slabs created yet</Text>
            ) : (
              slabs.map((slab) => (
                <View key={slab.id} style={[styles.slabRow, { borderBottomColor: border }]}>
                  <View style={styles.slabInfo}>
                    <Text style={[styles.slabType, { color: textPrimary }]}>{slab.vehicle_type}</Text>
                    <Text style={[styles.slabHours, { color: textMuted }]}>{slab.slab_hours}h</Text>
                    <Text style={[styles.slabFee, { color: textPrimary }]}>₹{slab.slab_fee}</Text>
                  </View>
                  <View style={styles.slabActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#eff6ff' }]}
                      onPress={() => { setSelectedSlab(slab); setShowEdit(true); }}
                    >
                      <Ionicons name="pencil" size={14} color={COLORS.gpayBlue} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#fff1f2' }]}
                      onPress={() => handleDelete(slab.id)}
                      disabled={deleteLoading}
                    >
                      <Ionicons name="trash" size={14} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <SlabFormModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        isLoading={createLoading}
        title="Create New Slab"
      />
      <SlabFormModal
        visible={showEdit}
        onClose={() => { setShowEdit(false); setSelectedSlab(null); }}
        onSubmit={handleUpdate}
        initial={selectedSlab}
        isLoading={updateLoading}
        title="Edit Slab"
      />
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
  card: { borderRadius: 20, borderWidth: 1, padding: 16 },
  cardLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  cardValue: { fontSize: 16, fontWeight: '700' },
  slabsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  noSlabs: { fontSize: 13, fontWeight: '500', textAlign: 'center', paddingVertical: 16 },
  slabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  slabInfo: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  slabType: { fontSize: 13, fontWeight: '700', minWidth: 80 },
  slabHours: { fontSize: 13, fontWeight: '600' },
  slabFee: { fontSize: 13, fontWeight: '800' },
  slabActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 16, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  formGroup: { gap: 8 },
  formLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  formInput: { borderWidth: 1.5, borderRadius: 12, padding: 12, fontSize: 15, fontWeight: '600' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  typeBtnText: { fontSize: 12, fontWeight: '700' },
  modalSubmit: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  modalSubmitText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});
