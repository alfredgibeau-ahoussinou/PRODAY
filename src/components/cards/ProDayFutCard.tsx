import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { radius, spacing } from '../../theme/designTokens';
import {
  PRODAY_CARD_ACTION_LABELS,
  type ProDayCardActionId,
  type ProDayCardData,
  type ProDayCardTier,
} from '../../models/ProDayCard';

/** Accent vert terrain discret — carte FUT épurée. */
const PITCH = '#16A34A';

const TIER_INK: Record<ProDayCardTier, string> = {
  bronze: '#78350F',
  silver: '#334155',
  gold: '#854D0E',
  elite: '#14532D',
  legend: '#581C87',
};

type CardTheme = {
  bg: string;
  border: string;
  ink: string;
  inkMuted: string;
  accent: string;
};

function tierTheme(tier: ProDayCardTier): CardTheme {
  return {
    bg: '#FFFFFF',
    border: 'rgba(15, 23, 42, 0.08)',
    ink: TIER_INK[tier],
    inkMuted: '#64748B',
    accent: tier === 'elite' || tier === 'gold' ? PITCH : TIER_INK[tier],
  };
}

type Props = {
  card: ProDayCardData;
  width?: number;
  onAction?: (action: ProDayCardActionId) => void;
  /** Tap principal (ex. poser sur le XI). Si défini, remplace le flip au tap — long-press = aperçu. */
  onSelect?: () => void;
};

function clampStat(n: number) {
  return Math.max(40, Math.min(99, Math.round(n)));
}

export const ProDayFutCard: React.FC<Props> = ({ card, width = 220, onAction, onSelect }) => {
  const [preview, setPreview] = useState(false);
  const styles = useMemo(() => createStyles(width), [width]);
  const theme = tierTheme(card.tier);

  return (
    <>
      <PressableSpring
        onPress={() => {
          if (onSelect) onSelect();
          else setPreview(true);
        }}
        onLongPress={() => setPreview(true)}
        scaleTo={0.98}
        haptic
      >
        <View style={[styles.shell, { borderColor: theme.border, backgroundColor: theme.bg }]}>
          <FrontFace card={card} styles={styles} theme={theme} tier={card.tier} />
        </View>
      </PressableSpring>

      <Modal visible={preview} transparent animationType="fade" onRequestClose={() => setPreview(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPreview(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <ProDayText variant="caption" style={styles.modalKicker}>
              {card.role.toUpperCase()} · {card.tier}
            </ProDayText>
            <ProDayText variant="section" style={styles.modalTitle}>
              {card.displayName}
            </ProDayText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow}>
              {card.actions.map((action) => (
                <Pressable
                  key={action}
                  onPress={() => {
                    onAction?.(action);
                    if (action === 'view_profile' || action === 'view_club') setPreview(false);
                  }}
                  style={[
                    styles.actionChip,
                    (action === 'view_profile' || action === 'view_club') && styles.actionChipPrimary,
                  ]}
                >
                  <ProDayText variant="caption" style={styles.actionLabel}>
                    {PRODAY_CARD_ACTION_LABELS[action]}
                  </ProDayText>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

function FrontFace({
  card,
  styles,
  theme,
  tier,
}: {
  card: ProDayCardData;
  styles: ReturnType<typeof createStyles>;
  theme: CardTheme;
  tier: ProDayCardTier;
}) {
  const ink = theme.ink;

  if (card.role === 'player') {
    const ovr = card.overall;
    const stats = [
      { l: 'BUT', v: card.goals },
      { l: 'PAS', v: card.assists },
      { l: 'FOR', v: clampStat(card.formPct) },
    ];
    return (
      <View style={styles.col}>
        <View style={styles.topRow}>
          <View style={styles.ratingCol}>
            <ProDayText variant="section" style={[styles.ovr, { color: theme.accent }]}>
              {ovr}
            </ProDayText>
            <ProDayText variant="caption" style={[styles.pos, { color: ink }]}>
              {card.primaryPosition}
            </ProDayText>
          </View>
          <Photo photoUrl={card.photoUrl} styles={styles} />
        </View>
        <ProDayText variant="body" style={[styles.name, { color: ink }]} numberOfLines={1}>
          {card.lastName}
        </ProDayText>
        <StatRow stats={stats} ink={ink} muted={theme.inkMuted} />
        <ProDayText variant="caption" style={[styles.tierLabel, { color: theme.inkMuted }]}>
          {tier}
        </ProDayText>
      </View>
    );
  }

  const rating =
    card.role === 'coach'
      ? card.reputation
      : card.role === 'supporter'
        ? Math.min(99, Math.round(card.points / 30))
        : card.role === 'sponsor'
          ? 99
          : card.role === 'team'
            ? Math.min(99, 60 + card.playersCount)
            : Number(card.standingLabel.match(/\d+/)?.[0] ?? 80);
  const pos =
    card.role === 'coach'
      ? 'COA'
      : card.role === 'club'
        ? 'CLB'
        : card.role === 'team'
          ? 'EQ'
          : card.role === 'supporter'
            ? 'FAN'
            : 'SPN';
  const name =
    card.role === 'sponsor'
      ? card.company
      : card.role === 'coach'
        ? card.displayName.split(' ').pop()!
        : card.role === 'team'
          ? card.category
          : card.displayName;

  return (
    <View style={styles.col}>
      <View style={styles.topRow}>
        <View style={styles.ratingCol}>
          <ProDayText variant="section" style={[styles.ovr, { color: theme.accent }]}>
            {rating}
          </ProDayText>
          <ProDayText variant="caption" style={[styles.pos, { color: ink }]}>
            {pos}
          </ProDayText>
        </View>
        <Photo photoUrl={card.photoUrl} styles={styles} />
      </View>
      <ProDayText variant="body" style={[styles.name, { color: ink }]} numberOfLines={1}>
        {name}
      </ProDayText>
    </View>
  );
}

function Photo({
  photoUrl,
  styles,
}: {
  photoUrl?: string | null;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.photoWrap}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.photoFallback]} />
      )}
    </View>
  );
}

function StatRow({
  stats,
  ink,
  muted,
}: {
  stats: Array<{ l: string; v: string | number }>;
  ink: string;
  muted: string;
}) {
  return (
    <View style={statStyles.row}>
      {stats.map((s) => (
        <View key={s.l} style={statStyles.cell}>
          <ProDayText variant="caption" style={{ color: muted, fontSize: 9, fontWeight: '600' }}>
            {s.l}
          </ProDayText>
          <ProDayText variant="caption" style={{ color: ink, fontSize: 14, fontWeight: '800' }}>
            {s.v}
          </ProDayText>
        </View>
      ))}
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(15, 23, 42, 0.08)',
  },
  cell: { alignItems: 'center', gap: 2 },
});

function createStyles(width: number) {
  const height = Math.round(width * 1.35);
  return StyleSheet.create({
    shell: {
      width,
      height,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.md,
      overflow: 'hidden',
    },
    col: { flex: 1, gap: 4 },
    topRow: { flex: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 0 },
    ratingCol: { width: 48, alignItems: 'center', paddingTop: 2 },
    ovr: { fontSize: 32, fontWeight: '800', lineHeight: 34 },
    pos: { fontWeight: '700', fontSize: 11, letterSpacing: 0.6, marginTop: 2 },
    photoWrap: { flex: 1, borderRadius: radius.sm, overflow: 'hidden' },
    photo: { width: '100%', height: '100%' },
    photoFallback: { backgroundColor: 'rgba(15, 23, 42, 0.06)' },
    name: {
      textAlign: 'center',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontSize: 13,
      marginTop: 2,
    },
    tierLabel: {
      textAlign: 'center',
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: 2,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      justifyContent: 'flex-end',
      padding: spacing.md,
    },
    modalSheet: {
      borderRadius: radius.lg,
      backgroundColor: '#FFFFFF',
      padding: spacing.lg,
      gap: spacing.sm,
    },
    modalKicker: { color: '#64748B', letterSpacing: 1, textTransform: 'uppercase' },
    modalTitle: { color: '#0F172A', fontWeight: '700', fontSize: 22 },
    actionsRow: { gap: spacing.sm, paddingVertical: spacing.sm },
    actionChip: {
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(15, 23, 42, 0.12)',
      backgroundColor: '#F8FAFC',
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    actionChipPrimary: {
      borderColor: PITCH,
      backgroundColor: 'rgba(22, 163, 74, 0.08)',
    },
    actionLabel: { color: '#0F172A', fontWeight: '600', fontSize: 11 },
  });
}
