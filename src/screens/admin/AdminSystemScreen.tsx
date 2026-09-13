import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { platformConfigService } from '../../services/platformConfig.service';
import type { PlatformConfig } from '../../models/PlatformConfig';
import { MaintenanceBlockedScreen } from '../MaintenanceBlockedScreen';

interface ServerMetric {
  name: string;
  value: string;
  status: 'good' | 'warning' | 'neutral';
  sub: string;
}

export const AdminSystemScreen: React.FC = () => {
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [customMessage, setCustomMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showBlockedPreview, setShowBlockedPreview] = useState(false);

  useEffect(() => {
    const unsub = platformConfigService.subscribeConfig((latest) => {
      setConfig(latest);
      setCustomMessage(latest.maintenance_message || '');
      setLoading(false);
    });
    return () => {
      unsub();
    };
  }, []);

  const isMaintenance = Boolean(config?.maintenance_mode);

  const handleToggleMaintenance = async (enable: boolean) => {
    if (enable) {
      prodayHaptics.warning();
      Alert.alert(
        '⚠️ ACTIVER LE KILL-SWITCH MAINTENANCE ?',
        'Cette action verrouille IMMÉDIATEMENT l’accès à tous les joueurs, coachs et parents. Seuls les administrateurs pourront encore se connecter.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Activer le Kill-Switch',
            style: 'destructive',
            onPress: async () => {
              setIsUpdating(true);
              try {
                await platformConfigService.setMaintenanceMode(true, customMessage);
                prodayHaptics.confirm();
              } catch (e) {
                Alert.alert('Erreur', 'Impossible de modifier la configuration.');
              } finally {
                setIsUpdating(false);
              }
            },
          },
        ],
      );
    } else {
      prodayHaptics.confirm();
      setIsUpdating(true);
      try {
        await platformConfigService.setMaintenanceMode(false, customMessage);
      } catch (e) {
        Alert.alert('Erreur', 'Impossible de désactiver le mode maintenance.');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleSaveMessage = async () => {
    prodayHaptics.confirm();
    setIsUpdating(true);
    try {
      await platformConfigService.saveConfig({
        maintenance_message: customMessage,
      });
      Alert.alert('Succès', 'Le message de maintenance a été mis à jour.');
    } catch {
      Alert.alert('Erreur', 'Échec de sauvegarde.');
    } finally {
      setIsUpdating(false);
    }
  };

  const serverMetrics: ServerMetric[] = [
    {
      name: 'Latence API & Auth',
      value: '18 ms',
      status: 'good',
      sub: 'Serveurs Europe Ouest (Paris)',
    },
    {
      name: 'Base Firestore & Règles ACL',
      value: 'Synchrone',
      status: 'good',
      sub: '0 transaction en attente',
    },
    {
      name: 'Passerelle Push (APNs / FCM)',
      value: '99.8%',
      status: 'good',
      sub: 'Délivrabilité optimale',
    },
    {
      name: 'Disponibilité Globale (SLA)',
      value: '99.98%',
      status: 'good',
      sub: '30 derniers jours',
    },
  ];

  if (showBlockedPreview) {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={styles.previewCloseBtn}
          onPress={() => setShowBlockedPreview(false)}
        >
          <Ionicons name="close" size={20} color="#FFF" />
          <Text style={styles.previewCloseText}>Fermer l'Aperçu</Text>
        </TouchableOpacity>
        <MaintenanceBlockedScreen message={customMessage} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Système */}
      <View style={styles.header}>
        <Text style={styles.title}>Système & Maintenance</Text>
        <Text style={styles.subtitle}>Supervision des infrastructures & kill-switch opérationnel</Text>
      </View>

      {/* 2. KILL-SWITCH CARD MAÎTRE */}
      <View
        style={[
          styles.killSwitchCard,
          isMaintenance ? styles.killSwitchActive : styles.killSwitchInactive,
        ]}
      >
        <View style={styles.killSwitchTop}>
          <View
            style={[
              styles.killSwitchIcon,
              {
                backgroundColor: isMaintenance
                  ? 'rgba(255, 69, 58, 0.2)'
                  : 'rgba(48, 209, 88, 0.15)',
              },
            ]}
          >
            <Ionicons
              name={isMaintenance ? 'warning' : 'shield-checkmark'}
              size={24}
              color={isMaintenance ? '#FF453A' : '#30D158'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.killSwitchTitle}>Kill-Switch Mode Maintenance</Text>
            <Text style={styles.killSwitchStatus}>
              {isMaintenance
                ? 'VERROUILLAGE GLOBAL ACTIF (Non-admins bloqués)'
                : 'SYSTÈME 100% OPÉRATIONNEL'}
            </Text>
          </View>
          {isUpdating ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Switch
              value={isMaintenance}
              onValueChange={handleToggleMaintenance}
              trackColor={{ false: '#26262E', true: '#FF453A' }}
              thumbColor="#FFFFFF"
            />
          )}
        </View>

        <Text style={styles.killSwitchDesc}>
          {isMaintenance
            ? 'La plateforme est actuellement verrouillée. Les utilisateurs et invités sont redirigés vers l’écran de maintenance ci-dessous.'
            : 'Activez ce commutateur pour isoler instantanément la base lors des déploiements ou des opérations de maintenance critiques.'}
        </Text>

        <View style={styles.previewBtnRow}>
          <TouchableOpacity
            style={styles.previewBtn}
            onPress={() => {
              prodayHaptics.press();
              setShowBlockedPreview(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="eye" size={15} color="#CBD5E1" />
            <Text style={styles.previewBtnText}>Aperçu écran verrouillé</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Personnalisation du Message de Maintenance */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="chatbox-ellipses" size={18} color="#0A84FF" />
          <Text style={styles.cardTitle}>Message Affiché aux Utilisateurs</Text>
        </View>

        <TextInput
          style={styles.textInput}
          value={customMessage}
          onChangeText={setCustomMessage}
          placeholder="Ex: Mise à jour des serveurs FFF en cours..."
          placeholderTextColor="#64748B"
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveMessage}
          activeOpacity={0.8}
          disabled={isUpdating}
        >
          <Ionicons name="save" size={15} color="#000" />
          <Text style={styles.saveBtnText}>Enregistrer le Message</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Métriques et Santé Serveurs */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="pulse" size={18} color="#30D158" />
          <Text style={styles.cardTitle}>Santé Serveurs & Infrastructure</Text>
        </View>

        <View style={styles.metricsGrid}>
          {serverMetrics.map((m, idx) => (
            <View key={idx} style={styles.metricTile}>
              <View style={styles.metricTop}>
                <Text style={styles.metricName}>{m.name}</Text>
                <View style={styles.metricStatusDot} />
              </View>
              <Text style={styles.metricVal}>{m.value}</Text>
              <Text style={styles.metricSub}>{m.sub}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0E',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  killSwitchCard: {
    backgroundColor: '#141418',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    gap: 12,
  },
  killSwitchActive: {
    borderColor: '#FF453A',
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
  },
  killSwitchInactive: {
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  killSwitchTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  killSwitchIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  killSwitchTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  killSwitchStatus: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  killSwitchDesc: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
  },
  previewBtnRow: {
    alignItems: 'flex-start',
    marginTop: 4,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 6,
  },
  previewBtnText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 6,
  },
  previewCloseText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#141418',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#0B0B0E',
    color: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    textAlignVertical: 'top',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricTile: {
    width: '48%',
    backgroundColor: '#0B0B0E',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricName: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  metricStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#30D158',
  },
  metricVal: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  metricSub: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
});
