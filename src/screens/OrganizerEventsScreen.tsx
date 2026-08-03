import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import type { User } from '../models/User';
import {
  EVENT_KIND_LABELS,
  EVENT_STATUS_LABELS,
} from '../models/EventOrganizer';
import { useOrganizerEvents } from '../hooks/useOrganizerEvents';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { PressableSpring, PushScreenTransition } from '../components/motion';
import { ProDayText } from '../components/ui/ProDayText';
import { GlassCard } from '../components/aurora/GlassCard';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { spacing, radius } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';
import { useTranslation } from '../context/LocaleContext';
import { formatCalendarDate } from '../utils/seasonCalendar';
import { CreateOrganizerEventScreen } from './CreateOrganizerEventScreen';
import { OrganizerEventDetailScreen } from './OrganizerEventDetailScreen';

interface OrganizerEventsScreenProps {
  profile: User;
  onBack: () => void;
}

export const OrganizerEventsScreen: React.FC<OrganizerEventsScreenProps> = ({
  profile,
  onBack,
}) => {
  const { t } = useTranslation();
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const { events, loading, refresh } = useOrganizerEvents(profile.uid);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <View style={[styles.root, rootStyle]}>
        <ScreenHeader
          label={t('events.list.label')}
          title={t('events.list.title')}
          subtitle={t('events.list.subtitle')}
          onBack={onBack}
        />
        <ScrollView contentContainerStyle={styles.body}>
          <PressableSpring
            style={[styles.createBtn, { backgroundColor: c.brand }]}
            onPress={() => setShowCreate(true)}
            scaleTo={0.97}
            haptic
          >
            <ProDayText variant="caption" inverse style={styles.createBtnText}>
              {t('events.list.createCta')}
            </ProDayText>
          </PressableSpring>

          {loading ? (
            <ActivityIndicator color={c.brand} style={{ marginTop: spacing.xl }} />
          ) : events.length === 0 ? (
            <GlassCard style={styles.empty}>
              <ProDayText variant="body" muted>
                {t('events.list.empty')}
              </ProDayText>
            </GlassCard>
          ) : (
            events.map((event) => (
              <PressableSpring
                key={event.id}
                onPress={() => setSelectedId(event.id)}
                scaleTo={0.98}
                haptic
              >
                <GlassCard style={styles.card}>
                  <ProDayText variant="caption" accent>
                    {EVENT_KIND_LABELS[event.kind]}
                  </ProDayText>
                  <ProDayText variant="section">{event.title}</ProDayText>
                  <ProDayText variant="caption" muted>
                    {[event.city, formatCalendarDate(event.starts_at)]
                      .filter(Boolean)
                      .join(' · ')}
                  </ProDayText>
                  <ProDayText variant="caption" muted>
                    {EVENT_STATUS_LABELS[event.status]}
                    {event.registration_price_cents
                      ? ` · ${(event.registration_price_cents / 100).toFixed(2)} €`
                      : ` · ${t('events.list.free')}`}
                  </ProDayText>
                </GlassCard>
              </PressableSpring>
            ))
          )}
        </ScrollView>
      </View>

      <PushScreenTransition active={showCreate}>
        {showCreate ? (
          <CreateOrganizerEventScreen
            profile={profile}
            onBack={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              void refresh();
            }}
          />
        ) : null}
      </PushScreenTransition>

      <PushScreenTransition active={Boolean(selectedId)}>
        {selectedId ? (
          <OrganizerEventDetailScreen
            profile={profile}
            eventId={selectedId}
            onBack={() => {
              setSelectedId(null);
              void refresh();
            }}
          />
        ) : null}
      </PushScreenTransition>
    </>
  );
};

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    body: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    createBtn: {
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    createBtnText: { fontWeight: '800' },
    empty: { padding: spacing.lg },
    card: { padding: spacing.md, gap: spacing.xs },
  });
}
