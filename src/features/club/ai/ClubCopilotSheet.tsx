import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedModalShell } from '../../../components/motion/AnimatedModalShell';
import { PressableSpring } from '../../../components/motion';
import { useClubTheme } from '../shell/ClubThemeContext';
import { ClubText } from '../ui/clubUi';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { ClubAiAssistant } from './ClubAiAssistant';

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Sheet immersif Copilote Club — dialogue réel Google Gemini (clubAssistantChat),
 * remplace l’ancien FAQ « Aide Pôle Club ».
 */
export function ClubCopilotSheet({ visible, onClose }: Props) {
  const { tokens } = useClubTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  return (
    <AnimatedModalShell
      visible={visible}
      onClose={onClose}
      variant="tall"
      handleOnly
      sheetBackgroundColor={tokens.bg}
    >
      <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, clubSpace.sm) }]}>
        <View style={[styles.header, { borderBottomColor: tokens.border }]}>
          <View style={styles.headerCopy}>
            <View style={[styles.badge, { backgroundColor: tokens.accentSoft }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={12} color={tokens.accent} />
              <ClubText variant="label" style={{ color: tokens.accent, fontSize: 9 }}>
                Assistant
              </ClubText>
            </View>
            <ClubText variant="section" style={styles.title}>
              Copilote Club
            </ClubText>
            <ClubText variant="caption" muted>
              Dialogue Copilote · confirmation avant action
            </ClubText>
          </View>
          <PressableSpring
            onPress={onClose}
            scaleTo={0.92}
            haptic
            style={[styles.closeBtn, { borderColor: tokens.border, backgroundColor: tokens.surface }]}
            accessibilityRole="button"
            accessibilityLabel="Fermer le copilote"
          >
            <Ionicons name="close" size={18} color={tokens.muted} />
          </PressableSpring>
        </View>
        <View style={styles.body}>
          <ClubAiAssistant embedded />
        </View>
      </View>
    </AnimatedModalShell>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: {
      flex: 1,
      minHeight: 0,
      backgroundColor: tokens.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: clubSpace.md,
      paddingHorizontal: clubSpace.lg,
      paddingBottom: clubSpace.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerCopy: { flex: 1, gap: 4, minWidth: 0 },
    badge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: clubRadius.pill,
      marginBottom: 2,
    },
    title: { fontWeight: '800' },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: { flex: 1, minHeight: 0 },
  });
