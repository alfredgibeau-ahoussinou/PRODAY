import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

interface PlayerGpsProfile {
  id: string;
  name: string;
  pos: string;
  distanceKm: number;
  sprintCount: number;
  maxSpeedKmh: number;
  playerLoad: number;
  acwr: number; // Acute Chronic Workload Ratio
  wellnessScore: number; // 0-100
  status: 'optimal' | 'warning' | 'danger';
  autoAdjustSuggestion?: string;
  adjusted?: boolean;
}

const DEFAULT_PLAYERS_GPS: PlayerGpsProfile[] = [
  {
    id: 'p1',
    name: 'Lucas M.',
    pos: 'Ailier Droit',
    distanceKm: 9.8,
    sprintCount: 28,
    maxSpeedKmh: 32.4,
    playerLoad: 680,
    acwr: 1.62,
    wellnessScore: 62,
    status: 'danger',
    autoAdjustSuggestion: 'Remplacer les courses à haute intensité par un travail d’appuis légers et décharge vélo (30 min).',
    adjusted: false,
  },
  {
    id: 'p2',
    name: 'Thomas D.',
    pos: 'Milieu Défensif',
    distanceKm: 11.2,
    sprintCount: 14,
    maxSpeedKmh: 28.1,
    playerLoad: 610,
    acwr: 1.48,
    wellnessScore: 71,
    status: 'warning',
    autoAdjustSuggestion: 'Réduction de 25% du temps de jeu en opposition dirigée et protocole adducteurs.',
    adjusted: false,
  },
  {
    id: 'p3',
    name: 'Mathis R.',
    pos: 'Milieu Central',
    distanceKm: 10.4,
    sprintCount: 19,
    maxSpeedKmh: 29.8,
    playerLoad: 530,
    acwr: 1.12,
    wellnessScore: 88,
    status: 'optimal',
  },
  {
    id: 'p4',
    name: 'Yanis B.',
    pos: 'Avant-Centre',
    distanceKm: 8.6,
    sprintCount: 22,
    maxSpeedKmh: 31.9,
    playerLoad: 490,
    acwr: 1.05,
    wellnessScore: 92,
    status: 'optimal',
  },
  {
    id: 'p5',
    name: 'Axel P.',
    pos: 'Défenseur Central',
    distanceKm: 7.9,
    sprintCount: 11,
    maxSpeedKmh: 28.9,
    playerLoad: 440,
    acwr: 0.98,
    wellnessScore: 85,
    status: 'optimal',
  },
];

export const CoachWorkloadHealthScreen: React.FC = () => {
  const [profiles, setProfiles] = useState<PlayerGpsProfile[]>(DEFAULT_PLAYERS_GPS);
  const [filter, setFilter] = useState<'all' | 'danger' | 'optimal'>('all');

  const dangerCount = profiles.filter((p) => p.status === 'danger' || p.status === 'warning').length;

  const applyAutoAdjustment = (id: string) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, adjusted: true } : p))
    );
    Alert.alert(
      'Charge Auto-Ajustée avec Succès',
      'Le programme d’entraînement individuel a été adapté automatiquement pour éviter la blessure.'
    );
  };

  const applyAllAdjustments = () => {
    setProfiles((prev) => prev.map((p) => ({ ...p, adjusted: true })));
    Alert.alert(
      'Toutes les Charges Auto-Ajustées',
      'Les séances alternatives ont été assignées directement aux profils des joueurs concernés.'
    );
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* 1. Header: GPS & Wellness Cockpit */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="heart-pulse" size={24} color="#FF9F0A" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={styles.gpsBadge}>
                <Text style={styles.gpsBadgeText}>GPS PlayerData™ Intégré</Text>
              </View>
              <View style={styles.acwrBadge}>
                <Text style={styles.acwrBadgeText}>Moteur ACWR Pro</Text>
              </View>
            </View>
            <Text style={styles.title}>Suivi de Charge, GPS & Santé</Text>
            <Text style={styles.subtitle}>Triage automatique de la fatigue aiguë et prévention blessures</Text>
          </View>
        </View>

        {/* Global Barometer 2x2 */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Taux Disponibilité</Text>
            <Text style={[styles.kpiVal, { color: '#30D158' }]}>89 %</Text>
            <Text style={styles.kpiSub}>16/18 Aptes match</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Score Wellness Équipe</Text>
            <Text style={[styles.kpiVal, { color: '#0A84FF' }]}>81 / 100</Text>
            <Text style={styles.kpiSub}>Sommeil 7.8h moy.</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Alertes Risque Surcharge</Text>
            <Text style={[styles.kpiVal, { color: '#FF453A' }]}>{dangerCount}</Text>
            <Text style={styles.kpiSub}>ACWR &gt; 1.45</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Charge Moyenne Hebdo</Text>
            <Text style={[styles.kpiVal, { color: '#C5A059' }]}>2 450 UA</Text>
            <Text style={styles.kpiSub}>Optimal pour R1</Text>
          </View>
        </View>
      </View>

      {/* 2. AI Workload Auto-Adjuster Banner (Innovation) */}
      {dangerCount > 0 && (
        <View style={styles.autoAdjustBanner}>
          <View style={styles.autoAdjustTop}>
            <MaterialCommunityIcons name="shield-refresh-outline" size={20} color="#FF9F0A" />
            <View style={{ flex: 1 }}>
              <Text style={styles.autoAdjustTitle}>IA Auto-Ajusteur de Charge Activé</Text>
              <Text style={styles.autoAdjustDesc}>
                {dangerCount} joueur(s) présentent un pic de charge aiguë. L’algorithme propose un protocole de compensation immédiat.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.adjustAllBtn}
            activeOpacity={0.8}
            onPress={applyAllAdjustments}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={16} color="#000000" />
            <Text style={styles.adjustAllBtnText}>Appliquer Auto-Ajustement pour Tout l’Effectif</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Filter Bar (Tous, En Risque, Optimaux) */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterBtnText, filter === 'all' && styles.filterBtnTextActive]}>
            Tous ({profiles.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'danger' && styles.filterBtnActive]}
          onPress={() => setFilter('danger')}
        >
          <Text style={[styles.filterBtnText, filter === 'danger' && styles.filterBtnTextActive]}>
            À Surveiller ({dangerCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'optimal' && styles.filterBtnActive]}
          onPress={() => setFilter('optimal')}
        >
          <Text style={[styles.filterBtnText, filter === 'optimal' && styles.filterBtnTextActive]}>
            Zone Optimale ({profiles.length - dangerCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Player Workload & GPS Cards */}
      {profiles
        .filter((p) => {
          if (filter === 'danger') return p.status === 'danger' || p.status === 'warning';
          if (filter === 'optimal') return p.status === 'optimal';
          return true;
        })
        .map((p) => {
          const isDanger = p.status === 'danger';
          const isWarning = p.status === 'warning';

          return (
            <View
              key={p.id}
              style={[
                styles.playerCard,
                isDanger && styles.cardDangerBorder,
                isWarning && styles.cardWarningBorder,
              ]}
            >
              <View style={styles.playerCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerName}>{p.name}</Text>
                  <Text style={styles.playerPos}>{p.pos}</Text>
                </View>

                {/* ACWR Badge */}
                <View
                  style={[
                    styles.acwrBadgeTag,
                    isDanger
                      ? { backgroundColor: 'rgba(255, 69, 58, 0.2)' }
                      : isWarning
                      ? { backgroundColor: 'rgba(255, 159, 10, 0.2)' }
                      : { backgroundColor: 'rgba(48, 209, 88, 0.2)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.acwrBadgeVal,
                      isDanger
                        ? { color: '#FF453A' }
                        : isWarning
                        ? { color: '#FF9F0A' }
                        : { color: '#30D158' },
                    ]}
                  >
                    ACWR {p.acwr}
                  </Text>
                </View>
              </View>

              {/* 4 GPS Telemetry Chips */}
              <View style={styles.metricsRow}>
                <View style={styles.metricChip}>
                  <Text style={styles.metricChipLabel}>Distance</Text>
                  <Text style={styles.metricChipVal}>{p.distanceKm} km</Text>
                </View>
                <View style={styles.metricChip}>
                  <Text style={styles.metricChipLabel}>Sprints &gt;25km/h</Text>
                  <Text style={styles.metricChipVal}>{p.sprintCount}</Text>
                </View>
                <View style={styles.metricChip}>
                  <Text style={styles.metricChipLabel}>Vitesse Max</Text>
                  <Text style={styles.metricChipVal}>{p.maxSpeedKmh} km/h</Text>
                </View>
                <View style={styles.metricChip}>
                  <Text style={styles.metricChipLabel}>PlayerLoad</Text>
                  <Text style={styles.metricChipVal}>{p.playerLoad} UA</Text>
                </View>
              </View>

              {/* Auto-Adjust suggestion if flagged */}
              {p.autoAdjustSuggestion && (
                <View style={styles.suggestionBox}>
                  <View style={styles.suggestionHeader}>
                    <MaterialCommunityIcons name="robot" size={14} color="#C5A059" />
                    <Text style={styles.suggestionTitle}>Séance Alternative Recommandée :</Text>
                  </View>
                  <Text style={styles.suggestionText}>{p.autoAdjustSuggestion}</Text>

                  <TouchableOpacity
                    style={[styles.applyBtn, p.adjusted && styles.applyBtnDone]}
                    activeOpacity={0.8}
                    onPress={() => applyAutoAdjustment(p.id)}
                    disabled={p.adjusted}
                  >
                    <Ionicons
                      name={p.adjusted ? 'checkmark-circle' : 'swap-horizontal'}
                      size={14}
                      color={p.adjusted ? '#30D158' : '#000000'}
                    />
                    <Text style={[styles.applyBtnText, p.adjusted && { color: '#30D158' }]}>
                      {p.adjusted ? 'Adaptation validée pour la séance' : 'Appliquer l’adaptation'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 14,
  },
  headerTop: {
    flexDirection: 'row',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  gpsBadge: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gpsBadgeText: {
    color: '#0A84FF',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  acwrBadge: {
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  acwrBadgeText: {
    color: '#FF9F0A',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  subtitle: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#1C1C22',
    borderRadius: 10,
    padding: 10,
  },
  kpiLabel: {
    color: '#8B8B9A',
    fontSize: 10,
    fontFamily: '-apple-system',
  },
  kpiVal: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: '-apple-system',
    marginVertical: 2,
  },
  kpiSub: {
    color: '#636366',
    fontSize: 10,
    fontFamily: '-apple-system',
  },
  autoAdjustBanner: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.3)',
    padding: 14,
    marginBottom: 14,
  },
  autoAdjustTop: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  autoAdjustTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  autoAdjustDesc: {
    color: '#8B8B9A',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  adjustAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#C5A059',
    borderRadius: 10,
    paddingVertical: 10,
  },
  adjustAllBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#141418',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 8,
  },
  filterBtnActive: {
    backgroundColor: '#1C1C22',
  },
  filterBtnText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
  },
  playerCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 10,
  },
  cardDangerBorder: {
    borderColor: 'rgba(255, 69, 58, 0.35)',
  },
  cardWarningBorder: {
    borderColor: 'rgba(255, 159, 10, 0.35)',
  },
  playerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  playerPos: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
  },
  acwrBadgeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  acwrBadgeVal: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  metricChip: {
    flex: 1,
    backgroundColor: '#1C1C22',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
  },
  metricChipLabel: {
    color: '#8B8B9A',
    fontSize: 9,
    fontFamily: '-apple-system',
  },
  metricChipVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  suggestionBox: {
    backgroundColor: '#1C1C22',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#C5A059',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  suggestionTitle: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  suggestionText: {
    color: '#D1D1D6',
    fontSize: 11,
    lineHeight: 15,
    fontFamily: '-apple-system',
    marginBottom: 8,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#C5A059',
    borderRadius: 8,
    paddingVertical: 7,
  },
  applyBtnDone: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderWidth: 1,
    borderColor: '#30D158',
  },
  applyBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
});
