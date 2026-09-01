/**
 * Composition visuelle inbox notifications Club — cartes + empty premium.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { PressableSpring, AnimatedEntrance } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubRadius, clubShadow, clubSpace } from '../theme/clubDesignSystem';
import { ClubStatusPill, ClubText } from './clubUi';
import type { StaffNotification } from '../../../services/staffNotifications.service';
import {
  formatStaffNotifWhen,
  staffNotificationIcon,
} from '../../../utils/staffNotificationRouting';

export function ClubNotifDeliveryNote({ text }: { text: string }) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => noteStyles(tokens), [tokens]);
  return (
    <View style={styles.box}>
      <Icon name="notifications" size={14} color={tokens.faint} />
      <ClubText variant="caption" muted style={styles.text}>
        {text}
      </ClubText>
    </View>
  );
}

export function ClubNotifListCard({
  item,
  index,
  onPress,
}: {
  item: StaffNotification;
  index: number;
  onPress: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => cardStyles(tokens), [tokens]);
  const unread = !item.read_at;
  const icon = staffNotificationIcon(item.type);

  return (
    <AnimatedEntrance kind="fadeUp" index={index} delayStep={28}>
      <PressableSpring
        onPress={onPress}
        scaleTo={0.98}
        haptic
        style={[styles.card, unread ? styles.cardUnread : null]}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${item.body}`}
      >
        <View
          style={[
            styles.rail,
            { backgroundColor: unread ? tokens.accent : tokens.borderStrong },
          ]}
        />
        <View
          style={[
            styles.icon,
            { backgroundColor: unread ? tokens.accentSoft : tokens.elevated },
          ]}
        >
          <Icon name={icon} size={16} color={unread ? tokens.accent : tokens.faint} />
        </View>
        <View style={styles.copy}>
          <ClubText variant="body" numberOfLines={1} style={{ fontWeight: unread ? '800' : '600' }}>
            {item.title || 'Alerte'}
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={2}>
            {item.body}
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={1}>
            {formatStaffNotifWhen(item.created_at)}
          </ClubText>
        </View>
        {unread ? <ClubStatusPill label="Nouveau" tone="warn" /> : null}
        <Icon name="chevron-forward" size={14} color={tokens.faint} />
      </PressableSpring>
    </AnimatedEntrance>
  );
}

function noteStyles(tokens: ClubThemeTokens) {
  return StyleSheet.create({
    box: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: clubSpace.sm,
      padding: clubSpace.md,
      borderRadius: clubRadius.lg,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
    },
    text: { flex: 1, lineHeight: 18 },
  });
}

function cardStyles(tokens: ClubThemeTokens) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.lg,
      borderRadius: clubRadius.xl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      overflow: 'hidden',
    },
    cardUnread: {
      borderColor: tokens.borderStrong,
      ...clubShadow.lift,
    },
    rail: {
      position: 'absolute',
      left: 0,
      top: 12,
      bottom: 12,
      width: 3,
      borderTopRightRadius: 2,
      borderBottomRightRadius: 2,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: clubRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    copy: { flex: 1, minWidth: 0, gap: 2 },
  });
}
