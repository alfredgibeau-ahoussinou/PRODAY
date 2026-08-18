import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import type { User } from '../../../models/User';
import { Icon } from '../../ui/Icon';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';
import { getRoleLabel } from '../../../screens/signup/signupFlowConfig';
import { userNeedsAdminVerificationReview } from '../../../utils/adminUserVerification';
import { isSubscriptionAccessActive } from '../../../utils/subscriptionLogic';
import {
  adminPlayerIdentityLine,
  adminUniverseShortLabel,
  resolveAdminPlayerAgeGroup,
} from '../../../utils/adminPlayerUniverse';

type Props = {
  user: User;
  onPress: (user: User) => void;
};

export function AdminPersonRow({ user, onPress }: Props) {
  const initial = (user.display_name?.trim().charAt(0) || '?').toUpperCase();
  const pending = userNeedsAdminVerificationReview(user);
  const payant = isSubscriptionAccessActive(user);
  const identity = adminPlayerIdentityLine(user);
  const ageGroup = resolveAdminPlayerAgeGroup(user);

  return (
    <Pressable
      onPress={() => onPress(user)}
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${user.display_name}`}
    >
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={s.avatar} />
      ) : (
        <View style={s.avatarPh}>
          <Text style={s.avatarLetter}>{initial}</Text>
        </View>
      )}

      <View style={s.main}>
        <Text style={s.name} numberOfLines={1}>
          {user.display_name || '—'}
        </Text>
        <View style={s.metaRow}>
          <Text style={s.meta} numberOfLines={1}>
            {getRoleLabel(user.role)}
            {user.city ? ` · ${user.city}` : ''}
          </Text>
          {pending ? (
            <View style={s.pendingChip}>
              <Text style={s.pendingText}>À valider</Text>
            </View>
          ) : null}
        </View>
        {identity ? (
          <Text style={s.identity} numberOfLines={1}>
            {identity}
          </Text>
        ) : user.email ? (
          <Text style={s.identity} numberOfLines={1}>
            {user.email}
          </Text>
        ) : null}
      </View>

      <View style={s.trailing}>
        {ageGroup ? (
          <View style={[s.badge, s.badgeUniverse]}>
            <Text style={[s.badgeText, s.badgeUniverseText]}>
              {adminUniverseShortLabel(ageGroup)}
            </Text>
          </View>
        ) : null}
        <View style={[s.badge, payant ? s.badgePay : s.badgeFree]}>
          <Text style={[s.badgeText, payant ? s.badgePayText : s.badgeFreeText]}>
            {payant ? 'Payant' : 'Gratuit'}
          </Text>
        </View>
      </View>

      <Icon name="chevron-forward" size={14} color={adminChrome.textMuted} />
    </Pressable>
  );
}

const AVATAR = 40;

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 72,
    backgroundColor: adminChrome.shell,
  },
  rowPressed: { backgroundColor: adminChrome.rowHover },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: adminChrome.shellElevated,
  },
  avatarPh: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: adminChrome.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  main: { flex: 1, minWidth: 0, gap: 3 },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: adminChrome.text,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  meta: {
    flexShrink: 1,
    fontSize: 12,
    color: adminChrome.textMuted,
    fontWeight: '600',
  },
  pendingChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: adminChrome.radiusSm,
    backgroundColor: 'rgba(251, 146, 60, 0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(251, 146, 60, 0.45)',
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FB923C',
  },
  identity: {
    fontSize: 12,
    color: adminChrome.textMuted,
    fontWeight: '500',
  },
  trailing: { alignItems: 'flex-end', gap: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: adminChrome.radiusSm,
  },
  badgePay: { backgroundColor: adminChrome.soft },
  badgeFree: { backgroundColor: adminChrome.shellElevated },
  badgeUniverse: { backgroundColor: adminChrome.pitchSoft },
  badgeText: { fontSize: 10, fontWeight: '800' },
  badgePayText: { color: adminChrome.accent },
  badgeFreeText: { color: adminChrome.textMuted },
  badgeUniverseText: { color: adminChrome.pitch },
});
