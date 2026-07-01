import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDaySurface } from '../components/ui/ProDaySurface';
import { Icon } from '../components/ui/Icon';
import { PressableSpring, PushScreenTransition } from '../components/motion';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useAppTheme } from '../context/ProductLineContext';
import { spacing, radius } from '../theme/designTokens';
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

type Overlay = 'join' | 'announcements' | 'roster' | null;

/** Onglet Club du shell amateur joueur — actus, effectif, adhésion. */
export const AmateurClubScreen: React.FC = () => {
  const profile = useSessionProfile();
  const { colors } = useAppTheme();
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
        caption="Club"
        title={club?.name ?? 'Mon club'}
        subtitle="Annonces, effectif et vie du club"
        flat
      >
        {loading ? (
          <ActivityIndicator color={colors.brand} style={styles.loader} />
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_CONTENT_INSET }]}
            showsVerticalScrollIndicator={false}
          >
            <ProDaySurface style={styles.statusCard}>
              <ProDayText variant="eyebrow" muted>
                Statut
              </ProDayText>
              <ProDayText variant="section">{statusLabel}</ProDayText>
              {club?.city ? (
                <ProDayText variant="caption" muted>
                  {club.city}
                </ProDayText>
              ) : null}
              {!membership || membership.status !== 'active' ? (
                <PressableSpring
                  style={[styles.cta, { backgroundColor: colors.brand }]}
                  onPress={() => setOverlay('join')}
                  haptic
                >
                  <Icon name="add" size={18} color={colors.brandInverse} />
                  <ProDayText variant="caption" style={{ color: colors.brandInverse }}>
                    Rejoindre un club
                  </ProDayText>
                </PressableSpring>
              ) : null}
            </ProDaySurface>

            <ProDayText variant="eyebrow" muted style={styles.section}>
              Annonces
            </ProDayText>
            {announcements.length === 0 ? (
              <ProDaySurface style={styles.empty}>
                <ProDayText variant="body" muted>
                  Aucune annonce pour le moment.
                </ProDayText>
              </ProDaySurface>
            ) : (
              announcements.map((item) => (
                <ProDaySurface key={item.id} style={styles.announcement}>
                  <ProDayText variant="caption">{item.title}</ProDayText>
                  <ProDayText variant="caption" muted numberOfLines={2}>
                    {item.body}
                  </ProDayText>
                </ProDaySurface>
              ))
            )}
            {club ? (
              <PressableSpring onPress={() => setOverlay('announcements')} haptic>
                <ProDayText variant="caption" style={{ color: colors.accent }}>
                  Voir toutes les annonces
                </ProDayText>
              </PressableSpring>
            ) : null}

            <ProDayText variant="eyebrow" muted style={styles.section}>
              Effectif
            </ProDayText>
            <PressableSpring
              style={[styles.rowAction, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => setOverlay('roster')}
              haptic
            >
              <Icon name="people" size={20} color={colors.accent} />
              <View style={styles.rowBody}>
                <ProDayText variant="caption">Voir l'effectif</ProDayText>
                <ProDayText variant="caption" muted>
                  Coéquipiers et staff du club
                </ProDayText>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </PressableSpring>
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
  root: { flex: 1 },
  loader: { marginTop: spacing.xl },
  scroll: { padding: spacing.lg, gap: spacing.md },
  statusCard: { gap: spacing.xs, padding: spacing.lg },
  cta: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  section: { marginTop: spacing.md },
  empty: { padding: spacing.lg },
  announcement: { padding: spacing.md, gap: spacing.xs },
  rowAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowBody: { flex: 1, gap: 2 },
});
