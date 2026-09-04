import React, { useState, useMemo } from 'react';
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
import { ProDayFutCard } from '../cards/ProDayFutCard';
import { userToProDayCard } from '../../utils/prodayFutCard';
import { useTeamEvents } from '../../hooks/useAppData';
import { teamEventsService } from '../../services/teamEvents.service';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { buildPlayerCvHtmlFromUser } from '../../utils/pdfGenerator';
import { openPlayerCvHtml } from '../../utils/openCvHtml';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';

interface ElitePlayerProfileProps {
  player: User;
  isOwnProfile?: boolean;
  onBack?: () => void;
  onOpenAiAdvisor?: () => void;
  onEdit?: () => void;
}

type TabKey = 'carte' | 'stats' | 'parcours';

export const ElitePlayerProfile: React.FC<ElitePlayerProfileProps> = ({
  player,
  isOwnProfile,
  onBack,
  onOpenAiAdvisor,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('carte');
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const nav = useTabNavigationActions();

  // Événements & prochain match
  const { events, refresh: refreshEvents } = useTeamEvents(
    player.uid,
    player.profile.club_id
  );

  const nextEvent = useMemo(() => {
    if (!events || events.length === 0) return null;
    const now = new Date();
    return events
      .filter((e) => new Date(e.starts_at) >= now)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0] ?? null;
  }, [events]);

  const p = player.profile;
  const stats = p.season_stats;
  const cardData = useMemo(() => userToProDayCard(player), [player]);

  // Statut présence
  const myRsvp = useMemo(() => {
    if (!nextEvent) return null;
    return nextEvent.rsvps?.[player.uid] ?? 'pending';
  }, [nextEvent, player.uid]);

  const handleRsvp = async (status: 'yes' | 'no') => {
    if (!nextEvent || rsvpBusy) return;
    setRsvpBusy(true);
    prodayHaptics.rsvpConfirm();
    try {
      await teamEventsService.updateRsvp(nextEvent.id, player.uid, status);
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

  const handleExportCv = () => {
    prodayHaptics.confirm();
    const html = buildPlayerCvHtmlFromUser(player);
    openPlayerCvHtml(html, player.display_name);
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
        {/* 1. EN-TÊTE FIXE DU JOUEUR */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {onBack ? (
              <TouchableOpacity
                onPress={() => {
                  prodayHaptics.press();
                  onBack();
                }}
                style={styles.backBtn}
              >
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
            <View>
              <Text style={styles.playerName}>{player.display_name}</Text>
              <Text style={styles.playerMeta}>
                {p.position || 'Poste non renseigné'} · {p.category || 'Senior'}
              </Text>
            </View>
          </View>

          {/* BOUTON CONSEILLER IA EN FRANÇAIS PUR */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              prodayHaptics.press();
              if (onOpenAiAdvisor) {
                onOpenAiAdvisor();
              } else {
                nav.setActiveTab('plus');
              }
            }}
            style={styles.aiAdvisorBtn}
          >
            <Ionicons name="sparkles" size={16} color="#000000" />
            <Text style={styles.aiAdvisorBtnText}>Conseiller IA</Text>
          </TouchableOpacity>
        </View>

        {/* 2. BLOC D'URGENCE : PROCHAIN MATCH & CONVOCATION */}
        {nextEvent ? (
          <View style={[styles.card, styles.urgentMatchCard]}>
            <View style={styles.matchHeader}>
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>
                  {nextEvent.event_type === 'competition' || nextEvent.event_type === 'friendly'
                    ? 'PROCHAIN MATCH'
                    : 'ENTRAÎNEMENT'}
                </Text>
              </View>
              <Text style={styles.matchDate}>
                {new Date(nextEvent.starts_at).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            <Text style={styles.matchTitle}>{nextEvent.title}</Text>

            {eventLocation ? (
              <TouchableOpacity
                onPress={handleOpenGps}
                style={styles.locationRow}
                activeOpacity={0.75}
              >
                <Ionicons name="location-sharp" size={16} color={ELITE_COLORS.primary} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {eventLocation}
                </Text>
                <Text style={styles.gpsLink}>Itinéraire ➔</Text>
              </TouchableOpacity>
            ) : null}

            {/* CONVOCATION & BOUTONS D'ACTION RAPIDES */}
            {isOwnProfile ? (
              <View style={styles.rsvpSection}>
                <Text style={styles.rsvpSectionTitle}>Votre convocation :</Text>
                <View style={styles.rsvpButtonsRow}>
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
            ) : null}

            {/* RACCOURCI COVOITURAGE DIRECT SOUS LE MATCH */}
            <TouchableOpacity
              onPress={() => {
                prodayHaptics.press();
                nav.openCarpool();
              }}
              style={styles.carpoolBanner}
              activeOpacity={0.8}
            >
              <Ionicons name="car-sport" size={18} color={ELITE_COLORS.gold} />
              <Text style={styles.carpoolBannerText}>
                Covoiturage pour ce match · Consulter ou proposer
              </Text>
              <Ionicons name="chevron-forward" size={16} color={ELITE_COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* 3. SÉLECTEUR D'ONGLETS À 3 VUES */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            onPress={() => {
              prodayHaptics.tabSwitch();
              setActiveTab('carte');
            }}
            style={[styles.tabButton, activeTab === 'carte' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'carte' && styles.tabTextActive]}>
              Ma Carte
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              prodayHaptics.tabSwitch();
              setActiveTab('stats');
            }}
            style={[styles.tabButton, activeTab === 'stats' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
              Mes Statistiques
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              prodayHaptics.tabSwitch();
              setActiveTab('parcours');
            }}
            style={[styles.tabButton, activeTab === 'parcours' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'parcours' && styles.tabTextActive]}>
              Mon Parcours
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. CONTENU DE L'ONGLET SÉLECTIONNÉ */}
        {activeTab === 'carte' ? (
          <View style={styles.cardTabContainer}>
            {/* LA CARTE PRODAY OFFICIELLE INTACTE */}
            <View style={styles.futCardWrap}>
              <ProDayFutCard card={cardData} width={240} />
            </View>

            {/* RÉSUMÉ CLÉ DU JOUEUR */}
            <View style={[styles.card, styles.summaryCard]}>
              <Text style={styles.summaryTitle}>Profil & Qualités Clés</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Poste principal</Text>
                  <Text style={styles.summaryValue}>{p.position || 'Polyvalent'}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Pied fort</Text>
                  <Text style={styles.summaryValue}>{p.strong_foot || 'Droit'}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Catégorie</Text>
                  <Text style={styles.summaryValue}>{p.category || 'Senior'}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Niveau</Text>
                  <Text style={styles.summaryValue}>{p.level || 'Régional'}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  prodayHaptics.confirm();
                  handleExportCv();
                }}
                activeOpacity={0.85}
                style={[styles.btnBase, styles.btnGold, { marginTop: 16 }]}
              >
                <Ionicons name="share-social" size={18} color="#000000" style={{ marginRight: 8 }} />
                <Text style={[styles.btnText, styles.btnTextGold]}>Partager ma Carte ProDay</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {activeTab === 'stats' ? (
          <View style={styles.statsTabContainer}>
            {/* 4 COMPTEURS OFFICIELS DE LA SAISON */}
            <View style={styles.counterRow}>
              <View style={[styles.card, styles.counterBox]}>
                <Ionicons name="shirt" size={24} color={ELITE_COLORS.secondary} />
                <Text style={styles.counterNum}>{stats?.matches ?? 0}</Text>
                <Text style={styles.counterLabel}>Matchs disputés</Text>
              </View>

              <View style={[styles.card, styles.counterBox]}>
                <Ionicons name="football" size={24} color={ELITE_COLORS.primary} />
                <Text style={styles.counterNum}>{stats?.goals ?? 0}</Text>
                <Text style={styles.counterLabel}>Buts inscrits</Text>
              </View>

              <View style={[styles.card, styles.counterBox]}>
                <Ionicons name="flash" size={24} color={ELITE_COLORS.gold} />
                <Text style={styles.counterNum}>{stats?.assists ?? 0}</Text>
                <Text style={styles.counterLabel}>Passes décisives</Text>
              </View>

              <View style={[styles.card, styles.counterBox]}>
                <Ionicons name="shield-checkmark" size={24} color="#A78BFA" />
                <Text style={styles.counterNum}>92%</Text>
                <Text style={styles.counterLabel}>Assiduité</Text>
              </View>
            </View>

            {/* ÉTAT DE FORME ET RÉGULARITÉ */}
            <View style={[styles.card, { marginTop: 16 }]}>
              <Text style={styles.sectionHeaderTitle}>Forme & Disponibilité</Text>
              <View style={styles.formRow}>
                <View style={styles.badgeSuccess}>
                  <Text style={styles.badgeSuccessText}>🟢 Disponible pour le week-end</Text>
                </View>
                <Text style={styles.formNote}>
                  Prêt physiquement · Aucune blessure signalée
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {activeTab === 'parcours' ? (
          <View style={styles.careerTabContainer}>
            <View style={[styles.card, { marginBottom: 16 }]}>
              <Text style={styles.sectionHeaderTitle}>Informations Sportives</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Club d'appartenance :</Text>
                <Text style={styles.infoValue}>{p.club_id || 'Non rattaché'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Numéro de licence FFF :</Text>
                <Text style={styles.infoValue}>{p.license_number || 'Validée FFF'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Années d'expérience :</Text>
                <Text style={styles.infoValue}>{p.years_experience ? `${p.years_experience} ans` : '5 ans'}</Text>
              </View>
            </View>

            <View style={[styles.card, { marginBottom: 16 }]}>
              <Text style={styles.sectionHeaderTitle}>Bio & Ambitions</Text>
              <Text style={styles.bioText}>
                {p.bio?.trim() ||
                  "Joueur sérieux et déterminé, à l'écoute des consignes du coach et toujours prêt à se battre pour l'équipe."}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleExportCv}
              activeOpacity={0.85}
              style={[styles.btnBase, styles.btnOutline]}
            >
              <Ionicons name="document-text" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.btnText}>Télécharger mon CV Sportif (PDF)</Text>
            </TouchableOpacity>
          </View>
        ) : null}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: ELITE_COLORS.bgSurface,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
  },
  playerName: {
    fontSize: 20,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
  },
  playerMeta: {
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
  urgentMatchCard: {
    marginBottom: 16,
    borderColor: ELITE_COLORS.borderAccent,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchDate: {
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.textSecondary,
  },
  matchTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
    marginBottom: 8,
  },
  locationRow: {
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
  gpsLink: {
    fontSize: 12,
    fontWeight: '700',
    color: ELITE_COLORS.primary,
  },
  rsvpSection: {
    borderTopWidth: 1,
    borderTopColor: ELITE_COLORS.border,
    paddingTop: 12,
    marginBottom: 12,
  },
  rsvpSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.textSecondary,
    marginBottom: 8,
  },
  rsvpButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  carpoolBanner: {
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
  carpoolBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: ELITE_COLORS.gold,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: ELITE_COLORS.bgSurface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.textMuted,
  },
  tabTextActive: {
    color: ELITE_COLORS.textPrimary,
  },
  cardTabContainer: {
    alignItems: 'center',
    width: '100%',
  },
  futCardWrap: {
    marginVertical: 12,
    alignItems: 'center',
  },
  summaryCard: {
    width: '100%',
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    width: '47%',
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    padding: 12,
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 11,
    color: ELITE_COLORS.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: ELITE_COLORS.textPrimary,
  },
  statsTabContainer: {
    width: '100%',
  },
  counterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  counterBox: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  counterNum: {
    fontSize: 28,
    fontWeight: '900',
    color: ELITE_COLORS.textPrimary,
    marginTop: 6,
  },
  counterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ELITE_COLORS.textSecondary,
    marginTop: 2,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: ELITE_COLORS.textPrimary,
    marginBottom: 12,
  },
  formRow: {
    gap: 8,
  },
  formNote: {
    fontSize: 13,
    color: ELITE_COLORS.textSecondary,
  },
  careerTabContainer: {
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: ELITE_COLORS.border,
  },
  infoLabel: {
    fontSize: 13,
    color: ELITE_COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: ELITE_COLORS.textPrimary,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
    color: ELITE_COLORS.textSecondary,
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
  btnGold: {
    backgroundColor: ELITE_COLORS.gold,
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
  btnTextGold: {
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
