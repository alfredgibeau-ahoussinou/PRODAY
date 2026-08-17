import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { ProDaySurface } from '../ui/ProDaySurface';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import {
  SMART_TACTICS_MORE_CHAPTERS,
  SMART_TACTICS_PLAYER_PRIMARY_CHAPTERS,
  SMART_TACTICS_PRIMARY_CHAPTERS,
  SMART_TACTICS_CHAPTERS,
  isSmartTacticsPrimaryChapter,
  type SmartTacticsChapterId,
} from '../../content/smartTacticsChapters';
import { COACH_SITE } from '../../content/coachPageIdentity';
import {
  CoachKpiRow,
  CoachSectionCard,
  CoachText,
} from '../coach/coachPortalUi';
import { MATCH_CHAPTER_PAD } from '../matchs/chapters/matchChapterLayout';
import { radius, spacing } from '../../theme/designTokens';
import type { User } from '../../models/User';
import type { TeamEvent } from '../../models/TeamEvent';
import type { TacticalPlan } from '../../models/SmartTactics';

export const SMART_PITCH = {
  grass: '#1B7A3A',
  grassDeep: '#0F5A28',
  line: 'rgba(255,255,255,0.32)',
  chip: 'rgba(12,18,14,0.88)',
  warm: '#F5A524',
  warmSoft: 'rgba(245,165,36,0.18)',
  ready: '#3DDC97',
  risk: '#FF6B4A',
};

const SmartTacticsCoachSkinContext = createContext(false);

export function SmartTacticsCoachSkinProvider({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}) {
  return (
    <SmartTacticsCoachSkinContext.Provider value={enabled}>
      {children}
    </SmartTacticsCoachSkinContext.Provider>
  );
}

export function useSmartTacticsCoachSkin() {
  return useContext(SmartTacticsCoachSkinContext);
}

const SMART_TACTICS_HIT_SLOP = { top: 10, bottom: 10, left: 8, right: 8 };

/** Coach shell : Pressable statique · joueur : spring scale. */
export function SmartTacticsPressable({
  children,
  onPress,
  disabled,
  style,
  scaleTo = 0.96,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}) {
  const coach = useSmartTacticsCoachSkin();
  if (!onPress) {
    return <View style={style}>{children}</View>;
  }
  if (coach) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        hitSlop={SMART_TACTICS_HIT_SLOP}
        style={({ pressed }) => [style, pressed && !disabled && { opacity: 0.72 }]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <PressableSpring
      onPress={onPress}
      scaleTo={scaleTo}
      haptic
      disabled={disabled}
      hitSlop={SMART_TACTICS_HIT_SLOP}
      style={style}
    >
      {children}
    </PressableSpring>
  );
}

/** Tokens visuels — coach shell SportEasy vs jeu orange/vert. */
export function useSmartTacticsTheme() {
  const coach = useSmartTacticsCoachSkin();
  const { colors } = useAppTheme();
  return useMemo(
    () => ({
      coach,
      accent: coach ? COACH_SITE.accent : SMART_PITCH.warm,
      accentSoft: coach ? COACH_SITE.soft : SMART_PITCH.warmSoft,
      ctaBg: coach ? '#E5E5EA' : SMART_PITCH.warm,
      ctaText: coach ? '#000000' : '#0B1A12',
      surface: coach ? COACH_SITE.surface : colors.surface,
      border: coach ? COACH_SITE.border : colors.border,
      muted: coach ? COACH_SITE.muted : colors.textMuted,
      foreground: coach ? COACH_SITE.foreground : colors.text,
      ready: SMART_PITCH.ready,
      risk: SMART_PITCH.risk,
      midTone: coach ? COACH_SITE.accent : SMART_PITCH.warm,
      stadiumGradient: coach
        ? ([COACH_SITE.bg, COACH_SITE.pitchDeep, COACH_SITE.bg] as const)
        : (['#0B1A12', '#12261A', '#0B1A12'] as const),
      benchGradient: coach
        ? ([COACH_SITE.surface, COACH_SITE.elevated, COACH_SITE.surface] as const)
        : (['#1A2A1E', '#101A14', '#0C1410'] as const),
      stadiumBorder: coach ? COACH_SITE.border : 'rgba(245,165,36,0.28)',
    }),
    [coach, colors.border, colors.surface, colors.text, colors.textMuted],
  );
}

export function SmartTacticsAccentText({
  style,
  ...rest
}: React.ComponentProps<typeof ProDayText>) {
  const theme = useSmartTacticsTheme();
  return <ProDayText {...rest} style={[{ color: theme.accent, fontWeight: '800' }, style]} />;
}

export function SmartTacticsLink({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<TextStyle>;
}) {
  const theme = useSmartTacticsTheme();
  const text = (
    <ProDayText variant="caption" style={[{ color: theme.accent, fontWeight: '800' }, style]}>
      {children}
    </ProDayText>
  );
  if (!onPress) return text;
  return (
    <SmartTacticsPressable onPress={onPress} style={linkTouch.wrap}>
      {text}
    </SmartTacticsPressable>
  );
}

export function SmartTacticsPrimaryCta({
  label,
  onPress,
  disabled,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useSmartTacticsTheme();
  return (
    <SmartTacticsPressable
      onPress={onPress}
      disabled={disabled}
      style={[
        coachCta.primary,
        { backgroundColor: theme.ctaBg, opacity: disabled ? 0.55 : 1 },
        style,
      ]}
    >
      {icon}
      <ProDayText variant="body" style={[coachCta.primaryText, { color: theme.ctaText }]}>
        {label}
      </ProDayText>
    </SmartTacticsPressable>
  );
}

export function SmartTacticsChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const theme = useSmartTacticsTheme();
  return (
    <SmartTacticsPressable
      onPress={onPress}
      style={[
        coachChip.base,
        {
          borderColor: active ? theme.accent : theme.border,
          backgroundColor: active ? theme.accentSoft : theme.surface,
        },
      ]}
    >
      {theme.coach ? (
        <CoachText variant="caption" accent={active} muted={!active} style={coachChip.label}>
          {label}
        </CoachText>
      ) : (
        <ProDayText
          variant="caption"
          style={[
            coachChip.label,
            active ? { color: theme.accent, fontWeight: '900' } : { fontWeight: '700' },
          ]}
          numberOfLines={1}
        >
          {label}
        </ProDayText>
      )}
    </SmartTacticsPressable>
  );
}

export function SmartTacticsSection({
  title,
  children,
  kicker,
  body,
}: {
  title: string;
  children: React.ReactNode;
  kicker?: string;
  body?: string;
}) {
  const theme = useSmartTacticsTheme();
  if (theme.coach) {
    return (
      <CoachSectionCard kicker={kicker} title={title} body={body}>
        {children}
      </CoachSectionCard>
    );
  }
  return (
    <View style={legacySection.wrap}>
      {kicker ? (
        <ProDayText variant="caption" muted style={legacySection.kicker}>
          {kicker}
        </ProDayText>
      ) : null}
      <ProDayText variant="section">{title}</ProDayText>
      {body ? (
        <ProDayText variant="caption" muted>
          {body}
        </ProDayText>
      ) : null}
      {children}
    </View>
  );
}

export function SmartTacticsPageHeader({
  kicker,
  title,
  body,
}: {
  kicker?: string;
  title: string;
  body?: string;
}) {
  const theme = useSmartTacticsTheme();
  if (theme.coach) {
    return (
      <View style={coachHeader.wrap}>
        {kicker ? (
          <CoachText variant="caption" muted style={coachHeader.kicker}>
            {kicker}
          </CoachText>
        ) : null}
        <CoachText variant="section" style={coachHeader.title}>
          {title}
        </CoachText>
        {body ? (
          <CoachText variant="caption" muted>
            {body}
          </CoachText>
        ) : null}
      </View>
    );
  }
  return (
    <View style={coachHeader.wrap}>
      {kicker ? (
        <ProDayText variant="caption" style={[legacySection.kicker, { color: SMART_PITCH.warm }]}>
          {kicker}
        </ProDayText>
      ) : null}
      <ProDayText variant="section" style={{ fontWeight: '900' }}>
        {title}
      </ProDayText>
      {body ? (
        <ProDayText variant="caption" muted>
          {body}
        </ProDayText>
      ) : null}
    </View>
  );
}

export function SmartTacticsKpiRow({
  items,
}: {
  items: { label: string; value: string; tone?: 'neutral' | 'good' | 'warn' | 'warm' }[];
}) {
  const theme = useSmartTacticsTheme();
  if (theme.coach) {
    return (
      <CoachKpiRow
        items={items.map((item) => ({
          label: item.label,
          value: item.value,
          tone:
            item.tone === 'good'
              ? theme.ready
              : item.tone === 'warn'
                ? theme.risk
                : item.tone === 'warm'
                  ? theme.accent
                  : undefined,
        }))}
      />
    );
  }
  return (
    <View style={metric.row}>
      {items.map((item) => (
        <SmartMetricChip
          key={item.label}
          label={item.label}
          value={item.value}
          tone={item.tone ?? 'neutral'}
        />
      ))}
    </View>
  );
}

/** Carte chapitre — ProDaySurface ou panneau coach sombre. */
export function SmartTacticsPanel({
  children,
  style,
  variant = 'module',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'module';
}) {
  const coach = useSmartTacticsCoachSkin();
  const { colors } = useAppTheme();
  if (coach) {
    return <View style={[coachPanel.card, style]}>{children}</View>;
  }
  return (
    <ProDaySurface variant={variant} style={style}>
      {children}
    </ProDaySurface>
  );
}

export function SmartTacticsChapterRail({
  active,
  onChange,
  mode = 'coach',
  coachSkin = false,
}: {
  active: SmartTacticsChapterId;
  onChange: (id: SmartTacticsChapterId) => void;
  mode?: 'coach' | 'player';
  coachSkin?: boolean;
}) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createRailStyles(coachSkin), [coachSkin]);
  const [moreOpen, setMoreOpen] = useState(() =>
    mode === 'coach' && !coachSkin ? !isSmartTacticsPrimaryChapter(active) : false,
  );
  const inMore =
    mode === 'coach' && SMART_TACTICS_MORE_CHAPTERS.some((c) => c.id === active);
  const activeMore = SMART_TACTICS_MORE_CHAPTERS.find((c) => c.id === active);
  const primary =
    mode === 'player' ? SMART_TACTICS_PLAYER_PRIMARY_CHAPTERS : SMART_TACTICS_PRIMARY_CHAPTERS;

  if (coachSkin && mode === 'coach') {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.coachScroll}
        style={styles.coachWrap}
        bounces={false}
      >
        {SMART_TACTICS_CHAPTERS.map((ch) => {
          const on = active === ch.id;
          return (
            <SmartTacticsPressable
              key={ch.id}
              onPress={() => onChange(ch.id)}
              style={[styles.coachPill, on && styles.coachPillOn]}
            >
              <ProDayText
                variant="caption"
                style={[styles.coachPillLabel, on ? styles.coachPillLabelOn : styles.coachPillLabelOff]}
                numberOfLines={1}
              >
                {ch.label}
              </ProDayText>
            </SmartTacticsPressable>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={
          mode === 'player'
            ? ['#0A1628', '#12304A', '#0A1628']
            : ['#0B1A12', '#123524', '#0B1A12']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.shell, { borderColor: 'rgba(245,165,36,0.28)' }]}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <ProDayText variant="caption" style={styles.brand}>
            {mode === 'player' ? 'Tactique IA · Joueur' : 'Tactique IA'}
          </ProDayText>
          {inMore && activeMore ? (
            <ProDayText variant="caption" style={styles.brandActive}>
              · {activeMore.label}
            </ProDayText>
          ) : null}
        </View>

        <View style={styles.segment}>
          {primary.map((ch) => {
            const on = active === ch.id;
            return (
              <PressableSpring
                key={ch.id}
                onPress={() => {
                  setMoreOpen(false);
                  onChange(ch.id);
                }}
                scaleTo={0.97}
                haptic
                style={[styles.segItem, on && styles.segItemOn]}
              >
                <Icon
                  name={ch.icon}
                  size={15}
                  color={on ? '#0B1A12' : 'rgba(255,255,255,0.62)'}
                />
                <ProDayText
                  variant="caption"
                  style={[styles.segLabel, on && styles.segLabelOn]}
                  numberOfLines={1}
                >
                  {ch.label}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>

        {mode === 'coach' ? (
          <PressableSpring
            onPress={() => setMoreOpen((v) => !v)}
            scaleTo={0.97}
            haptic
            style={[
              styles.toolsToggle,
              {
                borderColor: moreOpen || inMore ? SMART_PITCH.warm : 'rgba(255,255,255,0.18)',
                backgroundColor:
                  moreOpen || inMore ? SMART_PITCH.warmSoft : 'rgba(255,255,255,0.06)',
              },
            ]}
          >
            <Icon
              name={moreOpen ? 'chevron-up' : 'menu'}
              size={14}
              color={moreOpen || inMore ? SMART_PITCH.warm : 'rgba(255,255,255,0.75)'}
            />
            <ProDayText
              variant="caption"
              style={[
                styles.toolsToggleText,
                (moreOpen || inMore) && { color: SMART_PITCH.warm },
              ]}
            >
              {t('smartTactics.chapter.moreShort')}
            </ProDayText>
          </PressableSpring>
        ) : (
          <ProDayText variant="caption" style={styles.playerHint}>
            Lecture · pas de composition
          </ProDayText>
        )}
      </LinearGradient>

      {mode === 'coach' && moreOpen ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moreRail}
          bounces={false}
        >
          {SMART_TACTICS_MORE_CHAPTERS.map((ch) => {
            const on = active === ch.id;
            return (
              <PressableSpring
                key={ch.id}
                onPress={() => onChange(ch.id)}
                scaleTo={0.96}
                haptic
                style={[
                  styles.morePill,
                  {
                    borderColor: on ? SMART_PITCH.warm : colors.border,
                    backgroundColor: on ? SMART_PITCH.warmSoft : colors.surface,
                  },
                ]}
              >
                <Icon
                  name={ch.icon}
                  size={13}
                  color={on ? SMART_PITCH.warm : colors.textMuted}
                />
                <ProDayText
                  variant="caption"
                  muted={!on}
                  style={[styles.moreText, on && { color: SMART_PITCH.warm }]}
                >
                  {ch.label}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

export function SmartTacticsFlowHint({
  active,
  mode = 'coach',
  coachSkin = false,
}: {
  active: SmartTacticsChapterId;
  mode?: 'coach' | 'player';
  coachSkin?: boolean;
}) {
  const { t } = useTranslation();
  const coach = coachSkin || useSmartTacticsCoachSkin();
  if (mode === 'player') {
    const player = SMART_TACTICS_PLAYER_PRIMARY_CHAPTERS.find((c) => c.id === active);
    const hints: Record<string, string> = {
      inbox: 'STAGE 1 · Accepte tes quêtes coach',
      board: 'STAGE 2 · Reveal le XI (tap pour focus)',
      me: 'STAGE 3 · Power-up ta carte',
      dashboard: 'STAGE 4 · Ready pour le match',
    };
    return (
      <ProDayText variant="caption" muted style={hint.line}>
        {player ? hints[player.id] ?? 'Tactics Run' : 'Tactics Run'}
      </ProDayText>
    );
  }
  const primary = SMART_TACTICS_PRIMARY_CHAPTERS.find((c) => c.id === active);
  if (!primary) {
    return (
      <ProDayText variant="caption" muted style={[hint.line, coach && hint.coachLine]}>
        {t('smartTactics.flow.moreHint')}
      </ProDayText>
    );
  }
  return (
    <ProDayText variant="caption" muted style={[hint.line, coach && hint.coachLine]}>
      {t(`smartTactics.flow.step${primary.step}`)}
    </ProDayText>
  );
}

export function SmartTacticsChapterScroll({ children }: { children: React.ReactNode }) {
  const coach = useSmartTacticsCoachSkin();
  if (coach) {
    return (
      <ScrollView
        style={coachPad.scroll}
        contentContainerStyle={coachPad.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }
  return (
    <ScrollView
      style={pad.scroll}
      contentContainerStyle={pad.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function SmartTacticsEmpty({
  title,
  body,
  cta,
  onPress,
}: {
  title: string;
  body: string;
  cta?: string;
  onPress?: () => void;
}) {
  const { colors } = useAppTheme();
  const coach = useSmartTacticsCoachSkin();
  if (coach) {
    return (
      <View style={coachPanel.card}>
        <CoachText variant="section" style={coachPanel.title}>
          {title}
        </CoachText>
        <CoachText variant="caption" muted style={coachPanel.body}>
          {body}
        </CoachText>
        {cta && onPress ? (
          <SmartTacticsPressable onPress={onPress} style={empty.cta}>
            <CoachText variant="section" accent style={coachPanel.cta}>
              {cta}
            </CoachText>
          </SmartTacticsPressable>
        ) : null}
      </View>
    );
  }
  return (
    <ProDaySurface variant="module" style={[empty.card, { borderColor: colors.border }]}>
      <ProDayText variant="section">{title}</ProDayText>
      <ProDayText variant="caption" muted style={empty.body}>
        {body}
      </ProDayText>
      {cta && onPress ? (
        <PressableSpring onPress={onPress} scaleTo={0.96} haptic style={empty.cta}>
          <ProDayText variant="caption" style={[empty.ctaText, { color: SMART_PITCH.warm }]}>
            {cta}
          </ProDayText>
        </PressableSpring>
      ) : null}
    </ProDaySurface>
  );
}

export function SmartMetricChip({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'good' | 'warn' | 'warm';
}) {
  const { colors } = useAppTheme();
  const coach = useSmartTacticsCoachSkin();
  const accent =
    tone === 'good'
      ? SMART_PITCH.ready
      : tone === 'warn'
        ? SMART_PITCH.risk
        : tone === 'warm'
          ? SMART_PITCH.warm
          : coach
            ? COACH_SITE.muted
            : colors.textMuted;
  return (
    <View
      style={[
        metric.chip,
        coach
          ? { borderColor: COACH_SITE.border, backgroundColor: COACH_SITE.surface }
          : { borderColor: colors.border, backgroundColor: colors.surface },
      ]}
    >
      <ProDayText variant="caption" muted style={metric.label}>
        {label}
      </ProDayText>
      <ProDayText variant="section" style={{ color: accent, fontSize: 18 }}>
        {value}
      </ProDayText>
    </View>
  );
}

export type SmartTacticsChapterProps = {
  profile: User;
  events: TeamEvent[];
  members: User[];
  refreshing?: boolean;
  onRefresh: () => void;
  onOpenChapter: (id: SmartTacticsChapterId) => void;
  wellnessByUid?: Record<string, import('../../models/SmartTactics').WellnessSignals>;
  /** Plan chargé depuis l’historique → hydrate le board. */
  hydratePlan?: TacticalPlan | null;
  onHydratePlan?: (plan: TacticalPlan | null) => void;
};

const linkTouch = StyleSheet.create({
  wrap: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 2 },
});

const hint = StyleSheet.create({
  line: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 4,
    fontWeight: '600',
  },
  coachLine: {
    color: COACH_SITE.muted,
  },
});

const coachPanel = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COACH_SITE.border,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: COACH_SITE.surface,
  },
  title: { color: COACH_SITE.foreground, fontWeight: '800' },
  body: { color: COACH_SITE.muted, lineHeight: 18 },
  cta: { color: COACH_SITE.accent, fontWeight: '800' },
});

const pad = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    ...MATCH_CHAPTER_PAD,
    gap: spacing.xs + 2,
    paddingTop: 2,
    flexGrow: 0,
    paddingBottom: spacing.xl,
  },
});

const empty = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.sm + 2, gap: 4 },
  body: { lineHeight: 17 },
  cta: { marginTop: 2, alignSelf: 'flex-start' },
  ctaText: { fontWeight: '800' },
});

const coachPad = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },
  content: {
    ...MATCH_CHAPTER_PAD,
    gap: spacing.md,
    paddingTop: spacing.sm,
    flexGrow: 0,
    paddingBottom: spacing.xl,
  },
});

const coachCta = StyleSheet.create({
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  primaryText: { fontWeight: '700' },
});

const coachChip = StyleSheet.create({
  base: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 200,
  },
  label: { fontWeight: '800', fontSize: 12 },
});

const coachHeader = StyleSheet.create({
  wrap: { gap: 4 },
  kicker: { fontSize: 13, fontWeight: '600' },
  title: { fontWeight: '700', letterSpacing: -0.3 },
});

const legacySection = StyleSheet.create({
  wrap: { gap: 6, marginTop: 4 },
  kicker: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '800',
    fontSize: 10,
  },
});

const metric = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flex: 1,
    minWidth: '30%',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 2,
  },
  label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
});

function createRailStyles(coachSkin = false) {
  return StyleSheet.create({
    coachWrap: {
      flexGrow: 0,
      flexShrink: 0,
      maxHeight: 52,
      backgroundColor: 'transparent',
    },
    coachScroll: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: 6,
      gap: 6,
      alignItems: 'center',
    },
    coachPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: 18,
      backgroundColor: COACH_SITE.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: COACH_SITE.border,
    },
    coachPillOn: {
      backgroundColor: COACH_SITE.elevated,
      borderColor: COACH_SITE.accent,
    },
    coachPillLabel: {
      fontWeight: '800',
      fontSize: 12,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    coachPillLabelOff: {
      color: COACH_SITE.muted,
    },
    coachPillLabelOn: {
      color: COACH_SITE.accent,
    },
    wrap: {
      flexGrow: 0,
      flexShrink: 0,
      paddingHorizontal: spacing.lg,
      gap: spacing.xs,
    },
    shell: {
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.sm,
      gap: spacing.sm,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    brandDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: SMART_PITCH.warm,
    },
    brand: {
      color: 'rgba(255,255,255,0.78)',
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      fontSize: 10,
    },
    brandActive: {
      color: SMART_PITCH.warm,
      fontWeight: '800',
      fontSize: 10,
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: 'rgba(0,0,0,0.28)',
      borderRadius: radius.md,
      padding: 3,
      gap: 3,
    },
    segItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 9,
      borderRadius: radius.sm,
    },
    segItemOn: {
      backgroundColor: SMART_PITCH.warm,
    },
    segLabel: {
      color: 'rgba(255,255,255,0.7)',
      fontWeight: '800',
      fontSize: 12,
    },
    segLabelOn: {
      color: '#0B1A12',
    },
    toolsToggle: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    toolsToggleText: {
      color: 'rgba(255,255,255,0.78)',
      fontWeight: '800',
      fontSize: 11,
    },
    playerHint: {
      color: 'rgba(255,255,255,0.55)',
      fontWeight: '700',
      fontSize: 10,
      letterSpacing: 0.4,
    },
    moreRail: {
      gap: spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 2,
    },
    morePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: spacing.sm,
      paddingVertical: 7,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    moreText: { fontWeight: '700', fontSize: 11 },
  });
}
