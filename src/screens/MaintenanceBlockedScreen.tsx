import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { prodayHaptics } from '../utils/prodayHaptics';
import { platformConfigService } from '../services/platformConfig.service';
import { colors } from '../theme/designTokens';

type MaintenanceBlockedScreenProps = {
  message: string;
};

/** Plein écran — mode maintenance plateforme (verrouillage immédiat non-admins). */
export const MaintenanceBlockedScreen: React.FC<MaintenanceBlockedScreenProps> = ({
  message,
}) => {
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    prodayHaptics.press();
    setChecking(true);
    try {
      await platformConfigService.getConfig();
    } finally {
      setTimeout(() => setChecking(false), 500);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {/* Glow Icon */}
        <View style={styles.iconRing}>
          <Ionicons name="construct" size={44} color="#FFD60A" />
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.statusDot} />
          <Text style={styles.badgeText}>MAINTENANCE SYSTÈME EN COURS</Text>
        </View>

        <Text style={styles.title}>Plateforme Temporairement Indisponible</Text>

        <Text style={styles.body}>
          {message.trim() ||
            'Une mise à jour opérationnelle ou une maintenance d’infrastructure est actuellement en cours sur les serveurs ProDay.'}
        </Text>

        <View style={styles.card}>
          <View style={styles.cardItem}>
            <Ionicons name="shield-checkmark" size={18} color="#30D158" />
            <Text style={styles.cardItemText}>Intégrité des données préservée</Text>
          </View>
          <View style={styles.cardItem}>
            <Ionicons name="time" size={18} color="#0A84FF" />
            <Text style={styles.cardItemText}>Rétablissement automatique sous peu</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          activeOpacity={0.8}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Ionicons name="refresh" size={16} color="#000" style={{ marginRight: 6 }} />
              <Text style={styles.refreshButtonText}>Vérifier l’Accès</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0B0E',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 214, 10, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 214, 10, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD60A',
  },
  badgeText: {
    color: '#FFD60A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 340,
    marginBottom: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    gap: 12,
    marginBottom: 28,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardItemText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    minWidth: 180,
  },
  refreshButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
});

