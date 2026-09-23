import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Linking, Alert } from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';
import { useParentShell } from '../../navigation/parentShellContext';
import { parentPortalService } from '../../services/parentPortal.service';
import type { CarpoolLiveTripDoc } from '../../models/CarpoolLiveTrip';
import { carpoolLiveTripService } from '../../services/carpoolLiveTrip.service';
import { ParentPageFrame } from '../../components/parent/ParentPageFrame';
import {
  ParentActionButton,
  ParentSectionCard,
} from '../../components/parent/parentPortalUi';
import { PARENT_PAGES } from '../../content/parentPageIdentity';
import { normalizeGuardianEmail } from '../../utils/guardianEmail';
import { useAuth } from '../../context/AuthContext';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { transportLogisticsService } from '../../services/transportLogistics.service';
import { PassengerTransportTicket } from '../../components/transport/PassengerTransportTicket';
import type { TeamEvent } from '../../models/TeamEvent';
import { formatCalendarDate } from '../../utils/seasonCalendar';

export const ParentCarpoolScreen: React.FC = () => {
  const { colors: c } = useThemedScreen();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { selected, reload } = useParentShell();
  const email = normalizeGuardianEmail(profile?.email);
  const [trips, setTrips] = useState<CarpoolLiveTripDoc[]>([]);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [privacyBusy, setPrivacyBusy] = useState(false);

  const load = useCallback(async () => {
    if (!selected) {
      setTrips([]);
      setEvents([]);
      return;
    }
    setLoading(true);
    try {
      const [activeTrips, childEvents] = await Promise.all([
        parentPortalService.listActiveCarpoolTripsForChild(selected.uid),
        parentPortalService.listChildEvents(selected.uid),
      ]);
      setTrips(activeTrips);
      setEvents(childEvents);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const tripId = trips[0]?.trip_id;
    if (!tripId) return;
    return carpoolLiveTripService.subscribe(tripId, (doc) => {
      if (!doc) return;
      setTrips((prev) => {
        const others = prev.filter((trip) => trip.trip_id !== doc.trip_id);
        return doc.active ? [doc, ...others] : others;
      });
    });
  }, [trips[0]?.trip_id]);

  const openMaps = (lat: number, lng: number) => {
    void Linking.openURL(`https://maps.apple.com/?ll=${lat},${lng}&q=Position`);
  };

  if (!selected) {
    return (
      <ParentPageFrame identity={PARENT_PAGES.trajet}>
        <View style={styles.center}>
          <ProDayText variant="body" muted>
            {t('parent.selectChild')}
          </ProDayText>
        </View>
      </ParentPageFrame>
    );
  }

  const privacyOk = selected.settings.privacy?.share_live_carpool !== false;

  return (
    <ParentPageFrame identity={PARENT_PAGES.trajet}>
      <ScrollView contentContainerStyle={styles.content}>
        <ParentSectionCard
          title={t('parent.carpool.title', { name: selected.display_name })}
          subtitle={t('parent.carpool.subtitle')}
        >
          {!privacyOk ? (
            <>
              <ProDayText variant="body" muted>
                {t('parent.carpool.privacyDisabled')}
              </ProDayText>
              <ParentActionButton
                label="Activer le partage live"
                icon="checkmark-circle"
                loading={privacyBusy}
                onPress={() => {
                  if (!email) return;
                  setPrivacyBusy(true);
                  void parentPortalService
                    .updatePrivacy(selected.uid, email, {
                      ...selected.settings.privacy,
                      share_live_carpool: true,
                    })
                    .then(reload)
                    .catch((e) =>
                      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec'),
                    )
                    .finally(() => setPrivacyBusy(false));
                }}
              />
            </>
          ) : (
            <ParentActionButton
              label="Désactiver le partage"
              tone="ghost"
              loading={privacyBusy}
              onPress={() => {
                if (!email) return;
                setPrivacyBusy(true);
                void parentPortalService
                  .updatePrivacy(selected.uid, email, {
                    ...selected.settings.privacy,
                    share_live_carpool: false,
                  })
                  .then(reload)
                  .catch((e) =>
                    Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec'),
                  )
                  .finally(() => setPrivacyBusy(false));
              }}
            />
          )}
        </ParentSectionCard>

        {events.length > 0 && (
          <View style={{ gap: spacing.sm, marginVertical: spacing.sm }}>
            <ProDayText variant="section">
              Transports prévus ({selected.display_name})
            </ProDayText>
            {events.map((event) => {
              const parentView = transportLogisticsService.getParentTransportView(
                event,
                selected.uid
              );
              return (
                <View key={event.id}>
                  <PassengerTransportTicket
                    summary={parentView.summary}
                    eventTitle={event.title}
                    eventDate={formatCalendarDate(event.starts_at)}
                    isParentView
                    onDeclareIndependent={async () => {
                      try {
                        await transportLogisticsService.setIndependentTravel(
                          event.id,
                          selected.uid,
                          !parentView.summary.is_independent
                        );
                        void load();
                      } catch (err: any) {
                        Alert.alert('Erreur', err?.message || 'Erreur');
                      }
                    }}
                  />
                </View>
              );
            })}
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={c.brand} />
        ) : trips.length === 0 ? (
          <ParentSectionCard title={t('parent.carpool.empty')}>
            <ProDayText variant="caption" muted>
              Dès qu’un trajet live démarre pour {selected.display_name}, la position apparaît ici.
            </ProDayText>
            <ParentActionButton label="Actualiser" tone="ghost" icon="tune" onPress={() => void load()} />
          </ParentSectionCard>
        ) : (
          trips.map((trip) => (
            <ParentSectionCard
              key={trip.trip_id}
              title={t('parent.carpool.departure')}
              subtitle={`${trip.active ? t('parent.carpool.enRoute') : t('parent.carpool.finished')} · ${
                trip.kind === 'event' ? t('parent.carpool.kindEvent') : t('parent.carpool.kindFree')
              }`}
            >
              <ProDayText variant="caption" muted>
                {trip.started_at
                  ? trip.started_at.toLocaleString('fr-FR')
                  : t('parent.carpool.waiting')}
              </ProDayText>
              <ProDayText variant="section">{t('parent.carpool.position')}</ProDayText>
              {trip.location ? (
                <>
                  <ProDayText variant="body">
                    {trip.location.latitude.toFixed(5)}, {trip.location.longitude.toFixed(5)}
                    {trip.accuracy_m != null ? ` (±${Math.round(trip.accuracy_m)} m)` : ''}
                  </ProDayText>
                  <ParentActionButton
                    label={t('parent.carpool.openMaps')}
                    icon="location"
                    onPress={() => openMaps(trip.location!.latitude, trip.location!.longitude)}
                  />
                </>
              ) : (
                <ProDayText variant="caption" muted>
                  {t('parent.carpool.noLocation')}
                </ProDayText>
              )}
              {trip.ended_at ? (
                <ProDayText variant="caption" muted>
                  {t('parent.carpool.arrival')} · {trip.ended_at.toLocaleString('fr-FR')}
                </ProDayText>
              ) : (
                <ProDayText variant="caption" muted>
                  {t('parent.carpool.arrivalInProgress')}
                </ProDayText>
              )}
              <ProDayText variant="caption" muted>
                {t('parent.carpool.updatedAt', {
                  time: trip.updated_at ? trip.updated_at.toLocaleTimeString('fr-FR') : '—',
                })}
              </ProDayText>
            </ParentSectionCard>
          ))
        )}
      </ScrollView>
    </ParentPageFrame>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
});
