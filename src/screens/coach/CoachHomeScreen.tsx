import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { CoachStandingsTable } from '../../components/coach/CoachStandingsTable';

interface Props {
  onNavigate?: (navId: string) => void;
  onOpenMatch?: (matchId: string) => void;
}

export const CoachHomeScreen: React.FC<Props> = ({ onNavigate }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [showAiInsight, setShowAiInsight] = useState(false);
  const [showStandings, setShowStandings] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284C7" />
      }
    >
      {/* 1. Header: Apple SF Pro Identity */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.clubBadge}>
            <MaterialCommunityIcons name="shield-crown" size={22} color="#C5A059" />
          </View>
          <View>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryTag}>FFF R1 · POULE B</Text>
              <Text style={styles.seasonTag}>SAISON 2026/2027</Text>
            </View>
            <Text style={styles.teamTitle}>FC ProDay Seniors 1</Text>
            <Text style={styles.coachSubtitle}>Entraîneur Principal · Staff Technique</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() => onNavigate?.('com_staff')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="account-group-outline" size={18} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* 2. Page 6 Specification: Bandeau d'alertes en tête (1 tap pour agir sur blessure/fatigue) */}
      <View style={styles.alertBannerCard}>
        <View style={styles.alertBannerTop}>
          <View style={styles.alertBannerBadge}>
            <MaterialCommunityIcons name="alert-decagram" size={15} color="#EF4444" />
            <Text style={styles.alertBannerBadgeText}>VIGILANCE CHARGE & BLESSURES</Text>
          </View>
          <TouchableOpacity
            style={styles.alertBannerActBtn}
            activeOpacity={0.85}
            onPress={() => onNavigate?.('forme')}
          >
            <Text style={styles.alertBannerActBtnText}>Agir sur l’effectif (1 tap)</Text>
            <Feather name="arrow-right" size={12} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.alertBannerHeadline}>
          2 alertes actives nécessitant un ajustement immédiat :
        </Text>

        <View style={styles.alertItemsList}>
          <TouchableOpacity
            style={styles.alertItemRow}
            activeOpacity={0.85}
            onPress={() => onNavigate?.('forme')}
          >
            <View style={[styles.alertSeverityDot, { backgroundColor: '#EF4444' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertPlayerName}>M. Ruiz (#8 · Milieu)</Text>
              <Text style={styles.alertPlayerDetail}>
                Alerte ischios · Repos recommandé & décharge préventive
              </Text>
            </View>
            <View style={[styles.alertPillAction, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.alertPillActionText, { color: '#EF4444' }]}>Adapter</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.alertItemRow}
            activeOpacity={0.85}
            onPress={() => onNavigate?.('forme')}
          >
            <View style={[styles.alertSeverityDot, { backgroundColor: '#F59E0B' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertPlayerName}>T. Doué (#6 · Milieu Défensif)</Text>
              <Text style={styles.alertPlayerDetail}>
                Indice de fatigue 85% · Adapter la séance à RPE 5 max
              </Text>
            </View>
            <View style={[styles.alertPillAction, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.alertPillActionText, { color: '#D97706' }]}>Adapter</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Page 6 Specification: Prochain Événement */}
      <View style={styles.heroCard}>
        {/* Top Tag & Countdown */}
        <View style={styles.heroTopRow}>
          <View style={styles.matchBadge}>
            <MaterialCommunityIcons name="trophy-variant" size={12} color="#0284C7" />
            <Text style={styles.matchBadgeText}>CHAMPIONNAT R1 · J17</Text>
          </View>
          <View style={styles.officialFeedTag}>
            <View style={styles.officialFeedDot} />
            <Text style={styles.officialFeedTagText}>FLUX FFF DIRECT</Text>
          </View>
          <View style={styles.countdownBadge}>
            <Feather name="clock" size={12} color="#475569" />
            <Text style={styles.countdownText}>Dimanche 15:00</Text>
          </View>
        </View>

        {/* Fixture Teams Presentation */}
        <View style={styles.fixtureRow}>
          <View style={styles.fixtureTeam}>
            <View style={[styles.teamAvatar, styles.homeAvatar]}>
              <Text style={styles.teamAvatarText}>FCP</Text>
            </View>
            <Text numberOfLines={1} style={styles.fixtureTeamName}>FC ProDay</Text>
            <Text style={styles.fixtureTeamRank}>1er · 38 pts</Text>
          </View>

          <View style={styles.fixtureCenter}>
            <Text style={styles.fixtureVs}>VS</Text>
            <View style={styles.homeStatusPill}>
              <Text style={styles.homeStatusText}>À domicile</Text>
            </View>
          </View>

          <View style={styles.fixtureTeam}>
            <View style={[styles.teamAvatar, styles.awayAvatar]}>
              <Text style={styles.teamAvatarText}>RCF</Text>
            </View>
            <Text numberOfLines={1} style={styles.fixtureTeamName}>RC France</Text>
            <Text style={styles.fixtureTeamRank}>2e · 35 pts</Text>
          </View>
        </View>

        {/* Weather & Pitch Condition Bar */}
        <View style={styles.weatherPitchRow}>
          <View style={styles.weatherItem}>
            <MaterialCommunityIcons name="weather-sunny" size={14} color="#D97706" />
            <Text style={styles.weatherText}>18°C · Ensoleillé</Text>
          </View>
          <View style={styles.barDivider} />
          <View style={styles.weatherItem}>
            <MaterialCommunityIcons name="grass" size={14} color="#16A34A" />
            <Text style={styles.weatherText}>Pelouse Synthétique Impeccable</Text>
          </View>
        </View>

        {/* Location & Attendance Summary */}
        <View style={styles.attendanceBar}>
          <View style={styles.attendanceItem}>
            <Ionicons name="location-outline" size={13} color="#64748B" />
            <Text style={styles.attendanceText}>Stade d’Honneur</Text>
          </View>
          <View style={styles.barDivider} />
          <View style={styles.attendanceItem}>
            <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
            <Text style={[styles.attendanceText, { color: '#16A34A' }]}>16 Confirmés</Text>
          </View>
          <View style={styles.barDivider} />
          <View style={styles.attendanceItem}>
            <Ionicons name="time-outline" size={13} color="#D97706" />
            <Text style={[styles.attendanceText, { color: '#D97706' }]}>2 En attente</Text>
          </View>
        </View>

        {/* Official League Ranking Matchup Snippet */}
        <View style={styles.rankingSnippetCard}>
          <View style={styles.rankingSnippetLeft}>
            <MaterialCommunityIcons name="shield-star-outline" size={16} color="#C5A059" />
            <View style={{ flex: 1 }}>
              <Text style={styles.rankingSnippetTitle}>Choc au Sommet · Régional 1</Text>
              <Text style={styles.rankingSnippetDesc}>
                1er FC ProDay (38 pts) vs 2e RC France (35 pts) · Écart : +3 pts
              </Text>
            </View>
          </View>
          <View style={styles.rankingBadgeProDay}>
            <Text style={styles.rankingBadgeProDayText}>LEADER</Text>
          </View>
        </View>

        {/* Single Primary Action Button */}
        <TouchableOpacity
          style={styles.primaryCtaBtn}
          activeOpacity={0.88}
          onPress={() => onNavigate?.('equipe')}
        >
          <MaterialCommunityIcons name="soccer-field" size={18} color="#FFFFFF" />
          <Text style={styles.primaryCtaText}>Ajuster la Composition & Tactique</Text>
          <Feather name="arrow-right" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 4. Page 6 Specification: Effectif Résumé */}
      <View style={styles.squadSummaryCard}>
        <View style={styles.squadSummaryHeader}>
          <View style={styles.squadSummaryTitleRow}>
            <MaterialCommunityIcons name="account-group" size={18} color="#0F172A" />
            <Text style={styles.squadSummaryTitle}>Effectif Résumé & Disponibilité</Text>
          </View>
          <TouchableOpacity
            style={styles.squadManageBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('equipe')}
          >
            <Text style={styles.squadManageBtnText}>Gérer groupe</Text>
            <Feather name="chevron-right" size={14} color="#0284C7" />
          </TouchableOpacity>
        </View>

        {/* Availability Ratio Progress */}
        <View style={styles.availabilityRow}>
          <View style={styles.availabilityTrack}>
            <View style={[styles.availabilityFill, { width: '82%' }]} />
          </View>
          <Text style={styles.availabilityPercent}>82% disponible</Text>
        </View>

        {/* Metric Counters Grid */}
        <View style={styles.squadMetricsGrid}>
          <View style={styles.squadMetricItem}>
            <Text style={styles.squadMetricVal}>22</Text>
            <Text style={styles.squadMetricLabel}>Total</Text>
          </View>
          <View style={styles.squadMetricDivider} />
          <View style={styles.squadMetricItem}>
            <Text style={[styles.squadMetricVal, { color: '#16A34A' }]}>18</Text>
            <Text style={styles.squadMetricLabel}>Opérationnels</Text>
          </View>
          <View style={styles.squadMetricDivider} />
          <View style={styles.squadMetricItem}>
            <Text style={[styles.squadMetricVal, { color: '#F59E0B' }]}>2</Text>
            <Text style={styles.squadMetricLabel}>En attente</Text>
          </View>
          <View style={styles.squadMetricDivider} />
          <View style={styles.squadMetricItem}>
            <Text style={[styles.squadMetricVal, { color: '#EF4444' }]}>2</Text>
            <Text style={styles.squadMetricLabel}>Blessés / Repos</Text>
          </View>
        </View>

        {/* Direct Action Chips */}
        <View style={styles.squadActionChipsRow}>
          <TouchableOpacity
            style={styles.squadActionChip}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('equipe')}
          >
            <MaterialCommunityIcons name="clipboard-check-outline" size={14} color="#0284C7" />
            <Text style={styles.squadActionChipText}>Convocations (1 tap)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.squadActionChip}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('forme')}
          >
            <MaterialCommunityIcons name="heart-pulse" size={14} color="#EF4444" />
            <Text style={styles.squadActionChipText}>Suivi Charge & Forme</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. Discreet & Optional AI Tactical Assistant */}
      <View style={styles.aiDiscreetCard}>
        <TouchableOpacity
          style={styles.aiDiscreetHeader}
          activeOpacity={0.8}
          onPress={() => setShowAiInsight((prev) => !prev)}
        >
          <View style={styles.aiIconBadge}>
            <MaterialCommunityIcons name="star-four-points" size={14} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiPromptTitle}>Conseil Tactique IA (Optionnel)</Text>
            <Text style={styles.aiPromptPreview}>
              Système 4-3-3 étiré recommandé face au 3-5-2 de RC France
            </Text>
          </View>
          <Feather
            name={showAiInsight ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#64748B"
          />
        </TouchableOpacity>

        {showAiInsight && (
          <View style={styles.aiExpandedTray}>
            <Text style={styles.aiExpandedBody}>
              L’analyse prédictive identifie une vulnérabilité adverse dans le dos des pistons lors des transitions défensives. Recommandation : attaques verticales directes sur les couloirs.
            </Text>
            <View style={styles.aiStatsRow}>
              <View style={styles.aiStatPill}>
                <Text style={styles.aiStatLabel}>Probabilité Victoire</Text>
                <Text style={[styles.aiStatVal, { color: '#16A34A' }]}>58%</Text>
              </View>
              <View style={styles.aiStatPill}>
                <Text style={styles.aiStatLabel}>xG Prédit</Text>
                <Text style={styles.aiStatVal}>2.1 vs 1.2</Text>
              </View>
              <View style={styles.aiStatPill}>
                <Text style={styles.aiStatLabel}>Contrôle Manuel</Text>
                <Text style={[styles.aiStatVal, { color: '#0284C7' }]}>100% Libre</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* 6. Minimalist Quick Access Tiles (Design v4) */}
      <View style={styles.tilesGrid}>
        {/* Tile 1: Tableau Noir Multi-Format */}
        <TouchableOpacity
          style={styles.tileCard}
          activeOpacity={0.85}
          onPress={() => onNavigate?.('smart_tactics')}
        >
          <View style={[styles.tileIconWrap, { backgroundColor: '#E0F2FE' }]}>
            <MaterialCommunityIcons name="draw-pen" size={20} color="#0284C7" />
          </View>
          <Text style={styles.tileTitle}>Tableau Noir</Text>
          <Text style={styles.tileDesc}>Foot à 11, à 8, Futsal 5v5 & Animation</Text>
        </TouchableOpacity>

        {/* Tile 2: Séances & Schémas */}
        <TouchableOpacity
          style={styles.tileCard}
          activeOpacity={0.85}
          onPress={() => onNavigate?.('entrainements')}
        >
          <View style={[styles.tileIconWrap, { backgroundColor: '#DCFCE7' }]}>
            <MaterialCommunityIcons name="whistle-outline" size={20} color="#16A34A" />
          </View>
          <Text style={styles.tileTitle}>Entraînements</Text>
          <Text style={styles.tileDesc}>Thématiques & Ateliers interactifs</Text>
        </TouchableOpacity>

        {/* Tile 3: Direct Match Center & Scouting */}
        <TouchableOpacity
          style={styles.tileCard}
          activeOpacity={0.85}
          onPress={() => onNavigate?.('match_center')}
        >
          <View style={[styles.tileIconWrap, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="microphone" size={20} color="#D97706" />
          </View>
          <Text style={styles.tileTitle}>Scouting Vocal</Text>
          <Text style={styles.tileDesc}>Notes terrain, transcription & dictée</Text>
        </TouchableOpacity>
      </View>

      {/* 7. Live Standings Collapsible Section (Design v4) */}
      <View style={styles.standingsSection}>
        <TouchableOpacity
          style={styles.standingsHeader}
          activeOpacity={0.8}
          onPress={() => setShowStandings((prev) => !prev)}
        >
          <View style={styles.standingsHeaderLeft}>
            <MaterialCommunityIcons name="format-list-numbered" size={16} color="#C5A059" />
            <Text style={styles.standingsTitle}>Classement Officiel FFF R1</Text>
          </View>
          <Feather
            name={showStandings ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#64748B"
          />
        </TouchableOpacity>

        {showStandings && (
          <View style={styles.standingsContainer}>
            <CoachStandingsTable compact={false} lightMode={true} />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  categoryTag: {
    color: '#B45309',
    fontSize: 9.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
    letterSpacing: 0.5,
  },
  seasonTag: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  teamTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: '-apple-system',
    letterSpacing: -0.3,
  },
  coachSubtitle: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginTop: 1,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Page 6 : Bandeau d'alertes en tête */
  alertBannerCard: {
    backgroundColor: '#FFF1F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECDD3',
    padding: 14,
    marginBottom: 14,
  },
  alertBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  alertBannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  alertBannerBadgeText: {
    color: '#E11D48',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: '-apple-system',
    letterSpacing: 0.5,
  },
  alertBannerActBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E11D48',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  alertBannerActBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  alertBannerHeadline: {
    color: '#881337',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: '-apple-system',
    marginBottom: 8,
  },
  alertItemsList: {
    gap: 6,
  },
  alertItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    gap: 8,
  },
  alertSeverityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertPlayerName: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  alertPlayerDetail: {
    color: '#64748B',
    fontSize: 10.5,
    fontFamily: '-apple-system',
    marginTop: 1,
  },
  alertPillAction: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  alertPillActionText: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },

  /* Hero Card: Prochain Événement */
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  matchBadgeText: {
    color: '#0284C7',
    fontSize: 9.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
    letterSpacing: 0.5,
  },
  officialFeedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  officialFeedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
  },
  officialFeedTagText: {
    color: '#16A34A',
    fontSize: 8.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
    letterSpacing: 0.4,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countdownText: {
    color: '#334155',
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  fixtureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 12,
  },
  fixtureTeam: {
    flex: 1,
    alignItems: 'center',
  },
  teamAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  homeAvatar: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  awayAvatar: {
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  teamAvatarText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    fontFamily: '-apple-system',
  },
  fixtureTeamName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  fixtureTeamRank: {
    color: '#64748B',
    fontSize: 10.5,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  fixtureCenter: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  fixtureVs: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: '-apple-system',
    marginBottom: 4,
  },
  homeStatusPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  homeStatusText: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  weatherPitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 8,
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  weatherText: {
    color: '#475569',
    fontSize: 10.5,
    fontWeight: '500',
    fontFamily: '-apple-system',
  },
  barDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
  },
  attendanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  attendanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attendanceText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
    color: '#64748B',
  },
  rankingSnippetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  rankingSnippetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  rankingSnippetTitle: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  rankingSnippetDesc: {
    color: '#B45309',
    fontSize: 9.5,
    fontFamily: '-apple-system',
    marginTop: 1,
  },
  rankingBadgeProDay: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rankingBadgeProDayText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 13,
    gap: 8,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },

  /* Page 6 : Effectif Résumé */
  squadSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
  },
  squadSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  squadSummaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  squadSummaryTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  squadManageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  squadManageBtnText: {
    color: '#0284C7',
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  availabilityTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  availabilityFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 3,
  },
  availabilityPercent: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  squadMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  squadMetricItem: {
    alignItems: 'center',
  },
  squadMetricVal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: '-apple-system',
  },
  squadMetricLabel: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  squadMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  squadActionChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  squadActionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
  },
  squadActionChipText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },

  /* AI Assistant Card */
  aiDiscreetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  aiDiscreetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiPromptTitle: {
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  aiPromptPreview: {
    color: '#64748B',
    fontSize: 10.5,
    fontFamily: '-apple-system',
    marginTop: 1,
  },
  aiExpandedTray: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  aiExpandedBody: {
    color: '#334155',
    fontSize: 11.5,
    lineHeight: 17,
    fontFamily: '-apple-system',
    marginBottom: 10,
  },
  aiStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  aiStatPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  aiStatLabel: {
    color: '#64748B',
    fontSize: 9.5,
    fontFamily: '-apple-system',
    marginBottom: 2,
  },
  aiStatVal: {
    color: '#0F172A',
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },

  /* Tiles Grid */
  tilesGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  tileCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  tileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tileTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginBottom: 2,
  },
  tileDesc: {
    color: '#64748B',
    fontSize: 9.5,
    lineHeight: 13,
    fontFamily: '-apple-system',
  },

  /* Standings Section */
  standingsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  standingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  standingsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  standingsTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  standingsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});
