import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import { ParentPageFrame } from '../../components/parent/ParentPageFrame';
import {
  ParentActionButton,
  ParentAlertChip,
  ParentQuickGrid,
  ParentSectionCard,
} from '../../components/parent/parentPortalUi';
import { ParentUnlockCard } from '../../components/parent/ParentUnlockCard';
import { PARENT_PAGES } from '../../content/parentPageIdentity';
import { useParentShell, type ParentTabId } from '../../navigation/parentShellContext';
import {
  parentalGuardianService,
  type GuardianNotification,
} from '../../services/parentalGuardian.service';
import { parentPortalService } from '../../services/parentPortal.service';
import { useAuth } from '../../context/AuthContext';
import { normalizeGuardianEmail } from '../../utils/guardianEmail';
import { LateReportControl } from '../../components/team/LateReportControl';
import type { TeamEvent } from '../../models/TeamEvent';
import { getScreenTimeDayKey } from '../../utils/parentalScreenTime';
import {
  ParentRsvpEmptyCard,
  ParentRsvpEventHero,
} from '../../features/parent/ui/ParentRsvpChrome';
import {
  pickNextChildEvent,
  type ParentRsvpChoice,
} from '../../features/parent/ui/parentRsvpModel';

interface Props {
  onOpenTab: (tab: ParentTabId) => void;
}

export const ParentHomeScreen: React.FC<Props> = ({ onOpenTab }) => {
  const { colors: c } = useThemedScreen();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { children, selected, setSelectedUid, loading, reload } = useParentShell();
  const email = normalizeGuardianEmail(profile?.email);
  const [notifs, setNotifs] = useState<GuardianNotification[]>([]);
  const [nextEvent, setNextEvent] = useState<TeamEvent | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [bonusBusy, setBonusBusy] = useState(false);
  const [rsvpBusy, setRsvpBusy] = useState(false);

  useEffect(() => {
    if (!email) return;
    return parentalGuardianService.subscribeGuardianNotifications(email, setNotifs);
  }, [email]);

  const unreadNotifs = useMemo(() => notifs.filter((n) => !n.read_at), [notifs]);

  const refreshEvent = useCallback(async () => {
    if (!selected) {
      setNextEvent(null);
      return;
    }
    const events = await parentPortalService.listChildEvents(selected.uid);
    setNextEvent(pickNextChildEvent(events));
  }, [selected]);

  useEffect(() => {
    void refreshEvent();
  }, [refreshEvent]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
      await refreshEvent();
    } finally {
      setRefreshing(false);
    }
  }, [reload, refreshEvent]);

  const markNotifs = useCallback(async () => {
    if (!email) return;
    try {
      await parentalGuardianService.markGuardianNotificationsRead(email);
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : 'Erreur');
    }
  }, [email, t]);

  const grantBonus = useCallback(async () => {
    if (!selected || !email) return;
    setBonusBusy(true);
    try {
      await parentPortalService.grantScreenTimeBonus(selected.uid, email, 15);
      Alert.alert('Bonus accordé', `+15 min pour ${selected.display_name} aujourd’hui.`);
      await reload();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible d’accorder le bonus');
    } finally {
      setBonusBusy(false);
    }
  }, [selected, email, reload]);

  const onRsvp = useCallback(
    async (choice: ParentRsvpChoice) => {
      if (!selected || !nextEvent) return;
      setRsvpBusy(true);
      try {
        await parentPortalService.updateChildRsvp(selected.uid, nextEvent.id, choice, {
          childName: selected.display_name,
        });
        await refreshEvent();
      } catch (e) {
        Alert.alert(
          'Présence',
          e instanceof Error ? e.message : 'Impossible d’enregistrer la réponse.',
        );
      } finally {
        setRsvpBusy(false);
      }
    },
    [selected, nextEvent, refreshEvent],
  );

  const usageLabel = useMemo(() => {
    if (!selected) return null;
    const limit = selected.settings.daily_limit_minutes ?? 90;
    const bonus =
      selected.settings.screen_time_bonus_day === getScreenTimeDayKey()
        ? selected.settings.screen_time_bonus_minutes ?? 0
        : 0;
    return `${selected.minutesUsedToday} / ${limit + bonus} min`;
  }, [selected]);

  const pendingContacts = useMemo(
    () => (selected?.settings.approved_contacts ?? []).filter((x) => !x.approved),
    [selected],
  );

  if (loading && children.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={c.brand} />
      </View>
    );
  }

  return (
    <ParentPageFrame identity={PARENT_PAGES.home}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={c.brand}
          />
        }
      >
        {children.length === 0 ? (
          <ParentSectionCard
            title={t('parent.home.noChildren.title')}
            subtitle={t('parent.home.noChildren.body')}
          >
            <ParentActionButton
              label={t('parent.home.refresh')}
              onPress={() => void reload()}
              icon="tune"
            />
            <ParentActionButton
              label="Lier avec un code"
              tone="ghost"
              onPress={() => onOpenTab('reglages')}
              icon="add"
            />
          </ParentSectionCard>
        ) : (
          <>
            <ParentQuickGrid
              items={[
                {
                  id: 'agenda',
                  label: 'Agenda',
                  icon: 'calendar',
                  onPress: () => onOpenTab('agenda'),
                },
                {
                  id: 'enfant',
                  label: 'Enfant',
                  icon: 'person',
                  onPress: () => onOpenTab('enfant'),
                },
                {
                  id: 'guide',
                  label: 'Guide',
                  icon: 'star-four-points',
                  onPress: () => onOpenTab('guide'),
                },
                {
                  id: 'plus',
                  label: 'Menu',
                  icon: 'menu',
                  onPress: () => onOpenTab('plus'),
                },
              ]}
            />

            {children.length > 1 ? (
              <ParentSectionCard title="Enfants liés" subtitle="Touchez pour basculer la supervision">
                <View style={styles.childChips}>
                  {children.map((child) => {
                    const active = selected?.uid === child.uid;
                    return (
                      <PressableSpring
                        key={child.uid}
                        onPress={() => setSelectedUid(child.uid)}
                        scaleTo={0.97}
                        haptic
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? c.brandSoft : c.surfaceMuted,
                            borderColor: active ? c.brand : c.border,
                          },
                        ]}
                      >
                        <ProDayText
                          variant="caption"
                          style={{ fontWeight: '800', color: active ? c.brand : c.text }}
                        >
                          {child.display_name}
                        </ProDayText>
                        {child.alerts.length > 0 ? (
                          <View style={[styles.dot, { backgroundColor: c.accent }]} />
                        ) : null}
                      </PressableSpring>
                    );
                  })}
                </View>
              </ParentSectionCard>
            ) : null}

            {selected ? (
              nextEvent ? (
                <ParentRsvpEventHero
                  event={nextEvent}
                  childName={selected.display_name}
                  childUid={selected.uid}
                  busy={rsvpBusy}
                  onChoose={(choice) => void onRsvp(choice)}
                  footer={
                    <LateReportControl
                      eventId={nextEvent.id}
                      playerUid={selected.uid}
                      playerName={selected.display_name}
                      currentRsvp={nextEvent.rsvps?.[selected.uid]}
                      reportedByParent
                      enablePickupLate
                      onReported={() => void refreshEvent()}
                    />
                  }
                />
              ) : (
                <ParentRsvpEmptyCard
                  childName={selected.display_name}
                  onOpenAgenda={() => onOpenTab('agenda')}
                />
              )
            ) : null}

            {selected && email ? (
              <ParentUnlockCard child={selected} guardianEmail={email} onDone={reload} />
            ) : null}

            {selected && selected.alerts.length > 0 ? (
              <ParentSectionCard title="Alertes" subtitle={`Supervision de ${selected.display_name}`}>
                {selected.alerts.map((alert) => (
                  <ParentAlertChip key={alert} label={alert} />
                ))}
                {pendingContacts.length > 0 ? (
                  <ParentActionButton
                    label={`Traiter ${pendingContacts.length} contact(s)`}
                    onPress={() => onOpenTab('messages')}
                    icon="chat"
                  />
                ) : null}
              </ParentSectionCard>
            ) : null}

            {unreadNotifs.length > 0 ? (
              <ParentSectionCard
                title="Invitations"
                subtitle={`${unreadNotifs.length} non lue${unreadNotifs.length > 1 ? 's' : ''} · agenda`}
              >
                {unreadNotifs.slice(0, 4).map((n) => (
                  <View key={n.id} style={styles.notifRow}>
                    <ProDayText variant="body">{n.event_title}</ProDayText>
                    <ProDayText variant="caption" muted>
                      Convocation ·{' '}
                      {n.event_starts_at
                        ? n.event_starts_at.toLocaleString('fr-FR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'date à confirmer'}
                    </ProDayText>
                  </View>
                ))}
                <View style={styles.row}>
                  <ParentActionButton
                    label="Marquer comme lues"
                    tone="ghost"
                    onPress={() => void markNotifs()}
                  />
                  <ParentActionButton
                    label="Confirmer présence"
                    onPress={() => onOpenTab('agenda')}
                    icon="calendar"
                  />
                </View>
              </ParentSectionCard>
            ) : null}

            {selected ? (
              <ParentSectionCard
                title="Temps d’écran"
                subtitle={`${selected.display_name} · ${usageLabel}`}
              >
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: c.brand,
                        width: `${Math.min(
                          100,
                          Math.round(
                            (selected.minutesUsedToday /
                              Math.max(1, selected.settings.daily_limit_minutes ?? 90)) *
                              100,
                          ),
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.row}>
                  <ParentActionButton
                    label="+15 min"
                    onPress={() => void grantBonus()}
                    loading={bonusBusy}
                    icon="time"
                  />
                  <ParentActionButton
                    label="Limiter"
                    tone="ghost"
                    onPress={() => onOpenTab('reglages')}
                    icon="settings"
                  />
                  <ParentActionButton
                    label="Enfant"
                    tone="ghost"
                    onPress={() => onOpenTab('enfant')}
                    icon="person"
                  />
                </View>
              </ParentSectionCard>
            ) : null}
          </>
        )}
      </ScrollView>
    </ParentPageFrame>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  childChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  notifRow: { gap: 2, paddingVertical: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
});
