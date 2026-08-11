import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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
  isSmartTacticsPrimaryChapter,
  type SmartTacticsChapterId,
} from '../../content/smartTacticsChapters';
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

export function SmartTacticsChapterRail({
  active,
  onChange,
  mode = 'coach',
}: {
  active: SmartTacticsChapterId;
  onChange: (id: SmartTacticsChapterId) => void;
  mode?: 'coach' | 'player';
}) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createRailStyles(), []);
  const [moreOpen, setMoreOpen] = useState(() =>
    mode === 'coach' ? !isSmartTacticsPrimaryChapter(active) : false,
  );
  const inMore =
    mode === 'coach' && SMART_TACTICS_MORE_CHAPTERS.some((c) => c.id === active);
  const activeMore = SMART_TACTICS_MORE_CHAPTERS.find((c) => c.id === active);
  const primary =
    mode === 'player' ? SMART_TACTICS_PLAYER_PRIMARY_CHAPTERS : SMART_TACTICS_PRIMARY_CHAPTERS;

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
}: {
  active: SmartTacticsChapterId;
  mode?: 'coach' | 'player';
}) {
  const { t } = useTranslation();
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
      <ProDayText variant="caption" muted style={hint.line}>
        {t('smartTactics.flow.moreHint')}
      </ProDayText>
    );
  }
  return (
    <ProDayText variant="caption" muted style={hint.line}>
      {t(`smartTactics.flow.step${primary.step}`)}
    </ProDayText>
  );
}

export function SmartTacticsChapterScroll({ children }: { children: React.ReactNode }) {
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
  const accent =
    tone === 'good'
      ? SMART_PITCH.ready
      : tone === 'warn'
        ? SMART_PITCH.risk
        : tone === 'warm'
          ? SMART_PITCH.warm
          : colors.textMuted;
  return (
    <View style={[metric.chip, { borderColor: colors.border, backgroundColor: colors.surface }]}>
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

const hint = StyleSheet.create({
  line: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 4,
    fontWeight: '600',
  },
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

const metric = StyleSheet.create({
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

function createRailStyles() {
  return StyleSheet.create({
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
