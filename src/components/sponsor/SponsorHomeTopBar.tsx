import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { SponsorLogo } from '../SponsorLogo';
import { Icon } from '../ui/Icon';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing } from '../../theme/designTokens';

interface SponsorHomeTopBarProps {
  profile: User;
  unreadMessages: number;
  onMessagesPress: () => void;
  onProfilePress: () => void;
}

export const SponsorHomeTopBar: React.FC<SponsorHomeTopBarProps> = ({
  profile,
  unreadMessages,
  onMessagesPress,
  onProfilePress,
}) => {
  const initial = (profile.profile.job_title ?? profile.display_name).charAt(0).toUpperCase();

  return (
    <View style={styles.row}>
      <SponsorLogo width={118} background="dark" centered={false} />
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} onPress={onMessagesPress}>
          <Icon name="chat" size={20} color={SPONSOR_THEME.primary} />
          {unreadMessages > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity style={styles.profileBtn} onPress={onProfilePress}>
          <Text style={styles.profileInitial}>{initial}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SPONSOR_THEME.surface,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: SPONSOR_THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: SPONSOR_THEME.onPrimary },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SPONSOR_THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: { fontSize: 16, fontWeight: '900', color: SPONSOR_THEME.onPrimary },
});
