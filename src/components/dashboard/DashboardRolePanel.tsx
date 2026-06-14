import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring, StaggerReveal } from '../motion';
import type { User } from '../../models/User';
import type { Application } from '../../models/Player';
import type { TeamEvent } from '../../models/TeamEvent';
import type { FriendlyMatch } from '../../models/FriendlyMatch';
import { Icon, type IconName } from '../ui/Icon';
import {
  getRolePanelActionsForLine,
} from '../../content/roleDashboardExperience';
import { getDashboardMetaForLine } from '../../content/poleExperience';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import { spacing, radius } from '../../theme/designTokens';

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
  onMercatoStages?: () => void;
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
  onMercatoStages,
  layoutKind = 'pro',
}) => {
  const { productLine, colors: c } = useAppTheme();
  const meta = getDashboardMetaForLine(profile.role, productLine);
  const actions = getRolePanelActionsForLine(profile.role, productLine);

  if (profile.role === 'player') {
    const stats = profile.profile.season_stats;
    return (
      <View
        style={[
          styles.wrap,
          styles.wrapPlayer,
          { backgroundColor: c.surface, borderColor: c.border },
        ]}
      >
        <Text style={[styles.eyebrow, { color: c.brand }]}>{meta.eyebrow}</Text>
        <Text style={[styles.title, { color: c.text }]}>{meta.title}</Text>
        <View style={styles.statGrid}>
          <StatBox c={c} label="Matchs" value={String(stats?.matches ?? 0)} icon="football" />
          <StatBox c={c} label="Buts" value={String(stats?.goals ?? 0)} icon="star" />
          <StatBox c={c} label="Passes d." value={String(stats?.assists ?? 0)} icon="handshake" />
          <StatBox
            c={c}
            label="Candidatures"
            value={String(applications.length)}
            icon="briefcase"
            highlight={applications.length > 0}
            onPress={onApplications}
          />
        </View>
        {actions.map((a, index) => (
          <ActionRow
            key={a.title}
            index={index}
            c={c}
            icon={a.icon}
            title={a.title}
            sub={a.sub}
            accent={a.accent}
            onPress={
              a.title.includes('CV')
                ? (onProfile ?? onRecruitment)
                : a.title.includes('Candidater') || a.title.includes('Mercato F')
                  ? onRecruitment
                  : a.title.includes('Pôle santé')
                    ? (onHealth ?? onRecruitment)
                    : onMatches
            }
          />
        ))}
        {detections.length > 0 ? (
          <ActionRow
            c={c}
            icon="football"
            title={`${detections.length} détection${detections.length > 1 ? 's' : ''}`}
            sub="Inscription en un tap"
            onPress={onDetections}
            accent
            index={actions.length}
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
        <Text style={[styles.title, { color: c.text }]}>{meta.title}</Text>
        <View style={styles.medicalBadge}>
          <Icon name="heart" size={18} color="#0F766E" variant="filled" />
          <Text style={styles.medicalBadgeText}>{specialty}</Text>
        </View>
        {profile.city ? (
          <Text style={[styles.medicalZone, { color: c.textSecondary }]}>
            Zone : {profile.city}
            {profile.department ? ` (${profile.department})` : ''}
          </Text>
        ) : null}
        {actions.map((a, index) => (
          <ActionRow
            key={a.title}
            index={index}
            c={c}
            icon={a.icon}
            title={a.title}
            sub={a.sub}
            accent={a.accent}
            onPress={
              a.title.includes('Agenda')
                ? onMatches
                : a.title.includes('Messagerie')
                  ? onRecruitment
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
        <Text style={[styles.title, { color: c.text }]}>{meta.title}</Text>
        {actions.map((a, index) => (
          <ActionRow
            key={a.title}
            index={index}
            c={c}
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
    <View
      style={[
        styles.wrap,
        layoutKind === 'pro' && {
          backgroundColor: c.accentSoft,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: c.border,
        },
      ]}
    >
      <Text
        style={[
          styles.eyebrow,
          { color: layoutKind === 'pro' ? c.brand : c.brand },
        ]}
      >
        {meta.eyebrow}
      </Text>
      <Text style={[styles.title, { color: c.text }]}>{meta.title}</Text>
      {actions.map((a) => (
        <ActionRow
          key={a.title}
          c={c}
          icon={a.icon}
          title={a.title}
          sub={a.sub}
          accent={a.accent}
          onPress={
            a.title.includes('Calendrier') || a.title.includes('Gestion') || a.title.includes('Matchs')
              ? onMatches
              : a.title.includes('Recrutement') ||
                  a.title.includes('Repérage') ||
                  a.title.includes('Annonces') ||
                  a.title.includes('Mercato Pro')
                ? onRecruitment
                : a.title.includes('Détection') || a.title.includes('Tournois')
                  ? onDetections
                  : a.title.includes('Stages')
                    ? (onMercatoStages ?? onRecruitment)
                  : a.title.includes('Diplômes')
                    ? (onProfile ?? onRecruitment)
                    : onMatches
          }
        />
      ))}
      {openMatches.length > 0 && profile.role !== 'organizer' ? (
        <ActionRow
          c={c}
          icon="handshake"
          title={`${openMatches.length} match${openMatches.length > 1 ? 's' : ''} amical${openMatches.length > 1 ? 'ux' : ''}`}
          sub="Complétez votre planning"
          onPress={onMatches}
          index={actions.length}
        />
      ) : null}
    </View>
  );
};

const StatBox: React.FC<{
  c: AppColors;
  label: string;
  value: string;
  icon: IconName;
  highlight?: boolean;
  onPress?: () => void;
}> = ({ c, label, value, icon, highlight, onPress }) => {
  const content = (
    <>
      <Icon name={icon} size={16} color={highlight ? c.brand : c.textMuted} />
      <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.textMuted }]}>{label}</Text>
    </>
  );
  const boxStyle = [
    styles.statBox,
    {
      backgroundColor: c.surface,
      borderColor: highlight ? c.brand : c.border,
    },
    highlight && { backgroundColor: c.accentSoft },
  ];
  if (onPress) {
    return (
      <PressableSpring style={boxStyle} onPress={onPress} scaleTo={0.96} haptic>
        {content}
      </PressableSpring>
    );
  }
  return <View style={boxStyle}>{content}</View>;
};

const ActionRow: React.FC<{
  c: AppColors;
  icon: IconName;
  title: string;
  sub: string;
  onPress: () => void;
  accent?: boolean;
  index?: number;
}> = ({ c, icon, title, sub, onPress, accent, index = 0 }) => (
  <StaggerReveal index={index} delayStep={45}>
    <PressableSpring
      style={[
        styles.actionRow,
        {
          backgroundColor: accent ? c.brand : c.surface,
          borderColor: accent ? c.brand : c.border,
        },
      ]}
      onPress={onPress}
      scaleTo={0.97}
      haptic
    >
      <View
        style={[
          styles.actionIcon,
          { backgroundColor: accent ? c.brandLight : c.surfaceMuted },
        ]}
      >
        <Icon name={icon} size={20} color={accent ? c.brandInverse : c.text} />
      </View>
      <View style={styles.actionBody}>
        <Text
          style={[
            styles.actionTitle,
            { color: accent ? c.brandInverse : c.text },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.actionSub,
            { color: accent ? c.heroMuted : c.textMuted },
          ]}
        >
          {sub}
        </Text>
      </View>
      <Icon name="chevron-forward" size={18} color={accent ? c.brandInverse : c.textMuted} />
    </PressableSpring>
  </StaggerReveal>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  wrapPlayer: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
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
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  eyebrowMedical: { color: '#0F766E' },
  eyebrowSponsor: { color: '#BE185D' },
  title: { fontSize: 18, fontWeight: '900', marginBottom: spacing.md },
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
  medicalZone: { fontSize: 12, marginBottom: spacing.md, fontWeight: '600' },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statBox: {
    width: '47%',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  statValue: { fontSize: 22, fontWeight: '900', marginTop: spacing.xs },
  statLabel: { fontSize: 11, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBody: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '800' },
  actionSub: { fontSize: 12, marginTop: 2 },
});
