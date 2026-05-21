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
import { ScreenTopBar } from '../components/ui/ScreenTopBar';
import { StatIconCard } from '../components/ui/StatIconCard';
import { Icon } from '../components/ui/Icon';
import { colors, spacing, radius } from '../theme/designTokens';

interface PlayerProfileScreenProps {
  player: User;
  onBack: () => void;
  onContact?: (player: User) => void;
}

export const PlayerProfileScreen: React.FC<PlayerProfileScreenProps> = ({
  player,
  onBack,
  onContact,
}) => {
  const [favorited, setFavorited] = useState(false);
  const p = player.profile;
  const stats = p.season_stats;
  const region = player.city ?? 'France';
  const gallery = p.gallery_urls?.length
    ? p.gallery_urls
    : Array.from({ length: 6 }, (_, i) => `placeholder-${i}`);

  return (
    <View style={styles.root}>
      <ScreenTopBar title="Profil joueur" onBack={onBack} onMenu={() => {}} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
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
                {player.is_verified && (
                  <Icon name="checkmark-circle" size={18} color={colors.brandLight} />
                )}
              </View>
              <Text style={styles.heroSub}>
                {p.age ? `${p.age} ans` : ''}
                {p.age ? ' · ' : ''}
                {region}
              </Text>
              <Text style={styles.heroMeta}>
                {p.height_cm ? `${p.height_cm} cm` : '—'}
                {' · '}
                {p.weight_kg ? `${p.weight_kg} kg` : '—'}
              </Text>
            </View>
          </View>
        </View>

        {stats && (
          <View style={styles.statRow}>
            <StatIconCard icon="shirt" value={stats.matches} label="Matchs" />
            <StatIconCard icon="football" value={stats.goals} label="Buts" />
            <StatIconCard icon="walk" value={stats.assists} label="Passes décisives" />
          </View>
        )}

        <View style={styles.galleryHeader}>
          <Text style={styles.sectionTitle}>Galerie photos</Text>
          <TouchableOpacity>
            <Text style={styles.link}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.galleryGrid}>
          {gallery.slice(0, 6).map((uri, i) =>
            uri.startsWith('placeholder') ? (
              <View key={uri} style={styles.galleryCell}>
                <Icon name="image" size={28} color={colors.textMuted} />
              </View>
            ) : (
              <Image key={uri} source={{ uri }} style={styles.galleryCell} />
            )
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => onContact?.(player)}
        >
          <Icon name="mail" size={18} color="#FFFFFF" />
          <Text style={styles.btnPrimaryText}>Contacter</Text>
        </TouchableOpacity>
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 120 },
  heroCard: {
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  positionBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  positionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarPh: {
    backgroundColor: colors.brandLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  heroInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 },
  heroMeta: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  link: { fontSize: 13, fontWeight: '600', color: colors.brand },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
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
    flexDirection: 'column',
    gap: spacing.sm,
    padding: spacing.lg,
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
    paddingVertical: 14,
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
    paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  btnOutlineText: { color: colors.brand, fontWeight: '700', fontSize: 15 },
});
