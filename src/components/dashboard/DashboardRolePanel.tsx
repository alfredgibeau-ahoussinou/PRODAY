import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import type { Application } from '../../models/Player';
import type { TeamEvent } from '../../models/TeamEvent';
import type { FriendlyMatch } from '../../models/FriendlyMatch';
import { Icon, type IconName } from '../ui/Icon';
import { getRoleDashboardMeta, getRolePanelActions } from '../../content/roleDashboardExperience';
import { colors, spacing, radius } from '../../theme/designTokens';

interface DashboardRolePanelProps {
  profile: User;
  applications: Application[];
  detections: TeamEvent[];
  openMatches: FriendlyMatch[];
  onRecruitment: () => void;
  onDetections: () => void;
  onMatches: () => void;
  onApplications: () => void;
  onSponsors?: () => void;
  onProfile?: () => void;
  onHealth?: () => void;
  layoutKind?: 'amateur_player' | 'pro';
}

export const DashboardRolePanel: React.FC<DashboardRolePanelProps> = ({
  profile,
  applications,
  detections,
  openMatches,
  onRecruitment,
  onDetections,
  onMatches,
  onApplications,
  onSponsors,
  onProfile,
  onHealth,
  layoutKind = 'pro',
}) => {
  const meta = getRoleDashboardMeta(profile.role);
  const actions = getRolePanelActions(profile.role);

  if (profile.role === 'player') {
    const stats = profile.profile.season_stats;
    return (
      <View style={[styles.wrap, styles.wrapPlayer]}>
        <Text style={styles.eyebrow}>{meta.eyebrow}</Text>
        <Text style={styles.title}>{meta.title}</Text>
        <View style={styles.statGrid}>
          <StatBox label="Matchs" value={String(stats?.matches ?? 0)} icon="football" />
          <StatBox label="Buts" value={String(stats?.goals ?? 0)} icon="star" />
          <StatBox label="Passes d." value={String(stats?.assists ?? 0)} icon="handshake" />
          <StatBox
            label="Candidatures"
            value={String(applications.length)}
            icon="briefcase"
            highlight={applications.length > 0}
            onPress={onApplications}
          />
        </View>
        {actions.map((a) => (
          <ActionRow
            key={a.title}
            icon={a.icon}
            title={a.title}
            sub={a.sub}
            accent={a.accent}
            onPress={
              a.title.includes('CV')
                ? (onProfile ?? onRecruitment)
                : a.title.includes('Candidater')
                  ? onRecruitment
                  : a.title.includes('Pôle santé')
                    ? (onHealth ?? onRecruitment)
                    : onMatches
            }
          />
        ))}
        {detections.length > 0 ? (
          <ActionRow
            icon="football"
            title={`${detections.length} détection${detections.length > 1 ? 's' : ''}`}
            sub="Inscription en un tap"
            onPress={onDetections}
            accent
          />
        ) : null}
      </View>
    );
  }

  if (profile.role === 'physio') {
    const specialty =
      profile.profile.medical_specialty ?? profile.profile.job_title ?? 'Praticien';
    return (
      <View style={[styles.wrap, styles.wrapMedical]}>
        <Text style={[styles.eyebrow, styles.eyebrowMedical]}>{meta.eyebrow}</Text>
        <Text style={styles.title}>{meta.title}</Text>
        <View style={styles.medicalBadge}>
          <Icon name="heart" size={18} color="#0F766E" variant="filled" />
          <Text style={styles.medicalBadgeText}>{specialty}</Text>
        </View>
        {profile.city ? (
          <Text style={styles.medicalZone}>
            Zone : {profile.city}
            {profile.department ? ` (${profile.department})` : ''}
          </Text>
        ) : null}
        {actions.map((a) => (
          <ActionRow
            key={a.title}
            icon={a.icon}
            title={a.title}
            sub={a.sub}
            accent={a.accent}
            onPress={
              a.title.includes('Fil')
                ? onRecruitment
                : a.title.includes('Sportifs')
                  ? onMatches
                  : onProfile ?? onRecruitment
            }
          />
        ))}
      </View>
    );
  }

  if (profile.role === 'sponsor') {
    return (
      <View style={[styles.wrap, styles.wrapSponsor]}>
        <Text style={[styles.eyebrow, styles.eyebrowSponsor]}>{meta.eyebrow}</Text>
        <Text style={styles.title}>{meta.title}</Text>
        {actions.map((a) => (
          <ActionRow
            key={a.title}
            icon={a.icon}
            title={a.title}
            sub={a.sub}
            accent={a.accent}
            onPress={onSponsors ?? onRecruitment}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, layoutKind === 'pro' && styles.wrapPro]}>
      <Text style={[styles.eyebrow, layoutKind === 'pro' && styles.eyebrowPro]}>{meta.eyebrow}</Text>
      <Text style={styles.title}>{meta.title}</Text>
      {actions.map((a) => (
        <ActionRow
          key={a.title}
          icon={a.icon}
          title={a.title}
          sub={a.sub}
          accent={a.accent}
          onPress={
            a.title.includes('Calendrier') || a.title.includes('Gestion') || a.title.includes('Matchs')
              ? onMatches
              : a.title.includes('Recrutement') || a.title.includes('Repérage') || a.title.includes('Annonces')
                ? onRecruitment
                : a.title.includes('Détection') || a.title.includes('Tournois')
                  ? onDetections
                  : a.title.includes('Diplômes')
                    ? (onProfile ?? onRecruitment)
                    : onMatches
          }
        />
      ))}
      {openMatches.length > 0 && profile.role !== 'organizer' ? (
        <ActionRow
          icon="handshake"
          title={`${openMatches.length} match${openMatches.length > 1 ? 's' : ''} amical${openMatches.length > 1 ? 'ux' : ''}`}
          sub="Complétez votre planning"
          onPress={onMatches}
        />
      ) : null}
    </View>
  );
};

const StatBox: React.FC<{
  label: string;
  value: string;
  icon: IconName;
  highlight?: boolean;
  onPress?: () => void;
}> = ({ label, value, icon, highlight, onPress }) => {
  const Box = onPress ? TouchableOpacity : View;
  return (
    <Box
      style={[styles.statBox, highlight && styles.statBoxHighlight]}
      onPress={onPress}
    >
      <Icon name={icon} size={16} color={highlight ? colors.accent : colors.textMuted} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Box>
  );
};

const ActionRow: React.FC<{
  icon: IconName;
  title: string;
  sub: string;
  onPress: () => void;
  accent?: boolean;
}> = ({ icon, title, sub, onPress, accent }) => (
  <TouchableOpacity
    style={[styles.actionRow, accent && styles.actionRowAccent]}
    onPress={onPress}
  >
    <View style={[styles.actionIcon, accent && styles.actionIconAccent]}>
      <Icon name={icon} size={20} color={accent ? colors.brandInverse : colors.text} />
    </View>
    <View style={styles.actionBody}>
      <Text style={[styles.actionTitle, accent && styles.actionTitleAccent]}>{title}</Text>
      <Text style={[styles.actionSub, accent && styles.actionSubAccent]}>{sub}</Text>
    </View>
    <Icon name="chevron-forward" size={18} color={colors.textMuted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  wrapPlayer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  wrapPro: {
    backgroundColor: '#EFF6FF',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  eyebrowPro: { color: '#1D4ED8' },
  wrapMedical: {
    backgroundColor: '#F0FDFA',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  wrapSponsor: {
    backgroundColor: '#FFF5F8',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  eyebrow: { fontSize: 10, fontWeight: '800', color: colors.accent, letterSpacing: 1 },
  eyebrowMedical: { color: '#0F766E' },
  eyebrowSponsor: { color: '#BE185D' },
  title: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: spacing.md },
  medicalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  medicalBadgeText: { fontSize: 13, fontWeight: '800', color: '#0F766E' },
  medicalZone: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.md, fontWeight: '600' },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statBox: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  statBoxHighlight: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  statValue: { fontSize: 22, fontWeight: '900', color: colors.text, marginTop: spacing.xs },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  actionRowAccent: { backgroundColor: colors.ink, borderColor: colors.ink },
  actionTitleAccent: { color: colors.brandInverse },
  actionSubAccent: { color: colors.heroMuted },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconAccent: { backgroundColor: colors.accent, borderWidth: 0 },
  actionBody: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  actionSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
