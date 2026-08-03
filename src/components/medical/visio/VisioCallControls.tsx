import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableSpring } from '../../motion';
import { spacing, radius } from '../../../theme/designTokens';
import { MEDICAL_THEME } from '../../../content/medicalExperience';
import type { VisioCallControlsProps } from './visioCallTypes';

type ControlBtn = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  danger?: boolean;
  disabled?: boolean;
  onPress: () => void;
  label: string;
};

export const VisioCallControls: React.FC<VisioCallControlsProps> = ({
  camOn,
  micOn,
  screenSharing,
  chatOpen,
  screenShareSupported,
  onToggleCam,
  onToggleMic,
  onToggleScreenShare,
  onToggleChat,
  onHangUp,
}) => {
  const buttons = useMemo<ControlBtn[]>(
    () => [
      {
        key: 'mic',
        icon: micOn ? 'mic' : 'mic-off',
        active: micOn,
        onPress: onToggleMic,
        label: micOn ? 'Couper le micro' : 'Activer le micro',
      },
      {
        key: 'cam',
        icon: camOn ? 'videocam' : 'videocam-off',
        active: camOn,
        onPress: onToggleCam,
        label: camOn ? 'Couper la caméra' : 'Activer la caméra',
      },
      {
        key: 'screen',
        icon: 'desktop-outline',
        active: screenSharing,
        disabled: !screenShareSupported,
        onPress: onToggleScreenShare,
        label: screenSharing ? 'Arrêter le partage' : 'Partager l’écran',
      },
      {
        key: 'chat',
        icon: chatOpen ? 'chatbubbles' : 'chatbubble-outline',
        active: chatOpen,
        onPress: onToggleChat,
        label: 'Chat',
      },
      {
        key: 'hangup',
        icon: 'call',
        active: false,
        danger: true,
        onPress: onHangUp,
        label: 'Quitter',
      },
    ],
    [
      camOn,
      chatOpen,
      micOn,
      onHangUp,
      onToggleCam,
      onToggleChat,
      onToggleMic,
      onToggleScreenShare,
      screenShareSupported,
      screenSharing,
    ]
  );

  return (
    <View style={styles.bar} accessibilityRole="toolbar">
      {buttons.map((btn) => (
        <PressableSpring
          key={btn.key}
          accessibilityLabel={btn.label}
          disabled={btn.disabled}
          onPress={btn.onPress}
          scaleTo={0.92}
          haptic
          style={[
            styles.btn,
            btn.active && !btn.danger ? styles.btnActive : null,
            !btn.active && !btn.danger ? styles.btnMuted : null,
            btn.danger ? styles.btnDanger : null,
            btn.disabled ? styles.btnDisabled : null,
          ]}
        >
          <Ionicons
            name={btn.icon}
            size={22}
            color="#FFFFFF"
            style={btn.danger ? styles.hangupIcon : undefined}
          />
        </PressableSpring>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    backgroundColor: MEDICAL_THEME.primary,
  },
  btnMuted: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  btnDanger: {
    backgroundColor: '#DC2626',
    width: 56,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  hangupIcon: {
    transform: [{ rotate: '135deg' }],
  },
});
