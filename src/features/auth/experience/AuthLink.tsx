import React from 'react';
import { StyleSheet } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { PressableSpring } from '../../../components/motion';
import { AUTH_XP } from './tokens';

type AuthLinkProps = {
  label: string;
  onPress: () => void;
  /** Prefixe non cliquable, ex. « Nouveau sur ProDay ? » */
  leading?: string;
  align?: 'left' | 'center' | 'right';
  muted?: boolean;
};

export const AuthLink: React.FC<AuthLinkProps> = ({
  label,
  onPress,
  leading,
  align = 'left',
  muted = false,
}) => (
  <PressableSpring
    onPress={onPress}
    scaleTo={0.98}
    style={[styles.row, align === 'center' && styles.center, align === 'right' && styles.right]}
    accessibilityRole="link"
    accessibilityLabel={leading ? `${leading} ${label}` : label}
  >
    {leading ? (
      <ProDayText variant="body" style={styles.leading}>
        {leading}{' '}
      </ProDayText>
    ) : null}
    <ProDayText
      variant="body"
      style={[styles.label, muted && styles.muted]}
    >
      {label}
    </ProDayText>
  </PressableSpring>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingVertical: 8,
  },
  center: { justifyContent: 'center' },
  right: { justifyContent: 'flex-end' },
  leading: {
    color: AUTH_XP.textMuted,
    fontSize: 14,
  },
  label: {
    color: AUTH_XP.goldBright,
    fontSize: 14,
    fontWeight: '600',
  },
  muted: {
    color: AUTH_XP.textMuted,
    fontWeight: '500',
  },
});
