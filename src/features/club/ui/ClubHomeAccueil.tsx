/**
 * Composition visuelle Accueil Club uniquement — premium football, pas de grille SaaS.
 * Bindings / handlers restent dans ClubHomeScreen.
 */
import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring, AnimatedEntrance } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import type { TeamEvent } from '../../../models/TeamEvent';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import {
  clubEventTone,
  clubRadius,
  clubShadow,
  clubSpace,
  clubType,
} from '../theme/clubDesignSystem';
import { ClubStatusPill, ClubText } from './clubUi';

function formatKickoff(d: Date): string {
  return d.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatClock(d: Date): string {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** En-tête identité club — crest réel, nom fort, salutation secondaire. */
export function ClubHomeIdentityHeader({
  greeting,
  clubName,
  statusLabel,
  statusTone,
  onPressCrest,
  crestUploading,
}: {
  greeting: string;
  clubName: string;
  statusLabel: string;
  statusTone: 'ok' | 'warn' | 'alert';
  /** Tap crest → ajouter / changer le logo. */
  onPressCrest?: () => void;
  crestUploading?: boolean;
}) {
  const { tokens, logoUrl } = useClubTheme();
  const styles = useMemo(() => identityStyles(tokens), [tokens]);
  const crestLetter = (clubName.trim().charAt(0) || 'C').toUpperCase();

  const crestInner = logoUrl ? (
    <Image source={{ uri: logoUrl }} style={styles.crestImg} resizeMode="cover" />
  ) : (
    <LinearGradient
      colors={[tokens.accentDeep, tokens.accent]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.crestPh}
    >
      <ClubText style={styles.crestLetter}>{crestLetter}</ClubText>
    </LinearGradient>
  );

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[tokens.headerWash, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.wash}
        pointerEvents="none"
      />
      <View style={styles.row}>
        <PressableSpring
          onPress={onPressCrest}
          disabled={!onPressCrest || crestUploading}
          scaleTo={0.97}
          haptic={Boolean(onPressCrest)}
          style={[styles.crest, { borderColor: tokens.accentSoft }]}
          accessibilityRole={onPressCrest ? 'button' : undefined}
          accessibilityLabel={logoUrl ? 'Changer le logo du club' : 'Ajouter le logo du club'}
        >
          <View style={styles.crestInner}>
            {crestUploading ? (
              <View style={[styles.crestPh, { backgroundColor: tokens.elevated }]}>
                <ClubText variant="caption" muted>
                  …
                </ClubText>
              </View>
            ) : (
              crestInner
            )}
          </View>
          {onPressCrest && !crestUploading ? (
            <View style={[styles.crestBadge, { backgroundColor: tokens.accent }]}>
              <Icon name="camera" size={10} color={tokens.onAccent} />
            </View>
          ) : null}
        </PressableSpring>
        <View style={styles.textCol}>
          <ClubText variant="label" muted style={styles.greet}>
            {greeting}
          </ClubText>
          <ClubText variant="h1" numberOfLines={2} style={styles.clubName}>
            {clubName}
          </ClubText>
        </View>
        <View style={styles.statusCol}>
          <ClubStatusPill label={statusLabel} tone={statusTone} />
        </View>
      </View>
    </View>
  );
}

export type ClubHomePriority =
  | { kind: 'match'; event: TeamEvent }
  | { kind: 'training'; event: TeamEvent }
  | { kind: 'calm' };

/** Bandeau priorité — langage scoreboard / coup d’envoi, pas carte KPI. */
export function ClubHomePriorityHero({
  priority,
  onPress,
}: {
  priority: ClubHomePriority;
  onPress: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => heroStyles(tokens), [tokens]);

  if (priority.kind === 'calm') {
    return (
      <AnimatedEntrance kind="fadeUp" index={0} delayStep={40}>
        <PressableSpring onPress={onPress} scaleTo={0.985} haptic style={styles.shell}>
          <LinearGradient
            colors={[tokens.pitchSoft, tokens.surface, tokens.elevated]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.face}
          >
            <View style={[styles.rail, { backgroundColor: tokens.pitch }]} />
            <View style={styles.calmBody}>
              <ClubText variant="label" style={{ color: tokens.pitch }}>
                Journée calme
              </ClubText>
              <ClubText variant="h2" style={styles.heroTitle}>
                Terrain libre
              </ClubText>
              <ClubText variant="body" muted>
                Aucun match ni séance imminente — le club respire.
              </ClubText>
              <View style={styles.ctaRow}>
                <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
                  Voir le calendrier
                </ClubText>
                <Icon name="chevron-forward" size={14} color={tokens.accent} />
              </View>
            </View>
          </LinearGradient>
        </PressableSpring>
      </AnimatedEntrance>
    );
  }

  const isMatch = priority.kind === 'match';
  const tone = isMatch ? clubEventTone.match : clubEventTone.training;
  const event = priority.event;
  const starts = event.starts_at ? new Date(event.starts_at) : null;
  const kickLabel = starts ? formatKickoff(starts) : 'Horaire à confirmer';
  const clock = starts ? formatClock(starts) : '—:—';
  const title = event.title?.trim() || (isMatch ? 'Prochain match' : 'Prochaine séance');
  const place = event.location_label?.trim() || null;

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={40}>
      <PressableSpring onPress={onPress} scaleTo={0.985} haptic style={styles.shell}>
        <LinearGradient
          colors={[tone.soft, tokens.surface, tokens.elevated]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.face}
        >
          <View style={[styles.rail, { backgroundColor: tone.color }]} />
          <View style={styles.topMeta}>
            <View style={[styles.badge, { backgroundColor: tone.soft }]}>
              <ClubText variant="label" style={{ color: tone.color, fontSize: 9 }}>
                {tone.label}
              </ClubText>
            </View>
            <ClubText variant="caption" muted numberOfLines={1} style={{ flex: 1 }}>
              {kickLabel}
            </ClubText>
          </View>
          <View style={styles.scoreboard}>
            <View style={styles.scoreLeft}>
              <ClubText variant="h2" numberOfLines={2} style={styles.heroTitle}>
                {title}
              </ClubText>
              {place ? (
                <View style={styles.placeRow}>
                  <Icon name="location" size={13} color={tokens.faint} />
                  <ClubText variant="caption" muted numberOfLines={1}>
                    {place}
                  </ClubText>
                </View>
              ) : null}
            </View>
            <View style={styles.kickBox}>
              <ClubText variant="label" muted style={{ letterSpacing: 0.8 }}>
                Coup d’envoi
              </ClubText>
              <ClubText style={styles.kickClock}>{clock}</ClubText>
            </View>
          </View>
          <View style={styles.ctaRow}>
            <ClubText variant="caption" style={{ color: tone.color, fontWeight: '700' }}>
              {isMatch ? 'Ouvrir les matchs' : 'Ouvrir les entraînements'}
            </ClubText>
            <Icon name="chevron-forward" size={14} color={tone.color} />
          </View>
        </LinearGradient>
      </PressableSpring>
    </AnimatedEntrance>
  );
}

/** Bandeau KPI compact — effectif / coachs / actions, pas quatre tuiles jumelles. */
export function ClubHomeKpiStrip({
  players,
  coaches,
  actions,
  playersHint,
  coachesHint,
  onPlayers,
  onCoaches,
  onActions,
}: {
  players: number;
  coaches: number;
  actions: number;
  playersHint?: string;
  coachesHint?: string;
  onPlayers: () => void;
  onCoaches: () => void;
  onActions: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => kpiStyles(tokens), [tokens]);

  const cells: {
    key: string;
    label: string;
    value: number;
    hint?: string;
    onPress: () => void;
    accent?: string;
  }[] = [
    {
      key: 'players',
      label: 'Effectif',
      value: players,
      hint: playersHint,
      onPress: onPlayers,
    },
    {
      key: 'coaches',
      label: 'Coachs',
      value: coaches,
      hint: coachesHint,
      onPress: onCoaches,
    },
    {
      key: 'actions',
      label: 'Actions',
      value: actions,
      hint: actions > 0 ? 'À traiter' : 'À jour',
      onPress: onActions,
      accent: actions > 0 ? tokens.warning : tokens.success,
    },
  ];

  return (
    <AnimatedEntrance kind="fadeUp" index={1} delayStep={40}>
      <View style={styles.strip}>
        {cells.map((cell, i) => (
          <React.Fragment key={cell.key}>
            {i > 0 ? <View style={styles.divider} /> : null}
            <PressableSpring onPress={cell.onPress} scaleTo={0.97} haptic style={styles.cell}>
              <ClubText variant="label" muted>
                {cell.label}
              </ClubText>
              <ClubText
                variant="stat"
                style={{ color: cell.accent ?? tokens.foreground, fontSize: 24, lineHeight: 28 }}
              >
                {cell.value}
              </ClubText>
              {cell.hint ? (
                <ClubText variant="caption" muted numberOfLines={1}>
                  {cell.hint}
                </ClubText>
              ) : null}
            </PressableSpring>
          </React.Fragment>
        ))}
      </View>
    </AnimatedEntrance>
  );
}

type TodoItem = {
  id: string;
  icon: IconName;
  label: string;
  hint: string;
  onPress: () => void;
};

/** Liste « À faire » hiérarchisée — pas de grand rectangle or. */
export function ClubHomeTodoSection({
  items,
  emptySummary,
}: {
  items: TodoItem[];
  emptySummary: string;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => todoStyles(tokens), [tokens]);

  return (
    <AnimatedEntrance kind="fadeUp" index={2} delayStep={40}>
      <View style={styles.block}>
        <View style={styles.head}>
          <ClubText variant="label" muted>
            À faire
          </ClubText>
          {items.length > 0 ? (
            <View style={[styles.countChip, { backgroundColor: tokens.warningSoft }]}>
              <ClubText variant="caption" style={{ color: tokens.warning, fontWeight: '800' }}>
                {items.length}
              </ClubText>
            </View>
          ) : null}
        </View>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="checkmark-circle" size={18} color={tokens.success} />
            <ClubText variant="body" muted style={{ flex: 1 }}>
              {emptySummary}
            </ClubText>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item, index) => (
              <PressableSpring
                key={item.id}
                onPress={item.onPress}
                scaleTo={0.98}
                haptic
                style={styles.row}
              >
                <View style={styles.rank}>
                  <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '800' }}>
                    {index + 1}
                  </ClubText>
                </View>
                <View style={styles.icon}>
                  <Icon name={item.icon} size={16} color={tokens.accent} />
                </View>
                <View style={styles.col}>
                  <ClubText variant="body" style={{ fontWeight: '700' }}>
                    {item.label}
                  </ClubText>
                  <ClubText variant="caption" muted numberOfLines={2}>
                    {item.hint}
                  </ClubText>
                </View>
                <Icon name="chevron-forward" size={15} color={tokens.faint} />
              </PressableSpring>
            ))}
          </View>
        )}
      </View>
    </AnimatedEntrance>
  );
}

type TimelineItem = {
  id: string;
  kind: 'match' | 'training' | 'alert';
  label: string;
  time?: string;
  onPress: () => void;
};

/** Timeline « Aujourd’hui » imbriquée — empty state football. */
export function ClubHomeTodayTimeline({ items }: { items: TimelineItem[] }) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => timelineStyles(tokens), [tokens]);

  return (
    <AnimatedEntrance kind="fadeUp" index={3} delayStep={40}>
      <View style={styles.block}>
        <ClubText variant="label" muted style={styles.head}>
          Aujourd’hui
        </ClubText>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyDot, { backgroundColor: tokens.pitch }]} />
            <View style={styles.emptyCopy}>
              <ClubText variant="body" style={{ fontWeight: '600' }}>
                Rien au programme
              </ClubText>
              <ClubText variant="caption" muted>
                Pas de match, séance ni adhésion à traiter pour aujourd’hui.
              </ClubText>
            </View>
          </View>
        ) : (
          <View style={styles.railWrap}>
            <View style={styles.railLine} />
            {items.map((item) => {
              const tone =
                item.kind === 'match'
                  ? clubEventTone.match
                  : item.kind === 'training'
                    ? clubEventTone.training
                    : { color: tokens.warning, soft: tokens.warningSoft };
              return (
                <PressableSpring
                  key={item.id}
                  onPress={item.onPress}
                  scaleTo={0.98}
                  haptic
                  style={styles.item}
                >
                  <View style={[styles.dot, { backgroundColor: tone.color, borderColor: tokens.bg }]} />
                  <View style={[styles.card, { backgroundColor: tone.soft }]}>
                    <View style={styles.itemTop}>
                      <ClubText
                        variant="label"
                        style={{ color: tone.color, fontSize: 9, letterSpacing: 0.8 }}
                      >
                        {item.kind === 'match'
                          ? 'MATCH'
                          : item.kind === 'training'
                            ? 'SÉANCE'
                            : 'ACTION'}
                      </ClubText>
                      {item.time ? (
                        <ClubText variant="caption" style={{ color: tone.color, fontWeight: '700' }}>
                          {item.time}
                        </ClubText>
                      ) : null}
                    </View>
                    <ClubText variant="body" style={{ fontWeight: '600' }} numberOfLines={2}>
                      {item.label}
                    </ClubText>
                  </View>
                </PressableSpring>
              );
            })}
          </View>
        )}
      </View>
    </AnimatedEntrance>
  );
}

const identityStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    wrap: {
      paddingTop: clubSpace.sm,
      paddingBottom: clubSpace.md,
      overflow: 'visible',
    },
    wash: {
      ...StyleSheet.absoluteFillObject,
      height: 96,
      opacity: 0.85,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
      minHeight: 56,
    },
    crest: {
      width: 56,
      height: 56,
      borderRadius: clubRadius.lg,
      borderWidth: 2,
      backgroundColor: tokens.elevated,
      flexShrink: 0,
      ...clubShadow.soft,
    },
    crestInner: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: clubRadius.lg - 2,
      overflow: 'hidden',
    },
    crestImg: { width: '100%', height: '100%' },
    crestPh: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    crestBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: tokens.bg,
      zIndex: 2,
    },
    crestLetter: {
      ...clubType.h2,
      color: tokens.onAccent,
      fontSize: 24,
      lineHeight: 28,
    },
    textCol: {
      flex: 1,
      minWidth: 0,
      gap: 3,
      paddingRight: clubSpace.xs,
      justifyContent: 'center',
    },
    greet: {
      letterSpacing: 1.2,
      fontSize: 10,
      lineHeight: 12,
    },
    clubName: {
      letterSpacing: -0.55,
      fontSize: 24,
      lineHeight: 28,
    },
    statusCol: {
      flexShrink: 0,
      alignSelf: 'flex-start',
      paddingTop: 2,
      maxWidth: 108,
    },
  });

const heroStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    shell: {
      borderRadius: clubRadius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      ...clubShadow.soft,
    },
    face: {
      paddingVertical: clubSpace.lg,
      paddingHorizontal: clubSpace.lg,
      paddingLeft: clubSpace.lg + 6,
      gap: clubSpace.md,
      minHeight: 132,
    },
    rail: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
    },
    calmBody: { gap: clubSpace.xs },
    topMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: clubRadius.xs,
    },
    scoreboard: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: clubSpace.md,
    },
    scoreLeft: { flex: 1, minWidth: 0, gap: 6 },
    heroTitle: { letterSpacing: -0.4 },
    placeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    kickBox: {
      alignItems: 'flex-end',
      gap: 2,
      paddingLeft: clubSpace.sm,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: tokens.borderStrong,
      minWidth: 88,
    },
    kickClock: {
      ...clubType.score,
      color: tokens.foreground,
      fontSize: 32,
      lineHeight: 36,
    },
    ctaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
  });

const kpiStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    strip: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: tokens.surface,
      borderRadius: clubRadius.lg,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingVertical: clubSpace.sm,
      ...clubShadow.soft,
    },
    cell: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: clubSpace.xs,
      paddingVertical: clubSpace.sm,
    },
    divider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: tokens.borderStrong,
      marginVertical: clubSpace.sm,
    },
  });

const todoStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    block: { gap: clubSpace.sm },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
    },
    countChip: {
      minWidth: 22,
      height: 22,
      borderRadius: clubRadius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 7,
    },
    empty: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.md,
      backgroundColor: tokens.successSoft,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    list: { gap: clubSpace.xs },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.sm,
      borderRadius: clubRadius.md,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    rank: {
      width: 22,
      height: 22,
      borderRadius: clubRadius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.accentSoft,
    },
    icon: {
      width: 32,
      height: 32,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.elevated,
    },
    col: { flex: 1, minWidth: 0, gap: 2 },
  });

const timelineStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    block: { gap: clubSpace.sm },
    head: { marginBottom: 2 },
    empty: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: clubSpace.md,
      paddingVertical: clubSpace.lg,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.lg,
      borderWidth: 1,
      borderColor: tokens.border,
      borderStyle: 'dashed',
      backgroundColor: tokens.surface,
    },
    emptyDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginTop: 5,
    },
    emptyCopy: { flex: 1, gap: 4 },
    railWrap: {
      gap: clubSpace.sm,
      paddingLeft: 6,
    },
    railLine: {
      position: 'absolute',
      left: 10,
      top: 12,
      bottom: 12,
      width: 2,
      backgroundColor: tokens.borderStrong,
      borderRadius: 1,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: clubSpace.md,
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginTop: 14,
      borderWidth: 2,
      zIndex: 1,
    },
    card: {
      flex: 1,
      borderRadius: clubRadius.md,
      paddingVertical: clubSpace.sm,
      paddingHorizontal: clubSpace.md,
      gap: 4,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    itemTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.sm,
    },
  });
