import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { Icon, type IconName } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import {
  availabilityLabel,
  strongFootLabel,
} from '../../utils/playerProfileLabels';

const PITCH = '#16A34A';

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

  const metaParts: string[] = [];
  if (p.position) metaParts.push(p.position);
  if (p.category) metaParts.push(p.category);
  if (p.age) metaParts.push(`${p.age} ans`);
  if (player.city) metaParts.push(player.city);

  return (
    <View style={[styles.card, { borderColor: c.border, backgroundColor: c.surface }]}>
      <View style={styles.hero}>
        {isOwnProfile ? (
          <Text style={[styles.ownLabel, { color: c.textMuted }]}>Mon profil</Text>
        ) : null}

        <View style={styles.heroRow}>
          {player.avatar_url ? (
            <Image source={{ uri: player.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPh]}>
              <Text style={[styles.avatarLetter, { color: PITCH }]}>
                {player.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.heroName, { color: c.text }]} numberOfLines={2}>
                {player.display_name}
              </Text>
              {verified ? <Icon name="checkmark-circle" size={16} color={PITCH} /> : null}
            </View>
            <Text style={[styles.heroSub, { color: c.textMuted }]}>
              {metaParts.length > 0 ? metaParts.join(' · ') : 'Profil joueur'}
            </Text>
            {availability ? (
              <Text style={[styles.availLine, { color: c.textMuted }]}>{availability}</Text>
            ) : null}
            {p.cv_headline?.trim() ? (
              <Text style={[styles.headline, { color: c.textMuted }]} numberOfLines={2}>
                {p.cv_headline.trim()}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {isOwnProfile && (completionPercent != null || careerScore != null) ? (
        <View style={[styles.completionRow, { borderTopColor: c.border }]}>
          {completionPercent != null ? (
            <MetricInline
              title="Profil complété"
              value={`${completionPercent}%`}
              hint={completionPercent >= 80 ? 'Bonne visibilité' : 'Complétez pour être repéré'}
              colors={c}
            />
          ) : null}
          {careerScore != null ? (
            <MetricInline
              title="Score carrière"
              value={String(careerScore)}
              hint="Stats · activité · profil"
              colors={c}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const MetricInline: React.FC<{
  title: string;
  value: string;
  hint: string;
  colors: AppColors;
}> = ({ title, value, hint, colors: c }) => (
  <View style={styles.metricBlock}>
    <View style={styles.completionCopy}>
      <Text style={[styles.completionTitle, { color: c.text }]}>{title}</Text>
      <Text style={[styles.completionSub, { color: c.textMuted }]}>{hint}</Text>
    </View>
    <Text style={[styles.metricValue, { color: PITCH }]}>{value}</Text>
  </View>
);

const InfoRow: React.FC<{
  icon: IconName;
  label: string;
  value: string;
  colors: AppColors;
  isLast?: boolean;
}> = ({ icon, label, value, colors: c, isLast }) => (
  <View style={[infoStyles.row, !isLast && { borderBottomColor: c.border }]}>
    <Icon name={icon} size={16} color={c.textMuted} />
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
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.lg,
  },
  hero: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  ownLabel: { fontSize: 11, fontWeight: '600' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: 'rgba(22, 163, 74, 0.06)',
  },
  avatarPh: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: { fontSize: 28, fontWeight: '700' },
  heroInfo: { flex: 1, minWidth: 0, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroName: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  heroSub: { fontSize: 13, lineHeight: 18 },
  availLine: { fontSize: 12, lineHeight: 16 },
  headline: {
    fontSize: 13,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metricBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  completionCopy: { flex: 1, gap: 2 },
  completionTitle: { fontSize: 14, fontWeight: '700' },
  completionSub: { fontSize: 12, lineHeight: 16 },
  metricValue: { fontSize: 18, fontWeight: '800' },
});

const infoStyles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  copy: { flex: 1 },
  label: { fontSize: 11, fontWeight: '600' },
  value: { fontSize: 14, fontWeight: '600', marginTop: 1 },
  empty: { fontSize: 13, lineHeight: 20 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  galleryCell: {
    width: '31%' as unknown as number,
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
