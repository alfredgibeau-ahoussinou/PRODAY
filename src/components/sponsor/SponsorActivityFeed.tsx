import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SponsorActivityItem } from '../../models/SponsorOffer';
import { Icon, type IconName } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';

const ACTIVITY_ICONS: Record<SponsorActivityItem['type'], IconName> = {
  offer_view: 'search',
  lead: 'person',
  contribution: 'briefcase',
  message: 'chat',
  offer_published: 'add',
};

interface SponsorActivityFeedProps {
  items: SponsorActivityItem[];
  limit?: number;
  onEmptyPress?: () => void;
}

export const SponsorActivityFeed: React.FC<SponsorActivityFeedProps> = ({
  items,
  limit = 4,
  onEmptyPress,
}) => {
  const visible = items.slice(0, limit);
  if (visible.length === 0) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Activité récente</Text>
        <Text style={styles.emptyBody}>
          Les vues d’offres, messages clubs et contributions apparaîtront ici.
        </Text>
        {onEmptyPress ? (
          <PressableSpring onPress={onEmptyPress} scaleTo={0.97} haptic style={styles.emptyCta}>
            <Text style={styles.emptyCtaText}>Voir mes offres</Text>
          </PressableSpring>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Activité récente</Text>
      {visible.map((item) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.iconWrap}>
            <Icon name={ACTIVITY_ICONS[item.type]} size={14} color={SPONSOR_THEME.primary} />
          </View>
          <View style={styles.body}>
            <Text style={styles.rowTitle}>{item.title}</Text>
            <Text style={styles.rowSub} numberOfLines={2}>
              {item.subtitle}
            </Text>
          </View>
          <Text style={styles.time}>{formatRelative(item.at)}</Text>
        </View>
      ))}
    </View>
  );
};

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'À l’instant';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}j`;
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: SPONSOR_THEME.sectionLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SPONSOR_THEME.borderSubtle,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: SPONSOR_THEME.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  rowTitle: { fontSize: 13, fontWeight: '800', color: SPONSOR_THEME.text },
  rowSub: { fontSize: 11, color: SPONSOR_THEME.textMuted, marginTop: 2, lineHeight: 15 },
  time: { fontSize: 10, fontWeight: '700', color: SPONSOR_THEME.textMuted },
  emptyBody: {
    fontSize: 13,
    color: SPONSOR_THEME.textMuted,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  emptyCta: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: SPONSOR_THEME.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  emptyCtaText: { fontSize: 12, fontWeight: '800', color: SPONSOR_THEME.primary },
});
