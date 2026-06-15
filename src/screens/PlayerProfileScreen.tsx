import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import type { User } from '../models/User';
import { PressableSpring } from '../components/motion';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon, type IconName } from '../components/ui/Icon';
import { spacing, radius, shadows } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';
import { useAppTheme } from '../context/ProductLineContext';
import { buildPlayerCvHtmlFromUser } from '../utils/pdfGenerator';
import { openPlayerCvHtml } from '../utils/openCvHtml';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { isV3ShellEnabled } from '../config/featureFlags';
import { V3TabShell } from '../components/v3/V3TabShell';
import { V3ScreenBack } from '../components/v3/V3ScreenBack';
import { useSectionIntelligence } from '../hooks/useSectionIntelligence';
import { scorePlayerForScouting } from '../features/v3/engines/playerScouting.engine';
import { AnimatedEntrance } from '../components/motion';
import { ProDayText } from '../components/ui/ProDayText';
import { trackV3Event } from '../core/analytics/v3Events';
import { PlayerProfileBlocks, type ProfileBlockId } from '../components/player/PlayerProfileBlocks';

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
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: spacing.lg, paddingBottom: 140 },
    profileCard: {
      borderRadius: radius.lg,
      overflow: 'hidden',
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: c.border,
    },
    blueBlock: {
      position: 'relative',
      backgroundColor: c.brand,
      padding: spacing.lg,
      paddingTop: spacing.xl,
    },
    positionBadge: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      backgroundColor: 'rgba(255,255,255,0.22)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    positionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
    heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    avatar: {
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.45)',
    },
    avatarPh: {
      backgroundColor: c.brandLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarLetter: { fontSize: 30, fontWeight: '800', color: '#FFFFFF' },
    heroInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    heroName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
    heroSub: { color: 'rgba(255,255,255,0.92)', fontSize: 13, marginTop: 4 },
    statsStrip: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      paddingVertical: spacing.lg,
      alignItems: 'center',
    },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    statValue: { fontSize: 20, fontWeight: '800', color: c.text },
    statLabel: {
      fontSize: 10,
      color: c.textMuted,
      textAlign: 'center',
      paddingHorizontal: 4,
    },
    statDivider: { width: 1, height: 40, backgroundColor: c.border },
    statsEmpty: {
      color: c.textMuted,
      fontSize: 13,
      textAlign: 'center',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    galleryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: c.text },
    link: { fontSize: 13, fontWeight: '600', color: c.brand },
    galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    galleryCell: {
      width: '31%' as unknown as number,
      aspectRatio: 1,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    footer: {
      padding: spacing.lg,
      gap: spacing.sm,
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    btnPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: c.brand,
      borderRadius: radius.md,
      paddingVertical: 15,
    },
    btnPrimaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
    btnOutline: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: c.brand,
      borderRadius: radius.md,
      paddingVertical: 15,
      backgroundColor: c.surface,
    },
    btnOutlineText: { color: c.brand, fontWeight: '700', fontSize: 15 },
    scoutingBox: {
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
  });
}

export const PlayerProfileScreen: React.FC<PlayerProfileScreenProps> = ({
  player,
  onBack,
  onContact,
}) => {
  const { colors: themeColors, productLine } = useAppTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { profile: myProfile } = useAuth();
  const { requireAuth } = useRequireAuth();
  const { isFavorite, toggle } = useFavorites(myProfile?.uid);
  const favorited = isFavorite(player.uid);
  const isOwnProfile = myProfile?.uid === player.uid;
  const useV3Header =
    isV3ShellEnabled() && Boolean(myProfile && myProfile.role !== 'player' && !isOwnProfile);
  const useV3Blocks = isV3ShellEnabled() && isOwnProfile;
  const scouting = useMemo(() => {
    if (!useV3Header || !myProfile) return null;
    return scorePlayerForScouting(myProfile, player);
  }, [useV3Header, myProfile, player]);
  const intelligence = useSectionIntelligence('recrutement', myProfile ?? null, productLine, {
    staffMode: true,
  });

  useEffect(() => {
    if (useV3Header && scouting) {
      trackV3Event('staff_player_profile_open', {
        playerUid: player.uid,
        scoutingScore: scouting.score,
      });
    }
  }, [useV3Header, scouting, player.uid]);
  const p = player.profile;
  const profileTitle = productLine === 'woman' ? 'Profil joueuse' : 'Profil joueur';

  const handleExportCv = () => {
    const html = buildPlayerCvHtmlFromUser(player);
    openPlayerCvHtml(html, player.display_name);
  };
  const stats = p.season_stats;
  const hasStats =
    stats &&
    (stats.matches > 0 || stats.goals > 0 || stats.assists > 0);
  const region = player.city ?? '—';
  const gallery = p.gallery_urls?.filter(Boolean) ?? [];
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const visibleGallery = galleryExpanded ? gallery : gallery.slice(0, 6);
  const metaParts: string[] = [];
  if (p.age) metaParts.push(`${p.age} ans`);
  if (player.city) metaParts.push(player.city);
  if (p.height_cm) metaParts.push(`${p.height_cm} cm`);
  if (p.weight_kg) metaParts.push(`${p.weight_kg} kg`);

  const profileScroll = (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {scouting && useV3Header ? (
        <AnimatedEntrance kind="fadeUp">
          <View style={[styles.scoutingBox, { backgroundColor: themeColors.accentSoft, borderColor: themeColors.accentMuted }]}>
            <ProDayText variant="caption" accent style={{ fontWeight: '800' }}>
              Pertinence {scouting.score}% — {scouting.label}
            </ProDayText>
          </View>
        </AnimatedEntrance>
      ) : null}

      <AnimatedEntrance kind="fadeUp">
        <View style={[styles.profileCard, shadows.card]}>
          <View style={styles.blueBlock}>
            {p.position && (
              <View style={styles.positionBadge}>
                <Text style={styles.positionText}>{p.position}</Text>
              </View>
            )}
            <View style={styles.heroRow}>
              {player.avatar_url ? (
                <Image source={{ uri: player.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPh]}>
                  <Text style={styles.avatarLetter}>
                    {player.display_name.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.heroInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.heroName}>{player.display_name}</Text>
                  <Icon name="checkmark-circle" size={20} color="#7DD3FC" />
                </View>
                <Text style={styles.heroSub}>
                  {metaParts.length > 0 ? metaParts.join(' · ') : region}
                </Text>
              </View>
            </View>
          </View>

          {!useV3Blocks && hasStats && stats ? (
            <View style={styles.statsStrip}>
              <StatItem
                icon="shirt"
                value={stats.matches}
                label="Matchs"
                brandColor={themeColors.brand}
                styles={styles}
              />
              <View style={styles.statDivider} />
              <StatItem
                icon="football"
                value={stats.goals}
                label="Buts"
                brandColor={themeColors.brand}
                styles={styles}
              />
              <View style={styles.statDivider} />
              <StatItem
                icon="walk"
                value={stats.assists}
                label="Passes décisives"
                brandColor={themeColors.brand}
                styles={styles}
              />
            </View>
          ) : !useV3Blocks ? (
            <Text style={styles.statsEmpty}>Stats saison non renseignées</Text>
          ) : null}
        </View>
      </AnimatedEntrance>

      {useV3Blocks ? (
        <PlayerProfileBlocks
          player={player}
          editable
          renderBlock={(id: ProfileBlockId) => {
            if (id === 'stats') {
              return hasStats && stats ? (
                <View style={styles.statsStrip}>
                  <StatItem icon="shirt" value={stats.matches} label="Matchs" brandColor={themeColors.brand} styles={styles} />
                  <View style={styles.statDivider} />
                  <StatItem icon="football" value={stats.goals} label="Buts" brandColor={themeColors.brand} styles={styles} />
                  <View style={styles.statDivider} />
                  <StatItem icon="walk" value={stats.assists} label="Passes décisives" brandColor={themeColors.brand} styles={styles} />
                </View>
              ) : (
                <Text style={styles.statsEmpty}>Stats saison non renseignées</Text>
              );
            }
            if (id === 'videos' || id === 'identity') {
              return gallery.length > 0 ? (
                <View style={styles.galleryGrid}>
                  {visibleGallery.map((uri) => (
                    <Image key={uri} source={{ uri }} style={styles.galleryCell} />
                  ))}
                </View>
              ) : (
                <Text style={styles.statsEmpty}>Aucune photo dans la galerie</Text>
              );
            }
            if (id === 'bio') {
              return <Text style={styles.statsEmpty}>{p.bio?.trim() || 'Bio non renseignée'}</Text>;
            }
            return <Text style={styles.statsEmpty}>À compléter dans l’édition du profil</Text>;
          }}
        />
      ) : (
        <>
      <View style={styles.galleryHeader}>
        <Text style={styles.sectionTitle}>Galerie photos</Text>
        {gallery.length > 6 ? (
          <PressableSpring onPress={() => setGalleryExpanded((v) => !v)}>
            <Text style={styles.link}>{galleryExpanded ? 'Réduire' : 'Voir tout'}</Text>
          </PressableSpring>
        ) : null}
      </View>
      {gallery.length > 0 ? (
        <View style={styles.galleryGrid}>
          {visibleGallery.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.galleryCell} />
          ))}
        </View>
      ) : (
        <Text style={styles.statsEmpty}>Aucune photo dans la galerie</Text>
      )}
        </>
      )}
    </ScrollView>
  );

  const footer = (
    <View style={styles.footer}>
      <PressableSpring
        style={styles.btnPrimary}
        onPress={() => {
          if (!requireAuth('Connectez-vous pour contacter ce joueur.')) return;
          onContact?.(player);
        }}
      >
        <Icon name="mail" size={18} color="#FFFFFF" />
        <Text style={styles.btnPrimaryText}>Contacter</Text>
      </PressableSpring>
      {isOwnProfile ? (
        <PressableSpring style={styles.btnOutline} onPress={handleExportCv}>
          <Icon name="share" size={18} color={themeColors.brand} />
          <Text style={styles.btnOutlineText}>Exporter mon CV (PDF)</Text>
        </PressableSpring>
      ) : (
        <PressableSpring
          style={styles.btnOutline}
          onPress={async () => {
            if (!requireAuth('Connectez-vous pour enregistrer des favoris.') || !myProfile) return;
            try {
              await toggle(player.uid, 'player');
            } catch (e) {
              Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible.');
            }
          }}
        >
          <Icon
            name={favorited ? 'heart' : 'heart-outline'}
            size={18}
            color={themeColors.brand}
          />
          <Text style={styles.btnOutlineText}>Ajouter aux favoris</Text>
        </PressableSpring>
      )}
    </View>
  );

  if (useV3Header) {
    return (
      <V3TabShell
        caption="Scouting"
        title={player.display_name}
        subtitle={scouting ? `${scouting.label} · ${scouting.score}%` : undefined}
        right={<V3ScreenBack onPress={onBack} />}
        intelligence={intelligence}
        flat
      >
        {profileScroll}
        {footer}
      </V3TabShell>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title={profileTitle} onBack={onBack} onMenu={() => {}} centered />
      {profileScroll}
      {footer}
    </View>
  );
};
