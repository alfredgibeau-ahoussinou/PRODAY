import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { Icon, type IconName } from '../ui/Icon';
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
  careerScore?: number;
}

export const PlayerProfileHero: React.FC<PlayerProfileHeroProps> = ({
  player,
  colors: c,
  isOwnProfile,
  completionPercent,
  careerScore,
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
      <View style={[styles.hero, { backgroundColor: c.surfaceMuted }]}>
        {isOwnProfile ? (
          <View style={[styles.ownPill, { borderColor: c.border }]}>
            <Text style={[styles.ownPillText, { color: c.textMuted }]}>Mon profil</Text>
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
              <Text
                style={styles.heroName}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {player.display_name}
              </Text>
              {verified ? <Icon name="checkmark-circle" size={18} color={c.brand} /> : null}
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
              <View key={chip} style={[styles.chip, { borderColor: c.border }]}>
                <Text style={[styles.chipText, { color: c.text }]}>{chip}</Text>
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
              <Icon name="calendar" size={12} color={c.text} />
              <Text style={styles.availText}>{availability}</Text>
            </View>
          ) : null}
          {verified ? (
            <View style={[styles.verifiedBadge, { borderColor: c.border }]}>
              <Text style={[styles.verifiedText, { color: c.textMuted }]}>Profil vérifié</Text>
            </View>
          ) : null}
        </View>
      </View>

      {isOwnProfile && (completionPercent != null || careerScore != null) ? (
        <View style={[styles.completionRow, { borderTopColor: c.border }]}>
          {completionPercent != null ? (
            <View style={styles.metricBlock}>
              <View style={styles.completionCopy}>
                <Text style={[styles.completionTitle, { color: c.text }]}>Profil complété</Text>
                <Text style={[styles.completionSub, { color: c.textMuted }]}>
                  {completionPercent >= 80
                    ? 'Bonne visibilité Mercato'
                    : 'Complétez pour être repéré'}
                </Text>
              </View>
              <View style={[styles.completionRing, { borderColor: c.brand }]}>
                <Text style={[styles.completionPct, { color: c.brand }]}>{completionPercent}%</Text>
              </View>
            </View>
          ) : null}
          {careerScore != null ? (
            <View style={styles.metricBlock}>
              <View style={styles.completionCopy}>
                <Text style={[styles.completionTitle, { color: c.text }]}>Score carrière</Text>
                <Text style={[styles.completionSub, { color: c.textMuted }]}>
                  Stats · activité · profil
                </Text>
              </View>
              <View style={[styles.completionRing, { borderColor: c.brand }]}>
                <Text style={[styles.completionPct, { color: c.brand }]}>{careerScore}</Text>
              </View>
            </View>
          ) : null}
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

export type VisibleProfileContacts = {
  phone?: string;
  email?: string;
  other_contact?: string;
};

export const PlayerIdentityDetails: React.FC<{
  player: User;
  colors: AppColors;
  /** Coordonnées déjà filtrées selon `contact_privacy` + relation viewer. */
  visibleContacts?: VisibleProfileContacts | null;
}> = ({ player, colors: c, visibleContacts }) => {
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
  if (visibleContacts?.phone) {
    rows.push({ icon: 'call', label: 'Téléphone', value: visibleContacts.phone });
  }
  if (visibleContacts?.email) {
    rows.push({ icon: 'mail', label: 'E-mail', value: visibleContacts.email });
  }
  if (visibleContacts?.other_contact) {
    rows.push({ icon: 'globe', label: 'Autre contact', value: visibleContacts.other_contact });
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
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  ownPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  ownPillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarPh: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  heroInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroName: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: '#E6E8EC',
    letterSpacing: -0.4,
  },
  heroSub: { color: '#C7CEDA', fontSize: 13, marginTop: spacing.xs, lineHeight: 20 },
  headline: {
    color: '#B7C1D3',
    fontSize: 13,
    marginTop: spacing.sm,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  chipText: { fontSize: 11, fontWeight: '600' },
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
  availPositive: { backgroundColor: 'rgba(52,211,153,0.18)' },
  availNeutral: { backgroundColor: 'rgba(251,191,36,0.18)' },
  availText: { color: '#F1F4FA', fontSize: 11, fontWeight: '600' },
  verifiedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  verifiedText: { fontSize: 11, fontWeight: '600' },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  metricBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  completionCopy: { flex: 1, gap: spacing.xs },
  completionTitle: { fontSize: 15, fontWeight: '800' },
  completionSub: { fontSize: 12, lineHeight: 18 },
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
  card: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
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
    borderRadius: radius.md,
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
