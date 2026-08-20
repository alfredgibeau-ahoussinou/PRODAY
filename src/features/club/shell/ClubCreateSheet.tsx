import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import {
  CLUB_CREATE_ACTIONS,
  type ClubCreateActionId,
  type ClubNavItemId,
} from '../navigation/clubNavConfig';
import { ClubText } from '../ui/clubUi';
import { spacing } from '../../../theme/designTokens';
import { useClubTheme } from './ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (action: ClubCreateActionId, nav?: ClubNavItemId) => void;
};

/** Sheet + CRÉER — match, entraînement, joueur, coach, inviter, événement, invitation club. */
export function ClubCreateSheet({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.handle} />
          <ClubText variant="section">Créer</ClubText>
          <ClubText variant="caption" muted style={{ marginBottom: spacing.sm }}>
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
              <Icon name="chevron-forward" size={16} color={tokens.muted} />
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
      <Icon name="add" size={22} color="#fff" />
      <ClubText variant="caption" style={styles.fabLabel}>
        CRÉER
      </ClubText>
    </PressableSpring>
  );
}

function createStyles(tokens: ClubThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,22,40,0.45)' },
    sheet: {
      backgroundColor: tokens.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      gap: spacing.xs,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: tokens.border,
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.accentSoft,
    },
    fab: {
      position: 'absolute',
      right: spacing.lg,
      bottom: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: tokens.accent,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 999,
      zIndex: 30,
      elevation: 8,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    fabLabel: { color: '#fff', fontWeight: '800', letterSpacing: 0.8 },
  });
}
