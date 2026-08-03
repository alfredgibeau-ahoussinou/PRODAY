import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { ProDaySurface } from '../../components/ui/ProDaySurface';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { spacing, radius } from '../../theme/designTokens';
import { useParentShell } from '../../navigation/parentShellContext';
import { parentPortalService } from '../../services/parentPortal.service';
import type { CarpoolLiveTripDoc } from '../../models/CarpoolLiveTrip';
import { carpoolLiveTripService } from '../../services/carpoolLiveTrip.service';

export const ParentCarpoolScreen: React.FC = () => {
  const { colors: c } = useThemedScreen();
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
        const others = prev.filter((t) => t.trip_id !== doc.trip_id);
        return doc.active ? [doc, ...others] : others;
      });
    });
  }, [trips[0]?.trip_id]);

  if (!selected) {
    return (
      <View style={styles.center}>
        <ProDayText variant="body" muted>
          Sélectionnez un enfant.
        </ProDayText>
      </View>
    );
  }

  const privacyOk = selected.settings.privacy?.share_live_carpool !== false;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ProDayText variant="section">Trajet live — {selected.display_name}</ProDayText>
      <ProDayText variant="caption" muted>
        Suivi départ / route / arrivée lorsque le covoiturage est en cours.
      </ProDayText>

      {!privacyOk ? (
        <ProDaySurface variant="module" style={styles.card}>
          <ProDayText variant="body" muted>
            Le partage de position live est désactivé dans les permissions.
          </ProDayText>
        </ProDaySurface>
      ) : null}

      {loading ? (
        <ActivityIndicator color={c.brand} />
      ) : trips.length === 0 ? (
        <ProDaySurface variant="module" style={styles.card}>
          <ProDayText variant="body" muted>
            Aucun trajet en cours. Le suivi apparaît quand le conducteur démarre le partage.
          </ProDayText>
        </ProDaySurface>
      ) : (
        trips.map((trip) => (
          <ProDaySurface key={trip.trip_id} variant="module" style={styles.card}>
            <ProDayText variant="caption" accent>
              {trip.active ? 'En route' : 'Terminé'} · {trip.kind === 'event' ? 'Événement' : 'Offre libre'}
            </ProDayText>
            <ProDayText variant="section">Départ</ProDayText>
            <ProDayText variant="caption" muted>
              {trip.started_at
                ? trip.started_at.toLocaleString('fr-FR')
                : 'En attente du démarrage'}
            </ProDayText>
            <ProDayText variant="section">Position</ProDayText>
            {trip.location ? (
              <ProDayText variant="body">
                {trip.location.latitude.toFixed(5)}, {trip.location.longitude.toFixed(5)}
                {trip.accuracy_m != null ? ` (±${Math.round(trip.accuracy_m)} m)` : ''}
              </ProDayText>
            ) : (
              <ProDayText variant="caption" muted>
                Position non publiée
              </ProDayText>
            )}
            {trip.ended_at ? (
              <>
                <ProDayText variant="section">Arrivée</ProDayText>
                <ProDayText variant="caption" muted>
                  {trip.ended_at.toLocaleString('fr-FR')}
                </ProDayText>
              </>
            ) : (
              <ProDayText variant="caption" muted>
                Arrivée : en cours…
              </ProDayText>
            )}
            <ProDayText variant="caption" muted>
              Mis à jour :{' '}
              {trip.updated_at ? trip.updated_at.toLocaleTimeString('fr-FR') : '—'}
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
  card: { padding: spacing.lg, gap: spacing.sm, borderRadius: radius.lg },
});
