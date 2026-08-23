import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { AUTH_XP } from './tokens';

type AuthErrorProps = {
  message: string;
  onDismiss?: () => void;
};

/** Erreur humaine — jamais de code technique (401, Firebase…). */
export const AuthError: React.FC<AuthErrorProps> = ({ message, onDismiss }) => {
  if (!message) return null;
  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <ProDayText variant="body" style={styles.text}>
        {message}
      </ProDayText>
      {onDismiss ? (
        <PressableSpring
          onPress={onDismiss}
          hitSlop={8}
          scaleTo={0.92}
          accessibilityLabel="Fermer"
        >
          <Icon name="close" size={16} color={AUTH_XP.error} />
        </PressableSpring>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: AUTH_XP.borderError,
    backgroundColor: AUTH_XP.errorBg,
  },
  text: {
    flex: 1,
    color: AUTH_XP.error,
    fontSize: 14,
    lineHeight: 20,
  },
});
