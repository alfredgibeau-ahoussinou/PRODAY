import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Text,
} from 'react-native';
import type { SocialProfileSuggestion } from '../../features/v3/engines/socialRecommendation.engine';
import type { User } from '../../models/User';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { PressableSpring } from '../motion';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { formatDistanceKm } from '../../utils/geoLocation';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';

export type NetworkSheetAction =
  | 'profile'
  | 'favorite'
  | 'message'
  | 'explore'
  | 'dismiss';

interface MessagesNetworkSheetProps {
  visible: boolean;
  suggestion: SocialProfileSuggestion | null;
  targetUser: User | null;
  loadingTarget: boolean;
  isFavorite: boolean;
  favoriteBusy: boolean;
  canMessage: boolean;
  messageBlockedReason?: string | null;
  onClose: () => void;
  onAction: (action: NetworkSheetAction) => void;
}

export const MessagesNetworkSheet: React.FC<MessagesNetworkSheetProps> = ({
  visible,
  suggestion,
  targetUser,
  loadingTarget,
  isFavorite,
  favoriteBusy,
  canMessage,
  messageBlockedReason,
  onClose,
  onAction,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!suggestion) return null;

  const initial = suggestion.displayName.charAt(0).toUpperCase();
  const isContact = suggestion.kind === 'contact';

  return (
    <AnimatedModalShell visible={visible} onClose={onClose} closeLabel="Fermer">
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ProDayGradient kind="cta" style={styles.heroAccent} />
          <View style={styles.heroBody}>
            <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.initial, { color: colors.accent }]}>{initial}</Text>
            </View>
            <View style={styles.heroCopy}>
              <ProDayText variant="section" style={styles.name}>
                {suggestion.displayName}
              </ProDayText>
              <ProDayText variant="caption" muted>
                {suggestion.role}
              </ProDayText>
              <View style={styles.metaRow}>
                <Icon name="location" size={13} color={colors.textMuted} />
                <ProDayText variant="caption" muted>
                  {suggestion.city}
                  {suggestion.distanceKm != null
                    ? ` · ${formatDistanceKm(suggestion.distanceKm)}`
                    : ''}
                </ProDayText>
              </View>
            </View>
            <View style={[styles.score, { backgroundColor: colors.accent }]}>
              <ProDayText variant="caption" inverse style={styles.scoreText}>
                {suggestion.matchScore}%
              </ProDayText>
            </View>
          </View>
          <ProDayText variant="body" muted style={styles.reason}>
            {suggestion.reason}
          </ProDayText>
        </View>

        {loadingTarget ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : null}

        <View style={styles.actions}>
          {isContact && targetUser ? (
            <PressableSpring
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              onPress={() => onAction('profile')}
              scaleTo={0.98}
              haptic
            >
              <Icon name="person" size={18} color={colors.brandInverse} />
              <Text style={[styles.primaryText, { color: colors.brandInverse }]}>
                Voir le profil
              </Text>
            </PressableSpring>
          ) : null}

          {!isContact && suggestion.kind === 'mercato' ? (
            <PressableSpring
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              onPress={() => onAction('explore')}
              scaleTo={0.98}
              haptic
            >
              <Icon name="search" size={18} color={colors.brandInverse} />
              <Text style={[styles.primaryText, { color: colors.brandInverse }]}>
                Ouvrir le Mercato
              </Text>
            </PressableSpring>
          ) : null}

          {!isContact && suggestion.kind !== 'mercato' ? (
            <PressableSpring
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              onPress={() => onAction('explore')}
              scaleTo={0.98}
              haptic
            >
              <Icon name="football" size={18} color={colors.brandInverse} />
              <Text style={[styles.primaryText, { color: colors.brandInverse }]}>
                Explorer le Match
              </Text>
            </PressableSpring>
          ) : null}

          {isContact && suggestion.targetUid ? (
            <PressableSpring
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => onAction('favorite')}
              disabled={favoriteBusy}
              scaleTo={0.98}
              haptic
            >
              <Icon
                name={isFavorite ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isFavorite ? '#F59E0B' : colors.accent}
              />
              <Text style={[styles.secondaryText, { color: colors.text }]}>
                {favoriteBusy
                  ? 'Enregistrement…'
                  : isFavorite
                    ? 'Retirer des favoris'
                    : 'Enregistrer pour plus tard'}
              </Text>
            </PressableSpring>
          ) : null}

          {isContact ? (
            <PressableSpring
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
                !canMessage && styles.disabledBtn,
              ]}
              onPress={() => onAction('message')}
              disabled={!canMessage}
              scaleTo={0.98}
              haptic={canMessage}
            >
              <Icon name="chat" size={18} color={canMessage ? colors.accent : colors.textMuted} />
              <Text
                style={[
                  styles.secondaryText,
                  { color: canMessage ? colors.text : colors.textMuted },
                ]}
              >
                Écrire un message
              </Text>
            </PressableSpring>
          ) : null}

          {messageBlockedReason && isContact ? (
            <ProDayText variant="caption" muted style={styles.hint}>
              {messageBlockedReason}
            </ProDayText>
          ) : null}

          <PressableSpring onPress={() => onAction('dismiss')} scaleTo={0.98}>
            <Text style={[styles.ghost, { color: colors.textMuted }]}>
              Pas pour le moment
            </Text>
          </PressableSpring>
        </View>
      </ScrollView>
    </AnimatedModalShell>
  );
};

function createStyles(c: { text: string }) {
  return StyleSheet.create({
    scroll: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
    },
    hero: {
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    heroAccent: { height: 3, width: '100%' },
    heroBody: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      padding: spacing.md,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initial: {
      fontFamily: fontFamily.extrabold,
      fontSize: 20,
      fontWeight: '800',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    heroCopy: { flex: 1, gap: 2, minWidth: 0 },
    name: { fontWeight: '800', fontSize: 18 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    score: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      alignSelf: 'flex-start',
    },
    scoreText: { fontWeight: '900', fontSize: 11 },
    reason: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, lineHeight: 20 },
    loader: { marginVertical: spacing.sm },
    actions: { gap: spacing.sm },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
    },
    primaryText: {
      fontFamily: fontFamily.extrabold,
      fontSize: 15,
      fontWeight: '800',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
    },
    secondaryText: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
      fontWeight: '600',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    disabledBtn: { opacity: 0.55 },
    hint: { textAlign: 'center', lineHeight: 18, paddingHorizontal: spacing.sm },
    ghost: {
      fontFamily: fontFamily.semibold,
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
      paddingVertical: spacing.md,
      color: c.text,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
