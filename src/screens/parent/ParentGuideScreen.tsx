import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import { ParentPageFrame } from '../../components/parent/ParentPageFrame';
import {
  ParentActionButton,
  ParentSectionCard,
} from '../../components/parent/parentPortalUi';
import { PARENT_PAGES } from '../../content/parentPageIdentity';
import { useParentShell } from '../../navigation/parentShellContext';
import { useParentShellNav } from '../../features/parent/shell/ParentShellNavContext';
import {
  audienceLabel,
  buildParentGuideTips,
  scheduleParentGuideReminders,
  type ParentGuideAudience,
  type ParentGuideTip,
} from '../../services/parentAiGuide.service';
import { parentPortalService } from '../../services/parentPortal.service';
import { getScreenTimeDayKey } from '../../utils/parentalScreenTime';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { spacing, radius } from '../../theme/designTokens';
import { aiComingSoonBody } from '../../utils/aiUxHonesty';

const FILTERS: { id: ParentGuideAudience | 'all'; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'child', label: 'Enfant' },
  { id: 'parent', label: 'Vous' },
  { id: 'actions', label: 'Actions' },
];

/** Surface Guide IA — suggestions locales ; rappels push non activés. */
export const ParentGuideScreen: React.FC = () => {
  const { colors: c } = useThemedScreen();
  const { selected, children } = useParentShell();
  const shellNav = useParentShellNav();
  const [filter, setFilter] = useState<ParentGuideAudience | 'all'>('all');
  const [hasNextEvent, setHasNextEvent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selected) {
        if (!cancelled) setHasNextEvent(false);
        return;
      }
      try {
        const events = await parentPortalService.listChildEvents(selected.uid);
        const upcoming = events.some(
          (e) => e.starts_at.getTime() >= Date.now() - 2 * 60 * 60 * 1000,
        );
        if (!cancelled) setHasNextEvent(upcoming);
      } catch {
        if (!cancelled) setHasNextEvent(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const screenTimeNearLimit = useMemo(() => {
    if (!selected) return false;
    const limit = selected.settings.daily_limit_minutes ?? 90;
    const bonus =
      selected.settings.screen_time_bonus_day === getScreenTimeDayKey()
        ? selected.settings.screen_time_bonus_minutes ?? 0
        : 0;
    const max = limit + bonus;
    return max > 0 && selected.minutesUsedToday / max >= 0.8;
  }, [selected]);

  const pendingContacts = useMemo(
    () => (selected?.settings.approved_contacts ?? []).filter((x) => !x.approved).length,
    [selected],
  );

  const tips = useMemo(
    () =>
      buildParentGuideTips({
        childName: selected?.display_name,
        alerts: selected?.alerts ?? [],
        hasNextEvent,
        pendingContacts,
        screenTimeNearLimit,
        childrenCount: children.length,
      }),
    [selected, hasNextEvent, pendingContacts, screenTimeNearLimit, children.length],
  );

  useEffect(() => {
    void scheduleParentGuideReminders(tips);
  }, [tips]);

  const visible = useMemo(
    () => (filter === 'all' ? tips : tips.filter((t) => t.audience === filter)),
    [tips, filter],
  );

  return (
    <ParentPageFrame identity={PARENT_PAGES.guide} showHero>
      <ScrollView contentContainerStyle={styles.content}>
        <ProDayText variant="caption" muted>
          Suggestions du guide — locales, pas un diagnostic médical ni des scores inventés.
          {` ${aiComingSoonBody('Les rappels push')}`}
        </ProDayText>

        <View style={styles.filters}>
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <PressableSpring
                key={f.id}
                onPress={() => setFilter(f.id)}
                scaleTo={0.96}
                haptic
                style={[
                  styles.chip,
                  {
                    backgroundColor: on ? c.brandSoft : c.surfaceMuted,
                    borderColor: on ? c.brand : c.border,
                  },
                ]}
              >
                <ProDayText
                  variant="caption"
                  style={{ fontWeight: '700', color: on ? c.brand : c.textMuted }}
                >
                  {f.label}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>

        {visible.map((tip) => (
          <TipCard
            key={tip.id}
            tip={tip}
            onCta={() => tip.ctaTab && shellNav?.requestNav(tip.ctaTab)}
          />
        ))}
      </ScrollView>
    </ParentPageFrame>
  );
};

function TipCard({ tip, onCta }: { tip: ParentGuideTip; onCta: () => void }) {
  return (
    <ParentSectionCard
      title={tip.title}
      subtitle={`${audienceLabel(tip.audience)} · suggestion guide`}
    >
      <ProDayText variant="body">{tip.body}</ProDayText>
      {tip.ctaLabel && tip.ctaTab ? (
        <ParentActionButton label={tip.ctaLabel} onPress={onCta} icon="chevron-forward" />
      ) : null}
    </ParentSectionCard>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
