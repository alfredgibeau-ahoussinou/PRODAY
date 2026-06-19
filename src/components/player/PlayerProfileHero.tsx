import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { Icon, type IconName } from '../ui/Icon';
import { ProDayGradient } from '../ui/ProDayGradient';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import {
  availabilityLabel,
  availabilityTone,
  strongFootLabel,
} from '../../utils/playerProfileLabels';

interface PlayerProfileHeroProps {
  player: User;
  colors: AppColors;
  isOwnProfile: boolean;
  completionPercent?: number;
}

export const PlayerProfileHero: React.FC<PlayerProfileHeroProps> = ({
  player,
  colors: c,
  isOwnProfile,
  completionPercent,
}) => {
  const p = player.profile;
  const verified = player.is_verified === true;
  const availability = availabilityLabel(p.availability);
  const availTone = availabilityTone(p.availability);

  const chips = [
    p.position,
    p.category,
    p.level,
    strongFootLabel(p.strong_foot),
  ].filter(Boolean) as string[];

  const metaParts: string[] = [];
  if (p.age) metaParts.push(`${p.age} ans`);
  if (player.city) metaParts.push(player.city);
  if (p.height_cm) metaParts.push(`${p.height_cm} cm`);
  if (p.weight_kg) metaParts.push(`${p.weight_kg} kg`);

  return (
    <View style={[styles.card, shadows.card, { borderColor: c.border, backgroundColor: c.surface }]}>
      <ProDayGradient kind="hero" style={styles.hero}>
        {isOwnProfile ? (
          <View style={styles.ownPill}>
            <Text style={styles.ownPillText}>Mon profil</Text>
          </View>
        ) : null}

        <View style={styles.heroRow}>
          {player.avatar_url ? (
            <Image source={{ uri: player.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPh]}>
              <Text style={styles.avatarLetter}>{player.display_name.charAt(0).toUpperCase()}</Text>
            </View>
          )}

          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.heroName} numberOfLines={2}>
                {player.display_name}
              </Text>
              {verified ? <Icon name="checkmark-circle" size={20} color="#A7F3D0" /> : null}
            </View>
            <Text style={styles.heroSub}>
              {metaParts.length > 0 ? metaParts.join(' · ') : player.city ?? 'France'}
            </Text>
            {p.cv_headline?.trim() ? (
              <Text style={styles.headline} numberOfLines={2}>
                {p.cv_headline.trim()}
              </Text>
            ) : null}
          </View>
        </View>

        {chips.length > 0 ? (
          <View style={styles.chipRow}>
            {chips.map((chip) => (
              <View key={chip} style={styles.chip}>
                <Text style={styles.chipText}>{chip}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.badgesRow}>
          {availability ? (
            <View
              style={[
                styles.availBadge,
                availTone === 'positive' && styles.availPositive,
                availTone === 'neutral' && styles.availNeutral,
              ]}
            >
              <Icon name="calendar" size={12} color="#FFFFFF" />
              <Text style={styles.availText}>{availability}</Text>
            </View>
          ) : null}
          {verified ? (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>Profil vérifié</Text>
            </View>
          ) : null}
        </View>
      </ProDayGradient>

      {isOwnProfile && completionPercent != null ? (
        <View style={[styles.completionRow, { borderTopColor: c.border }]}>
          <View style={styles.completionCopy}>
            <Text style={[styles.completionTitle, { color: c.text }]}>Profil complété</Text>
            <Text style={[styles.completionSub, { color: c.textMuted }]}>
              {completionPercent >= 80
                ? 'Bonne visibilité sur le Mercato'
                : 'Complétez les blocs ci-dessous pour être mieux repéré'}
            </Text>
          </View>
          <View style={[styles.completionRing, { borderColor: c.brand }]}>
            <Text style={[styles.completionPct, { color: c.brand }]}>{completionPercent}%</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const InfoRow: React.FC<{
  icon: IconName;
  label: string;
  value: string;
  colors: AppColors;
  isLast?: boolean;
}> = ({ icon, label, value, colors: c, isLast }) => (
  <View style={[infoStyles.row, !isLast && { borderBottomColor: c.border }]}>
    <View style={[infoStyles.iconWrap, { backgroundColor: c.accentSoft }]}>
      <Icon name={icon} size={16} color={c.brand} />
    </View>
    <View style={infoStyles.copy}>
      <Text style={[infoStyles.label, { color: c.textMuted }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: c.text }]}>{value}</Text>
    </View>
  </View>
);

export const PlayerIdentityDetails: React.FC<{ player: User; colors: AppColors }> = ({
  player,
  colors: c,
}) => {
  const p = player.profile;
  const rows: { icon: IconName; label: string; value: string }[] = [];

  if (p.position) rows.push({ icon: 'football', label: 'Poste', value: p.position });
  if (p.category) rows.push({ icon: 'people', label: 'Catégorie', value: p.category });
  if (p.level) rows.push({ icon: 'trophy', label: 'Niveau', value: p.level });
  const foot = strongFootLabel(p.strong_foot);
  if (foot) rows.push({ icon: 'walk', label: 'Pied fort', value: foot });
  if (p.height_cm) rows.push({ icon: 'shirt', label: 'Taille', value: `${p.height_cm} cm` });
  if (p.weight_kg) rows.push({ icon: 'person', label: 'Poids', value: `${p.weight_kg} kg` });
  if (player.city) rows.push({ icon: 'location', label: 'Ville', value: player.city });
  if (p.years_experience != null && p.years_experience > 0) {
    rows.push({
      icon: 'time',
      label: 'Expérience',
      value: `${p.years_experience} an${p.years_experience > 1 ? 's' : ''}`,
    });
  }

  if (rows.length === 0) {
    return (
      <Text style={[infoStyles.empty, { color: c.textMuted }]}>
        Identité sportive non renseignée
      </Text>
    );
  }

  return (
    <View style={[infoStyles.card, { backgroundColor: c.surfaceMuted, borderColor: c.border }]}>
      {rows.map((row, index) => (
        <InfoRow
          key={row.label}
          {...row}
          colors={c}
          isLast={index === rows.length - 1}
        />
      ))}
    </View>
  );
};

export const PlayerGalleryGrid: React.FC<{
  urls: string[];
  colors: AppColors;
  expanded: boolean;
}> = ({ urls, colors: c, expanded }) => {
  const visible = expanded ? urls : urls.slice(0, 6);
  if (urls.length === 0) {
    return (
      <Text style={[infoStyles.empty, { color: c.textMuted }]}>Aucune photo dans la galerie</Text>
    );
  }
  return (
    <View style={infoStyles.galleryGrid}>
      {visible.map((uri) => (
        <Image
          key={uri}
          source={{ uri }}
          style={[infoStyles.galleryCell, { backgroundColor: c.surfaceMuted, borderColor: c.border }]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  hero: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  ownPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  ownPillText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  avatarPh: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  heroInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroName: { flex: 1, fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.4 },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4, lineHeight: 18 },
  headline: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  chipText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  availPositive: { backgroundColor: 'rgba(52,211,153,0.35)' },
  availNeutral: { backgroundColor: 'rgba(251,191,36,0.35)' },
  availText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  verifiedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  verifiedText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
  },
  completionCopy: { flex: 1, gap: 2 },
  completionTitle: { fontSize: 14, fontWeight: '800' },
  completionSub: { fontSize: 12, lineHeight: 17 },
  completionRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionPct: { fontSize: 13, fontWeight: '900' },
});

const infoStyles = StyleSheet.create({
  card: { borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  label: { fontSize: 11, fontWeight: '600' },
  value: { fontSize: 14, fontWeight: '700', marginTop: 1 },
  empty: { fontSize: 13, lineHeight: 20 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  galleryCell: {
    width: '31%' as unknown as number,
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
