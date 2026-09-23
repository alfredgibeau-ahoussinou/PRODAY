import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Icon } from '../ui/Icon';
import type { TransportMode } from '../../models/TransportLogistics';
import { transportLogisticsService } from '../../services/transportLogistics.service';
import { radius, spacing } from '../../theme/designTokens';

interface TransportModeSelectorProps {
  currentMode: TransportMode;
  eventId: string;
  editorUid: string;
  onUpdated: () => void;
}

const MODES: { mode: TransportMode; title: string; subtitle: string; icon: any }[] = [
  {
    mode: 'carpool_only',
    title: 'Covoiturage',
    subtitle: 'Véhicules personnels & parents',
    icon: 'car',
  },
  {
    mode: 'bus_only',
    title: 'Bus Club',
    subtitle: 'Autocar / Minibus collectif',
    icon: 'bus',
  },
  {
    mode: 'mixed',
    title: 'Mixte',
    subtitle: 'Bus principal + Covoiturages',
    icon: 'swap-horizontal',
  },
  {
    mode: 'individual',
    title: 'Individuel',
    subtitle: 'Chacun par ses propres moyens',
    icon: 'person',
  },
];

export const TransportModeSelector: React.FC<TransportModeSelectorProps> = ({
  currentMode,
  eventId,
  editorUid,
  onUpdated,
}) => {
  const [loadingMode, setLoadingMode] = useState<TransportMode | null>(null);

  const handleSelectMode = async (mode: TransportMode) => {
    if (mode === currentMode) return;
    setLoadingMode(mode);
    try {
      await transportLogisticsService.setTransportMode(eventId, mode, undefined, editorUid);
      onUpdated();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Erreur lors du changement de mode de transport');
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Mode de Déplacement de l'Événement</Text>
      <View style={styles.grid}>
        {MODES.map((item) => {
          const isSelected = currentMode === item.mode;
          const isLoading = loadingMode === item.mode;

          return (
            <TouchableOpacity
              key={item.mode}
              style={[styles.card, isSelected && styles.cardActive]}
              onPress={() => handleSelectMode(item.mode)}
              disabled={Boolean(loadingMode)}
            >
              <View style={[styles.iconCircle, isSelected && styles.iconCircleActive]}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#38BDF8" />
                ) : (
                  <Icon
                    name={item.icon}
                    size={20}
                    color={isSelected ? '#38BDF8' : '#94A3B8'}
                  />
                )}
              </View>
              <Text style={[styles.title, isSelected && styles.titleActive]}>
                {item.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconCircleActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  titleActive: {
    color: '#38BDF8',
  },
  subtitle: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 14,
  },
});
