import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { HomeScreen } from '../HomeScreen';
import { ClubAnnouncementsScreen } from '../ClubAnnouncementsScreen';
import { EditProfileScreen } from '../EditProfileScreen';
import { ReferralScreen } from '../ReferralScreen';
import { ClubShell } from './clubShell';
import { ProDaySurface } from '../../components/ui/ProDaySurface';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring, PushScreenTransition } from '../../components/motion';
import { ProfileGalleryEditor } from '../../components/profile/ProfileGalleryEditor';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useTranslation } from '../../context/LocaleContext';
import { useAppTheme } from '../../context/ProductLineContext';
import { useAuth } from '../../context/AuthContext';
import { clubsService } from '../../services/clubs.service';
import { clubAnnouncementsService } from '../../services/clubAnnouncements.service';
import type { Club } from '../../models/Club';
import type { ClubAnnouncement } from '../../models/ClubAnnouncement';
import { pickGalleryImage } from '../../utils/pickMedia';
import { profileService } from '../../services/profile.service';
import { radius, spacing } from '../../theme/designTokens';

type VitrineOverlay = 'announcements' | 'edit' | 'referral' | null;

/** Onglet Vitrine — profil public du club (galerie, annonces, identité). */
export const ClubVitrineScreen: React.FC = () => {
  const profile = useSessionProfile();
  const { refreshProfile } = useAuth();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const [club, setClub] = useState<Club | null>(null);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overlay, setOverlay] = useState<VitrineOverlay>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const clubId = profile?.profile.club_id ?? profile?.uid;

  const loadVitrine = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const [clubRow, posts] = await Promise.all([
        clubsService.getById(clubId),
        clubAnnouncementsService.listByClub(clubId),
      ]);
      setClub(clubRow);
      setAnnouncements(posts.slice(0, 3));
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    void loadVitrine();
  }, [loadVitrine]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadVitrine();
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  }, [loadVitrine, refreshProfile]);

  const gallery = useMemo(
    () => profile?.profile.gallery_urls?.filter(Boolean) ?? [],
    [profile?.profile.gallery_urls],
  );

  const handleGalleryAdd = async () => {
    if (!profile) return;
    const file = await pickGalleryImage();
    if (!file) return;
    setUploadingGallery(true);
    try {
      await profileService.addGalleryPhoto(profile.uid, file);
      await refreshProfile();
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleGalleryRemove = async (url: string) => {
    if (!profile) return;
    await profileService.removeGalleryPhoto(profile.uid, url);
    await refreshProfile();
  };

  if (!profile || profile.role !== 'club') {
    return <HomeScreen />;
  }

  return (
    <>
      <ClubShell
        caption={t('club.vitrine.caption')}
        title={t('club.vitrine.title')}
        subtitle={t('club.vitrine.subtitle')}
        profile={profile}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <>
            <ProDaySurface variant="accent" style={[styles.header, { borderColor: colors.border }]}>
              {club?.logo_url || profile.avatar_url ? (
                <Image
                  source={{ uri: club?.logo_url ?? profile.avatar_url }}
                  style={styles.logo}
                />
              ) : null}
              <ProDayText variant="title">{club?.name ?? profile.display_name}</ProDayText>
              <ProDayText variant="caption" muted>
                {club?.city ?? profile.city}
                {club?.verified ? ` · ${t('club.vitrine.verified')}` : ''}
              </ProDayText>
              {profile.profile.bio ? (
                <ProDayText variant="body" muted>
                  {profile.profile.bio}
                </ProDayText>
              ) : null}
            </ProDaySurface>

            <ProDayText variant="eyebrow" muted>
              {t('club.vitrine.gallery')}
            </ProDayText>
            <ProfileGalleryEditor
              urls={gallery}
              uploading={uploadingGallery}
              onAdd={() => void handleGalleryAdd()}
              onRemove={(url) => void handleGalleryRemove(url)}
            />

            <ProDayText variant="eyebrow" muted>
              {t('club.vitrine.announcements')}
            </ProDayText>
            {announcements.length > 0 ? (
              announcements.map((post) => (
                <ProDaySurface
                  key={post.id}
                  variant="module"
                  style={[styles.postCard, { borderColor: colors.border }]}
                >
                  <ProDayText variant="section">{post.title}</ProDayText>
                  <ProDayText variant="caption" muted numberOfLines={2}>
                    {post.body}
                  </ProDayText>
                </ProDaySurface>
              ))
            ) : (
              <ProDaySurface variant="module" style={[styles.empty, { borderColor: colors.border }]}>
                <ProDayText variant="body" muted>
                  {t('club.vitrine.noAnnouncements')}
                </ProDayText>
              </ProDaySurface>
            )}

            <View style={styles.actions}>
              <PressableSpring
                onPress={() => setOverlay('announcements')}
                style={[styles.actionBtn, { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}
              >
                <ProDayText variant="caption" style={{ color: colors.accent }}>
                  {t('club.vitrine.manageAnnouncements')}
                </ProDayText>
              </PressableSpring>
              <PressableSpring
                onPress={() => setOverlay('edit')}
                style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
              >
                <ProDayText variant="caption" muted>
                  {t('club.vitrine.editProfile')}
                </ProDayText>
              </PressableSpring>
              <PressableSpring
                onPress={() => setOverlay('referral')}
                style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
              >
                <ProDayText variant="caption" muted>
                  Parrainage
                </ProDayText>
              </PressableSpring>
            </View>
          </>
        )}
      </ClubShell>

      <PushScreenTransition active={overlay === 'announcements'}>
        {overlay === 'announcements' ? (
          <ClubAnnouncementsScreen
            profile={profile}
            canManage
            onBack={() => {
              setOverlay(null);
              void loadVitrine();
            }}
          />
        ) : null}
      </PushScreenTransition>

      <PushScreenTransition active={overlay === 'edit'}>
        {overlay === 'edit' ? (
          <EditProfileScreen
            user={profile}
            onBack={() => setOverlay(null)}
            onSaved={async () => {
              await refreshProfile();
              setOverlay(null);
            }}
          />
        ) : null}
      </PushScreenTransition>

      <PushScreenTransition active={overlay === 'referral'}>
        {overlay === 'referral' ? (
          <ReferralScreen onBack={() => setOverlay(null)} />
        ) : null}
      </PushScreenTransition>
    </>
  );
};

const styles = StyleSheet.create({
  loader: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  header: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  postCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  empty: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
});
