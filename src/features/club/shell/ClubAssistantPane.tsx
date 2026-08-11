import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  ClubActionRow,
  ClubSectionCard,
  ClubKpiRow,
} from '../../../components/club/clubPortalUi';
import { ClubLiveChat } from '../../../components/club/ClubLiveChat';
import { PressableSpring } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { CLUB_SITE } from '../../../content/clubPageIdentity';
import { CLUB_OFFERS } from '../../../content/clubOffers';
import {
  resolveClubOfferId,
  userHasClubAiAssistant,
} from '../../../utils/clubFeatureAccess';
import { buildClubAiBriefing } from '../../../utils/clubAiBriefing';
import { clubsService } from '../../../services/clubs.service';
import { teamsService } from '../../../services/teams.service';
import { membershipsService } from '../../../services/memberships.service';
import { usersService } from '../../../services/users.service';
import { clubRosterBoardService } from '../../../services/clubRosterBoard.service';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { useClubShellNav } from './ClubShellNavContext';
import { openClubHelpChatbot } from './clubHelpOpen';
import { spacing } from '../../../theme/designTokens';

const STARTERS = [
  'Par où je commence si mon club est encore vide ?',
  'J’ai des adhésions en attente, tu me guides ?',
  'Vivier ou Mercato — qu’est-ce qui a le plus de sens ?',
  'Quelle formule pour les tournois et la vidéo ?',
];

/**
 * Assistant IA Club — chat live Mistral + briefing factuel.
 */
export function ClubAssistantPane() {
  const profile = useSessionProfile();
  const shellNav = useClubShellNav();
  const offerId = resolveClubOfferId(profile);
  const hasAi = userHasClubAiAssistant(profile);
  const offer = offerId ? CLUB_OFFERS[offerId] : null;

  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<ReturnType<typeof buildClubAiBriefing> | null>(null);

  const clubId = profile?.profile.club_id ?? profile?.uid;

  const load = useCallback(async () => {
    if (!clubId || !profile) {
      setLoading(false);
      return;
    }
    try {
      const [clubRow, teamRows, membershipRows, memberRows, internalNeeds, externalNeeds] =
        await Promise.all([
          clubsService.getById(clubId),
          teamsService.listByClubId(clubId),
          membershipsService.listByClub(clubId),
          usersService.listMembersByClubId(clubId),
          clubRosterBoardService.listNeedsForClub(clubId, 'internal').catch(() => []),
          clubRosterBoardService.listNeedsForClub(clubId, 'external').catch(() => []),
        ]);
      const coachCount = new Set(teamRows.flatMap((t) => t.coach_uids)).size;
      const pending = membershipRows.filter((m) => m.status === 'pending').length;
      const teamsWithoutCoach = teamRows.filter((t) => !t.coach_uids?.length).length;
      setBriefing(
        buildClubAiBriefing({
          clubName: clubRow?.name ?? profile.display_name ?? 'Club',
          teamsCount: teamRows.length,
          playersCount: memberRows.length,
          coachesCount: coachCount,
          pendingMemberships: pending,
          teamsWithoutCoach,
          openInternalNeeds: internalNeeds.filter((n) => n.status === 'open').length,
          openExternalNeeds: externalNeeds.filter((n) => n.status === 'open').length,
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [clubId, profile]);

  useEffect(() => {
    void load();
  }, [load]);

  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        {offer ? (
          <ClubKpiRow
            items={[
              { label: 'Formule', value: offer.shortLabel },
              { label: 'IA', value: hasAi ? 'Contexte' : 'Chat' },
              {
                label: 'Coachs',
                value: offer.coachesIncluded ? 'Inclus' : 'Indiv.',
              },
              {
                label: 'Attente',
                value: briefing ? String(briefing.priorities.length) : '—',
              },
            ]}
          />
        ) : (
          <ClubSectionCard
            kicker="Formule"
            title="Chat disponible"
            body="Le copilote répond en direct. Activez une offre Club pour débloquer structure, calendrier et modules."
          >
            <ClubActionRow
              primary="Voir les offres"
              onPrimary={() => shellNav?.requestNav('offers')}
            />
          </ClubSectionCard>
        )}

        {loading ? (
          <ActivityIndicator color={CLUB_SITE.accent} style={styles.loader} />
        ) : briefing ? (
          <View style={styles.briefStrip}>
            <ProDayText variant="caption" style={styles.briefKicker}>
              Briefing
            </ProDayText>
            <ProDayText variant="caption" style={styles.briefText} numberOfLines={2}>
              {briefing.summary}
            </ProDayText>
            {hasAi && briefing.suggestions[0] ? (
              <PressableSpring
                onPress={() => {
                  const s = briefing.suggestions[0]!;
                  if (s.chapter === 'structure') return shellNav?.requestNav('structure');
                  if (s.chapter === 'vivier') return shellNav?.requestNav('vivier');
                  shellNav?.requestNav('today');
                }}
                scaleTo={0.98}
                style={styles.briefCta}
              >
                <ProDayText variant="caption" style={styles.briefCtaText}>
                  {briefing.suggestions[0].title} →
                </ProDayText>
              </PressableSpring>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.chat}>
        <ClubLiveChat starters={STARTERS} />
      </View>

      <PressableSpring onPress={() => openClubHelpChatbot()} scaleTo={0.98} style={styles.faqLink}>
        <ProDayText variant="caption" style={styles.faqText}>
          Aide menu (FAQ) — navigation des dossiers
        </ProDayText>
      </PressableSpring>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0 },
    top: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      gap: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: CLUB_SITE.border,
      paddingBottom: spacing.sm,
    },
    loader: { marginVertical: spacing.sm },
    briefStrip: { gap: 4 },
    briefKicker: {
      color: CLUB_SITE.accent,
      textTransform: 'uppercase',
      letterSpacing: 2,
      fontSize: 10,
      fontWeight: '800',
    },
    briefText: { color: CLUB_SITE.muted, lineHeight: 17 },
    briefCta: { alignSelf: 'flex-start', marginTop: 2 },
    briefCtaText: { color: CLUB_SITE.accent, fontWeight: '700' },
    chat: { flex: 1, minHeight: 0 },
    faqLink: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: CLUB_SITE.border,
    },
    faqText: { color: CLUB_SITE.muted, textAlign: 'center' },
  });
}
