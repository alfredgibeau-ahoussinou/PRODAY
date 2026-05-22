import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { User } from '../models/User';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon, type IconName } from '../components/ui/Icon';
import { colors, spacing, radius, shadows } from '../theme/designTokens';
import { buildPlayerCvHtmlFromUser } from '../utils/pdfGenerator';
import { openPlayerCvHtml } from '../utils/openCvHtml';
import { useAuth } from '../context/AuthContext';

interface PlayerProfileScreenProps {
  player: User;
  onBack: () => void;
  onContact?: (player: User) => void;
}

const StatItem: React.FC<{ icon: IconName; value: string | number; label: string }> = ({
  icon,
  value,
  label,
}) => (
  <View style={styles.statItem}>
    <Icon name={icon} size={22} color={colors.brand} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const PlayerProfileScreen: React.FC<PlayerProfileScreenProps> = ({
  player,
  onBack,
  onContact,
}) => {
  const [favorited, setFavorited] = useState(false);
  const { profile: myProfile } = useAuth();
  const isOwnProfile = myProfile?.uid === player.uid;
  const p = player.profile;

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
  const metaParts: string[] = [];
  if (p.age) metaParts.push(`${p.age} ans`);
  if (player.city) metaParts.push(player.city);
  if (p.height_cm) metaParts.push(`${p.height_cm} cm`);
  if (p.weight_kg) metaParts.push(`${p.weight_kg} kg`);

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Profil joueur"
        onBack={onBack}
        onMenu={() => {}}
        centered
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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

          {hasStats && stats ? (
            <View style={styles.statsStrip}>
              <StatItem icon="shirt" value={stats.matches} label="Matchs" />
              <View style={styles.statDivider} />
              <StatItem icon="football" value={stats.goals} label="Buts" />
              <View style={styles.statDivider} />
              <StatItem icon="walk" value={stats.assists} label="Passes décisives" />
            </View>
          ) : (
            <Text style={styles.statsEmpty}>Stats saison non renseignées</Text>
          )}
        </View>

        <View style={styles.galleryHeader}>
          <Text style={styles.sectionTitle}>Galerie photos</Text>
          <TouchableOpacity>
            <Text style={styles.link}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        {gallery.length > 0 ? (
          <View style={styles.galleryGrid}>
            {gallery.slice(0, 6).map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.galleryCell} />
            ))}
          </View>
        ) : (
          <Text style={styles.statsEmpty}>Aucune photo dans la galerie</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => onContact?.(player)}
        >
          <Icon name="mail" size={18} color="#FFFFFF" />
          <Text style={styles.btnPrimaryText}>Contacter</Text>
        </TouchableOpacity>
        {isOwnProfile ? (
          <TouchableOpacity style={styles.btnOutline} onPress={handleExportCv}>
            <Icon name="share" size={18} color={colors.brand} />
            <Text style={styles.btnOutlineText}>Exporter mon CV (PDF)</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.btnOutline}
            onPress={() => setFavorited((f) => !f)}
          >
            <Icon
              name={favorited ? 'heart' : 'heart-outline'}
              size={18}
              color={colors.brand}
            />
            <Text style={styles.btnOutlineText}>Ajouter aux favoris</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 140 },
  profileCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  blueBlock: {
    position: 'relative',
    backgroundColor: colors.brand,
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
    backgroundColor: colors.brandLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: { fontSize: 30, fontWeight: '800', color: '#FFFFFF' },
  heroInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  heroSub: { color: 'rgba(255,255,255,0.92)', fontSize: 13, marginTop: 4 },
  heroMeta: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  statDivider: { width: 1, height: 40, backgroundColor: colors.border },
  statsEmpty: {
    color: colors.textMuted,
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  link: { fontSize: 13, fontWeight: '600', color: colors.brand },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  galleryCell: {
    width: '31%' as unknown as number,
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 15,
  },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 15,
    backgroundColor: colors.surface,
  },
  btnOutlineText: { color: colors.brand, fontWeight: '700', fontSize: 15 },
});
