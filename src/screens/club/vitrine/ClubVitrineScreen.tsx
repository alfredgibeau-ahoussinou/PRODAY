import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { HomeScreen } from '../../HomeScreen';
import { ClubAnnouncementsScreen } from '../../ClubAnnouncementsScreen';
import { EditProfileScreen } from '../../EditProfileScreen';
import { ReferralScreen } from '../../ReferralScreen';
import { ClubShell } from '../shared/clubShell';
import {
  ClubActionRow,
  ClubEmptyState,
  ClubLightPanel,
  ClubSectionCard,
} from '../../../components/club/clubPortalUi';
import { ProDayText } from '../../../components/ui/ProDayText';
import { PushScreenTransition } from '../../../components/motion';
import { ProfileGalleryEditor } from '../../../components/profile/ProfileGalleryEditor';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useAuth } from '../../../context/AuthContext';
import { clubsService } from '../../../services/clubs.service';
import { clubAnnouncementsService } from '../../../services/clubAnnouncements.service';
import type { Club } from '../../../models/Club';
import type { ClubAnnouncement } from '../../../models/ClubAnnouncement';
import { pickGalleryImage } from '../../../utils/pickMedia';
import { profileService } from '../../../services/profile.service';
import { radius, spacing } from '../../../theme/designTokens';

type VitrineOverlay = 'announcements' | 'edit' | 'referral' | null;

/** Vitrine publique du club — identité, galerie, annonces. */
export const ClubVitrineScreen: React.FC = () => {
  const profile = useSessionProfile();
  const { refreshProfile } = useAuth();
  const { colors } = useAppTheme();
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
        pageId="vitrine"
        caption="Vitrine"
        title="Page publique"
        subtitle="Identité visible hors du bureau."
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
            <ClubSectionCard
              kicker={club?.verified ? 'Vérifié' : 'Identité'}
              title={club?.name ?? profile.display_name}
              body={[club?.city ?? profile.city, profile.profile.bio].filter(Boolean).join(' · ')}
            >
              {club?.logo_url || profile.avatar_url ? (
                <Image
                  source={{ uri: club?.logo_url ?? profile.avatar_url }}
                  style={[styles.logo, { borderColor: colors.border }]}
                />
              ) : null}
              <ClubActionRow
                primary="Modifier le profil"
                onPrimary={() => setOverlay('edit')}
                secondary="Parrainage"
                onSecondary={() => setOverlay('referral')}
              />
            </ClubSectionCard>

            <ClubSectionCard kicker="Médias" title="Galerie">
              <ProfileGalleryEditor
                urls={gallery}
                uploading={uploadingGallery}
                onAdd={() => void handleGalleryAdd()}
                onRemove={(url) => void handleGalleryRemove(url)}
              />
            </ClubSectionCard>

            <ClubSectionCard kicker="Communication" title="Annonces">
              {announcements.length > 0 ? (
                announcements.map((post) => (
                  <ClubLightPanel key={post.id}>
                    <ProDayText variant="section">{post.title}</ProDayText>
                    <ProDayText variant="caption" muted numberOfLines={2}>
                      {post.body}
                    </ProDayText>
                  </ClubLightPanel>
                ))
              ) : (
                <ClubEmptyState
                  title="Aucune annonce"
                  body="Publiez une info pour les familles et licenciés."
                  cta="Gérer les annonces"
                  onPress={() => setOverlay('announcements')}
                />
              )}
              {announcements.length > 0 ? (
                <ClubActionRow
                  primary="Gérer les annonces"
                  onPrimary={() => setOverlay('announcements')}
                />
              ) : null}
            </ClubSectionCard>
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
  loader: { padding: spacing.xxl, alignItems: 'center' },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    marginVertical: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
