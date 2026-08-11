import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { ProDayText } from '../components/ui/ProDayText';
import { PressableSpring, PushScreenTransition } from '../components/motion';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useJoueurSession } from '../context/JoueurSessionContext';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';
import { membershipsService } from '../services/memberships.service';
import { clubsService } from '../services/clubs.service';
import { clubAnnouncementsService } from '../services/clubAnnouncements.service';
import type { Membership } from '../models/Membership';
import type { Club } from '../models/Club';
import type { ClubAnnouncement } from '../models/ClubAnnouncement';
import { JoinClubScreen } from './JoinClubScreen';
import { ClubAnnouncementsScreen } from './ClubAnnouncementsScreen';
import { PlayersListScreen } from './PlayersListScreen';
import {
  JoueurPageFrame,
  JoueurSectionCard,
  JoueurActionRow,
  JoueurEmptyState,
} from '../components/player/joueurPortalUi';
import { JOUEUR_SITE, resolveJoueurPageIdentity } from '../content/joueurPageIdentity';
import { spacing } from '../theme/designTokens';

type Overlay = 'join' | 'announcements' | 'roster' | null;

/** Onglet Club — chrome univers joueur (âge × genre). */
export const AmateurClubScreen: React.FC = () => {
  const profile = useSessionProfile();
  const session = useJoueurSession();
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [overlay, setOverlay] = useState<Overlay>(null);

  const load = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const active =
        (await membershipsService.getActiveForPlayer(profile.uid)) ??
        (await membershipsService.listByPlayer(profile.uid)).find((m) => m.status === 'pending') ??
        null;
      setMembership(active);
      const clubId = active?.club_id ?? profile.profile.club_id;
      if (clubId) {
        const [clubDoc, ann] = await Promise.all([
          clubsService.getById(clubId),
          clubAnnouncementsService.listByClub(clubId),
        ]);
        setClub(clubDoc);
        setAnnouncements(ann.slice(0, 3));
      } else {
        setClub(null);
        setAnnouncements([]);
      }
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void load();
  }, [load]);

  const identity = useMemo(
    () =>
      session?.identity ??
      resolveJoueurPageIdentity({
        ageGroup: 'adult',
        gender: 'neutral',
        displayName: profile?.display_name,
      }),
    [session?.identity, profile?.display_name],
  );

  const copy = useMemo(() => {
    const g = session?.ageGroup ?? 'adult';
    if (g === 'youth') {
      return {
        caption: 'Mon club',
        title: club?.name ?? 'Mon équipe',
        subtitle: 'Annonces et potes du club',
        statusKicker: 'Statut',
        annonces: 'Messages du club',
        effectif: 'Mes potes',
        effectifSub: 'Voir qui joue avec toi',
        join: 'Rejoindre un club',
      };
    }
    if (g === 'teen') {
      return {
        caption: 'Club · XP',
        title: club?.name ?? 'Mon club',
        subtitle: 'Annonces, effectif, missions club',
        statusKicker: 'Licence',
        annonces: 'Feed club',
        effectif: 'Effectif',
        effectifSub: 'Coéquipiers et staff',
        join: 'Trouver un club',
      };
    }
    return {
      caption: 'Club',
      title: club?.name ?? 'Mon club',
      subtitle: 'Annonces, effectif, vie du club',
      statusKicker: 'Statut',
      annonces: 'Annonces',
      effectif: 'Effectif',
      effectifSub: 'Coéquipiers et staff',
      join: 'Rejoindre un club',
    };
  }, [session?.ageGroup, club?.name]);

  const statusLabel = useMemo(() => {
    if (!membership) return 'Sans club';
    if (membership.status === 'pending') return 'Demande en attente';
    if (membership.status === 'active') return 'Licencié';
    return membership.status;
  }, [membership]);

  if (!profile) return null;

  return (
    <View style={styles.root}>
      <TabScreenShell
        caption={copy.caption}
        title={copy.title}
        subtitle={copy.subtitle}
        flat
      >
        {loading ? (
          <ActivityIndicator color={identity.accent} style={styles.loader} />
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_CONTENT_INSET }]}
            showsVerticalScrollIndicator={false}
          >
            <JoueurPageFrame identity={identity} showHero={false}>
              <View style={styles.stack}>
                <JoueurSectionCard
                  kicker={copy.statusKicker}
                  title={statusLabel}
                  body={club?.city ?? undefined}
                >
                  {!membership || membership.status !== 'active' ? (
                    <JoueurActionRow
                      primary={copy.join}
                      onPrimary={() => setOverlay('join')}
                    />
                  ) : null}
                </JoueurSectionCard>

                {announcements.length === 0 ? (
                  <JoueurEmptyState
                    title={copy.annonces}
                    body="Aucune annonce pour le moment."
                    cta={club ? 'Ouvrir le fil' : undefined}
                    onPress={club ? () => setOverlay('announcements') : undefined}
                  />
                ) : (
                  <JoueurSectionCard kicker="Club" title={copy.annonces}>
                    <View style={styles.list}>
                      {announcements.map((item) => (
                        <PressableSpring
                          key={item.id}
                          onPress={() => setOverlay('announcements')}
                          style={styles.annItem}
                        >
                          <ProDayText variant="caption" style={styles.annTitle}>
                            {item.title}
                          </ProDayText>
                          <ProDayText variant="caption" style={styles.annBody} numberOfLines={2}>
                            {item.body}
                          </ProDayText>
                        </PressableSpring>
                      ))}
                    </View>
                    <JoueurActionRow
                      primary="Toutes les annonces"
                      onPrimary={() => setOverlay('announcements')}
                    />
                  </JoueurSectionCard>
                )}

                <JoueurSectionCard
                  kicker="Groupe"
                  title={copy.effectif}
                  body={copy.effectifSub}
                >
                  <JoueurActionRow
                    primary="Voir l’effectif"
                    onPrimary={() => setOverlay('roster')}
                  />
                </JoueurSectionCard>
              </View>
            </JoueurPageFrame>
          </ScrollView>
        )}
      </TabScreenShell>

      <PushScreenTransition active={overlay === 'join'}>
        {overlay === 'join' ? (
          <JoinClubScreen
            profile={profile}
            onBack={() => setOverlay(null)}
            onJoined={() => {
              setOverlay(null);
              void load();
            }}
          />
        ) : null}
      </PushScreenTransition>
      <PushScreenTransition active={overlay === 'announcements'}>
        {overlay === 'announcements' ? (
          <ClubAnnouncementsScreen profile={profile} onBack={() => setOverlay(null)} />
        ) : null}
      </PushScreenTransition>
      <PushScreenTransition active={overlay === 'roster'}>
        {overlay === 'roster' ? (
          <PlayersListScreen onBack={() => setOverlay(null)} onSelectPlayer={() => undefined} />
        ) : null}
      </PushScreenTransition>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: JOUEUR_SITE.bg },
  loader: { marginTop: spacing.xl },
  scroll: { flexGrow: 1 },
  stack: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  list: { gap: spacing.sm, marginTop: spacing.xs },
  annItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: JOUEUR_SITE.border,
    paddingTop: spacing.sm,
    gap: 2,
  },
  annTitle: { color: JOUEUR_SITE.foreground, fontWeight: '700' },
  annBody: { color: JOUEUR_SITE.muted },
});
