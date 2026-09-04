import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '../../models/User';
import { ELITE_COLORS } from '../../theme/prodayEliteTheme';
import { useTeamEvents } from '../../hooks/useAppData';
import { teamEventsService } from '../../services/teamEvents.service';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';

interface EliteHomeScreenProps {
  profile: User;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const EliteHomeScreen: React.FC<EliteHomeScreenProps> = ({
  profile,
}) => {
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const nav = useTabNavigationActions();

  // Événements d'équipe pour récupérer le prochain match
  const { events, refresh: refreshEvents } = useTeamEvents(
    profile.uid,
    profile.profile.club_id
  );

  const nextEvent = useMemo(() => {
    if (!events || events.length === 0) return null;
    const now = new Date();
    return events
      .filter((e) => new Date(e.starts_at) >= now)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0] ?? null;
  }, [events]);

  const myRsvp = useMemo(() => {
    if (!nextEvent) return null;
    return nextEvent.rsvps?.[profile.uid] ?? 'pending';
  }, [nextEvent, profile.uid]);

  const handleRsvp = async (status: 'yes' | 'no') => {
    if (!nextEvent || rsvpBusy) return;
    setRsvpBusy(true);
    prodayHaptics.rsvpConfirm();
    try {
      await teamEventsService.updateRsvp(nextEvent.id, profile.uid, status);
      await refreshEvents();
    } catch (e) {
      console.warn('Erreur RSVP', e);
    } finally {
      setRsvpBusy(false);
    }
  };

  const eventLocation = nextEvent?.location_label || nextEvent?.city;

  const handleOpenGps = () => {
    if (!eventLocation) return;
    prodayHaptics.press();
    const query = encodeURIComponent(eventLocation);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: TAB_BAR_CONTENT_INSET + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. EN-TÊTE ACCUEIL AVEC SALUTATION PERSONNALISÉE ET CONSEILLER IA */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingText}>Bonjour, {profile.display_name.split(' ')[0]}</Text>
            <Text style={styles.clubMeta}>
              {profile.profile.club_id ? `Club : ${profile.profile.club_id}` : 'ProDay Élite'} · {profile.profile.category || 'Senior'}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              prodayHaptics.press();
              nav.setActiveTab('plus');
            }}
            style={styles.aiAdvisorBtn}
          >
            <Ionicons name="sparkles" size={16} color="#000000" />
            <Text style={styles.aiAdvisorBtnText}>Conseiller IA</Text>
          </TouchableOpacity>
        </View>

        {/* 2. LA CARTE GÉANTE DU PROCHAIN MATCH (CŒUR DE L'EXPÉRIENCE SPORTEASY) */}
        {nextEvent ? (
          <View style={[styles.card, styles.matchHeroCard]}>
            <View style={styles.matchHeroHeader}>
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>
                  {nextEvent.event_type === 'competition' || nextEvent.event_type === 'friendly'
                    ? 'MATCH DU WEEK-END'
                    : 'SÉANCE ENTRAÎNEMENT'}
                </Text>
              </View>
              <Text style={styles.matchTimeText}>
                {new Date(nextEvent.starts_at).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            <Text style={styles.matchTitleText}>{nextEvent.title}</Text>

            {eventLocation ? (
              <TouchableOpacity
                onPress={handleOpenGps}
                style={styles.locationContainer}
                activeOpacity={0.8}
              >
                <Ionicons name="location-sharp" size={18} color={ELITE_COLORS.primary} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {eventLocation}
                </Text>
                <Text style={styles.gpsActionText}>Itinéraire ➔</Text>
              </TouchableOpacity>
            ) : null}

            {/* BOUTONS MA PRÉSENCE (CONVOCATION EN 1 TAP) */}
            <View style={styles.convocationBox}>
              <Text style={styles.convocationTitle}>Votre réponse au coach :</Text>
              <View style={styles.convocationActions}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={rsvpBusy}
                  onPress={() => handleRsvp('yes')}
                  style={[
                    styles.btnBase,
                    myRsvp === 'yes' ? styles.btnPrimary : styles.btnOutline,
                    { flex: 1 },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={myRsvp === 'yes' ? '#000000' : ELITE_COLORS.primary}
                  />
                  <Text
                    style={[
                      styles.btnText,
                      myRsvp === 'yes' ? styles.btnTextPrimary : styles.btnTextOutline,
                    ]}
                  >
                    Je serai présent
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={rsvpBusy}
                  onPress={() => handleRsvp('no')}
                  style={[
                    styles.btnBase,
                    myRsvp === 'no' ? styles.btnDanger : styles.btnOutline,
                    { flex: 1 },
                  ]}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={myRsvp === 'no' ? '#F87171' : ELITE_COLORS.danger}
                  />
                  <Text
                    style={[
                      styles.btnText,
                      myRsvp === 'no' ? styles.btnTextDanger : styles.btnTextOutline,
                    ]}
                  >
                    Je serai absent
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* COVOITURAGE DIRECT SOUS LE MATCH */}
            <TouchableOpacity
              onPress={() => {
                prodayHaptics.press();
                nav.openCarpool();
              }}
              style={styles.carpoolAction}
              activeOpacity={0.8}
            >
              <Ionicons name="car-sport" size={18} color={ELITE_COLORS.gold} />
              <Text style={styles.carpoolActionText}>
                Covoiturage pour ce match · Consulter ou proposer
              </Text>
              <Ionicons name="chevron-forward" size={16} color={ELITE_COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, styles.noMatchCard]}>
            <Ionicons name="calendar-outline" size={28} color={ELITE_COLORS.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.noMatchTitle}>Aucun match programmé cette semaine</Text>
              <Text style={styles.noMatchSub}>Reposez-vous et préparez les prochains entraînements.</Text>
            </View>
          </View>
        )}

        {/* 3. WIDGET CLASSEMENT EXPRESS DE LA POULE */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            prodayHaptics.press();
            nav.openMatchs();
          }}
          style={[styles.card, styles.standingsExpressCard]}
        >
          <View style={styles.cardHeaderWithAction}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="trophy" size={20} color={ELITE_COLORS.gold} />
              <Text style={styles.cardHeaderTitle}>Classement Régional</Text>
            </View>
            <Text style={styles.viewMoreLink}>Voir le classement ➔</Text>
          </View>
          <View style={styles.standingsHighlight}>
            <Text style={styles.standingsRankText}>🟢 2e place</Text>
            <Text style={styles.standingsScoreText}>29 points · 12 matchs joués</Text>
          </View>
        </TouchableOpacity>

        {/* 4. DERNIÈRE CONSIGNE DU STAFF / VESTIAIRE */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            prodayHaptics.press();
            nav.setActiveTab('messages');
          }}
          style={[styles.card, styles.coachNoteCard]}
        >
          <View style={styles.cardHeaderWithAction}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="megaphone" size={20} color={ELITE_COLORS.primary} />
              <Text style={styles.cardHeaderTitle}>Consigne du Vestiaire</Text>
            </View>
            <Text style={styles.viewMoreLink}>Ouvrir le vestiaire ➔</Text>
          </View>
          <Text style={styles.coachNoteText}>
            « Rendez-vous 1h15 avant le coup d'envoi au vestiaire. N'oubliez pas vos protège-tibias et votre maillot d'échauffement. »
          </Text>
        </TouchableOpacity>

        {/* 5. ACCÈS DIRECT À MA CARTE PRODAY ET MON PROFIL */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => {
            prodayHaptics.press();
            nav.setActiveTab('profil');
          }}
          style={styles.myCardPromo}
        >
          <Ionicons name="shield" size={24} color={ELITE_COLORS.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.myCardPromoTitle}>Ma Carte Joueur & Radar de Performance</Text>
            <Text style={styles.myCardPromoSub}>Consultez votre note globale, vos buts et vos statistiques.</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={ELITE_COLORS.gold} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ELITE_COLORS.bg,
  },
  scrollContent: {
    padding: 16,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: ELITE_COLORS.bgSurface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '900',
    color: ELITE_COLORS.textPrimary,
  },
  clubMeta: {
    fontSize: 13,
    color: ELITE_COLORS.textSecondary,
    marginTop: 2,
  },
  aiAdvisorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ELITE_COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  aiAdvisorBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 13,
  },
  matchHeroCard: {
    marginBottom: 16,
    borderColor: ELITE_COLORS.borderAccent,
    backgroundColor: '#0F172A',
  },
  matchHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.textSecondary,
  },
  matchTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: ELITE_COLORS.textPrimary,
    marginBottom: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: ELITE_COLORS.textSecondary,
  },
  gpsActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: ELITE_COLORS.primary,
  },
  convocationBox: {
    borderTopWidth: 1,
    borderTopColor: ELITE_COLORS.border,
    paddingTop: 12,
    marginBottom: 12,
  },
  convocationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.textSecondary,
    marginBottom: 10,
  },
  convocationActions: {
    flexDirection: 'row',
    gap: 10,
  },
  carpoolAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ELITE_COLORS.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  carpoolActionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: ELITE_COLORS.gold,
  },
  noMatchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    padding: 18,
  },
  noMatchTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
  },
  noMatchSub: {
    fontSize: 12,
    color: ELITE_COLORS.textSecondary,
    marginTop: 2,
  },
  standingsExpressCard: {
    marginBottom: 16,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
  },
  viewMoreLink: {
    fontSize: 12,
    fontWeight: '700',
    color: ELITE_COLORS.primary,
  },
  standingsHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  standingsRankText: {
    fontSize: 15,
    fontWeight: '900',
    color: ELITE_COLORS.primary,
  },
  standingsScoreText: {
    fontSize: 13,
    color: ELITE_COLORS.textSecondary,
  },
  coachNoteCard: {
    marginBottom: 16,
  },
  coachNoteText: {
    fontSize: 13,
    lineHeight: 20,
    color: ELITE_COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  myCardPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ELITE_COLORS.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  myCardPromoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: ELITE_COLORS.gold,
  },
  myCardPromoSub: {
    fontSize: 12,
    color: ELITE_COLORS.textSecondary,
    marginTop: 2,
  },
  badgeSuccess: {
    backgroundColor: ELITE_COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeSuccessText: {
    color: ELITE_COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  btnBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
  },
  btnPrimary: {
    backgroundColor: ELITE_COLORS.primary,
  },
  btnDanger: {
    backgroundColor: ELITE_COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnTextPrimary: {
    color: '#000000',
    fontWeight: '800',
  },
  btnTextDanger: {
    color: '#F87171',
    fontWeight: '700',
  },
  btnTextOutline: {
    color: ELITE_COLORS.textSecondary,
  },
});
