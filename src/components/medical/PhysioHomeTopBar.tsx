import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { Logo } from '../Logo';
import { Icon } from '../ui/Icon';
import { MEDICAL_THEME } from '../../content/medicalExperience';
import { spacing } from '../../theme/designTokens';
import { useMedicalStyles } from './medicalStyles';
import type { AppColors } from '../../theme/universeTheme';

interface PhysioHomeTopBarProps {
  profile: User;
  unreadMessages: number;
  onMessagesPress: () => void;
  onCabinetPress: () => void;
}

export const PhysioHomeTopBar: React.FC<PhysioHomeTopBarProps> = ({
  profile,
  unreadMessages,
  onMessagesPress,
  onCabinetPress,
}) => {
  const { colors: c } = useMedicalStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.row}>
      <Logo width={108} />
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} onPress={onMessagesPress}>
          <Icon name="chat" size={20} color={MEDICAL_THEME.primary} />
          {unreadMessages > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity style={styles.cabinetBtn} onPress={onCabinetPress}>
          <Text style={styles.cabinetInitial}>
            {profile.display_name.charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
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
      backgroundColor: MEDICAL_THEME.primaryBg,
      borderWidth: 1,
      borderColor: MEDICAL_THEME.primaryBorder,
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
      backgroundColor: MEDICAL_THEME.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeText: { fontSize: 9, fontWeight: '800', color: c.brandInverse },
    cabinetBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: MEDICAL_THEME.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cabinetInitial: { fontSize: 16, fontWeight: '900', color: c.brandInverse },
  });
}
