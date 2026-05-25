import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { SlabBasedEntryForm } from './SlabBasedEntryForm';
import { HourlyEntryForm } from './HourlyEntryForm';

export const EntryFormRouter = ({ onComplete, onCancel }) => {
  const { organization, pricingType } = useAuth();

  if (!organization) return null;

  const isSlabBased = pricingType?.code === 'slab_based' || pricingType?.code === 'SLAB_BASED';

  if (isSlabBased) {
    return (
      <View style={styles.container}>
        <SlabBasedEntryForm
          organization={organization}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HourlyEntryForm
        organization={organization}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});
