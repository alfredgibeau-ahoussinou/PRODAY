import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { radius, spacing } from '../../theme/designTokens';
import {
  PRODAY_CARD_ACTION_LABELS,
  type ProDayCardActionId,
  type ProDayCardData,
  type ProDayCardTier,
} from '../../models/ProDayCard';

const TIER_FIFA: Record<
  ProDayCardTier,
  { frame: [string, string, string]; face: [string, string, string]; ink: string; plate: string }
> = {
  bronze: {
    frame: ['#e8c4a0', '#a67c52', '#6b4423'],
    face: ['#c4a574', '#8b6914', '#5c4030'],
    ink: '#2a1810',
    plate: 'rgba(42,24,16,0.55)',
  },
  silver: {
    frame: ['#f2f4f8', '#b8c0cc', '#6e7888'],
    face: ['#d5dde8', '#9aa8bc', '#6a778a'],
    ink: '#1a1e28',
    plate: 'rgba(26,30,40,0.5)',
  },
  gold: {
    frame: ['#fff6c8', '#f0d060', '#a07810'],
    face: ['#f5e6a0', '#e0c040', '#c9a018'],
    ink: '#1c1405',
    plate: 'rgba(28,20,5,0.5)',
  },
  elite: {
    frame: ['#b8fff0', '#2dd4bf', '#0f766e'],
    face: ['#134e4a', '#0f766e', '#042f2e'],
    ink: '#ecfdf5',
    plate: 'rgba(0,0,0,0.45)',
  },
  legend: {
    frame: ['#f5d0fe', '#c026d3', '#4a044e'],
    face: ['#3b0764', '#7e22ce', '#1e0533'],
    ink: '#faf5ff',
    plate: 'rgba(0,0,0,0.5)',
  },
};

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
  const [flipped, setFlipped] = useState(false);
  const [preview, setPreview] = useState(false);
  const progress = useSharedValue(0);
  const idle = useSharedValue(0);
  const styles = useMemo(() => createStyles(width), [width]);
  const theme = TIER_FIFA[card.tier];

  useEffect(() => {
    idle.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [idle]);

  const flip = () => {
    const next = !flipped;
    setFlipped(next);
    progress.value = withSpring(next ? 1 : 0, { damping: 16, stiffness: 180 });
  };

  const shellStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: `${interpolate(idle.value, [0, 1], [-7, 7])}deg` },
      { rotateX: `${interpolate(idle.value, [0, 1], [4, -3])}deg` },
      { translateY: interpolate(idle.value, [0, 1], [0, -5]) },
    ],
  }));

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(progress.value, [0, 1], [0, 180])}deg` },
    ],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(progress.value, [0, 1], [180, 360])}deg` },
    ],
    backfaceVisibility: 'hidden',
  }));

  return (
    <>
      <PressableSpring
        onPress={() => {
          if (onSelect) onSelect();
          else flip();
        }}
        onLongPress={() => setPreview(true)}
        scaleTo={0.97}
        haptic
      >
        <Animated.View style={[styles.shell, { shadowColor: theme.frame[1] }, shellStyle]}>
          <Animated.View style={[styles.face, frontStyle]}>
            <FifaChrome theme={theme} tier={card.tier}>
              <FrontFace card={card} styles={styles} theme={theme} />
            </FifaChrome>
          </Animated.View>
          <Animated.View style={[styles.face, backStyle]}>
            <FifaChrome theme={theme} tier={card.tier}>
              <BackFace card={card} styles={styles} theme={theme} />
            </FifaChrome>
          </Animated.View>
        </Animated.View>
      </PressableSpring>

      <Modal visible={preview} transparent animationType="fade" onRequestClose={() => setPreview(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPreview(false)}>
          <Pressable
            style={[styles.modalSheet, { borderColor: `${theme.frame[1]}99` }]}
            onPress={(e) => e.stopPropagation()}
          >
            <LinearGradient colors={[theme.face[1], '#050508']} style={StyleSheet.absoluteFill} />
            <ProDayText variant="caption" style={{ color: theme.frame[0], letterSpacing: 2 }}>
              {card.role.toUpperCase()} · {card.tier.toUpperCase()}
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
  theme: (typeof TIER_FIFA)[ProDayCardTier];
  tier: string;
}) {
  return (
    <LinearGradient colors={theme.frame} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={chrome.frame}>
      <LinearGradient colors={theme.face} start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} style={chrome.face}>
        <ProDayText variant="caption" style={[chrome.brand, { color: theme.ink }]}>
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
  theme: (typeof TIER_FIFA)[ProDayCardTier];
}) {
  const ink = theme.ink;

  if (card.role === 'player') {
    const ovr = card.overall;
    const stats = [
      { l: 'PAC', v: clampStat(ovr - 2) },
      { l: 'SHO', v: clampStat(ovr - 6 + card.goals) },
      { l: 'PAS', v: clampStat(ovr - 4 + card.assists) },
      { l: 'DRI', v: clampStat(ovr - 1) },
      { l: 'DEF', v: clampStat(ovr - 18) },
      { l: 'PHY', v: clampStat(card.formPct * 0.95) },
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
            <ProDayText variant="caption" style={{ color: ink, fontSize: 8, opacity: 0.8 }}>
              {card.nationality.slice(0, 3).toUpperCase()}
            </ProDayText>
            <ProDayText variant="caption" style={{ color: ink, fontSize: 8, opacity: 0.8 }}>
              {card.clubName.slice(0, 8)}
            </ProDayText>
          </View>
          <Photo photoUrl={card.photoUrl} styles={styles} />
        </View>
        <NamePlate name={card.lastName} theme={theme} />
        <StatGrid stats={stats} ink={ink} />
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

function BackFace({
  card,
  styles,
  theme,
}: {
  card: ProDayCardData;
  styles: ReturnType<typeof createStyles>;
  theme: (typeof TIER_FIFA)[ProDayCardTier];
}) {
  return (
    <View style={[styles.col, { paddingTop: spacing.sm }]}>
      <ProDayText variant="section" style={[styles.backTitle, { color: theme.ink }]}>
        {card.displayName}
      </ProDayText>
      {card.role === 'player' ? (
        <>
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
          />
          <ProDayText variant="caption" style={{ color: theme.ink, opacity: 0.75, marginTop: 8 }}>
            {card.recruitmentStatus}
          </ProDayText>
        </>
      ) : (
        <ProDayText variant="caption" style={{ color: theme.ink, opacity: 0.8, marginTop: 8 }}>
          {card.role} · {card.tier}
        </ProDayText>
      )}
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
  theme: (typeof TIER_FIFA)[ProDayCardTier];
}) {
  return (
    <View style={[nameStyles.plate, { backgroundColor: theme.plate }]}>
      <ProDayText variant="body" style={[nameStyles.text, { color: theme.ink }]} numberOfLines={1}>
        {name}
      </ProDayText>
    </View>
  );
}

function StatGrid({ stats, ink }: { stats: Array<{ l: string; v: string | number }>; ink: string }) {
  return (
    <View style={statStyles.grid}>
      {stats.map((s) => (
        <View key={s.l} style={statStyles.row}>
          <ProDayText variant="caption" style={{ color: ink, opacity: 0.7, fontSize: 9, fontWeight: '800' }}>
            {s.l}
          </ProDayText>
          <ProDayText variant="caption" style={{ color: ink, fontSize: 12, fontWeight: '900' }}>
            {s.v}
          </ProDayText>
        </View>
      ))}
    </View>
  );
}

const chrome = StyleSheet.create({
  frame: { flex: 1, borderRadius: 14, padding: 4, overflow: 'hidden' },
  face: { flex: 1, borderRadius: 11, padding: spacing.sm, paddingTop: spacing.md, overflow: 'hidden' },
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
    opacity: 0.7,
  },
});

const nameStyles = StyleSheet.create({
  plate: {
    marginTop: 4,
    paddingVertical: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  text: {
    textAlign: 'center',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 13,
  },
});

const statStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, paddingHorizontal: 2 },
  row: {
    width: '50%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
});

function createStyles(width: number) {
  const height = Math.round(width * 1.4);
  return StyleSheet.create({
    shell: {
      width,
      height,
      borderRadius: 14,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.5,
      shadowRadius: 18,
      elevation: 14,
    },
    face: { ...StyleSheet.absoluteFillObject } as ViewStyle,
    col: { flex: 1 },
    topRow: { flex: 1, flexDirection: 'row', gap: 4, minHeight: 0 },
    ratingCol: { width: 56, alignItems: 'center', paddingTop: 4 },
    ovr: { fontSize: 34, fontWeight: '900', lineHeight: 36 },
    pos: { fontWeight: '900', fontSize: 12, letterSpacing: 1, marginTop: 2 },
    photoWrap: { flex: 1, borderRadius: radius.sm, overflow: 'hidden' },
    photo: { width: '100%', height: '100%' },
    photoFallback: { backgroundColor: 'rgba(0,0,0,0.15)' },
    backTitle: { fontWeight: '900', textTransform: 'uppercase', textAlign: 'center' },
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
