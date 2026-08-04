import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { ProDaySurface } from '../../components/ui/ProDaySurface';
import { PressableSpring } from '../../components/motion';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import { useParentShell } from '../../navigation/parentShellContext';
import { parentPortalService } from '../../services/parentPortal.service';
import type { CarpoolLiveTripDoc } from '../../models/CarpoolLiveTrip';
import { carpoolLiveTripService } from '../../services/carpoolLiveTrip.service';

export const ParentCarpoolScreen: React.FC = () => {
  const { colors: c } = useThemedScreen();
  const { t } = useTranslation();
  const { selected } = useParentShell();
  const [trips, setTrips] = useState<CarpoolLiveTripDoc[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!selected) {
      setTrips([]);
      return;
    }
    setLoading(true);
    try {
      setTrips(await parentPortalService.listActiveCarpoolTripsForChild(selected.uid));
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    void load();
  }, [load]);

  // Live subscribe first active trip
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
    const url = `https://maps.apple.com/?ll=${lat},${lng}&q=Position`;
    void Linking.openURL(url);
  };

  if (!selected) {
    return (
      <View style={styles.center}>
        <ProDayText variant="body" muted>
          {t('parent.selectChild')}
        </ProDayText>
      </View>
    );
  }

  const privacyOk = selected.settings.privacy?.share_live_carpool !== false;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ProDayText variant="section">
        {t('parent.carpool.title', { name: selected.display_name })}
      </ProDayText>
      <ProDayText variant="caption" muted>
        {t('parent.carpool.subtitle')}
      </ProDayText>

      {!privacyOk ? (
        <ProDaySurface variant="module" style={styles.card}>
          <ProDayText variant="body" muted>
            {t('parent.carpool.privacyDisabled')}
          </ProDayText>
        </ProDaySurface>
      ) : null}

      {loading ? (
        <ActivityIndicator color={c.brand} />
      ) : trips.length === 0 ? (
        <ProDaySurface variant="module" style={styles.card}>
          <ProDayText variant="body" muted>
            {t('parent.carpool.empty')}
          </ProDayText>
        </ProDaySurface>
      ) : (
        trips.map((trip) => (
          <ProDaySurface key={trip.trip_id} variant="module" style={styles.card}>
            <ProDayText variant="caption" accent>
              {trip.active ? t('parent.carpool.enRoute') : t('parent.carpool.finished')} ·{' '}
              {trip.kind === 'event' ? t('parent.carpool.kindEvent') : t('parent.carpool.kindFree')}
            </ProDayText>
            <ProDayText variant="section">{t('parent.carpool.departure')}</ProDayText>
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
                <PressableSpring
                  onPress={() => openMaps(trip.location!.latitude, trip.location!.longitude)}
                  scaleTo={0.97}
                  haptic
                  style={[styles.mapBtn, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}
                >
                  <ProDayText variant="caption" accent style={{ fontWeight: '800' }}>
                    {t('parent.carpool.openMaps')}
                  </ProDayText>
                </PressableSpring>
              </>
            ) : (
              <ProDayText variant="caption" muted>
                {t('parent.carpool.noLocation')}
              </ProDayText>
            )}
            {trip.ended_at ? (
              <>
                <ProDayText variant="section">{t('parent.carpool.arrival')}</ProDayText>
                <ProDayText variant="caption" muted>
                  {trip.ended_at.toLocaleString('fr-FR')}
                </ProDayText>
              </>
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
          </ProDaySurface>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { padding: spacing.md, borderRadius: radius.md, gap: spacing.xs },
  mapBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
