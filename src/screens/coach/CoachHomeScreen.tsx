import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { CoachStandingsTable } from '../../components/coach/CoachStandingsTable';
import { CoachLoadAlertsPanel } from '../../components/coach/CoachLoadAlertsPanel';
import { CoachPendingRsvpSheet } from '../../components/coach/CoachPendingRsvpSheet';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useCoachTeamChrome } from '../../hooks/useCoachTeamChrome';
import { useCoachLoadAlerts } from '../../hooks/useCoachLoadAlerts';
import { teamEventsService } from '../../services/teamEvents.service';
import { useCoachRsvpRemind } from '../../hooks/useCoachRsvpRemind';
import {
  EVENT_TYPE_LABELS,
  getPendingInviteeUids,
  type TeamEvent,
} from '../../models/TeamEvent';
import { clubSeasonLabelForDate, formatClubSeasonLabel } from '../../utils/clubSeason';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { proForm, proRadius, proSemantic, proSpace } from '../../theme/professionalDesign';
import { withAlpha } from '../../components/navigation/tabBarShared';
import { tabBarScrollInset } from '../../navigation/tabBarLayout';

interface Props {
  onNavigate?: (navId: string) => void;
  onOpenMatch?: (matchId: string) => void;
}

/**
 * Accueil Coach — **une information par carte, une seule action par intention**.
 *
 * La page empilait auparavant deux blocs de vigilance qui répétaient le même
 * état, des essais d'honnêteté de six lignes, une carte d'emplacement (« le
 * classement s'affichera ici ») et trois boutons menant au même écran. La
 * version resserrée garde le même contrat de données (signaux réels, aucun
 * chiffre inventé) mais n'affiche que :
 *
 *  1. l'en-tête équipe ;
 *  2. **une** carte Vigilance (résumé + action), la liste détaillée seulement
 *     s'il existe des alertes exploitables ;
 *  3. le prochain événement et son action principale (composer l'équipe) ;
 *  4. trois accès rapides, l'entrée Copilote, le classement replié.
 */
export const CoachHomeScreen: React.FC<Props> = ({ onNavigate }) => {
  const profile = useSessionProfile();
  const { teamName, displayName } = useCoachTeamChrome();
  const { tokens, teamId } = useCoachTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  /** Saison unique du produit (`clubSeason`) — même définitions que le pôle Club. */
  const season = formatClubSeasonLabel(clubSeasonLabelForDate(new Date()));
  const [refreshing, setRefreshing] = useState(false);
  const [showStandings, setShowStandings] = useState(true);
  /** Détail des réponses en attente — déroulé du badge du prochain événement. */
  const [pendingSheetOpen, setPendingSheetOpen] = useState(false);

  /** Prochain événement réel du coach — aucune rencontre fictive. */
  const [nextEvent, setNextEvent] = useState<TeamEvent | null>(null);
  /** Signaux de charge réels — la carte Vigilance en est la seule vitrine. */
  const {
    state: loadState,
    report: loadReport,
    reload: reloadLoadAlerts,
  } = useCoachLoadAlerts();
  /** Relance groupée du badge — logique partagée avec la page Effectif. */
  const {
    reminding: remindingAll,
    remindAll: remindPendingRsvps,
    feedbackKind: remindFeedbackKind,
  } = useCoachRsvpRemind(nextEvent);

  const loadNextEvent = useCallback(() => {
    if (!profile?.uid) return Promise.resolve();
    return teamEventsService
      .listForUser(profile.uid, profile.profile.club_id || undefined)
      .then((rows) => {
        const next = rows
          .slice()
          .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())
          .find((e) => e.starts_at.getTime() >= Date.now() - 2 * 3600 * 1000);
        setNextEvent(next ?? null);
      })
      .catch(() => undefined);
  }, [profile?.uid, profile?.profile.club_id]);

  useEffect(() => {
    void loadNextEvent();
  }, [loadNextEvent]);

  /** Pull-to-refresh réel : relit les événements et les signaux de charge. */
  const onRefresh = () => {
    setRefreshing(true);
    reloadLoadAlerts();
    void loadNextEvent().finally(() => setRefreshing(false));
  };

  /**
   * Vigilance — **une ligne de titre, une ligne d'explication**, dérivées des
   * données réelles du hook. Le détail des sources manquantes reste dans le
   * rapport ; l'écran ne le déverse plus sur le coach.
   */
  const alertBanner = useMemo(() => {
    if (loadState === 'loading') {
      return {
        headline: 'Lecture des données de charge…',
        detail: 'Effectif, pointages et check-ins de forme de l’équipe active.',
        showSpinner: true,
      };
    }
    if (loadState === 'guest') {
      return {
        headline: 'Suivi charge & blessures',
        detail: 'Aucun club rattaché à ce compte : les alertes ne peuvent pas être calculées.',
        showSpinner: false,
      };
    }
    if (loadState === 'error' || !loadReport) {
      return {
        headline: 'Charge indisponible',
        detail: 'La lecture des données d’équipe a échoué.',
        showSpinner: false,
      };
    }

    const { counts, trackedPlayers, signals } = loadReport;
    const watched = counts.high + counts.caution;
    const coverage = `${trackedPlayers}/${signals.length} joueur(s) avec données`;
    const windowLabel = `7 jours : ${loadReport.matchesInWindow} match(s), ${loadReport.trainingsInWindow} entraînement(s)`;

    if (!loadReport.hasData) {
      const last = loadReport.lastEvent;
      const lastLabel = last
        ? `Dernier événement : ${last.startsAt.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
          })} (${(EVENT_TYPE_LABELS[last.eventType] ?? 'événement').toLowerCase()}). `
        : '';
      return {
        headline: 'Aucune donnée de charge sur 7 jours',
        detail: loadReport.sources.events
          ? `${lastLabel}Pointez les présences pour alimenter le suivi.`
          : 'Aucun événement de l’équipe n’a pu être lu (accès ou données absentes).',
        showSpinner: false,
      };
    }
    if (watched > 0) {
      return {
        headline: `${counts.high} prioritaire(s) · ${counts.caution} à surveiller`,
        detail: `${coverage} · ${windowLabel}`,
        showSpinner: false,
      };
    }
    if (loadReport.unavailablePlayers > 0) {
      return {
        headline: `${loadReport.unavailablePlayers} indisponible(s) déclaré(s)`,
        detail: windowLabel,
        showSpinner: false,
      };
    }
    return {
      headline: 'Aucun signal de charge préoccupant',
      detail: `${coverage} · ${windowLabel}`,
      showSpinner: false,
    };
  }, [loadState, loadReport]);

  /** La liste détaillée n'a de sens que s'il y a une alerte exploitable. */
  const showAlertsList = loadState === 'ready' && loadReport && loadReport.actionable.length > 0;

  /**
   * Réponses en attente sur la convocation du prochain événement — **définition
   * partagée** (`getPendingInviteeUids`, celle du Match Center et des rappels) :
   * un invité qui n'a ni répondu ni décliné. Zéro si aucun événement à venir.
   */
  const pendingRsvpCount = useMemo(
    () => (nextEvent ? getPendingInviteeUids(nextEvent).length : 0),
    [nextEvent],
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.accent} />
      }
    >
      {/* En-tête équipe */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.clubBadge}>
            <MaterialCommunityIcons name="shield-crown" size={22} color={tokens.accent} />
          </View>
          <View>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryTag}>
                {profile?.profile.club_id ? 'Club affilié' : 'Club non relié'}
              </Text>
              <Text style={styles.seasonTag}>SAISON {season}</Text>
            </View>
            <Text numberOfLines={1} style={styles.teamTitle}>
              {teamName}
            </Text>
            <Text style={styles.coachSubtitle}>{displayName} · Entraîneur</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() => onNavigate?.('com_staff')}
          activeOpacity={0.8}

          accessibilityRole="button"
          accessibilityLabel="Messagerie">
          <MaterialCommunityIcons name="account-group-outline" size={18} color={tokens.foreground} />
        </TouchableOpacity>
      </View>

      {/* Vigilance — une seule carte : résumé, action, et la liste seulement si utile */}
      <View style={styles.alertBannerCard}>
        <View style={styles.alertBannerTop}>
          <View style={styles.alertBannerBadge}>
            <MaterialCommunityIcons name="alert-decagram" size={15} color={proSemantic.danger} />
            <Text style={styles.alertBannerBadgeText}>VIGILANCE</Text>
          </View>
          <TouchableOpacity
            style={styles.alertBannerActBtn}
            activeOpacity={0.85}
            onPress={() => onNavigate?.('forme')}
          >
            <Text style={styles.alertBannerActBtnText}>Agir sur l’effectif</Text>
            <Feather name="arrow-right" size={12} color={proSemantic.onDanger} />
          </TouchableOpacity>
        </View>

        <Text style={styles.alertBannerHeadline}>{alertBanner.headline}</Text>
        <Text style={styles.alertBannerDetail}>{alertBanner.detail}</Text>

        {alertBanner.showSpinner ? (
          <ActivityIndicator size="small" color={proSemantic.danger} style={styles.alertSpinner} />
        ) : null}

        {loadState === 'error' ? (
          <TouchableOpacity
            style={styles.alertRetryBtn}
            activeOpacity={0.85}
            onPress={reloadLoadAlerts}
          >
            <Feather name="refresh-cw" size={12} color={proSemantic.danger} />
            <Text style={styles.alertRetryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Liste détaillée — uniquement quand une alerte réelle existe */}
      {showAlertsList ? <CoachLoadAlertsPanel alerts={loadReport.alerts} /> : null}

      {/* Prochain événement + action principale */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.matchBadge}>
            <MaterialCommunityIcons name="trophy-variant" size={12} color={tokens.accent} />
            <Text style={styles.matchBadgeText}>PROCHAIN ÉVÉNEMENT</Text>
          </View>
          {nextEvent ? (
            <View style={styles.heroTopRight}>
              <View style={styles.countdownBadge}>
                <Feather name="clock" size={12} color={tokens.muted} />
                <Text style={styles.countdownText}>
                  {nextEvent.starts_at.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
              {pendingRsvpCount > 0 ? (
                <View style={styles.rsvpPendingBadge}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setPendingSheetOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel={`Voir les ${pendingRsvpCount} réponses en attente`}
                  >
                    <View style={styles.rsvpBadgeInfo}>
                      <Ionicons name="notifications-outline" size={12} color={proSemantic.warning} />
                      <Text style={styles.rsvpPendingBadgeText}>
                        {pendingRsvpCount} réponse{pendingRsvpCount > 1 ? 's' : ''} en attente
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {remindingAll ? (
                    <ActivityIndicator size="small" color={proSemantic.warning} />
                  ) : remindFeedbackKind ? (
                    <Ionicons
                      name={
                        remindFeedbackKind === 'sent'
                          ? 'checkmark-circle'
                          : remindFeedbackKind === 'cooldown'
                            ? 'time-outline'
                            : 'alert-circle'
                      }
                      size={14}
                      color={
                        remindFeedbackKind === 'sent'
                          ? proSemantic.success
                          : remindFeedbackKind === 'cooldown'
                            ? proSemantic.warning
                            : proSemantic.danger
                      }
                    />
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => void remindPendingRsvps()}
                      accessibilityRole="button"
                      accessibilityLabel={`Relancer les ${pendingRsvpCount} joueurs qui n’ont pas répondu`}
                      style={styles.rsvpRemindBtn}
                    >
                      <Ionicons name="paper-plane" size={11} color={proSemantic.onDanger} />
                      <Text style={styles.rsvpRemindBtnText}>Relancer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {nextEvent ? (
          <>
            <Text numberOfLines={2} style={styles.eventTitle}>
              {nextEvent.title || 'Événement'}
            </Text>
            <View style={styles.eventMetaRow}>
              <View style={styles.eventMetaItem}>
                <Feather name="clock" size={14} color={tokens.muted} />
                <Text style={styles.eventMetaText}>
                  {nextEvent.starts_at.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.eventMetaItem}>
                <Ionicons name="location" size={14} color={tokens.muted} />
                <Text numberOfLines={1} style={styles.eventMetaText}>
                  {nextEvent.location_label || nextEvent.location || nextEvent.city || 'Lieu à confirmer'}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.honestNote}>
            Aucun événement programmé. Les entraînements et matchs créés depuis le planning
            apparaîtront ici.
          </Text>
        )}

        <TouchableOpacity
          style={styles.primaryCtaBtn}
          activeOpacity={0.88}
          onPress={() => onNavigate?.('equipe')}
        >
          <MaterialCommunityIcons name="soccer-field" size={18} color={tokens.onAccent} />
          <Text style={styles.primaryCtaText}>Composer l’équipe & la tactique</Text>
          <Feather name="arrow-right" size={16} color={tokens.onAccent} />
        </TouchableOpacity>
      </View>

      {/* Accès rapides */}
      <View style={styles.tilesGrid}>
        <TouchableOpacity
          style={styles.tileCard}
          activeOpacity={0.85}
          onPress={() => onNavigate?.('smart_tactics')}
        >
          <View style={[styles.tileIconWrap, { backgroundColor: withAlpha(tokens.accent, 0.12) }]}>
            <MaterialCommunityIcons name="draw-pen" size={20} color={tokens.accent} />
          </View>
          <Text style={styles.tileTitle}>Tableau tactique</Text>
          <Text style={styles.tileDesc}>Foot à 11, à 8, futsal & animation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tileCard}
          activeOpacity={0.85}
          onPress={() => onNavigate?.('entrainements')}
        >
          <View style={[styles.tileIconWrap, { backgroundColor: withAlpha(proSemantic.success, 0.14) }]}>
            <MaterialCommunityIcons name="whistle-outline" size={20} color={proSemantic.success} />
          </View>
          <Text style={styles.tileTitle}>Entraînements</Text>
          <Text style={styles.tileDesc}>Séances & ateliers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tileCard}
          activeOpacity={0.85}
          onPress={() => onNavigate?.('match_center')}
        >
          <View style={[styles.tileIconWrap, { backgroundColor: withAlpha(proSemantic.warning, 0.14) }]}>
            <MaterialCommunityIcons name="microphone" size={20} color={proSemantic.warning} />
          </View>
          <Text style={styles.tileTitle}>Scouting vocal</Text>
          <Text style={styles.tileDesc}>Notes terrain & dictée</Text>
        </TouchableOpacity>
      </View>

      {/* Historique des relances — déroulé de la fonctionnalité du badge */}
      <TouchableOpacity
        style={styles.aiRow}
        activeOpacity={0.8}
        onPress={() => onNavigate?.('rsvp_log')}
        accessibilityRole="button"
        accessibilityLabel="Voir l'historique des relances"
      >
        <View style={[styles.aiIconBadge, { backgroundColor: withAlpha(proSemantic.warning, 0.12) }]}>
          <Ionicons name="time-outline" size={16} color={proSemantic.warning} />
        </View>
        <View style={styles.aiRowText}>
          <Text style={styles.aiRowTitle}>Historique des relances</Text>
          <Text numberOfLines={1} style={styles.aiRowSubtitle}>
            Qui a été relancé, quand, et combien de destinataires
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color={tokens.muted} />
      </TouchableOpacity>

      {/* Copilote — une ligne, pas un paragraphe de précautions */}
      <TouchableOpacity
        style={styles.aiRow}
        activeOpacity={0.8}
        onPress={() => onNavigate?.('copilot_chat')}
      >
        <View style={styles.aiIconBadge}>
          <MaterialCommunityIcons name="star-four-points" size={14} color={proSemantic.warning} />
        </View>
        <View style={styles.aiRowText}>
          <Text style={styles.aiRowTitle}>Copilote Coach</Text>
          <Text numberOfLines={1} style={styles.aiRowSubtitle}>
            Séance, causerie, préparation de match
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color={tokens.muted} />
      </TouchableOpacity>

      {/* Classement — replié par défaut */}
      <View style={styles.standingsSection}>
        <TouchableOpacity
          style={styles.standingsHeader}
          activeOpacity={0.8}
          onPress={() => setShowStandings((prev) => !prev)}
        >
          <View style={styles.standingsHeaderLeft}>
            <MaterialCommunityIcons name="format-list-numbered" size={16} color={tokens.accent} />
            <Text style={styles.standingsTitle}>Classement officiel</Text>
          </View>
          <Feather
            name={showStandings ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={tokens.muted}
          />
        </TouchableOpacity>

        {showStandings ? (
          <View style={styles.standingsContainer}>
            <CoachStandingsTable compact={false} teamId={teamId} teamName={teamName} />
          </View>
        ) : null}
      </View>

      {/* Détail des réponses en attente — déroulé du badge du prochain événement */}
      <CoachPendingRsvpSheet
        visible={pendingSheetOpen}
        onClose={() => setPendingSheetOpen(false)}
        event={nextEvent}
        tokens={tokens}
      />
    </ScrollView>
  );
};

const createStyles = (tokens: CoachThemeTokens) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    content: {
      padding: 16,
      paddingBottom: tabBarScrollInset({ extra: proSpace.xl }),
    },

    /* En-tête */
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
      flex: 1,
      minWidth: 0,
    },
    clubBadge: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: withAlpha(proSemantic.warning, 0.1),
      borderWidth: 1,
      borderColor: withAlpha(proSemantic.warning, 0.3),
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
      color: proSemantic.warning,
      fontSize: 9.5,
      fontWeight: '800',
            letterSpacing: 0.5,
    },
    seasonTag: {
      color: tokens.muted,
      fontSize: 9.5,
      fontWeight: '600',
          },
    teamTitle: {
      color: tokens.foreground,
      fontSize: 18,
      fontWeight: '800',
            letterSpacing: -0.3,
    },
    coachSubtitle: {
      color: tokens.muted,
      fontSize: 11,
            marginTop: 1,
    },
    headerActionBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    /* Vigilance — carte unique */
    alertBannerCard: {
      backgroundColor: withAlpha(proSemantic.danger, 0.12),
      borderRadius: proRadius.lg,
      borderWidth: 1,
      borderColor: withAlpha(proSemantic.danger, 0.3),
      padding: 14,
      marginBottom: 14,
    },
    alertBannerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 8,
    },
    alertBannerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    alertBannerBadgeText: {
      color: proSemantic.danger,
      fontSize: 10,
      fontWeight: '800',
            letterSpacing: 0.5,
    },
    alertBannerActBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: proSemantic.danger,
      paddingHorizontal: proSpace.md,
      /** Cible tactile conforme au socle partagé (≥ 44 px). */
      minHeight: proForm.chipHeight,
      borderRadius: proForm.chipRadius,
    },
    alertBannerActBtnText: {
      /** Texte sur aplat de statut : blanc, identique dans les deux pôles. */
      color: proSemantic.onDanger,
      fontSize: 10.5,
      fontWeight: '700',
          },
    alertBannerHeadline: {
      color: proSemantic.danger,
      fontSize: 12,
      fontWeight: '600',
            marginBottom: 4,
    },
    alertBannerDetail: {
      color: tokens.muted,
      fontSize: 11,
      lineHeight: 16,
          },
    alertSpinner: {
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    alertRetryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      marginTop: 10,
      paddingHorizontal: proSpace.md,
      minHeight: proForm.chipHeight,
      borderRadius: proForm.chipRadius,
      borderWidth: 1,
      borderColor: withAlpha(proSemantic.danger, 0.4),
    },
    alertRetryBtnText: {
      color: proSemantic.danger,
      fontSize: 10.5,
      fontWeight: '700',
          },

    /* Prochain événement */
    heroCard: {
      backgroundColor: tokens.surface,
      borderRadius: proRadius.xl,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 16,
      marginBottom: 14,
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
      backgroundColor: withAlpha(tokens.accent, 0.12),
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    matchBadgeText: {
      color: tokens.accent,
      fontSize: 9.5,
      fontWeight: '800',
            letterSpacing: 0.5,
    },
    heroTopRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 1,
    },
    countdownBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: tokens.elevated,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    countdownText: {
      color: tokens.foreground,
      fontSize: 10.5,
      fontWeight: '700',
          },
    rsvpPendingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: withAlpha(proSemantic.warning, 0.14),
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    rsvpBadgeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    rsvpRemindBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: proSemantic.warning,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 5,
    },
    rsvpRemindBtnText: {
      /** Texte posé sur un aplat de statut — même règle que `onDanger`. */
      color: proSemantic.onDanger,
      fontSize: 10.5,
      fontWeight: '700',
          },
    rsvpPendingBadgeText: {
      color: proSemantic.warning,
      fontSize: 10.5,
      fontWeight: '700',
          },
    eventTitle: {
      color: tokens.foreground,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.3,
      marginBottom: 8,
    },
    eventMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.elevated,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginBottom: 12,
      gap: 8,
    },
    eventMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flex: 1,
      minWidth: 0,
    },
    eventMetaText: {
      color: tokens.muted,
      fontSize: 10.5,
      fontWeight: '500',
            flexShrink: 1,
    },
    metaDivider: {
      width: 1,
      height: 12,
      backgroundColor: tokens.border,
    },
    primaryCtaBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.accent,
      /** Action principale : pilule à hauteur cible du socle partagé. */
      borderRadius: proForm.actionRadius,
      minHeight: proForm.actionMinHeight,
      paddingVertical: 13,
      gap: 8,
    },
    primaryCtaText: {
      color: tokens.onAccent,
      fontSize: 13,
      fontWeight: '700',
          },

    /* Accès rapides */
    tilesGrid: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    tileCard: {
      flex: 1,
      backgroundColor: tokens.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: tokens.border,
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
      color: tokens.foreground,
      fontSize: 12,
      fontWeight: '700',
            marginBottom: 2,
    },
    tileDesc: {
      color: tokens.muted,
      fontSize: 9.5,
      lineHeight: 13,
          },

    /* Copilote */
    aiRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: tokens.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 14,
      marginBottom: 14,
    },
    aiIconBadge: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: withAlpha(proSemantic.warning, 0.14),
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiRowText: {
      flex: 1,
      minWidth: 0,
    },
    aiRowTitle: {
      color: tokens.foreground,
      fontSize: 12.5,
      fontWeight: '700',
          },
    aiRowSubtitle: {
      color: tokens.muted,
      fontSize: 10.5,
            marginTop: 1,
    },

    /* Classement */
    standingsSection: {
      backgroundColor: tokens.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: tokens.border,
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
      color: tokens.foreground,
      fontSize: 13,
      fontWeight: '700',
          },
    standingsContainer: {
      paddingHorizontal: 12,
      paddingBottom: 12,
    },

    /* Note discrète partagée */
    honestNote: {
      color: tokens.muted,
      fontSize: 12,
      lineHeight: 18,
      fontStyle: 'italic',
      marginTop: 6,
    },
  });
