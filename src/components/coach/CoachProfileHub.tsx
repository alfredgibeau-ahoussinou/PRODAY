import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { User } from '../../models/User';
import type { TeamEvent } from '../../models/TeamEvent';
import { COACH_SITE, getCoachPageIdentity } from '../../content/coachPageIdentity';
import {
  CoachActionRow,
  CoachKpiRow,
  CoachSectionCard,
  CoachText,
} from './coachPortalUi';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { getProfileCompletion } from '../../utils/profileCompletion';
import { buildCoachAiNowActions } from '../../utils/coachAiInsights';
import { buildCoachProfileStats, type CoachProfileStats } from '../../utils/coachProfileStats';
import { teamEventsService } from '../../services/teamEvents.service';
import { usersService } from '../../services/users.service';
import { findCoachNavItem } from '../../features/coach/navigation/coachNavConfig';
import { spacing } from '../../theme/designTokens';

const PROFILE_QUICK_NAV_IDS = ['today', 'equipe', 'coach_ia', 'messages', 'plus'] as const;

type Props = {
  profile: User;
  subscriptionTier?: 'free' | 'pro';
  onEdit?: () => void;
  onPublicProfile?: () => void;
  onAvatarPress?: () => void;
  onSubscriptionPress?: () => void;
  /** Aperçu actions assistant IA (depuis coachAiEngine). */
  aiActionPreview?: { title: string; detail: string }[];
  /** Charge effectif et événements club pour stats réelles. */
  selfLoadClubData?: boolean;
  coachStats?: CoachProfileStats;
  clubName?: string;
  teamName?: string;
};

function splitDisplayName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return { first: parts[0] ?? 'Coach', last: '' };
  return { first: parts[0]!, last: parts.slice(1).join(' ') };
}

export function CoachProfileHub({
  profile,
  subscriptionTier = 'free',
  onEdit,
  onPublicProfile,
  onAvatarPress,
  onSubscriptionPress,
  aiActionPreview,
  selfLoadClubData = true,
  coachStats: coachStatsProp,
  clubName,
  teamName,
}: Props) {
  const identity = getCoachPageIdentity('profil');
  const shellNav = useCoachShellNav();
  const nav = useTabNavigationActions();
  const p = profile.profile;
  const completion = useMemo(() => getProfileCompletion(profile).percent, [profile]);
  const verified = profile.is_verified && profile.verification_status === 'VERIFIED';
  const title = p.job_title?.trim() || 'Entraîneur';
  const diploma = p.diploma?.trim() || 'Diplôme à renseigner';
  const specialties = p.specialties ?? [];
  const experiences = p.experiences ?? [];
  const diplomas = p.diplomas_list?.length ?? (p.diploma ? 1 : 0);
  const initial = (profile.display_name?.trim()?.charAt(0) || 'C').toUpperCase();
  const { first, last } = splitDisplayName(profile.display_name ?? 'Coach');
  const category = p.category?.trim() || 'Catégorie à renseigner';
  const clubLabel = clubName?.trim() || profile.profile.club_id ? 'Club rattaché' : 'Aucun club';
  const teamLabel = teamName?.trim() || 'Équipe à renseigner';

  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [members, setMembers] = useState<User[]>([]);

  useEffect(() => {
    if (!selfLoadClubData || !profile.profile.club_id) return;
    const clubId = profile.profile.club_id;
    void Promise.all([
      teamEventsService.listForClub(clubId).catch(() => [] as TeamEvent[]),
      usersService.listMembersByClubId(clubId).catch(() => [] as User[]),
    ]).then(([ev, mem]) => {
      setEvents(ev);
      setMembers(mem);
    });
  }, [selfLoadClubData, profile.profile.club_id, profile.uid]);

  const coachStats = useMemo(
    () =>
      coachStatsProp ??
      buildCoachProfileStats(events, members, profile.uid),
    [coachStatsProp, events, members, profile.uid],
  );

  const resolvedAiPreview = useMemo(() => {
    if (aiActionPreview && aiActionPreview.length > 0) return aiActionPreview;
    return buildCoachAiNowActions({
      events,
      members,
      hasClub: Boolean(profile.profile.club_id),
    })
      .slice(0, 3)
      .map((a) => ({ title: a.title, detail: a.detail }));
  }, [aiActionPreview, events, members, profile.profile.club_id]);

  const open = (
    id:
      | 'today'
      | 'entrainements'
      | 'match_center'
      | 'equipe'
      | 'joueurs'
      | 'smart_tactics'
      | 'forme'
      | 'coach_ia'
      | 'gestion',
  ) => {
    if (shellNav) shellNav.requestNav(id);
    else if (id === 'match_center') nav.openMatchs();
    else if (id === 'smart_tactics' || id === 'forme') nav.openDashboard('smart_tactics');
    else nav.setActiveTab('home');
  };

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <LinearGradient
          colors={[COACH_SITE.soft, COACH_SITE.surface]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.heroTop}>
          <View style={styles.heroTopLeft}>
            <Icon name={identity.icon} size={12} color={COACH_SITE.accent} />
            <ProDayText variant="caption" style={styles.kicker}>
              {identity.eyebrow}
            </ProDayText>
          </View>
          {verified ? (
            <View style={styles.verifiedPill}>
              <Icon name="checkmark-circle" size={12} color={COACH_SITE.accent} />
              <ProDayText variant="caption" style={styles.verifiedText}>
                Vérifié
              </ProDayText>
            </View>
          ) : (
            <View style={styles.pendingPill}>
              <ProDayText variant="caption" style={styles.pendingText}>
                À vérifier
              </ProDayText>
            </View>
          )}
        </View>

        <PressableSpring onPress={onAvatarPress} scaleTo={0.98} haptic style={styles.avatarWrap}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <ProDayText variant="title" style={styles.avatarLetter}>
                {initial}
              </ProDayText>
            </View>
          )}
          <View style={styles.avatarBadge}>
            <Icon name="camera" size={12} color="#fff" />
          </View>
        </PressableSpring>

        <ProDayText variant="title" numberOfLines={1} style={styles.name}>
          {first}
          {last ? ` ${last}` : ''}
        </ProDayText>
        <ProDayText variant="caption" numberOfLines={1} style={styles.meta}>
          {title}
          {profile.city ? ` · ${profile.city}` : ''}
          {subscriptionTier === 'pro' ? ' · Coach Pro' : ''}
        </ProDayText>
        <View style={styles.identityRow}>
          <View style={styles.identityChip}>
            <CoachText variant="caption" muted>
              Club
            </CoachText>
            <CoachText variant="caption">{clubLabel}</CoachText>
          </View>
          <View style={styles.identityChip}>
            <CoachText variant="caption" muted>
              Équipe
            </CoachText>
            <CoachText variant="caption" numberOfLines={1}>
              {teamLabel}
            </CoachText>
          </View>
          <View style={styles.identityChip}>
            <CoachText variant="caption" muted>
              Cat.
            </CoachText>
            <CoachText variant="caption">{category}</CoachText>
          </View>
        </View>
        {p.bio?.trim() ? (
          <ProDayText variant="caption" numberOfLines={3} style={styles.bio}>
            {p.bio.trim()}
          </ProDayText>
        ) : (
          <ProDayText variant="caption" style={styles.bioMuted}>
            Ajoute une bio pour ta vitrine publique.
          </ProDayText>
        )}
      </View>

      <CoachKpiRow
        items={[
          { label: 'Profil', value: `${completion}%` },
          { label: 'Diplômes', value: String(diplomas) },
          { label: 'Exp.', value: String(experiences.length) },
          {
            label: 'Note',
            value: p.rating != null ? p.rating.toFixed(1) : '—',
            tone: p.rating != null ? COACH_SITE.accent : undefined,
          },
        ]}
      />

      <CoachSectionCard
        kicker="Activité coach"
        title="Stats réelles"
        body="Compteurs depuis votre calendrier ProDay — pas de chiffres inventés."
      >
        <CoachKpiRow
          items={[
            { label: 'Séances', value: String(coachStats.sessionsCreated) },
            { label: 'Matchs', value: String(coachStats.matchesManaged) },
            { label: 'Feuilles', value: String(coachStats.matchesWithSheets) },
            { label: 'Effectif', value: String(coachStats.rosterSize) },
          ]}
        />
      </CoachSectionCard>

      <CoachSectionCard
        kicker="Identité terrain"
        title={diploma}
        body={
          p.license_number
            ? `Licence ${p.license_number}`
            : 'Numéro de licence et parcours à compléter.'
        }
      >
        {experiences.length > 0 ? (
          <View style={styles.expList}>
            {experiences.slice(0, 3).map((exp) => (
              <CoachText key={exp.id} variant="caption" muted>
                {exp.organization}
                {exp.title ? ` · ${exp.title}` : ''}
                {exp.period ? ` (${exp.period})` : ''}
              </CoachText>
            ))}
          </View>
        ) : (
          <CoachText variant="caption" muted style={styles.hint}>
            Parcours et expériences à renseigner dans le profil.
          </CoachText>
        )}
        {specialties.length ? (
          <View style={styles.tags}>
            {specialties.slice(0, 6).map((s) => (
              <View key={s} style={styles.tag}>
                <ProDayText variant="caption" style={styles.tagText}>
                  {s}
                </ProDayText>
              </View>
            ))}
          </View>
        ) : (
          <ProDayText variant="caption" style={styles.hint}>
            Spécialités : tactique, jeunes, prépa physique…
          </ProDayText>
        )}
        <CoachActionRow
          primary="Modifier le profil"
          onPrimary={() => onEdit?.()}
          secondary="Vitrine"
          onSecondary={() => onPublicProfile?.()}
        />
      </CoachSectionCard>

      <CoachSectionCard
        kicker="Intelligence"
        title="Mon assistant IA"
        body="Synthèse équipe, stratégie et actions — uniquement depuis vos données ProDay."
      >
        {resolvedAiPreview.length > 0 ? (
          <View style={styles.aiPreview}>
            {resolvedAiPreview.map((a) => (
              <View key={a.title} style={styles.aiPreviewRow}>
                <CoachText variant="caption" style={styles.aiPreviewTitle}>
                  {a.title}
                </CoachText>
                <CoachText variant="caption" muted numberOfLines={2}>
                  {a.detail}
                </CoachText>
              </View>
            ))}
          </View>
        ) : (
          <CoachText variant="caption" muted style={styles.hint}>
            Constituez votre effectif et vos feuilles de match pour activer l’assistant.
          </CoachText>
        )}
        <CoachActionRow primary="Ouvrir l’assistant IA" onPrimary={() => open('coach_ia')} />
      </CoachSectionCard>

      {coachStats.recentActivity.length > 0 ? (
        <CoachSectionCard
          kicker="Fil d’activité"
          title="Événements récents"
          body="Derniers items de votre calendrier club."
        >
          {coachStats.recentActivity.map((a) => (
            <View key={`${a.label}-${a.date.getTime()}`} style={styles.activityRow}>
              <CoachText variant="caption" numberOfLines={1} style={styles.activityLabel}>
                {a.label}
              </CoachText>
              <CoachText variant="caption" muted>
                {a.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </CoachText>
            </View>
          ))}
        </CoachSectionCard>
      ) : null}

      <CoachSectionCard
        kicker="Commandes"
        title="Accès rapide"
        body="Navigation principale — les outils détaillés sont dans Menu."
      >
        <View style={styles.grid}>
          {PROFILE_QUICK_NAV_IDS.map((id) => {
            const item = findCoachNavItem(id);
            if (!item) return null;
            return (
              <PressableSpring
                key={item.id}
                onPress={() => open(item.id)}
                scaleTo={0.97}
                haptic
                style={styles.gridBtn}
              >
                <Icon name={item.icon} size={16} color={COACH_SITE.accent} />
                <ProDayText variant="caption" style={styles.gridLabel}>
                  {item.shortLabel ?? item.label}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>
        {onSubscriptionPress ? (
          <CoachActionRow
            primary={subscriptionTier === 'pro' ? 'Abonnement' : 'Passer Coach Pro'}
            onPrimary={onSubscriptionPress}
          />
        ) : null}
      </CoachSectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  hero: {
    borderRadius: 18,
    padding: spacing.lg,
    overflow: 'hidden',
    gap: spacing.sm,
    backgroundColor: COACH_SITE.surface,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  heroTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kicker: {
    color: COACH_SITE.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${COACH_SITE.accent}88`,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedText: {
    color: COACH_SITE.accent,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.4,
  },
  pendingPill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COACH_SITE.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingText: {
    color: COACH_SITE.muted,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.4,
  },
  avatarWrap: { alignSelf: 'flex-start', marginTop: spacing.xs },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: `${COACH_SITE.accent}99`,
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: `${COACH_SITE.accent}99`,
    backgroundColor: COACH_SITE.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: COACH_SITE.foreground, fontWeight: '800' },
  avatarBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COACH_SITE.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: COACH_SITE.foreground,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontSize: 26,
    marginTop: spacing.sm,
  },
  meta: { color: COACH_SITE.accent, fontWeight: '700' },
  identityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  identityChip: {
    flex: 1,
    minWidth: 88,
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: COACH_SITE.elevated,
    gap: 2,
  },
  bio: { color: COACH_SITE.muted, lineHeight: 18, marginTop: 2 },
  bioMuted: { color: COACH_SITE.muted, lineHeight: 18, marginTop: 2 },
  expList: { gap: 4, marginBottom: spacing.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  tag: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${COACH_SITE.accent}66`,
    backgroundColor: COACH_SITE.soft,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: { color: COACH_SITE.foreground, fontWeight: '700', fontSize: 11 },
  hint: { color: COACH_SITE.muted, marginTop: spacing.xs },
  aiPreview: { gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.sm },
  aiPreviewRow: {
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: COACH_SITE.elevated,
  },
  aiPreviewTitle: { fontWeight: '700', marginBottom: 4 },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COACH_SITE.border,
  },
  activityLabel: { flex: 1, fontWeight: '600' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  gridBtn: {
    width: '31%',
    minWidth: 96,
    flexGrow: 1,
    backgroundColor: COACH_SITE.elevated,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  gridLabel: {
    color: COACH_SITE.foreground,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
