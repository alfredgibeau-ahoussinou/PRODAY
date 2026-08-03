import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { CarpoolPassenger } from '../../models/TeamEvent';
import type { CarpoolTripStatus } from '../../models/CarpoolLiveTrip';
import type { GeoMarker } from '../../core/types/geo';
import { useCarpoolLiveTrip } from '../../hooks/useCarpoolLiveTrip';
import { ProDayLiveMap } from '../geo/ProDayLiveMap';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { openMapsAt, formatCoordinates } from '../../utils/geoLocation';
import {
  canEndCarpoolTrip,
  canStartCarpoolTrip,
  confirmedPassengerUids,
} from '../../utils/carpoolLiveTrip';
import { spacing, radius } from '../../theme/designTokens';

interface CarpoolLiveTripPanelProps {
  tripId: string;
  viewerUid: string;
  driverUid: string;
  driverName: string;
  passengers: CarpoolPassenger[] | undefined;
  tripStatus: CarpoolTripStatus;
  onStartTrip: () => Promise<void>;
  onEndTrip: () => Promise<void>;
  onTripChanged?: () => void;
}

function formatUpdatedAgo(
  date: Date | undefined,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (!date) return t('carpool.live.waitingFix');
  const sec = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (sec < 15) return t('carpool.live.justNow');
  if (sec < 60) return t('carpool.live.secondsAgo', { n: sec });
  const min = Math.round(sec / 60);
  return t('carpool.live.minutesAgo', { n: min });
}

/** Panneau démarrer / suivre / terminer un trajet avec géoloc live. */
export const CarpoolLiveTripPanel: React.FC<CarpoolLiveTripPanelProps> = ({
  tripId,
  viewerUid,
  driverUid,
  driverName,
  passengers,
  tripStatus,
  onStartTrip,
  onEndTrip,
  onTripChanged,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const {
    busy,
    sharing,
    active,
    canView,
    canPublish,
    startTrip,
    endTrip,
    driverLocation,
    lastUpdatedAt,
  } = useCarpoolLiveTrip({
    tripId,
    viewerUid,
    driverUid,
    driverName,
    passengers,
    tripStatus,
    onStartTrip,
    onEndTrip,
    onTripChanged,
    t,
  });

  const isDriver = viewerUid === driverUid;
  const isConfirmedPassenger = confirmedPassengerUids(passengers).includes(viewerUid);
  const showStart = canStartCarpoolTrip({ viewerUid, driverUid, tripStatus });
  const showEnd = canEndCarpoolTrip({ viewerUid, driverUid, tripStatus });

  const markers: GeoMarker[] = useMemo(() => {
    if (!driverLocation) return [];
    return [
      {
        id: `driver-${driverUid}`,
        kind: 'user',
        title: driverName,
        subtitle: t('carpool.live.driverPin'),
        city: '',
        location: driverLocation,
        distanceKm: 0,
        tab: 'covoiturage',
        entityId: tripId,
      },
    ];
  }, [driverLocation, driverUid, driverName, t, tripId]);

  if (tripStatus === 'completed') {
    return (
      <View style={[styles.done, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
        <Icon name="checkmark-circle" size={16} color={colors.success} />
        <ProDayText variant="caption" muted style={styles.doneText}>
          {t('carpool.live.completed')}
        </ProDayText>
      </View>
    );
  }

  if (!isDriver && !isConfirmedPassenger) {
    return null;
  }

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Icon name="location" size={16} color={colors.accent} />
        <ProDayText variant="caption" accent style={styles.title}>
          {active ? t('carpool.live.activeTitle') : t('carpool.live.idleTitle')}
        </ProDayText>
      </View>

      {active && canView ? (
        driverLocation ? (
          <>
            <ProDayLiveMap
              center={driverLocation}
              radiusKm={1}
              markers={markers}
              height={180}
            />
            <ProDayText variant="caption" muted>
              {t('carpool.live.lastUpdate', { when: formatUpdatedAgo(lastUpdatedAt, t) })}
            </ProDayText>
            <PressableSpring
              onPress={() => openMapsAt(driverLocation, driverName)}
              scaleTo={0.96}
              haptic
            >
              <ProDayText variant="caption" accent style={styles.mapLink}>
                {formatCoordinates(driverLocation)} · {t('carpool.live.openMaps')}
              </ProDayText>
            </PressableSpring>
          </>
        ) : (
          <ProDayText variant="caption" muted>
            {t('carpool.live.waitingFix')}
          </ProDayText>
        )
      ) : null}

      {canPublish && sharing ? (
        <ProDayText variant="caption" muted>
          {t('carpool.live.sharingHint')}
        </ProDayText>
      ) : null}

      {showStart ? (
        <PressableSpring onPress={startTrip} disabled={busy} scaleTo={0.96} haptic>
          <ProDayGradient kind="cta" style={styles.cta}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ProDayText variant="caption" inverse style={styles.ctaText}>
                {t('carpool.live.startCta')}
              </ProDayText>
            )}
          </ProDayGradient>
        </PressableSpring>
      ) : null}

      {showEnd ? (
        <PressableSpring onPress={endTrip} disabled={busy} scaleTo={0.96} haptic>
          <View style={[styles.endBtn, { borderColor: colors.border }]}>
            {busy ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : (
              <ProDayText variant="caption" accent style={styles.ctaText}>
                {t('carpool.live.endCta')}
              </ProDayText>
            )}
          </View>
        </PressableSpring>
      ) : null}

      {!isDriver && !active ? (
        <ProDayText variant="caption" muted>
          {t('carpool.live.passengerIdle')}
        </ProDayText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { fontWeight: '800' },
  mapLink: { fontWeight: '700' },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  ctaText: { fontWeight: '800' },
  endBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  doneText: { fontWeight: '600' },
});
