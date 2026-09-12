import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { CoachStandingsTable } from '../../components/coach/CoachStandingsTable';

interface Props {
  onNavigate?: (navId: string) => void;
  onOpenMatch?: (matchId: string) => void;
}

export const CoachHomeScreen: React.FC<Props> = ({ onNavigate, onOpenMatch }) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C5A059" />
      }
    >
      {/* 1. Header: Coach Identity & Team Context */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.crestPlaceholder}>
            <MaterialCommunityIcons name="shield-check" size={24} color="#C5A059" />
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.badgeRow}>
              <View style={styles.fffBadge}>
                <Text style={styles.fffBadgeText}>FFF R1 · Poule B</Text>
              </View>
              <View style={styles.seasonBadge}>
                <Text style={styles.seasonBadgeText}>Saison 2026/2027</Text>
              </View>
            </View>
            <Text style={styles.teamTitle}>FC ProDay Seniors 1</Text>
            <Text style={styles.coachSubtitle}>Entraîneur Principal · Staff Technique</Text>
          </View>
        </View>

        {/* 1-Tap Quick Action Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickPillsRow}>
          <TouchableOpacity
            style={[styles.quickPill, styles.quickPillHighlight]}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('equipe')}
          >
            <Ionicons name="people" size={14} color="#000000" />
            <Text style={styles.quickPillTextHighlight}>Convocations 1-Tap</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickPill}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('match_center')}
          >
            <MaterialCommunityIcons name="whistle" size={14} color="#C5A059" />
            <Text style={styles.quickPillText}>Direct Match</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickPill}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('entrainements')}
          >
            <Ionicons name="calendar-outline" size={14} color="#C5A059" />
            <Text style={styles.quickPillText}>Nouvelle Séance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickPill}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('smart_tactics')}
          >
            <MaterialCommunityIcons name="presentation" size={14} color="#C5A059" />
            <Text style={styles.quickPillText}>Causerie Direct</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 2. Hero Card: Upcoming Match & Kickoff Countdown */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.matchTypeBadge}>
            <MaterialCommunityIcons name="trophy-variant" size={13} color="#0A84FF" />
            <Text style={styles.matchTypeText}>CHAMPIONNAT R1 · J17</Text>
          </View>
          <View style={styles.countdownBadge}>
            <Feather name="clock" size={12} color="#E5E5EA" />
            <Text style={styles.countdownText}>Dimanche · 15:00 (J-2)</Text>
          </View>
        </View>

        <View style={styles.fixtureRow}>
          <View style={styles.fixtureTeam}>
            <View style={[styles.teamAvatar, styles.homeAvatar]}>
              <Text style={styles.teamAvatarText}>FCP</Text>
            </View>
            <Text numberOfLines={1} style={styles.fixtureTeamName}>FC ProDay</Text>
            <Text style={styles.fixtureTeamRole}>1er (38 pts)</Text>
          </View>

          <View style={styles.fixtureVs}>
            <Text style={styles.fixtureVsText}>VS</Text>
            <View style={styles.fixtureStatus}>
              <Text style={styles.fixtureStatusText}>À domicile</Text>
            </View>
          </View>

          <View style={styles.fixtureTeam}>
            <View style={[styles.teamAvatar, styles.awayAvatar]}>
              <Text style={styles.teamAvatarText}>RCF</Text>
            </View>
            <Text numberOfLines={1} style={styles.fixtureTeamName}>RC France</Text>
            <Text style={styles.fixtureTeamRole}>2e (35 pts)</Text>
          </View>
        </View>

        {/* Pitch, Weather & RSVP Summary Bar */}
        <View style={styles.matchMetaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color="#8B8B9A" />
            <Text style={styles.metaText}>Stade d’Honneur</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="cloud-outline" size={14} color="#8B8B9A" />
            <Text style={styles.metaText}>14°C · Pluie 20%</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="checkmark-circle" size={14} color="#30D158" />
            <Text style={styles.metaText}>16/16 Validés</Text>
          </View>
        </View>

        {/* Action Buttons for Match */}
        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.heroBtnPrimary}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('match_center')}
          >
            <MaterialCommunityIcons name="clipboard-play-outline" size={16} color="#FFFFFF" />
            <Text style={styles.heroBtnPrimaryText}>Feuille de Match & Direct</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.heroBtnSecondary}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('coach_ia')}
          >
            <MaterialCommunityIcons name="brain" size={16} color="#C5A059" />
            <Text style={styles.heroBtnSecondaryText}>Twin Match Lab</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. AI Executive Tactical Briefing */}
      <View style={styles.aiBriefCard}>
        <View style={styles.aiBriefHeader}>
          <View style={styles.aiBriefTitleGroup}>
            <MaterialCommunityIcons name="star-four-points" size={18} color="#C5A059" />
            <Text style={styles.aiBriefTitle}>Brief Tactique Prédictif IA</Text>
          </View>
          <View style={styles.aiConfidenceBadge}>
            <Text style={styles.aiConfidenceText}>Indice Fiabilité 94%</Text>
          </View>
        </View>

        <Text style={styles.aiBriefBody}>
          RC France évolue en <Text style={styles.aiHighlight}>3-5-2 avec pistons très hauts</Text>. 
          Leur point de rupture identifié réside dans la transition défensive sur leurs couloirs (dos des pistons).
          Recommandation : Maintenir un <Text style={styles.aiHighlight}>4-3-3 étiré</Text> avec attaques verticales rapides dès la récupération.
        </Text>

        <View style={styles.aiMetricsRow}>
          <View style={styles.aiMetricBox}>
            <Text style={styles.aiMetricLabel}>Probabilité Victoire</Text>
            <Text style={[styles.aiMetricVal, { color: '#30D158' }]}>58 %</Text>
          </View>
          <View style={styles.aiMetricBox}>
            <Text style={styles.aiMetricLabel}>xG Estimé</Text>
            <Text style={styles.aiMetricVal}>2.1 vs 1.2</Text>
          </View>
          <View style={styles.aiMetricBox}>
            <Text style={styles.aiMetricLabel}>Efficacité Pressing</Text>
            <Text style={[styles.aiMetricVal, { color: '#0A84FF' }]}>76 %</Text>
          </View>
        </View>
      </View>

      {/* 4. Wellness & Charge Triage Alerts (Medical / Load Monitoring) */}
      <View style={styles.triageCard}>
        <View style={styles.triageHeader}>
          <View style={styles.triageTitleGroup}>
            <Ionicons name="pulse" size={18} color="#FF9F0A" />
            <Text style={styles.triageTitle}>Triage Forme & Alertes Charge GPS</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate?.('forme')}>
            <Text style={styles.seeAllLink}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.triageAlertRow}>
          <View style={styles.triageAlertIconWrap}>
            <Feather name="alert-triangle" size={16} color="#FF453A" />
          </View>
          <View style={styles.triageAlertContent}>
            <Text style={styles.triageAlertName}>Lucas M. (Ailier D.) · Surcharge Aiguë</Text>
            <Text style={styles.triageAlertDesc}>ACWR à 1.62 (&gt; 1.5). Risque musculaire ischio-jambiers élevé. Séance allégée préconisée.</Text>
          </View>
          <TouchableOpacity
            style={styles.autoAdjustPill}
            onPress={() => onNavigate?.('forme')}
          >
            <Text style={styles.autoAdjustText}>Auto-Ajuster</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.triageAlertRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.triageAlertIconWrap, { backgroundColor: 'rgba(255, 159, 10, 0.15)' }]}>
            <MaterialCommunityIcons name="dumbbell" size={16} color="#FF9F0A" />
          </View>
          <View style={styles.triageAlertContent}>
            <Text style={styles.triageAlertName}>Thomas D. (Milieu Déf.) · Douleur Adducteur</Text>
            <Text style={styles.triageAlertDesc}>Check-in matinal : Courbatures 4/5. Décharge proprioceptive recommandée.</Text>
          </View>
          <TouchableOpacity
            style={styles.autoAdjustPill}
            onPress={() => onNavigate?.('forme')}
          >
            <Text style={styles.autoAdjustText}>Adapter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. Official Live Championship Standings */}
      <CoachStandingsTable
        compact={true}
        onSelectTeam={() => onNavigate?.('equipe')}
      />

      {/* 6. Module Shortcuts (8 Pro Tools Grid) */}
      <Text style={styles.sectionHeader}>Outils Pro & Modules Tactiques</Text>
      <View style={styles.toolsGrid}>
        <TouchableOpacity
          style={styles.toolCard}
          activeOpacity={0.8}
          onPress={() => onNavigate?.('smart_tactics')}
        >
          <View style={[styles.toolIcon, { backgroundColor: 'rgba(197, 160, 89, 0.15)' }]}>
            <MaterialCommunityIcons name="chess-queen" size={22} color="#C5A059" />
          </View>
          <Text style={styles.toolTitle}>Tableau Tactique 3D</Text>
          <Text style={styles.toolDesc}>Ardoise vectorielle & CPA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolCard}
          activeOpacity={0.8}
          onPress={() => onNavigate?.('coach_ia')}
        >
          <View style={[styles.toolIcon, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
            <MaterialCommunityIcons name="robot" size={22} color="#0A84FF" />
          </View>
          <Text style={styles.toolTitle}>Twin Match Lab</Text>
          <Text style={styles.toolDesc}>Simulation & vulnérabilités</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolCard}
          activeOpacity={0.8}
          onPress={() => onNavigate?.('entrainements')}
        >
          <View style={[styles.toolIcon, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
            <MaterialCommunityIcons name="soccer-field" size={22} color="#30D158" />
          </View>
          <Text style={styles.toolTitle}>Séances & Schémas</Text>
          <Text style={styles.toolDesc}>Ateliers visuels & IA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolCard}
          activeOpacity={0.8}
          onPress={() => onNavigate?.('forme')}
        >
          <View style={[styles.toolIcon, { backgroundColor: 'rgba(255, 159, 10, 0.15)' }]}>
            <MaterialCommunityIcons name="heart-pulse" size={22} color="#FF9F0A" />
          </View>
          <Text style={styles.toolTitle}>Charge GPS & ACWR</Text>
          <Text style={styles.toolDesc}>Suivi PlayerData & santé</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolCard}
          activeOpacity={0.8}
          onPress={() => onNavigate?.('mes_videos')}
        >
          <View style={[styles.toolIcon, { backgroundColor: 'rgba(191, 90, 242, 0.15)' }]}>
            <Ionicons name="videocam" size={22} color="#BF5AF2" />
          </View>
          <Text style={styles.toolTitle}>Hub Vidéo & Highlights</Text>
          <Text style={styles.toolDesc}>Veo, clipping IA & causerie</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolCard}
          activeOpacity={0.8}
          onPress={() => onNavigate?.('joueurs')}
        >
          <View style={[styles.toolIcon, { backgroundColor: 'rgba(100, 210, 255, 0.15)' }]}>
            <MaterialCommunityIcons name="account-search-outline" size={22} color="#64D2FF" />
          </View>
          <Text style={styles.toolTitle}>Scouting & Bilan 360°</Text>
          <Text style={styles.toolDesc}>Rapports & marketplace</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    gap: 12,
  },
  crestPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1C1C22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
  },
  headerInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  fffBadge: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fffBadgeText: {
    color: '#0A84FF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  seasonBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  seasonBadgeText: {
    color: '#8B8B9A',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  teamTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  coachSubtitle: {
    color: '#8B8B9A',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: '-apple-system',
  },
  quickPillsRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1C1C22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  quickPillHighlight: {
    backgroundColor: '#C5A059',
    borderColor: '#C5A059',
  },
  quickPillText: {
    color: '#E5E5EA',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  quickPillTextHighlight: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  heroCard: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  matchTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchTypeText: {
    color: '#0A84FF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  countdownText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '500',
    fontFamily: '-apple-system',
  },
  fixtureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  fixtureTeam: {
    alignItems: 'center',
    width: 100,
  },
  teamAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  homeAvatar: {
    backgroundColor: '#1C2E22',
    borderWidth: 2,
    borderColor: '#30D158',
  },
  awayAvatar: {
    backgroundColor: '#1B2433',
    borderWidth: 2,
    borderColor: '#0A84FF',
  },
  teamAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  fixtureTeamName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
    textAlign: 'center',
  },
  fixtureTeamRole: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '500',
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  fixtureVs: {
    alignItems: 'center',
  },
  fixtureVsText: {
    color: '#8B8B9A',
    fontSize: 14,
    fontWeight: '800',
  },
  fixtureStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  fixtureStatusText: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '600',
  },
  matchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C22',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginVertical: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 10,
  },
  metaText: {
    color: '#E5E5EA',
    fontSize: 11,
    fontWeight: '500',
    fontFamily: '-apple-system',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  heroBtnPrimary: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0A84FF',
    paddingVertical: 12,
    borderRadius: 12,
  },
  heroBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  heroBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1C1C22',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  heroBtnSecondaryText: {
    color: '#C5A059',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  aiBriefCard: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.25)',
    padding: 16,
    marginBottom: 14,
  },
  aiBriefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  aiBriefTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiBriefTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  aiConfidenceBadge: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiConfidenceText: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '700',
  },
  aiBriefBody: {
    color: '#D1D1D6',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: '-apple-system',
  },
  aiHighlight: {
    color: '#C5A059',
    fontWeight: '700',
  },
  aiMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  aiMetricBox: {
    flex: 1,
    backgroundColor: '#1C1C22',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  aiMetricLabel: {
    color: '#8B8B9A',
    fontSize: 10,
    fontWeight: '500',
    fontFamily: '-apple-system',
  },
  aiMetricVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
    fontFamily: '-apple-system',
  },
  triageCard: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 14,
  },
  triageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  triageTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triageTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  seeAllLink: {
    color: '#0A84FF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  triageAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  triageAlertIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triageAlertContent: {
    flex: 1,
  },
  triageAlertName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  triageAlertDesc: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  autoAdjustPill: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  autoAdjustText: {
    color: '#0A84FF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  sectionHeader: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginVertical: 12,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolCard: {
    width: '48%',
    backgroundColor: '#141418',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toolTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  toolDesc: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginTop: 3,
  },
});
