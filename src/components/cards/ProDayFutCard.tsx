import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { radius, spacing } from '../../theme/designTokens';
import { FUT18_TIER_THEME } from '../../theme/fut18PremiumPalette';
import {
  PRODAY_CARD_ACTION_LABELS,
  type ProDayCardActionId,
  type ProDayCardData,
  type ProDayCardTier,
} from '../../models/ProDayCard';

type Props = {
  card: ProDayCardData;
  width?: number;
  onAction?: (action: ProDayCardActionId) => void;
  /** Tap principal (ex. poser sur le XI). Long-press = aperçu + actions. */
  onSelect?: () => void;
};

function clampStat(n: number) {
  return Math.max(40, Math.min(99, Math.round(n)));
}

export const ProDayFutCard: React.FC<Props> = ({ card, width = 220, onAction, onSelect }) => {
  const [preview, setPreview] = useState(false);
  const styles = useMemo(() => createStyles(width), [width]);
  const theme = FUT18_TIER_THEME[card.tier];

  const openPreview = () => setPreview(true);

  return (
    <>
      <PressableSpring
        onPress={() => {
          if (onSelect) onSelect();
          else openPreview();
        }}
        onLongPress={openPreview}
        scaleTo={0.98}
        haptic
      >
        <View style={[styles.shell, { shadowColor: theme.frame[1] }]}>
          <FifaChrome theme={theme} tier={card.tier}>
            <FrontFace card={card} styles={styles} theme={theme} />
          </FifaChrome>
        </View>
      </PressableSpring>

      <Modal visible={preview} transparent animationType="fade" onRequestClose={() => setPreview(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPreview(false)}>
          <Pressable
            style={[styles.modalSheet, { borderColor: theme.rim }]}
            onPress={(e) => e.stopPropagation()}
          >
            <LinearGradient colors={[theme.face[0], FUT18_TIER_THEME.gold.face[2]]} style={StyleSheet.absoluteFill} />
            <ProDayText variant="caption" style={{ color: theme.frame[0], letterSpacing: 2 }}>
              {card.role.toUpperCase()} · {card.tier.toUpperCase()}
            </ProDayText>
            <ProDayText variant="section" style={styles.modalTitle}>
              {card.displayName}
            </ProDayText>
            {card.role === 'player' ? (
              <StatGrid
                stats={[
                  { l: 'MAT', v: card.matches },
                  { l: 'BUT', v: card.goals },
                  { l: 'PAS', v: card.assists },
                  { l: 'FRM', v: card.formPct },
                  { l: 'POT', v: card.potential },
                  { l: 'MIN', v: card.minutesPlayed },
                ]}
                ink={theme.ink}
                compact={false}
              />
            ) : null}
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
                    (action === 'view_profile' || action === 'view_club') && {
                      backgroundColor: theme.frame[1],
                    },
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

function FifaChrome({
  children,
  theme,
  tier,
}: {
  children: React.ReactNode;
  theme: (typeof FUT18_TIER_THEME)[ProDayCardTier];
  tier: string;
}) {
  return (
    <LinearGradient colors={theme.frame} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={chrome.frame}>
      <LinearGradient colors={theme.face} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={chrome.face}>
        <LinearGradient
          colors={['rgba(255,255,255,0.14)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 0.5 }}
          style={chrome.shine}
          pointerEvents="none"
        />
        <ProDayText variant="caption" style={[chrome.brand, { color: theme.inkMuted }]}>
          ProDay · {tier}
        </ProDayText>
        {children}
      </LinearGradient>
    </LinearGradient>
  );
}

function FrontFace({
  card,
  styles,
  theme,
}: {
  card: ProDayCardData;
  styles: ReturnType<typeof createStyles>;
  theme: (typeof FUT18_TIER_THEME)[ProDayCardTier];
}) {
  const ink = theme.ink;

  if (card.role === 'player') {
    const ovr = card.overall;
    const stats = [
      { l: 'PAC', v: clampStat(ovr - 2) },
      { l: 'SHO', v: clampStat(ovr - 6 + card.goals) },
      { l: 'PAS', v: clampStat(ovr - 4 + card.assists) },
      { l: 'DRI', v: clampStat(ovr - 1) },
    ];
    return (
      <View style={styles.col}>
        <View style={styles.topRow}>
          <View style={styles.ratingCol}>
            <ProDayText variant="section" style={[styles.ovr, { color: ink }]}>
              {ovr}
            </ProDayText>
            <ProDayText variant="caption" style={[styles.pos, { color: ink }]}>
              {card.primaryPosition}
            </ProDayText>
            <ProDayText variant="caption" style={[styles.metaTiny, { color: theme.inkMuted }]}>
              {card.nationality.slice(0, 3).toUpperCase()}
            </ProDayText>
            <ProDayText variant="caption" style={[styles.metaTiny, { color: theme.inkMuted }]} numberOfLines={1}>
              {card.clubName.slice(0, 8)}
            </ProDayText>
          </View>
          <Photo photoUrl={card.photoUrl} styles={styles} />
        </View>
        <NamePlate name={card.lastName} theme={theme} />
        <StatGrid stats={stats} ink={ink} compact />
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
          <ProDayText variant="section" style={[styles.ovr, { color: ink }]}>
            {rating}
          </ProDayText>
          <ProDayText variant="caption" style={[styles.pos, { color: ink }]}>
            {pos}
          </ProDayText>
        </View>
        <Photo photoUrl={card.photoUrl} styles={styles} />
      </View>
      <NamePlate name={name} theme={theme} />
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

function NamePlate({
  name,
  theme,
}: {
  name: string;
  theme: (typeof FUT18_TIER_THEME)[ProDayCardTier];
}) {
  return (
    <View style={[nameStyles.plate, { backgroundColor: theme.plate, borderColor: theme.rim }]}>
      <ProDayText variant="body" style={[nameStyles.text, { color: theme.ink }]} numberOfLines={1}>
        {name}
      </ProDayText>
    </View>
  );
}

function StatGrid({
  stats,
  ink,
  compact,
}: {
  stats: Array<{ l: string; v: string | number }>;
  ink: string;
  compact?: boolean;
}) {
  return (
    <View style={[statStyles.grid, compact && statStyles.gridCompact]}>
      {stats.map((s) => (
        <View key={s.l} style={statStyles.row}>
          <ProDayText variant="caption" style={[statStyles.label, { color: ink }]}>
            {s.l}
          </ProDayText>
          <ProDayText variant="caption" style={[statStyles.value, { color: ink }]}>
            {s.v}
          </ProDayText>
        </View>
      ))}
    </View>
  );
}

const chrome = StyleSheet.create({
  frame: { flex: 1, borderRadius: 14, padding: 3, overflow: 'hidden' },
  face: { flex: 1, borderRadius: 12, padding: spacing.sm, paddingTop: spacing.md, overflow: 'hidden' },
  shine: { ...StyleSheet.absoluteFillObject, borderRadius: 12 },
  brand: {
    position: 'absolute',
    top: 4,
    alignSelf: 'center',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 7,
    letterSpacing: 1.4,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});

const nameStyles = StyleSheet.create({
  plate: {
    marginTop: 6,
    paddingVertical: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: {
    textAlign: 'center',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 13,
  },
});

const statStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, paddingHorizontal: 2 },
  gridCompact: { marginTop: 4 },
  row: {
    width: '50%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  label: { opacity: 0.72, fontSize: 9, fontWeight: '800' },
  value: { fontSize: 12, fontWeight: '900' },
});

function createStyles(width: number) {
  const height = Math.round(width * 1.38);
  return StyleSheet.create({
    shell: {
      width,
      height,
      borderRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 14,
      elevation: 10,
    },
    col: { flex: 1 },
    topRow: { flex: 1, flexDirection: 'row', gap: 4, minHeight: 0 },
    ratingCol: { width: 52, alignItems: 'center', paddingTop: 6 },
    ovr: { fontSize: 32, fontWeight: '900', lineHeight: 34 },
    pos: { fontWeight: '900', fontSize: 11, letterSpacing: 1, marginTop: 2 },
    metaTiny: { fontSize: 8, fontWeight: '700', marginTop: 2 },
    photoWrap: { flex: 1, borderRadius: radius.sm, overflow: 'hidden' },
    photo: { width: '100%', height: '100%' },
    photoFallback: { backgroundColor: 'rgba(0,0,0,0.2)' },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.72)',
      justifyContent: 'flex-end',
      padding: spacing.md,
    },
    modalSheet: {
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.lg,
      overflow: 'hidden',
      gap: spacing.sm,
    },
    modalTitle: { color: '#fff', fontWeight: '800', fontSize: 22 },
    actionsRow: { gap: spacing.sm, paddingVertical: spacing.sm },
    actionChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      backgroundColor: 'rgba(255,255,255,0.08)',
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    actionLabel: { color: '#fff', fontWeight: '700', textTransform: 'uppercase', fontSize: 10 },
  });
}
