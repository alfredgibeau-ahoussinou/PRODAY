import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { ProDayText } from '../../components/ui/ProDayText';
import { ProDayGlyph } from '../../components/ui/prodayGlyphs';
import { PlayerCardReveal } from '../../components/joueur/PlayerCardReveal';
import { userToProDayCard } from '../../utils/prodayFutCard';
import { JoueurAttributeRadar } from './JoueurAttributeRadar';
import { ELITE_COLORS, ELITE_RADIUS, ELITE_SPACING } from '../../theme/prodayEliteTheme';
import { teamEventsService } from '../../services/teamEvents.service';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { User } from '../../models/User';

interface Props {
  profile: User;
  onOpenCoachAi?: () => void;
  onOpenMatchs?: () => void;
  onOpenCarpool?: (matchId?: string) => void;
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');

/**
 * Pôle Joueur ProDay Élite
 * 100% en Français · Design épuré inspiré des athlètes professionnels
 * Navigation fluide & Carte ProDay intacte
 */
export const ElitePlayerCockpitScreen: React.FC<Props> = ({
  profile,
  onOpenCoachAi,
  onOpenMatchs,
  onOpenCarpool,
}) => {
  const { profile: authProfile } = useAuth();
  const nav = useTabNavigationActions();
  const [activeTab, setActiveTab] = useState<'carte' | 'stats' | 'parcours'>('carte');
  const [, setRsvpLoading] = useState(false);
  const [userRsvp, setUserRsvp] = useState<'present' | 'absent' | null>(null);

  const clubId = profile.profile?.club_id;
  const { items: calendarItems } = useSeasonCalendar(profile.uid, clubId);

  // Détection du prochain match réel ou compte démo
  const nextMatch = useMemo(() => {
    const isDemo = profile.email?.includes('demo') || profile.display_name?.includes('Demo');
    
    // Si compte réel avec événements programmés
    const realUpcoming = calendarItems.find(
      (item) => item.kind === 'friendly_match' || item.kind === 'competition_fixture' || item.kind === 'team_event'
    );

    if (realUpcoming) {
      return {
        id: realUpcoming.id,
        teamEventId: realUpcoming.team_event_id,
        title: realUpcoming.title || 'Match de Championnat',
        opponent: realUpcoming.subtitle || 'Adversaire officiel',
        location: realUpcoming.city ? `Stade (${realUpcoming.city})` : 'Terrain d’honneur',
        dateStr: realUpcoming.starts_at ? new Date(realUpcoming.starts_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Ce week-end',
        timeStr: realUpcoming.starts_at ? new Date(realUpcoming.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '15:00',
        isReal: true,
      };
    }

    // Si compte démo : données riches
    if (isDemo) {
      return {
        id: 'demo-match-1',
        teamEventId: undefined,
        title: 'Régional 3 · Journée 14',
        opponent: 'US Créteil',
        location: 'Stade Municipal (Terrain Honneur)',
        dateStr: 'Dimanche 15 mars',
        timeStr: '15:00',
        isReal: false,
      };
    }

    // Vrai compte sans match encore programmé
    return null;
  }, [calendarItems, profile]);

  // Carte ProDay officielle (design intact bouclier ProDay)
  const isDemo = profile.email?.includes('demo') || profile.display_name?.includes('Demo');
  const cardData = useMemo(() => {
    const base = userToProDayCard(profile);
    if (isDemo) {
      return {
        ...base,
        matches: 18,
        goals: 10,
        assists: 5,
        overall: 89,
        formPct: 87,
        clubName: profile.profile?.club_id || 'FC ProDay',
        primaryPosition: profile.profile?.position || 'MC',
      };
    }
    return {
      ...base,
      clubName: profile.profile?.club_id || 'FC ProDay',
    };
  }, [profile, isDemo]);

  // Gestion réponse convocation
  const handleRsvp = async (status: 'present' | 'absent') => {
    setUserRsvp(status);
    prodayHaptics.press();
    if (!nextMatch?.isReal || !nextMatch.teamEventId || !authProfile?.uid) return;

    try {
      setRsvpLoading(true);
      await teamEventsService.updateRsvp(nextMatch.teamEventId, authProfile.uid, status === 'present' ? 'yes' : 'no');
    } catch {
      // Tolérant mode hors-ligne
    } finally {
      setRsvpLoading(false);
    }
  };

  // Ouverture Waze / Maps
  const handleOpenGps = () => {
    const query = encodeURIComponent(nextMatch?.location || 'Stade de football');
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    void Linking.openURL(url);
  };

  const isDesktop = WINDOW_WIDTH >= 900;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. EN-TÊTE JOUEUR & CONSEILLER IA */}
      <View style={styles.headerRow}>
        <View style={styles.playerInfo}>
          <ProDayText style={styles.kicker}>
            {profile.profile?.club_id ? 'JOUEUR DU CLUB' : 'PROFIL JOUEUR PRODAY'}
          </ProDayText>
          <ProDayText style={styles.playerName}>
            {profile.display_name?.toUpperCase() || 'JOUEUR'}
          </ProDayText>
          <View style={styles.subInfoRow}>
            <View style={styles.teamPill}>
              <ProDayGlyph name="pitch" size={14} color={ELITE_COLORS.pitchGreen} />
              <ProDayText style={styles.teamText}>
                {profile.profile?.position || 'Attaquant'} · {profile.profile?.age ? `${profile.profile.age} ans` : 'Sénior'}
              </ProDayText>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => {
            prodayHaptics.press();
            if (onOpenCoachAi) onOpenCoachAi();
            else nav.openDashboard('train_coach');
          }}
          activeOpacity={0.8}
        >
          <ProDayGlyph name="ai-spark" size={18} />
          <ProDayText style={styles.aiButtonText}>Conseiller IA</ProDayText>
        </TouchableOpacity>
      </View>

      {/* 2. LE BLOC PROCHAIN MATCH & CONVOCATION (Façon SportEasy Pro) */}
      {nextMatch ? (
        <View style={styles.matchCard}>
          <View style={styles.matchCardTop}>
            <View style={styles.matchBadge}>
              <ProDayGlyph name="calendar" size={13} color={ELITE_COLORS.pitchGreen} />
              <ProDayText style={styles.matchBadgeText}>PROCHAIN MATCH</ProDayText>
            </View>
            <ProDayText style={styles.matchDateText}>
              {nextMatch.dateStr} à {nextMatch.timeStr}
            </ProDayText>
          </View>

          <View style={styles.matchTeamsRow}>
            <View style={styles.teamCol}>
              <ProDayText style={styles.teamNameMain}>Mon Équipe</ProDayText>
              <ProDayText style={styles.teamSubRole}>Domicile</ProDayText>
            </View>

            <View style={styles.vsCircle}>
              <ProDayText style={styles.vsText}>VS</ProDayText>
            </View>

            <View style={styles.teamCol}>
              <ProDayText style={styles.teamNameMain}>{nextMatch.opponent}</ProDayText>
              <ProDayText style={styles.teamSubRole}>Extérieur</ProDayText>
            </View>
          </View>

          <View style={styles.locationRow}>
            <ProDayGlyph name="location-pin" size={14} color={ELITE_COLORS.titanium} />
            <ProDayText style={styles.locationText} numberOfLines={1}>
              {nextMatch.location}
            </ProDayText>
          </View>

          {/* Boutons d'action convocation immédiate */}
          <View style={styles.rsvpRow}>
            <TouchableOpacity
              style={[
                styles.rsvpBtn,
                styles.rsvpBtnYes,
                userRsvp === 'present' && styles.rsvpBtnSelectedYes,
              ]}
              onPress={() => handleRsvp('present')}
              activeOpacity={0.8}
            >
              <ProDayGlyph
                name="check-presence"
                size={18}
                secondaryColor={userRsvp === 'present' ? '#000000' : ELITE_COLORS.pitchGreen}
              />
              <ProDayText
                style={[
                  styles.rsvpBtnText,
                  styles.rsvpTextYes,
                  userRsvp === 'present' && styles.rsvpTextActiveBlack,
                ]}
              >
                {userRsvp === 'present' ? 'Présence confirmée' : 'Je serai là'}
              </ProDayText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.rsvpBtn,
                styles.rsvpBtnNo,
                userRsvp === 'absent' && styles.rsvpBtnSelectedNo,
              ]}
              onPress={() => handleRsvp('absent')}
              activeOpacity={0.8}
            >
              <ProDayGlyph name="cross-absence" size={18} color={ELITE_COLORS.titanium} />
              <ProDayText
                style={[
                  styles.rsvpBtnText,
                  styles.rsvpTextNo,
                  userRsvp === 'absent' && styles.rsvpTextActiveNo,
                ]}
              >
                {userRsvp === 'absent' ? 'Noté absent' : 'Absent'}
              </ProDayText>
            </TouchableOpacity>
          </View>

          {/* Raccourcis utiles GPS & Covoiturage */}
          <View style={styles.quickLinksRow}>
            <TouchableOpacity style={styles.quickLink} onPress={handleOpenGps}>
              <ProDayGlyph name="location-pin" size={14} color={ELITE_COLORS.pitchGreen} />
              <ProDayText style={styles.quickLinkText}>Itinéraire GPS</ProDayText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => {
                prodayHaptics.press();
                if (onOpenCarpool) onOpenCarpool(nextMatch.id);
                else nav.openCarpool();
              }}
            >
              <ProDayGlyph name="carpool" size={14} color={ELITE_COLORS.goldMaster} />
              <ProDayText style={styles.quickLinkText}>Covoiturage</ProDayText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => {
                prodayHaptics.press();
                if (onOpenMatchs) onOpenMatchs();
                else nav.openMatchs();
              }}
            >
              <ProDayGlyph name="whistle" size={14} color={ELITE_COLORS.textSecondary} />
              <ProDayText style={styles.quickLinkText}>Feuille de match</ProDayText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.noMatchCard}>
          <ProDayGlyph name="pitch" size={28} color={ELITE_COLORS.pitchGreen} />
          <View style={styles.noMatchInfo}>
            <ProDayText style={styles.noMatchTitle}>Aucun match programmé</ProDayText>
            <ProDayText style={styles.noMatchSub}>
              Le calendrier des rencontres apparaîtra dès publication par le club.
            </ProDayText>
          </View>
        </View>
      )}

      {/* 3. SÉLECTEUR D'ONGLETS SANS FRICTION */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'carte' && styles.tabBtnActive]}
          onPress={() => {
            prodayHaptics.press();
            setActiveTab('carte');
          }}
        >
          <ProDayText style={[styles.tabText, activeTab === 'carte' && styles.tabTextActive]}>
            Ma Carte
          </ProDayText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'stats' && styles.tabBtnActive]}
          onPress={() => {
            prodayHaptics.press();
            setActiveTab('stats');
          }}
        >
          <ProDayText style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
            Statistiques
          </ProDayText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'parcours' && styles.tabBtnActive]}
          onPress={() => {
            prodayHaptics.press();
            setActiveTab('parcours');
          }}
        >
          <ProDayText style={[styles.tabText, activeTab === 'parcours' && styles.tabTextActive]}>
            Parcours
          </ProDayText>
        </TouchableOpacity>
      </View>

      {/* 4. CONTENU SELON ONGLET ACTIF */}
      {activeTab === 'carte' && (
        <View style={styles.tabContent}>
          {/* Écrin Carte Joueur ProDay (Design Intact) */}
          <View style={styles.cardEcrin}>
            <PlayerCardReveal
              card={cardData}
              width={Math.min(280, WINDOW_WIDTH - 48)}
              onPress={() => {
                prodayHaptics.press();
                nav.setActiveTab('profil');
              }}
            />
          </View>

          {/* Radar des Qualités 6 Axes */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <ProDayGlyph name="stats" size={16} color={ELITE_COLORS.pitchGreen} />
              <ProDayText style={styles.sectionTitle}>Profil Athlétique & Technique</ProDayText>
            </View>
            <View style={styles.radarWrapper}>
              <JoueurAttributeRadar size={220} accent={ELITE_COLORS.pitchGreen} />
            </View>
          </View>
        </View>
      )}

      {activeTab === 'stats' && (
        <View style={styles.tabContent}>
          {/* Les 4 Chiffres Clés de la Saison */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <ProDayText style={styles.metricValue}>
                {profile.profile?.season_stats?.matches ?? (profile.email?.includes('demo') ? 12 : 0)}
              </ProDayText>
              <ProDayText style={styles.metricLabel}>MATCHS</ProDayText>
            </View>

            <View style={styles.metricCard}>
              <ProDayText style={[styles.metricValue, { color: ELITE_COLORS.pitchGreen }]}>
                {profile.profile?.season_stats?.goals ?? (profile.email?.includes('demo') ? 8 : 0)}
              </ProDayText>
              <ProDayText style={styles.metricLabel}>BUTS</ProDayText>
            </View>

            <View style={styles.metricCard}>
              <ProDayText style={styles.metricValue}>
                {profile.profile?.season_stats?.assists ?? (profile.email?.includes('demo') ? 4 : 0)}
              </ProDayText>
              <ProDayText style={styles.metricLabel}>PASSES DÉ</ProDayText>
            </View>

            <View style={styles.metricCard}>
              <ProDayText style={[styles.metricValue, { color: ELITE_COLORS.goldMaster }]}>
                {profile.email?.includes('demo') ? '92%' : '100%'}
              </ProDayText>
              <ProDayText style={styles.metricLabel}>PRÉSENCE</ProDayText>
            </View>
          </View>

          {/* Dernières rencontres */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <ProDayGlyph name="trophy" size={16} />
              <ProDayText style={styles.sectionTitle}>Dernières Rencontres Disputées</ProDayText>
            </View>

            <View style={styles.matchHistoryList}>
              <View style={styles.historyRow}>
                <View style={[styles.resultPill, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
                  <ProDayText style={{ color: ELITE_COLORS.pitchGreen, fontWeight: '800', fontSize: 12 }}>V</ProDayText>
                </View>
                <View style={styles.historyCenter}>
                  <ProDayText style={styles.historyMatch}>vs FC Asnières (3 - 1)</ProDayText>
                  <ProDayText style={styles.historyDetail}>Titulaire · 90 min · 1 But</ProDayText>
                </View>
                <View style={styles.historyBadge}>
                  <ProDayText style={styles.historyNote}>7.8 / 10</ProDayText>
                </View>
              </View>

              <View style={styles.historyRow}>
                <View style={[styles.resultPill, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <ProDayText style={{ color: ELITE_COLORS.goldMaster, fontWeight: '800', fontSize: 12 }}>N</ProDayText>
                </View>
                <View style={styles.historyCenter}>
                  <ProDayText style={styles.historyMatch}>vs Red Star (2 - 2)</ProDayText>
                  <ProDayText style={styles.historyDetail}>Titulaire · 85 min · 1 Passe décisive</ProDayText>
                </View>
                <View style={styles.historyBadge}>
                  <ProDayText style={styles.historyNote}>7.1 / 10</ProDayText>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {activeTab === 'parcours' && (
        <View style={styles.tabContent}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <ProDayGlyph name="whistle" size={16} color={ELITE_COLORS.pitchGreen} />
              <ProDayText style={styles.sectionTitle}>Renseignements Sportifs</ProDayText>
            </View>

            <View style={styles.infoRow}>
              <ProDayText style={styles.infoLabel}>Poste favori</ProDayText>
              <ProDayText style={styles.infoValue}>{profile.profile?.position || 'Attaquant'}</ProDayText>
            </View>

            <View style={styles.infoRow}>
              <ProDayText style={styles.infoLabel}>Pied fort</ProDayText>
              <ProDayText style={styles.infoValue}>{profile.profile?.strong_foot === 'left' ? 'Gauche' : 'Droit'}</ProDayText>
            </View>

            <View style={styles.infoRow}>
              <ProDayText style={styles.infoLabel}>Licence officielle</ProDayText>
              <ProDayText style={[styles.infoValue, { color: ELITE_COLORS.pitchGreen }]}>
                {profile.profile?.license_number ? `N° ${profile.profile.license_number}` : 'Validée'}
              </ProDayText>
            </View>

            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <ProDayText style={styles.infoLabel}>Club d'appartenance</ProDayText>
              <ProDayText style={styles.infoValue}>{profile.profile?.club_id || 'Libre / Autonome'}</ProDayText>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ELITE_COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: ELITE_SPACING.md,
    paddingTop: ELITE_SPACING.md,
    paddingBottom: 120,
  },
  desktopContainer: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ELITE_SPACING.lg,
  },
  playerInfo: {
    flex: 1,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: ELITE_COLORS.pitchGreen,
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  playerName: {
    fontSize: 22,
    fontWeight: '900',
    color: ELITE_COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  teamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ELITE_COLORS.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: ELITE_RADIUS.pill,
    borderWidth: 1,
    borderColor: ELITE_COLORS.borderLight,
  },
  teamText: {
    fontSize: 12,
    fontWeight: '600',
    color: ELITE_COLORS.textSecondary,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: ELITE_RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  aiButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.goldMaster,
  },
  matchCard: {
    backgroundColor: ELITE_COLORS.surfacePrimary,
    borderRadius: ELITE_RADIUS.lg,
    padding: ELITE_SPACING.md,
    borderWidth: 1,
    borderColor: ELITE_COLORS.borderLight,
    marginBottom: ELITE_SPACING.lg,
  },
  matchCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ELITE_SPACING.md,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: ELITE_RADIUS.pill,
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: ELITE_COLORS.pitchGreen,
    letterSpacing: 0.8,
  },
  matchDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: ELITE_COLORS.textSecondary,
  },
  matchTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ELITE_SPACING.sm,
  },
  teamCol: {
    flex: 1,
  },
  teamNameMain: {
    fontSize: 16,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
  },
  teamSubRole: {
    fontSize: 11,
    fontWeight: '500',
    color: ELITE_COLORS.textMuted,
    marginTop: 2,
  },
  vsCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ELITE_COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  vsText: {
    fontSize: 11,
    fontWeight: '900',
    color: ELITE_COLORS.textMuted,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: ELITE_SPACING.sm,
    paddingBottom: ELITE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: ELITE_COLORS.borderLight,
  },
  locationText: {
    fontSize: 12,
    color: ELITE_COLORS.textSecondary,
    flex: 1,
  },
  rsvpRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: ELITE_SPACING.md,
  },
  rsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: ELITE_RADIUS.md,
    borderWidth: 1,
  },
  rsvpBtnYes: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderColor: 'rgba(0, 230, 118, 0.35)',
  },
  rsvpBtnSelectedYes: {
    backgroundColor: ELITE_COLORS.pitchGreen,
    borderColor: ELITE_COLORS.pitchGreen,
  },
  rsvpBtnNo: {
    backgroundColor: ELITE_COLORS.surfaceSecondary,
    borderColor: ELITE_COLORS.borderLight,
  },
  rsvpBtnSelectedNo: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: ELITE_COLORS.alertRed,
  },
  rsvpBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  rsvpTextYes: {
    color: ELITE_COLORS.pitchGreen,
  },
  rsvpTextActiveBlack: {
    color: '#000000',
  },
  rsvpTextNo: {
    color: ELITE_COLORS.textSecondary,
  },
  rsvpTextActiveNo: {
    color: ELITE_COLORS.alertRed,
  },
  quickLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: ELITE_SPACING.md,
    paddingTop: ELITE_SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: ELITE_COLORS.borderLight,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  quickLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: ELITE_COLORS.textSecondary,
  },
  noMatchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: ELITE_COLORS.surfacePrimary,
    padding: ELITE_SPACING.md,
    borderRadius: ELITE_RADIUS.lg,
    borderWidth: 1,
    borderColor: ELITE_COLORS.borderLight,
    marginBottom: ELITE_SPACING.lg,
  },
  noMatchInfo: {
    flex: 1,
  },
  noMatchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ELITE_COLORS.textPrimary,
  },
  noMatchSub: {
    fontSize: 12,
    color: ELITE_COLORS.textMuted,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: ELITE_COLORS.surfacePrimary,
    borderRadius: ELITE_RADIUS.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: ELITE_COLORS.borderLight,
    marginBottom: ELITE_SPACING.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: ELITE_RADIUS.pill,
  },
  tabBtnActive: {
    backgroundColor: ELITE_COLORS.surfaceRaised,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: ELITE_COLORS.textMuted,
  },
  tabTextActive: {
    color: ELITE_COLORS.textPrimary,
    fontWeight: '800',
  },
  tabContent: {
    gap: ELITE_SPACING.lg,
  },
  cardEcrin: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ELITE_SPACING.md,
  },
  sectionCard: {
    backgroundColor: ELITE_COLORS.surfacePrimary,
    borderRadius: ELITE_RADIUS.lg,
    padding: ELITE_SPACING.md,
    borderWidth: 1,
    borderColor: ELITE_COLORS.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: ELITE_SPACING.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
  },
  radarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: ELITE_COLORS.surfacePrimary,
    borderRadius: ELITE_RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ELITE_COLORS.borderLight,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
    color: ELITE_COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: ELITE_COLORS.textMuted,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  matchHistoryList: {
    gap: 10,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: ELITE_COLORS.borderLight,
  },
  resultPill: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCenter: {
    flex: 1,
  },
  historyMatch: {
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.textPrimary,
  },
  historyDetail: {
    fontSize: 11,
    color: ELITE_COLORS.textMuted,
    marginTop: 2,
  },
  historyBadge: {
    backgroundColor: ELITE_COLORS.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  historyNote: {
    fontSize: 12,
    fontWeight: '800',
    color: ELITE_COLORS.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ELITE_COLORS.borderLight,
  },
  infoLabel: {
    fontSize: 13,
    color: ELITE_COLORS.textMuted,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: ELITE_COLORS.textPrimary,
    fontWeight: '700',
  },
});
