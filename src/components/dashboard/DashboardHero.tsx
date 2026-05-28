import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { User } from '../../models/User';
import type { ProdayPulseResult, PulseBreakdownItem } from '../../utils/prodayPulse';
import { ROLE_DASHBOARD_TAGLINE } from '../../content/dashboardUniques';
import { ProDayPulseInteractive } from '../interactive/ProDayPulseInteractive';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';

interface DashboardHeroProps {
  profile: User;
  pulse: ProdayPulseResult;
  breakdown: PulseBreakdownItem[];
  unreadMessages: number;
  onProfilePress: () => void;
  onMessagesPress: () => void;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  profile,
  pulse,
  breakdown,
  unreadMessages,
  onProfilePress,
  onMessagesPress,
}) => {
  const firstName = profile.display_name.split(' ')[0];
  const roleLabel =
    profile.role === 'player'
      ? 'Joueur'
      : profile.role === 'coach'
        ? 'Coach'
        : profile.role === 'agent'
          ? 'Agent'
          : profile.role === 'organizer'
            ? 'Organisateur'
            : 'Sponsor';

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.brandMark}>
          <Text style={styles.brandText}>PRODAY</Text>
        </View>
        <TouchableOpacity style={styles.msgBtn} onPress={onMessagesPress}>
          <Icon name="chat" size={20} color={colors.brandInverse} />
          {unreadMessages > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <Text style={styles.greeting}>Bonjour, {firstName}</Text>
      <Text style={styles.tagline}>{ROLE_DASHBOARD_TAGLINE[profile.role]}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.rolePill}>{roleLabel}</Text>
        {profile.city ? <Text style={styles.city}>{profile.city}</Text> : null}
      </View>

      <ProDayPulseInteractive
        pulse={pulse}
        breakdown={breakdown}
        variant="dark"
        onExpand={onProfilePress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceInverse,
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    marginBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    ...shadows.interactive,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  brandMark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  brandText: {
    color: colors.brandInverse,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 2.5,
  },
  msgBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.accent,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  greeting: {
    color: colors.brandInverse,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  tagline: {
    color: colors.heroMuted,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  rolePill: {
    color: colors.brandInverse,
    backgroundColor: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  city: { color: colors.heroMuted, fontSize: 13 },
});
