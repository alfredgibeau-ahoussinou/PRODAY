import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import type { User } from '../models/User';
import { StatCard } from '../components/StatCard';
import { MediaGallery } from '../components/MediaGallery';
import { colors, spacing, radius, shadows } from '../theme/designTokens';

interface PlayerProfileScreenProps {
  player: User;
  onBack: () => void;
  onContact?: (player: User) => void;
}

function strongFootLabel(foot?: string): string {
  if (foot === 'left') return 'Gauche';
  if (foot === 'both') return 'Ambidextre';
  return 'Droit';
}

function availabilityLabel(status?: string): { text: string; color: string; bg: string } {
  switch (status) {
    case 'unavailable':
      return { text: 'Indisponible', color: colors.textMuted, bg: colors.surfaceMuted };
    case 'negotiating':
      return { text: 'En discussion', color: colors.warning, bg: colors.warningBg };
    default:
      return { text: 'Disponible', color: colors.success, bg: colors.successBg };
  }
}

export const PlayerProfileScreen: React.FC<PlayerProfileScreenProps> = ({
  player,
  onBack,
  onContact,
}) => {
  const [favorited, setFavorited] = useState(false);
  const p = player.profile;
  const avail = availabilityLabel(p.availability);
  const region = [player.city, player.department].filter(Boolean).join(', ');
  const stats = p.season_stats;

  const handleShare = async () => {
    await Share.share({
      message: `Profil ProDay — ${player.display_name}, ${p.position ?? 'Joueur'} (${p.level ?? ''})`,
    });
  };

  return (
    <View style={styles.root}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {player.display_name}
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareText}>Partager</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {player.avatar_url ? (
            <Image source={{ uri: player.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarLetter}>
                {player.display_name.charAt(0)}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{player.display_name}</Text>
          <Text style={styles.subtitle}>
            {[p.position, p.age ? `${p.age} ans` : null, region].filter(Boolean).join(' · ')}
          </Text>
          <View style={[styles.availBadge, { backgroundColor: avail.bg }]}>
            <View style={[styles.availDot, { backgroundColor: avail.color }]} />
            <Text style={[styles.availText, { color: avail.color }]}>{avail.text}</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <StatCard
            label="Taille"
            value={p.height_cm ? `${(p.height_cm / 100).toFixed(2)} m` : '—'}
          />
          <StatCard label="Poids" value={p.weight_kg ? `${p.weight_kg} kg` : '—'} />
          <StatCard label="Pied fort" value={strongFootLabel(p.strong_foot)} />
        </View>

        {p.bio && (
          <View style={[styles.block, shadows.card]}>
            <Text style={styles.blockTitle}>À propos</Text>
            <Text style={styles.bio}>{p.bio}</Text>
          </View>
        )}

        <View style={styles.metaRow}>
          {p.level && (
            <View style={styles.metaChip}>
              <Text style={styles.metaLabel}>Niveau</Text>
              <Text style={styles.metaValue}>{p.level}</Text>
            </View>
          )}
          {p.years_experience != null && (
            <View style={styles.metaChip}>
              <Text style={styles.metaLabel}>Expérience</Text>
              <Text style={styles.metaValue}>{p.years_experience} ans</Text>
            </View>
          )}
          {p.category && (
            <View style={styles.metaChip}>
              <Text style={styles.metaLabel}>Catégorie</Text>
              <Text style={styles.metaValue}>{p.category}</Text>
            </View>
          )}
        </View>

        {stats && (
          <View style={[styles.block, shadows.card]}>
            <Text style={styles.blockTitle}>Stats saison 23/24</Text>
            <View style={styles.seasonRow}>
              <SeasonStat value={stats.matches} label="Matchs" />
              <SeasonStat value={stats.goals} label="Buts" />
              <SeasonStat value={stats.assists} label="Passes D." />
            </View>
          </View>
        )}

        {p.gallery_urls && p.gallery_urls.length > 0 && (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Galerie</Text>
            <MediaGallery urls={p.gallery_urls} />
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, shadows.card]}>
        <TouchableOpacity
          style={styles.btnOutline}
          onPress={() => setFavorited((f) => !f)}
        >
          <Text style={styles.btnOutlineText}>
            {favorited ? '★ Favori' : 'Ajouter aux favoris'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => onContact?.(player)}
        >
          <Text style={styles.btnPrimaryText}>Contacter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SeasonStat: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <View style={styles.seasonItem}>
    <Text style={styles.seasonValue}>{value}</Text>
    <Text style={styles.seasonLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.sm, marginRight: spacing.sm },
  backText: { fontSize: 22, color: colors.brand, fontWeight: '600' },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  shareBtn: { padding: spacing.sm },
  shareText: { color: colors.brand, fontWeight: '600', fontSize: 14 },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 120 },
  hero: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.blueCyan + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: { fontSize: 48, fontWeight: '800', color: colors.brand },
  name: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.textSecondary, fontSize: 15, marginTop: 4 },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    gap: 6,
  },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  availText: { fontWeight: '700', fontSize: 13 },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  block: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  bio: { color: colors.textSecondary, lineHeight: 22, fontSize: 15 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  metaChip: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: '30%' as unknown as number,
    flexGrow: 1,
  },
  metaLabel: { color: colors.textMuted, fontSize: 11 },
  metaValue: { color: colors.text, fontWeight: '700', fontSize: 15, marginTop: 2 },
  seasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  seasonItem: { alignItems: 'center' },
  seasonValue: { fontSize: 28, fontWeight: '800', color: colors.brand },
  seasonLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btnOutline: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnOutlineText: { color: colors.bluePrimary, fontWeight: '700', fontSize: 14 },
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.bluePrimary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
