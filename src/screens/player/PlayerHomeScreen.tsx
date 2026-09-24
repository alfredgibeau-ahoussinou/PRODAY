import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { userToProDayCard } from '../../utils/prodayFutCard';
import type { ProDayPlayerCardData } from '../../models/ProDayCard';
import { useTabNavigationOptional } from '../../context/TabNavigationContext';
import { playerRsvpService, type PlayerRsvpStatus } from '../../services/playerRsvp.service';
import { teamEventsService } from '../../services/teamEvents.service';
import {
  isCoachMatchEvent,
  userRsvp,
  type RsvpStatus,
  type TeamEvent,
} from '../../models/TeamEvent';
import { PlayerPageGuideModal, type GuideSection } from '../../components/player/PlayerPageGuideModal';
import {
  playerColors,
  playerType,
  playerForm,
  playerCard,
  playerHeroCard,
  playerResponseTone,
  PLAYER_SURFACE_TOKENS,
} from '../../theme/playerDesignSystem';
import { CLUB_TOKENS } from '../../features/club/theme/clubTokens';

interface PlayerHomeScreenProps {
  onNavigateTab?: (tabId: 'stats' | 'wellness' | 'tactics') => void;
}

/** Statut réel du joueur pour un événement — source unique effet/requête/rétabli. */
function deriveRsvp(event: TeamEvent, uid: string): PlayerRsvpStatus {
  const stored = userRsvp(event, uid);
  if (stored === 'yes') return 'present';
  if (stored === 'no') return 'absent';
  return 'pending';
}

/**
 * Accueil joueur — refonte Player §4 : la page répond d'abord à quatre
 * questions (prochain événement · réponse attendue · activité récente ·
 * message important), sans tableau de bord dense. Forme « Apple Fitness » :
 * cartes plates à rayons généreux sur fond noir, typographie Apple system.
 * Toutes les couleurs viennent du socle partagé — aucune valeur littérale.
 */
export const PlayerHomeScreen: React.FC<PlayerHomeScreenProps> = ({ onNavigateTab }) => {
  const profile = useSessionProfile();
  const userId = profile?.uid || 'player-demo';
  const tabNav = useTabNavigationOptional();

  const [rsvp, setRsvp] = useState<PlayerRsvpStatus>('pending');
  const [rsvpError, setRsvpError] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  /** Prochain match réel (convocation du staff) — aucun match fictif. */
  const [nextMatch, setNextMatch] = useState<TeamEvent | null>(null);
  const [rsvpBusy, setRsvpBusy] = useState(false);

  useEffect(() => {
    if (!profile?.uid) return;
    let alive = true;
    teamEventsService
      .listForUser(profile.uid, profile.profile.club_id || undefined)
      .then((rows) => {
        if (!alive) return;
        const next = rows
          .filter(isCoachMatchEvent)
          .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())
          .find((e) => e.starts_at.getTime() >= Date.now() - 2 * 3600 * 1000);
        setNextMatch(next ?? null);
        if (next) {
          setRsvp(deriveRsvp(next, profile.uid));
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleRsvpChange = (status: PlayerRsvpStatus) => {
    prodayHaptics.impactMedium();
    if (!nextMatch || !profile?.uid) return;
    const mapped: RsvpStatus = status === 'present' ? 'yes' : status === 'absent' ? 'no' : 'maybe';
    setRsvpError(false);
    setRsvp(status); // Ack immédiat — la couleur répond avant le réseau.
    setRsvpBusy(true);
    teamEventsService
      .updateRsvp(nextMatch.id, profile.uid, mapped)
      .then(() => prodayHaptics.rsvpConfirm())
      .catch(() => {
        setRsvp(deriveRsvp(nextMatch, profile.uid));
        setRsvpError(true);
        prodayHaptics.error();
      })
      .finally(() => setRsvpBusy(false));
  };

  const guideSections: GuideSection[] = [
    {
      icon: 'card',
      iconColor: playerColors.accent,
      title: 'Ta carte officielle',
      description: 'Ta carte officielle ProDay résume ton identité, ton niveau réel et tes 3 métriques clés : matchs joués, note moyenne du staff et buts+passes. Touche-la pour accéder à ton passeport complet.',
      badge: 'IDENTITÉ',
    },
    {
      icon: 'checkmark-done-circle',
      iconColor: playerResponseTone.present.color,
      title: 'Réponse en un tap',
      description: 'Indique ton statut pour ton prochain match (Présent, Incertain ou Absent). Le staff voit immédiatement ta réponse pour préparer la feuille de match.',
      badge: 'EN 1 TAP',
    },
    {
      icon: 'partly-sunny',
      iconColor: CLUB_TOKENS.secondary,
      title: 'Prochain match & décompte',
      description: 'Visualise le décompte jusqu\'au coup d\'envoi de ton prochain match programmé par le staff.',
    },
    {
      icon: 'sparkles',
      iconColor: playerColors.accentAlt,
      title: 'Export Story (9:16)',
      description: 'Génère une story avec ta carte officielle et tes statistiques réelles pour valoriser ton statut sur les réseaux.',
    },
  ];

  const cardData: ProDayPlayerCardData = React.useMemo(() => {
    if (profile) {
      // Carte dérivée exclusivement des données réelles du profil —
      // les anciens overrides figés (18 matchs, 14 buts, OVR 87…) sont retirés.
      return userToProDayCard(profile, {});
    }
    // Invité sans profil : carte neutre, aucune statistique inventée.
    return {
      id: userId,
      role: 'player',
      tier: 'bronze',
      displayName: 'Invité',
      photoUrl: null,
      verified: false,
      accentHex: playerColors.textMuted,
      deepHex: playerColors.surfaceRaised,
      actions: ['view_profile'],
      firstName: 'Invité',
      lastName: '',
      age: 0,
      gender: 'M',
      nationality: 'FR',
      clubName: '—',
      primaryPosition: '—',
      strongFoot: 'R',
      heightCm: 0,
      weightKg: 0,
      levelLabel: '—',
      league: '—',
      levelBadge: 'amateur',
      overall: 0,
      formPct: 0,
      potential: 0,
      estimatedValueLabel: '—',
      matches: 0,
      goals: 0,
      assists: 0,
      minutesPlayed: 0,
      lastMatchLabel: '—',
      progressLabel: '—',
      skillBadges: [],
      aiObjectives: [],
      recruitmentStatus: '—',
    };
  }, [profile, userId]);

  const playerData = {
    id: cardData.id,
    name: cardData.displayName,
    pos: cardData.primaryPosition,
    ovr: cardData.overall,
    tier: cardData.overall >= 88 ? ('special' as const) : ('gold' as const),
    clubName: cardData.clubName,
    // Aucun attribut inventé : le radar détaillé sera branché sur les
    // évaluations réelles du staff / recruteurs.
    pac: 0,
    sho: 0,
    pas: 0,
    dri: 0,
    def: 0,
    phy: 0,
    matchesPlayed: cardData.matches,
    goals: cardData.goals,
    assists: cardData.assists,
  };

  const nextMatchWhen = nextMatch
    ? `${nextMatch.starts_at.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · ${nextMatch.starts_at.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    : null;

  const rsvpOptions: { status: PlayerRsvpStatus; icon: keyof typeof Ionicons.glyphMap }[] = [
    { status: 'present', icon: 'checkmark-circle' },
    { status: 'pending', icon: 'help-circle' },
    { status: 'absent', icon: 'close-circle' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. En-tête Identité & Contexte Équipe épuré */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.greetingText}>
            Bonjour, {cardData.firstName || 'Joueur'}
          </Text>
          <Text style={styles.teamSubHeader} numberOfLines={1}>
            {cardData.clubName !== '—' ? cardData.clubName : 'Sans club affilié'} · {cardData.primaryPosition !== '—' ? cardData.primaryPosition : 'Poste à renseigner'}
          </Text>
        </View>

        <View style={styles.headerBadges}>
          <View style={styles.levelPill}>
            <MaterialCommunityIcons name="shield-check" size={14} color={CLUB_TOKENS.secondary} />
            <Text style={styles.levelText} numberOfLines={1}>
              {cardData.levelLabel || 'Joueur'}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Priorité n°1 : Carte Prochain Événement & Convocation avec RSVP immédiat */}
      <View style={[styles.matchWidgetCard, playerCard(PLAYER_SURFACE_TOKENS)]}>
        <View style={styles.matchBadgeRow}>
          <View style={styles.matchLiveBadge}>
            <Ionicons name="calendar" size={12} color={playerColors.accent} />
            <Text style={styles.matchLiveBadgeText}>
              {nextMatch?.event_type === 'training' ? 'PROCHAIN ENTRAÎNEMENT' : 'PROCHAIN MATCH'}
            </Text>
          </View>
          {nextMatch && rsvp === 'pending' && (
            <Text style={styles.rsvpUrgentPill}>RÉPONSE ATTENDUE</Text>
          )}
        </View>

        {nextMatch ? (
          <>
            <Text style={styles.matchFixtureTitle} numberOfLines={2}>
              {nextMatch.title || 'Séance programmée'}
            </Text>
            <Text style={styles.matchCountdownSub} numberOfLines={2}>
              {nextMatchWhen}
              {nextMatch.location_label || nextMatch.city ? ` · ${nextMatch.location_label || nextMatch.city}` : ''}
            </Text>
          </>
        ) : (
          <View style={styles.matchEmptyBox}>
            <Ionicons name="calendar-outline" size={20} color={playerColors.textDim} />
            <Text style={styles.matchEmptyText}>
              Aucun match ou entraînement programmé pour l'instant. Les convocations du staff apparaîtront ici.
            </Text>
          </View>
        )}

        {/* Barre de réponse RSVP en un tap */}
        {nextMatch && (
          <View style={styles.rsvpSection}>
            <View style={styles.rsvpHeaderRow}>
              <Text style={styles.rsvpSectionTitle}>MON STATUT DE PRÉSENCE</Text>
              {rsvp === 'pending' && !rsvpBusy && (
                <Text style={styles.rsvpHintText}>Le coach attend ta confirmation</Text>
              )}
            </View>
            <View style={[styles.rsvpBar, rsvpBusy && styles.rsvpBarBusy]}>
              {rsvpOptions.map(({ status, icon }) => {
                const tone = playerResponseTone[status];
                const active = rsvp === status;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.rsvpBtn,
                      active && { backgroundColor: tone.color },
                      !active && { backgroundColor: playerColors.surfaceRaised, borderWidth: 1, borderColor: playerColors.border },
                    ]}
                    onPress={() => handleRsvpChange(status)}
                    disabled={rsvpBusy}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Répondre : ${tone.label}`}
                  >
                    <Ionicons
                      name={icon}
                      size={14}
                      color={active ? tone.ink : tone.color}
                    />
                    <Text
                      style={[
                        styles.rsvpBtnText,
                        { color: active ? tone.ink : playerColors.text },
                      ]}
                    >
                      {tone.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {rsvpError && (
              <Text style={styles.rsvpErrorText}>
                Réponse non enregistrée — vérifie ta connexion puis réessaie.
              </Text>
            )}
          </View>
        )}
      </View>

      {/* 3. Priorité n°2 : Carte Direct Vestiaire & Communications */}
      <TouchableOpacity
        style={[styles.announcementCard, playerCard(PLAYER_SURFACE_TOKENS)]}
        onPress={() => {
          prodayHaptics.selection();
          tabNav?.setActiveTab('messages');
        }}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Messages">
        <View style={styles.announcementInner}>
          <View style={styles.announcementIconBox}>
            <Ionicons name="chatbubbles" size={18} color={playerColors.accent} />
          </View>
          <View style={styles.announcementTextCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.announcementTitle}>Vestiaire & Communications</Text>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>DIRECT</Text>
              </View>
            </View>
            <Text style={styles.announcementSub}>
              Consulter les consignes du staff et échanges d'équipe.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={playerColors.textMuted} />
        </View>
      </TouchableOpacity>

      {/* 4. Priorité n°3 : Synthèse Essentielle & Accès Pages Dédiées */}
      <TouchableOpacity
        style={[styles.summaryCard, playerCard(PLAYER_SURFACE_TOKENS)]}
        onPress={() => {
          prodayHaptics.selection();
          tabNav?.setActiveTab('profil');
        }}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <View style={styles.summaryInner}>
          <View style={styles.summaryLeftCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="shield-checkmark" size={17} color={playerColors.accent} />
              <Text style={styles.summaryTitle}>Passeport & Carte Officielle</Text>
            </View>
            <Text style={styles.summarySub}>
              {cardData.matches > 0
                ? `${cardData.matches} match${cardData.matches > 1 ? 's' : ''} disputé${cardData.matches > 1 ? 's' : ''} · Note globale ${cardData.overall > 0 ? cardData.overall : '—'}`
                : 'Fiche joueur prête · Données et passeport à jour'}
            </Text>
          </View>
          <View style={styles.summaryActionWrap}>
            <Text style={styles.summaryActionText}>Voir fiche →</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Guide interactif si besoin */}
      <PlayerPageGuideModal
        visible={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        pageTitle="Cockpit & Carte Officielle"
        pageSubtitle="Ton centre de contrôle joueur ProDay"
        badgeLabel="GUIDE DU COCKPIT"
        badgeColor={playerColors.accent}
        introText="Bienvenue sur ton Cockpit personnel. Cet écran rassemble ton identité de joueur et ta disponibilité pour le prochain match."
        sections={guideSections}
        proTip="Mets à jour ton statut au moins 48h avant la rencontre pour aider le coach à préparer la feuille de match."
        ctaLabel="C'est parti !"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: playerColors.bg,
  },
  content: {
    padding: playerForm.space.lg,
    paddingBottom: playerForm.space.xxl,
  },

  /* En-tête */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: playerForm.space.lg,
  },
  greetingText: {
    ...playerType.subheadline,
    color: playerColors.textMuted,
  },
  nameHeader: {
    ...playerType.title,
    color: playerColors.text,
    maxWidth: 220,
  },
  teamSubHeader: {
    ...playerType.caption,
    color: playerColors.textDim,
    marginTop: 2,
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: playerForm.space.sm,
  },
  guideIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: playerForm.chipHeight - 12,
    backgroundColor: playerColors.accentSoft,
    borderWidth: 1,
    borderColor: playerColors.border,
    paddingHorizontal: 9,
    borderRadius: playerForm.chipRadius,
  },
  guideBtnText: {
    ...playerType.micro,
    fontWeight: '800',
    color: playerColors.accent,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: playerForm.chipHeight - 12,
    backgroundColor: playerColors.surfaceRaised,
    borderWidth: 1,
    borderColor: playerColors.border,
    paddingHorizontal: 10,
    borderRadius: playerForm.chipRadius,
  },
  levelText: {
    ...playerType.micro,
    fontWeight: '800',
    color: CLUB_TOKENS.secondary,
    maxWidth: 110,
  },

  /* Widget prochain match */
  matchWidgetCard: {
    padding: playerForm.cardPaddingH,
    marginBottom: playerForm.space.md,
  },
  matchBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: playerForm.space.sm,
  },
  matchLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: playerColors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: playerForm.fieldRadius - 10,
  },
  matchLiveBadgeText: {
    ...playerType.micro,
    fontWeight: '800',
    color: playerColors.accent,
    letterSpacing: 0.5,
  },
  rsvpUrgentPill: {
    ...playerType.micro,
    fontWeight: '800',
    color: CLUB_TOKENS.warning,
    backgroundColor: CLUB_TOKENS.warningSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: playerForm.fieldRadius - 10,
    letterSpacing: 0.5,
  },
  matchFixtureTitle: {
    ...playerType.headline,
    color: playerColors.text,
  },
  matchCountdownSub: {
    ...playerType.caption,
    color: playerColors.textMuted,
    marginTop: 2,
  },
  matchEmptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: playerForm.space.sm,
    backgroundColor: playerColors.surfaceRaised,
    borderRadius: playerForm.fieldRadius,
    paddingHorizontal: playerForm.space.md,
    paddingVertical: playerForm.space.md,
  },
  matchEmptyText: {
    ...playerType.caption,
    color: playerColors.textMuted,
    flex: 1,
  },
  rsvpSection: {
    paddingTop: playerForm.space.md,
    marginTop: playerForm.space.md,
    borderTopWidth: playerForm.separatorThickness,
    borderTopColor: playerColors.border,
  },
  rsvpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: playerForm.space.sm,
    marginBottom: playerForm.space.sm,
  },
  rsvpHintText: {
    ...playerType.caption,
    color: CLUB_TOKENS.warning,
  },
  rsvpErrorText: {
    ...playerType.caption,
    color: CLUB_TOKENS.danger,
    marginTop: playerForm.space.sm,
  },
  rsvpBarBusy: {
    opacity: 0.6,
  },
  rsvpSectionTitle: {
    ...playerType.micro,
    fontWeight: '800',
    color: playerColors.textDim,
    marginBottom: playerForm.space.sm,
    letterSpacing: 0.5,
  },
  rsvpBar: {
    flexDirection: 'row',
    gap: playerForm.chipGap - 6,
  },
  rsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 44,
    borderRadius: playerForm.fieldRadius,
  },
  rsvpBtnText: {
    ...playerType.callout,
    color: playerColors.text,
  },

  /* Annonces / Vestiaire */
  announcementCard: {
    marginBottom: playerForm.space.md,
    overflow: 'hidden',
  },
  announcementInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: playerForm.cardPaddingH,
    paddingVertical: playerForm.cardPaddingV - 2,
    gap: playerForm.space.md,
  },
  announcementIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: playerColors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementTextCol: {
    flex: 1,
    minWidth: 0,
  },
  announcementTitle: {
    ...playerType.headline,
    color: playerColors.text,
  },
  announcementSub: {
    ...playerType.caption,
    color: playerColors.textMuted,
    marginTop: 2,
  },
  activePill: {
    backgroundColor: CLUB_TOKENS.successSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activePillText: {
    ...playerType.micro,
    fontWeight: '800',
    color: CLUB_TOKENS.secondary,
    letterSpacing: 0.5,
  },

  /* Synthèse essentielle */
  summaryCard: {
    padding: playerForm.cardPaddingH,
    marginBottom: playerForm.space.md,
  },
  summaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: playerForm.space.md,
  },
  summaryLeftCol: {
    flex: 1,
    minWidth: 0,
  },
  summaryTitle: {
    ...playerType.headline,
    color: playerColors.text,
  },
  summarySub: {
    ...playerType.caption,
    color: playerColors.textMuted,
    marginTop: 2,
  },
  summaryActionWrap: {
    backgroundColor: playerColors.surfaceRaised,
    borderRadius: playerForm.chipRadius,
    borderWidth: 1,
    borderColor: playerColors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  summaryActionText: {
    ...playerType.caption,
    fontWeight: '700',
    color: playerColors.accent,
  },
});
