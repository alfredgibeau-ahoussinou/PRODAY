import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import {
  CLUB_CREATE_ACTIONS,
  type ClubCreateActionId,
  type ClubNavItemId,
} from '../navigation/clubNavConfig';
import { ClubText } from '../ui/clubUi';
import { useClubTheme } from './ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubRadius, clubShadow, clubSpace } from '../theme/clubDesignSystem';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (action: ClubCreateActionId, nav?: ClubNavItemId) => void;
};

/** Sheet + CRÉER — match, entraînement, joueur, club… (logique inchangée). */
export function ClubCreateSheet({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose}>
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: tokens.scrim }]} />
        </Pressable>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, clubSpace.lg) }]}>
          <View style={styles.handle} />
          <ClubText variant="h3">Créer</ClubText>
          <ClubText variant="caption" muted style={{ marginBottom: clubSpace.sm }}>
            Choisissez ce que vous voulez ajouter
          </ClubText>
          {CLUB_CREATE_ACTIONS.map((action) => (
            <PressableSpring
              key={action.id}
              onPress={() => {
                onSelect(action.id, action.nav);
                onClose();
              }}
              scaleTo={0.98}
              haptic
              style={styles.row}
            >
              <View style={styles.icon}>
                <Icon name={action.icon} size={18} color={tokens.accent} />
              </View>
              <ClubText variant="body" style={{ fontWeight: '600', flex: 1 }}>
                {action.label}
              </ClubText>
              <Icon name="chevron-forward" size={16} color={tokens.faint} />
            </PressableSpring>
          ))}
        </View>
      </View>
    </Modal>
  );
}

/** FAB mobile « + CRÉER ». */
export function ClubCreateFab({ onPress }: { onPress: () => void }) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  return (
    <PressableSpring
      onPress={onPress}
      scaleTo={0.94}
      haptic
      style={styles.fab}
      accessibilityRole="button"
      accessibilityLabel="Créer"
    >
      <Icon name="add" size={22} color={tokens.onAccent} />
      <ClubText variant="caption" style={[styles.fabLabel, { color: tokens.onAccent }]}>
        CRÉER
      </ClubText>
    </PressableSpring>
  );
}

function createStyles(tokens: ClubThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    scrim: { ...StyleSheet.absoluteFillObject },
    sheet: {
      backgroundColor: tokens.raised,
      borderTopLeftRadius: clubRadius.xxl,
      borderTopRightRadius: clubRadius.xxl,
      paddingHorizontal: clubSpace.lg,
      paddingTop: clubSpace.sm,
      gap: clubSpace.xs,
      borderTopWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.lift,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: tokens.borderStrong,
      marginBottom: clubSpace.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.sm,
      paddingHorizontal: 4,
      borderRadius: clubRadius.md,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.accentSoft,
    },
    fab: {
      position: 'absolute',
      right: clubSpace.lg,
      bottom: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: tokens.accent,
      paddingHorizontal: 18,
      paddingVertical: 13,
      borderRadius: clubRadius.pill,
      zIndex: 30,
      elevation: 8,
      ...clubShadow.accent(tokens),
    },
    fabLabel: { fontWeight: '800', letterSpacing: 0.8 },
  });
}
