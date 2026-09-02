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
        {/* Découpe géométrique "Bouclier FIFA" via un masque transparent et LinearGradient */}
        <View style={styles.cardContainer}>
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
  tier: ProDayCardTier;
}) {
  return (
    <View style={chrome.wrapper}>
      {/* Fond du bouclier (Gradient Card) */}
      <LinearGradient colors={theme.frame} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      
      {/* Face interne (Surface) */}
      <View style={chrome.innerFace}>
        <LinearGradient
          colors={theme.face}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Rayons / Effet de Brillance FIFA */}
        <LinearGradient
          colors={['rgba(255,255,255,0.4)', 'transparent', 'rgba(255,255,255,0.1)']}
          style={chrome.shine}
          locations={[0, 0.4, 1]}
          start={{ x: -0.5, y: -0.5 }}
          end={{ x: 1.5, y: 1.5 }}
        />
        
        {children}
      </View>
    </View>
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
      { l: 'DEF', v: clampStat(ovr - 10) },
      { l: 'PHY', v: clampStat(ovr - 3) },
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
            
            <View style={styles.flagIcon} />
            <View style={styles.clubIcon} />
          </View>
          <Photo photoUrl={card.photoUrl} styles={styles} />
        </View>
        <NamePlate name={card.lastName} theme={theme} />
        
        <View style={styles.statsContainer}>
          <StatGrid stats={stats.slice(0, 3)} ink={ink} />
          <View style={[styles.statDivider, { backgroundColor: theme.inkMuted }]} />
          <StatGrid stats={stats.slice(3, 6)} ink={ink} />
        </View>
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
        <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="contain" />
      ) : (
        <Image source={require('../../../assets/images/default-avatar.png')} style={[styles.photo, styles.photoFallback]} resizeMode="contain" />
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
    <View style={nameStyles.plate}>
      <ProDayText variant="body" style={[nameStyles.text, { color: theme.ink }]} numberOfLines={1}>
        {name}
      </ProDayText>
      <View style={[nameStyles.line, { backgroundColor: theme.inkMuted }]} />
    </View>
  );
}

function StatGrid({
  stats,
  ink,
}: {
  stats: Array<{ l: string; v: string | number }>;
  ink: string;
}) {
  return (
    <View style={statStyles.grid}>
      {stats.map((s) => (
        <View key={s.l} style={statStyles.row}>
          <ProDayText variant="caption" style={[statStyles.value, { color: ink }]}>
            {s.v}
          </ProDayText>
          <ProDayText variant="caption" style={[statStyles.label, { color: ink }]}>
            {s.l}
          </ProDayText>
        </View>
      ))}
    </View>
  );
}

const chrome = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: 'hidden',
    padding: 3,
    // Forme de carte bouclier type FIFA (via border radius pour l'instant)
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  innerFace: {
    flex: 1,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 33,
    borderBottomRightRadius: 33,
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 10,
    overflow: 'hidden',
  },
  shine: {
    ...StyleSheet.absoluteFillObject,
  },
});

const nameStyles = StyleSheet.create({
  plate: {
    marginTop: -8,
    alignItems: 'center',
    zIndex: 10,
  },
  text: {
    fontFamily: 'RobotoCondensed-Bold',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 18,
    textAlign: 'center',
  },
  line: {
    height: 1,
    width: '80%',
    marginTop: 2,
    opacity: 0.4,
  },
});

const statStyles = StyleSheet.create({
  grid: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    opacity: 0.8,
    fontSize: 10,
    fontWeight: '400',
    fontFamily: 'RobotoCondensed-Regular',
  },
  value: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'RobotoCondensed-Bold',
  },
});

function createStyles(width: number) {
  const height = Math.round(width * 1.45);
  return StyleSheet.create({
    cardContainer: {
      width,
      height,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 15,
      backgroundColor: 'transparent',
    },
    col: { flex: 1 },
    topRow: {
      flexDirection: 'row',
      height: '55%',
      zIndex: 5,
    },
    ratingCol: {
      width: '35%',
      alignItems: 'center',
      paddingTop: 4,
      gap: 2,
    },
    ovr: {
      fontSize: 34,
      fontWeight: '900',
      lineHeight: 38,
      fontFamily: 'RobotoCondensed-Bold',
    },
    pos: {
      fontWeight: '500',
      fontSize: 13,
      marginTop: -4,
      fontFamily: 'RobotoCondensed-Regular',
    },
    flagIcon: {
      width: 24,
      height: 16,
      backgroundColor: 'rgba(255,255,255,0.2)',
      marginTop: 4,
    },
    clubIcon: {
      width: 20,
      height: 24,
      backgroundColor: 'rgba(255,255,255,0.2)',
      marginTop: 4,
    },
    photoWrap: {
      width: '75%',
      height: '110%',
      position: 'absolute',
      right: -10,
      bottom: -15,
    },
    photo: {
      width: '100%',
      height: '100%',
    },
    photoFallback: {
      opacity: 0.5,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
      paddingHorizontal: 8,
    },
    statDivider: {
      width: 1,
      height: '80%',
      opacity: 0.3,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      justifyContent: 'center',
      padding: spacing.md,
    },
    modalSheet: {
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.lg,
      overflow: 'hidden',
      gap: spacing.sm,
    },
    modalTitle: { color: '#fff', fontWeight: '800', fontSize: 24, textAlign: 'center' },
    actionsRow: { gap: spacing.sm, paddingVertical: spacing.sm, justifyContent: 'center' },
    actionChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      backgroundColor: 'rgba(255,255,255,0.08)',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    actionLabel: { color: '#fff', fontWeight: '800', textTransform: 'uppercase', fontSize: 11 },
  });
}
