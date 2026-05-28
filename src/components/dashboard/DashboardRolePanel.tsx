import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import type { Application } from '../../models/Player';
import type { TeamEvent } from '../../models/TeamEvent';
import type { FriendlyMatch } from '../../models/FriendlyMatch';
import { Icon, type IconName } from '../ui/Icon';
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
}) => {
  const stats = profile.profile.season_stats;

  if (profile.role === 'player') {
    return (
      <View style={styles.wrap}>
        <Text style={styles.eyebrow}>COCKPIT JOUEUR</Text>
        <Text style={styles.title}>Votre carrière en direct</Text>
        <View style={styles.statGrid}>
          <StatBox
            label="Matchs"
            value={String(stats?.matches ?? 0)}
            icon="football"
          />
          <StatBox label="Buts" value={String(stats?.goals ?? 0)} icon="star" />
          <StatBox
            label="Passes d."
            value={String(stats?.assists ?? 0)}
            icon="handshake"
          />
          <StatBox
            label="Candidatures"
            value={String(applications.length)}
            icon="briefcase"
            highlight={applications.length > 0}
            onPress={onApplications}
          />
        </View>
        <ActionRow
          icon="search"
          title="Opportunités Mercato"
          sub="Annonces clubs & détections"
          onPress={onRecruitment}
        />
        {detections.length > 0 ? (
          <ActionRow
            icon="football"
            title={`${detections.length} détection${detections.length > 1 ? 's' : ''} ouverte${detections.length > 1 ? 's' : ''}`}
            sub="Inscription en un tap"
            onPress={onDetections}
            accent
          />
        ) : null}
      </View>
    );
  }

  if (
    profile.role === 'coach' ||
    profile.role === 'agent' ||
    profile.role === 'organizer' ||
    profile.role === 'club'
  ) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.eyebrow}>CENTRE DE COMMANDE</Text>
        <Text style={styles.title}>
          {profile.role === 'coach'
            ? 'Pilotez votre équipe'
            : profile.role === 'club'
              ? 'Votre club sur ProDay'
              : profile.role === 'agent'
                ? 'Scouting & placement'
                : 'Animez la communauté'}
        </Text>
        <ActionRow
          icon="calendar"
          title="Calendrier & convocations"
          sub="RSVP, compo, Live Stats"
          onPress={onMatches}
          accent
        />
        <ActionRow
          icon="search"
          title="Recrutement"
          sub="Publier ou chercher des profils"
          onPress={onRecruitment}
        />
        {openMatches.length > 0 ? (
          <ActionRow
            icon="handshake"
            title={`${openMatches.length} match${openMatches.length > 1 ? 's' : ''} amical${openMatches.length > 1 ? 'ux' : ''} disponible${openMatches.length > 1 ? 's' : ''}`}
            sub="Complétez votre planning"
            onPress={onMatches}
          />
        ) : null}
        {detections.length > 0 ? (
          <ActionRow
            icon="football"
            title="Organiser une détection"
            sub="Journées scouting ProDay"
            onPress={onDetections}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>PARTENARIATS</Text>
      <Text style={styles.title}>Soutenez les clubs locaux</Text>
      <ActionRow
        icon="star-four-points"
        title="Offres sponsors"
        sub="Visibilité & financement"
        onPress={onSponsors ?? onRecruitment}
      />
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
  eyebrow: { fontSize: 10, fontWeight: '800', color: colors.accent, letterSpacing: 1 },
  title: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: spacing.md },
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
