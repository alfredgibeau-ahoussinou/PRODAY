import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import type { User } from '../models/User';
import { PressableSpring } from '../components/motion';
import { Icon, type IconName } from '../components/ui/Icon';
import { ProDayButton } from '../components/ui/ProDayButton';
import { spacing, radius } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';
import { useAppTheme } from '../context/ProductLineContext';
import { buildPlayerCvHtmlFromUser } from '../utils/pdfGenerator';
import { openPlayerCvHtml } from '../utils/openCvHtml';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { isSubScreenShellEnabled } from '../hooks/useSubScreenShell';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { ScreenBackButton } from '../components/ui/ScreenBackButton';
import { scorePlayerForScouting } from '../features/v3/engines/playerScouting.engine';
import { computeOpportunityScore } from '../core/recruitment/opportunityScore.engine';
import { AnimatedEntrance } from '../components/motion';
import { ProDayText } from '../components/ui/ProDayText';
import { trackV3Event } from '../core/analytics/v3Events';
import { PlayerProfileBlocks, type ProfileBlockId } from '../components/player/PlayerProfileBlocks';
import {
  PlayerGalleryGrid,
  PlayerIdentityDetails,
  PlayerProfileHero,
  type VisibleProfileContacts,
} from '../components/player/PlayerProfileHero';
import { getProfileCompletion } from '../utils/profileCompletion';
import { availabilityLabel } from '../utils/playerProfileLabels';
import { PlayerBadgesRow } from '../components/player/PlayerBadgesRow';
import { ProDayFutCard } from '../components/cards/ProDayFutCard';
import { userToProDayCard } from '../utils/prodayFutCard';
import type { ProDayCardActionId } from '../models/ProDayCard';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';
import { PlayerTacticalInbox } from '../components/player/PlayerTacticalInbox';
import { PlayerScoutingShortlistPanel } from '../components/player/PlayerScoutingShortlistPanel';
import { PlayerScoutReportsPanel } from '../components/player/PlayerScoutReportsPanel';
import { PlayerOneClickRecruitmentPanel } from '../components/player/PlayerOneClickRecruitmentPanel';
import { HighlightAnnotationSheet } from '../components/player/HighlightAnnotationSheet';
import type { HighlightAnnotation } from '../core/recruitment/highlightAnnotation.engine';
import { usePlayerActivities, useCareerProgression, usePlayerActivitiesForStaff, computePlayerCareerForStaff } from '../hooks/useCareerProgression';
import { CareerScoreCard } from '../components/player/CareerScoreCard';
import { PlayerActivityPublicSummary } from '../components/player/PlayerActivityPublicSummary';
import { SkillEndorsementsCard } from '../components/player/SkillEndorsementsCard';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';
import { usersService } from '../services/users.service';

interface PlayerProfileScreenProps {
  player: User;
  onBack: () => void;
  onContact?: (player: User) => void;
}

const StatItem: React.FC<{
  icon: IconName;
  value: string | number;
  label: string;
  brandColor: string;
  styles: ReturnType<typeof createStyles>;
}> = ({ icon, value, label, brandColor, styles }) => (
  <View style={styles.statItem}>
    <Icon name={icon} size={22} color={brandColor} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
    content: { padding: spacing.lg, paddingBottom: TAB_BAR_CONTENT_INSET + 120 },
    statsStrip: {
      flexDirection: 'row',
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    statValue: { fontSize: 22, fontWeight: '900', color: c.text },
    statLabel: {
      fontSize: 10,
      color: c.textMuted,
      textAlign: 'center',
      paddingHorizontal: 4,
      fontWeight: '600',
    },
    statDivider: { width: 1, height: 40, backgroundColor: c.border },
    bodyText: { fontSize: 14, lineHeight: 22, color: c.textSecondary },
    emptyText: { fontSize: 13, lineHeight: 20, color: c.textMuted },
    scoutingBox: {
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    galleryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    link: { fontSize: 13, fontWeight: '700', color: c.brand },
    footer: {
      padding: spacing.lg,
      gap: spacing.sm,
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
  });
}

export const PlayerProfileScreen: React.FC<PlayerProfileScreenProps> = ({
  player,
  onBack,
  onContact,
}) => {
  const { colors: themeColors, productLine, isWoman } = useAppTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { profile: myProfile } = useAuth();
  const { requireAuth } = useRequireAuth();
  const nav = useTabNavigationActions();
  const { isFavorite, toggle } = useFavorites(myProfile?.uid);
  const favorited = isFavorite(player.uid);
  const isOwnProfile = myProfile?.uid === player.uid;
  const isStaffView =
    isSubScreenShellEnabled(myProfile, 'staff') && !isOwnProfile;
  const { activities } = usePlayerActivities(isOwnProfile ? player.uid : undefined);
  const { activities: staffActivities, loading: staffActivitiesLoading } = usePlayerActivitiesForStaff(
    isStaffView ? player.uid : undefined
  );
  const career = useCareerProgression(isOwnProfile ? player : null, { activities });
  const staffCareer = useMemo(
    () => (isStaffView ? computePlayerCareerForStaff(player, staffActivities) : null),
    [isStaffView, player, staffActivities]
  );
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const [highlightSheetOpen, setHighlightSheetOpen] = useState(false);
  const [highlightAnnotations, setHighlightAnnotations] = useState<HighlightAnnotation[]>([]);
  const highlightUrl = player.profile.highlight_video_urls?.filter(Boolean)[0];
  const [visibleContacts, setVisibleContacts] = useState<VisibleProfileContacts | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (isOwnProfile) {
      setVisibleContacts({
        phone: player.phone,
        email: player.email,
        other_contact: player.other_contact,
      });
      return () => {
        cancelled = true;
      };
    }
    setVisibleContacts(null);
    void usersService
      .getPublicById(player.uid, {
        viewerUid: myProfile?.uid,
        viewerRole: myProfile?.role,
        isConnection: favorited,
      })
      .then((publicUser) => {
        if (cancelled || !publicUser) return;
        setVisibleContacts({
          phone: publicUser.phone,
          email: publicUser.email,
          other_contact: publicUser.other_contact,
        });
      })
      .catch(() => {
        if (!cancelled) setVisibleContacts(null);
      });
    return () => {
      cancelled = true;
    };
  }, [
    favorited,
    isOwnProfile,
    myProfile?.role,
    myProfile?.uid,
    player.email,
    player.other_contact,
    player.phone,
    player.uid,
  ]);

  const scouting = useMemo(() => {
    if (!isStaffView || !myProfile) return null;
    return scorePlayerForScouting(myProfile, player);
  }, [isStaffView, myProfile, player]);

  const opportunity = useMemo(() => {
    if (!isStaffView || !myProfile) return null;
    return computeOpportunityScore({ player, viewer: myProfile });
  }, [isStaffView, myProfile, player]);

  const completion = useMemo(
    () => (isOwnProfile ? getProfileCompletion(player) : null),
    [isOwnProfile, player],
  );

  useEffect(() => {
    if (isStaffView && scouting) {
      trackV3Event('staff_player_profile_open', {
        playerUid: player.uid,
        scoutingScore: scouting.score,
      });
    }
  }, [isStaffView, scouting, player.uid]);

  const p = player.profile;
  const stats = p.season_stats;
  const hasStats = Boolean(stats && (stats.matches > 0 || stats.goals > 0 || stats.assists > 0));
  const gallery = p.gallery_urls?.filter(Boolean) ?? [];
  const highlights = p.highlight_video_urls?.filter(Boolean) ?? [];

  const handleExportCv = () => {
    const html = buildPlayerCvHtmlFromUser(player);
    openPlayerCvHtml(html, player.display_name);
  };

  const renderBlock = (id: ProfileBlockId) => {
    switch (id) {
      case 'identity':
        return (
          <View style={{ gap: spacing.md }}>
            <PlayerIdentityDetails
              player={player}
              colors={themeColors}
              visibleContacts={visibleContacts}
            />
            {gallery.length > 0 ? (
              <>
                <View style={styles.galleryHeader}>
                  <Text style={[styles.emptyText, { color: themeColors.text, fontWeight: '700' }]}>
                    Galerie
                  </Text>
                  {gallery.length > 6 ? (
                    <PressableSpring onPress={() => setGalleryExpanded((v) => !v)}>
                      <Text style={styles.link}>{galleryExpanded ? 'Réduire' : 'Voir tout'}</Text>
                    </PressableSpring>
                  ) : null}
                </View>
                <PlayerGalleryGrid urls={gallery} colors={themeColors} expanded={galleryExpanded} />
              </>
            ) : null}
          </View>
        );
      case 'stats':
        return hasStats && stats ? (
          <View style={styles.statsStrip}>
            <StatItem icon="shirt" value={stats.matches} label="Matchs" brandColor={themeColors.brand} styles={styles} />
            <View style={styles.statDivider} />
            <StatItem icon="football" value={stats.goals} label="Buts" brandColor={themeColors.brand} styles={styles} />
            <View style={styles.statDivider} />
            <StatItem icon="walk" value={stats.assists} label="Passes D." brandColor={themeColors.brand} styles={styles} />
          </View>
        ) : (
          <Text style={styles.emptyText}>Stats saison non renseignées</Text>
        );
      case 'videos':
        return highlights.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <Text style={styles.bodyText}>
              {highlights.length} vidéo highlight enregistrée{highlights.length > 1 ? 's' : ''}
            </Text>
            {isStaffView && highlightUrl ? (
              <PressableSpring onPress={() => setHighlightSheetOpen(true)}>
                <Text style={[styles.link, { color: themeColors.brand }]}>
                  Annoter le highlight
                  {highlightAnnotations.length > 0
                    ? ` · ${highlightAnnotations.length}`
                    : ''}
                </Text>
              </PressableSpring>
            ) : null}
          </View>
        ) : (
          <Text style={styles.emptyText}>Aucune vidéo highlight</Text>
        );
      case 'season': {
        const parts = [p.level, p.category, p.years_experience ? `${p.years_experience} ans d'exp.` : null]
          .filter(Boolean)
          .join(' · ');
        return parts ? (
          <Text style={styles.bodyText}>{parts}</Text>
        ) : (
          <Text style={styles.emptyText}>Palmarès / saison non renseigné</Text>
        );
      }
      case 'availability': {
        const label = availabilityLabel(p.availability);
        return label ? (
          <Text style={[styles.bodyText, { color: themeColors.brand, fontWeight: '700' }]}>{label}</Text>
        ) : (
          <Text style={styles.emptyText}>Disponibilité non indiquée</Text>
        );
      }
      case 'bio':
        return p.bio?.trim() ? (
          <Text style={styles.bodyText}>{p.bio.trim()}</Text>
        ) : (
          <Text style={styles.emptyText}>Bio non renseignée</Text>
        );
      default:
        return <Text style={styles.emptyText}>À compléter dans l’édition du profil</Text>;
    }
  };

  const profileScroll = (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {scouting && isStaffView ? (
        <AnimatedEntrance kind="fade">
          <View style={[styles.scoutingBox, { backgroundColor: themeColors.accentSoft, borderColor: themeColors.accentMuted }]}>
            <ProDayText variant="caption" accent style={{ fontWeight: '800' }}>
              Opportunity Score {opportunity?.score ?? scouting.score}%
              {opportunity ? ` · ${opportunity.label}` : ` · ${scouting.label}`}
            </ProDayText>
            {opportunity && opportunity.reasons.length > 0 ? (
              <ProDayText variant="caption" muted numberOfLines={2} style={{ marginTop: 4 }}>
                {opportunity.reasons.join(' · ')}
              </ProDayText>
            ) : null}
          </View>
          {myProfile ? (
            <>
              <PlayerScoutingShortlistPanel
                staff={myProfile}
                player={player}
                scoutingScore={opportunity?.score ?? scouting.score}
              />
              <PlayerScoutReportsPanel staff={myProfile} player={player} />
              <PlayerOneClickRecruitmentPanel staff={myProfile} player={player} />
            </>
          ) : null}
        </AnimatedEntrance>
      ) : null}

      {isOwnProfile ? <PlayerBadgesRow user={player} /> : null}

      <AnimatedEntrance kind="fadeUp">
        <View style={{ alignItems: 'center', marginVertical: spacing.sm }}>
          <ProDayFutCard
            card={userToProDayCard(player)}
            width={200}
            onAction={(action: ProDayCardActionId) => {
              if (action === 'view_profile') return;
              if (action === 'message') {
                if (isOwnProfile) nav.setActiveTab('messages');
                else onContact?.(player);
                return;
              }
              if (action === 'view_club' || action === 'recruit') {
                nav.openMercato('home');
                return;
              }
              if (action === 'invite') {
                nav.openMatchs();
                return;
              }
              if (action === 'follow') {
                void toggle(player.uid);
              }
            }}
          />
        </View>
      </AnimatedEntrance>

      {isOwnProfile ? <PlayerTacticalInbox uid={player.uid} /> : null}

      <AnimatedEntrance kind="fadeUp">
        <SkillEndorsementsCard
          playerUid={player.uid}
          viewerUid={myProfile?.uid}
          viewerName={myProfile?.display_name}
          clubId={myProfile?.profile.club_id ?? player.profile.club_id}
          canEndorse={
            !!myProfile &&
            myProfile.uid !== player.uid &&
            (myProfile.role === 'player' ||
              myProfile.role === 'coach' ||
              myProfile.role === 'club')
          }
        />
      </AnimatedEntrance>

      {isStaffView && staffCareer ? (
        <AnimatedEntrance kind="fadeUp">
          <CareerScoreCard career={staffCareer} />
          <PlayerActivityPublicSummary
            activities={staffActivities}
            loading={staffActivitiesLoading}
          />
        </AnimatedEntrance>
      ) : null}

      <AnimatedEntrance kind="fadeUp">
        <PlayerProfileHero
          player={player}
          colors={themeColors}
          isOwnProfile={isOwnProfile}
          completionPercent={completion?.percent}
          careerScore={career?.total ?? staffCareer?.total}
        />
      </AnimatedEntrance>

      <PlayerProfileBlocks
        player={player}
        editable={isOwnProfile}
        renderBlock={renderBlock}
      />
    </ScrollView>
  );

  const footer = (
    <View style={styles.footer}>
      {isOwnProfile ? (
        <ProDayButton label="Exporter mon CV (PDF)" icon="share" onPress={handleExportCv} />
      ) : (
        <>
          <ProDayButton
            label="Contacter"
            icon="mail"
            onPress={() => {
              if (!requireAuth('Connectez-vous pour contacter ce joueur.')) return;
              onContact?.(player);
            }}
          />
          <ProDayButton
            label={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            icon={favorited ? 'heart' : 'heart-outline'}
            variant="secondary"
            onPress={() => {
              void (async () => {
                if (!requireAuth('Connectez-vous pour enregistrer des favoris.') || !myProfile) return;
                try {
                  await toggle(player.uid, 'player');
                } catch (e) {
                  Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible.');
                }
              })();
            }}
          />
        </>
      )}
    </View>
  );

  const shellCaption = isStaffView ? 'Scouting' : isOwnProfile ? 'Mon espace' : 'Mercato';
  const shellTitle = isOwnProfile
    ? isWoman
      ? 'Ma fiche joueuse'
      : 'Ma fiche joueur'
    : player.display_name;

  return (
    <TabScreenShell
      caption={shellCaption}
      title={shellTitle}
      subtitle={
        opportunity
          ? `${opportunity.label} · ${opportunity.score}%`
          : scouting
            ? `${scouting.label} · ${scouting.score}%`
            : isOwnProfile && completion
              ? `Profil ${completion.percent}% complété`
              : [p.position, p.level, player.city].filter(Boolean).join(' · ') || undefined
      }
      left={<ScreenBackButton onPress={onBack} />}
      flat
    >
      {profileScroll}
      {footer}
      {highlightUrl && myProfile ? (
        <HighlightAnnotationSheet
          visible={highlightSheetOpen}
          onClose={() => setHighlightSheetOpen(false)}
          mediaUrl={highlightUrl}
          authorUid={myProfile.uid}
          annotations={highlightAnnotations}
          onChange={setHighlightAnnotations}
        />
      ) : null}
    </TabScreenShell>
  );
};
