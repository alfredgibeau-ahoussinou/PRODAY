import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import {
  playerWellnessService,
  calculateWellnessScore,
  type PlayerDailyWellness,
} from '../../services/playerWellness.service';
import { PlayerPageGuideModal, type GuideSection } from '../../components/player/PlayerPageGuideModal';
import { PlayerPageGuideBanner } from '../../components/player/PlayerPageGuideBanner';

export const PlayerWellnessScreen: React.FC = () => {
  const profile = useSessionProfile();
  const userId = profile?.uid || 'player-demo';

  const [sleepHours, setSleepHours] = useState(8);
  const [sleepQuality, setSleepQuality] = useState(4);
  const [soreness, setSoreness] = useState(2);
  const [energy, setEnergy] = useState(4);
  const [stress, setStress] = useState(2);
  const [savedToday, setSavedToday] = useState(false);
  const [wellnessRecord, setWellnessRecord] = useState<PlayerDailyWellness | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const guideSections: GuideSection[] = [
    {
      icon: 'sunny',
      iconColor: '#FBBF24',
      title: 'Check-In Matinal Quotidien (30 sec)',
      description: 'Chaque matin, ajuste rapidement tes 4 curseurs : sommeil, courbatures, énergie et stress. Ce rituel permet d\'évaluer ta charge interne et ton niveau de fraîcheur.',
      badge: 'QUOTIDIEN',
    },
    {
      icon: 'pulse',
      iconColor: '#30D158',
      title: 'Ratio ACWR & Alerte Coach IA',
      description: 'Le ratio Charge Aiguë / Charge Chronique mesure la tolérance de tes muscles à l\'effort. S\'il s\'écarte de la zone optimale (0.8 à 1.3), le préparateur physique adapte ton entraînement.',
      badge: 'SANTÉ IA',
    },
    {
      icon: 'calendar',
      iconColor: '#0A84FF',
      title: 'Agenda & Convocations Équipe',
      description: 'Visualise tes prochaines séances sur le terrain, tes matchs et les sessions de récupération en balnéo. Tes statuts de convocation y sont synchronisés en direct.',
      badge: 'SYNCHRO',
    },
    {
      icon: 'shield-checkmark',
      iconColor: '#A855F7',
      title: 'Bouclier Anti-Blessure',
      description: 'Plus de 80% des blessures musculaires peuvent être évitées en ajustant l\'intensité avant la rupture. Ton check-in protège ton intégrité physique tout au long de la saison.',
    },
  ];

  useEffect(() => {
    void playerWellnessService.getTodayWellness(userId).then((res) => {
      if (res) {
        setSleepHours(res.sleepHours);
        setSleepQuality(res.sleepQuality);
        setSoreness(res.soreness);
        setEnergy(res.energy);
        setStress(res.stress);
        setWellnessRecord(res);
        setSavedToday(true);
      }
    });
  }, [userId]);

  const currentScore = calculateWellnessScore({
    sleepHours,
    sleepQuality,
    soreness,
    energy,
    stress,
  });

  const handleSaveCheckin = async () => {
    prodayHaptics.impactMedium();
    const res = await playerWellnessService.saveTodayWellness(userId, {
      sleepHours,
      sleepQuality,
      soreness,
      energy,
      stress,
    });
    setWellnessRecord(res);
    setSavedToday(true);
  };

  const getSorenessLabel = (val: number) => {
    switch (val) {
      case 1:
        return 'Aucune';
      case 2:
        return 'Légère';
      case 3:
        return 'Modérée';
      case 4:
        return 'Forte';
      case 5:
        return 'Sévère';
      default:
        return '';
    }
  };

  const getEnergyLabel = (val: number) => {
    switch (val) {
      case 1:
        return 'Épuisé';
      case 2:
        return 'Bas';
      case 3:
        return 'Correct';
      case 4:
        return 'Bon';
      case 5:
        return 'Au sommet';
      default:
        return '';
    }
  };

  const upcomingEvents = [
    {
      id: 'e1',
      title: 'Séance Tactique & Vitesse',
      date: "Aujourd'hui · 19:30",
      location: 'Terrain Annexe 1',
      type: 'training',
    },
    {
      id: 'e2',
      title: 'J17 : FC ProDay vs RC France',
      date: 'Samedi 14 Mars · 18:00',
      location: 'Stade Municipal',
      type: 'match',
    },
    {
      id: 'e3',
      title: 'Récupération Active & Cryo',
      date: 'Lundi 16 Mars · 18:30',
      location: 'Espace Santé & Balnéo',
      type: 'recovery',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.screenSubtitle}>Prévention & Récupération</Text>
          <Text style={styles.screenTitle}>Santé & Check-In</Text>
        </View>

        <View style={styles.topHeaderRight}>
          <TouchableOpacity
            style={styles.guideIconBtn}
            onPress={() => {
              prodayHaptics.selection();
              setShowGuideModal(true);
            }}
            activeOpacity={0.8}
            accessibilityLabel="Guide de la page"
          >
            <Ionicons name="help-circle-outline" size={16} color="#30D158" />
            <Text style={styles.guideBtnText}>Guide</Text>
          </TouchableOpacity>

          <View
            style={[
              styles.riskPill,
              currentScore.risk === 'low'
                ? styles.riskLow
                : currentScore.risk === 'moderate'
                ? styles.riskModerate
                : styles.riskHigh,
            ]}
          >
            <Ionicons
              name={currentScore.risk === 'low' ? 'checkmark-circle' : 'warning'}
              size={14}
              color={
                currentScore.risk === 'low'
                  ? '#30D158'
                  : currentScore.risk === 'moderate'
                  ? '#FBBF24'
                  : '#FF453A'
              }
            />
            <Text
              style={[
                styles.riskText,
                {
                  color:
                    currentScore.risk === 'low'
                      ? '#30D158'
                      : currentScore.risk === 'moderate'
                      ? '#FBBF24'
                      : '#FF453A',
                },
              ]}
            >
              {currentScore.risk === 'low'
                ? 'Forme Optimale'
                : currentScore.risk === 'moderate'
                ? 'Vigilance Fatigue'
                : 'Risque Blessure'}
            </Text>
          </View>
        </View>
      </View>

      {/* Dismissible Onboarding Guide Banner */}
      <PlayerPageGuideBanner
        pageKey="wellness"
        title="Guide Santé & Prévention Blessures"
        subtitle="Découvre pourquoi le check-in matinal et l'ACWR protègent ton corps"
        onOpenGuide={() => setShowGuideModal(true)}
      />

      {/* Daily Morning Check-in Card */}
      <LinearGradient
        colors={['#161E2E', '#0F172A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.checkinCard}
      >
        <View style={styles.checkinHeader}>
          <View style={styles.checkinHeaderLeft}>
            <Ionicons name="sunny" size={18} color="#FBBF24" />
            <Text style={styles.checkinTitle}>Check-In Matinal Quotidien</Text>
          </View>
          <Text style={styles.scoreBadge}>{currentScore.score}/100</Text>
        </View>

        {/* 1. Sleep Stepper */}
        <View style={styles.controlRow}>
          <View>
            <Text style={styles.controlLabel}>Sommeil (heures)</Text>
            <Text style={styles.controlValue}>{sleepHours} h de repos</Text>
          </View>
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => {
                prodayHaptics.selection();
                setSleepHours(Math.max(4, sleepHours - 0.5));
              }}
            >
              <Ionicons name="remove" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.stepDisplay}>{sleepHours}h</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => {
                prodayHaptics.selection();
                setSleepHours(Math.min(12, sleepHours + 0.5));
              }}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Soreness Level */}
        <View style={styles.controlRow}>
          <View>
            <Text style={styles.controlLabel}>Courbatures & Raideurs</Text>
            <Text style={styles.controlValue}>{getSorenessLabel(soreness)}</Text>
          </View>
          <View style={styles.segmentedButtons}>
            {[1, 2, 3, 4, 5].map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[styles.segBtn, soreness === lvl && styles.segBtnActive]}
                onPress={() => {
                  prodayHaptics.selection();
                  setSoreness(lvl);
                }}
              >
                <Text style={[styles.segBtnText, soreness === lvl && styles.segBtnTextActive]}>
                  {lvl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3. Energy Level */}
        <View style={styles.controlRow}>
          <View>
            <Text style={styles.controlLabel}>Niveau d'Énergie</Text>
            <Text style={styles.controlValue}>{getEnergyLabel(energy)}</Text>
          </View>
          <View style={styles.segmentedButtons}>
            {[1, 2, 3, 4, 5].map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[styles.segBtn, energy === lvl && styles.segBtnActive]}
                onPress={() => {
                  prodayHaptics.selection();
                  setEnergy(lvl);
                }}
              >
                <Text style={[styles.segBtnText, energy === lvl && styles.segBtnTextActive]}>
                  {lvl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. Stress Level */}
        <View style={styles.controlRow}>
          <View>
            <Text style={styles.controlLabel}>Stress / Tension</Text>
            <Text style={styles.controlValue}>
              {stress <= 2 ? 'Calme' : stress === 3 ? 'Moyen' : 'Élevé'}
            </Text>
          </View>
          <View style={styles.segmentedButtons}>
            {[1, 2, 3, 4, 5].map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[styles.segBtn, stress === lvl && styles.segBtnActive]}
                onPress={() => {
                  prodayHaptics.selection();
                  setStress(lvl);
                }}
              >
                <Text style={[styles.segBtnText, stress === lvl && styles.segBtnTextActive]}>
                  {lvl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Validation Button */}
        <TouchableOpacity
          style={styles.validateBtn}
          onPress={handleSaveCheckin}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={savedToday ? ['#059669', '#10B981'] : ['#30D158', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.validateGradient}
          >
            <Ionicons
              name={savedToday ? 'checkmark-done-circle' : 'checkmark-circle'}
              size={18}
              color="#000000"
            />
            <Text style={styles.validateText}>
              {savedToday ? 'Check-In Transmis au Staff ✓' : 'Valider mon Check-In du Jour'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* ACWR Coach Workload Sync Card */}
      <View style={styles.acwrCard}>
        <View style={styles.acwrHeader}>
          <View style={styles.acwrIcon}>
            <MaterialCommunityIcons name="heart-pulse" size={20} color="#30D158" />
          </View>
          <View style={styles.acwrTextContainer}>
            <Text style={styles.acwrTitle}>Ratio Charge ACWR (Aigu / Chronique)</Text>
            <Text style={styles.acwrSub}>Synchronisé avec le Pôle Coach ProDay</Text>
          </View>
          <Text style={styles.acwrValue}>1.08</Text>
        </View>

        <View style={styles.acwrBarContainer}>
          <View style={styles.acwrBarTrack}>
            <View style={[styles.acwrBarFill, { width: '54%' }]} />
          </View>
          <View style={styles.acwrLabels}>
            <Text style={styles.acwrRangeLabel}>Sous-charge (0.5)</Text>
            <Text style={[styles.acwrRangeLabel, { color: '#30D158' }]}>Optimal (0.8 - 1.3)</Text>
            <Text style={styles.acwrRangeLabel}>Surcharge (1.5+)</Text>
          </View>
        </View>
      </View>

      {/* Unified Calendar Timeline */}
      <View style={styles.calendarSection}>
        <View style={styles.calendarHeader}>
          <Text style={styles.calendarSectionTitle}>Agenda Équipe & Convocations</Text>
          <Text style={styles.calendarSectionSub}>Synchronisé avec le planning officiel</Text>
        </View>

        <View style={styles.eventsList}>
          {upcomingEvents.map((evt) => (
            <View key={evt.id} style={styles.eventRow}>
              <View
                style={[
                  styles.eventIconCircle,
                  evt.type === 'match'
                    ? { backgroundColor: 'rgba(48, 209, 88, 0.15)' }
                    : evt.type === 'recovery'
                    ? { backgroundColor: 'rgba(168, 85, 247, 0.15)' }
                    : { backgroundColor: 'rgba(10, 132, 255, 0.15)' },
                ]}
              >
                <Ionicons
                  name={evt.type === 'match' ? 'football' : evt.type === 'recovery' ? 'water' : 'barbell'}
                  size={16}
                  color={evt.type === 'match' ? '#30D158' : evt.type === 'recovery' ? '#C084FC' : '#0A84FF'}
                />
              </View>

              <View style={styles.eventInfoCol}>
                <Text style={styles.eventTitle}>{evt.title}</Text>
                <Text style={styles.eventMeta}>
                  {evt.date} · {evt.location}
                </Text>
              </View>

              <View style={styles.eventStatusBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#30D158" />
                <Text style={styles.eventStatusText}>Convoqué</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Interactive Page Guide Modal */}
      <PlayerPageGuideModal
        visible={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        pageTitle="Santé, Forme & Planning"
        pageSubtitle="Protège ton intégrité physique et synchronise-toi avec le staff"
        badgeLabel="GUIDE SANTÉ & PRÉVENTION"
        badgeColor="#30D158"
        introText="Cet écran te permet d'indiquer ton état de fatigue chaque matin en 30 secondes pour que le préparateur physique et le coach adaptent la charge de travail et préviennent les blessures."
        sections={guideSections}
        proTip="Remplis ton check-in avant 11h du matin : le staff s'appuie sur la moyenne du groupe pour calibrer l'intensité des séances d'entraînement !"
        ctaLabel="Compris, je gère !"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0E',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guideIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  guideBtnText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '800',
    color: '#30D158',
  },
  screenSubtitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 12,
    color: '#94A3B8',
  },
  screenTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  riskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  riskLow: {
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  riskModerate: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  riskHigh: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  riskText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '800',
  },
  checkinCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 16,
  },
  checkinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  checkinHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkinTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scoreBadge: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 14,
    fontWeight: '900',
    color: '#30D158',
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  controlLabel: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  controlValue: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141418',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 3,
    gap: 8,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDisplay: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    minWidth: 26,
    textAlign: 'center',
  },
  segmentedButtons: {
    flexDirection: 'row',
    backgroundColor: '#141418',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  segBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segBtnActive: {
    backgroundColor: '#30D158',
  },
  segBtnText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  segBtnTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  validateBtn: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  validateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  validateText: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  acwrCard: {
    backgroundColor: '#141418',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 18,
  },
  acwrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  acwrIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acwrTextContainer: {
    flex: 1,
  },
  acwrTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  acwrSub: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  acwrValue: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 18,
    fontWeight: '900',
    color: '#30D158',
  },
  acwrBarContainer: {
    marginTop: 4,
  },
  acwrBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  acwrBarFill: {
    height: '100%',
    backgroundColor: '#30D158',
    borderRadius: 4,
  },
  acwrLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  acwrRangeLabel: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
  },
  calendarSection: {
    marginBottom: 20,
  },
  calendarHeader: {
    marginBottom: 10,
  },
  calendarSectionTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  calendarSectionSub: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  eventsList: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  eventIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventInfoCol: {
    flex: 1,
  },
  eventTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventMeta: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  eventStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventStatusText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10,
    fontWeight: '800',
    color: '#30D158',
  },
});
