import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, type AppStateStatus } from 'react-native';
import type { CarpoolLiveTripDoc } from '../models/CarpoolLiveTrip';
import type { CarpoolPassenger } from '../models/TeamEvent';
import type { CarpoolTripStatus } from '../models/CarpoolLiveTrip';
import { carpoolLiveTripService } from '../services/carpoolLiveTrip.service';
import {
  canPublishLiveLocation,
  canViewLiveLocation,
  isTripActive,
} from '../utils/carpoolLiveTrip';
import {
  watchTripLocation,
  type TripLocationWatchHandle,
} from '../utils/geoLocation';

interface UseCarpoolLiveTripArgs {
  tripId: string;
  viewerUid: string;
  driverUid: string;
  driverName: string;
  passengers: CarpoolPassenger[] | undefined;
  tripStatus: CarpoolTripStatus;
  /** Démarrer / terminer côté métier (offre ou événement). */
  onStartTrip: () => Promise<void>;
  onEndTrip: () => Promise<void>;
  onTripChanged?: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function useCarpoolLiveTrip({
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
}: UseCarpoolLiveTripArgs) {
  const [live, setLive] = useState<CarpoolLiveTripDoc | null>(null);
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);
  const watchRef = useRef<TripLocationWatchHandle | null>(null);
  const publishBusy = useRef(false);

  const canView = canViewLiveLocation({
    viewerUid,
    driverUid,
    passengers,
    tripStatus,
  });
  const canPublish = canPublishLiveLocation({
    viewerUid,
    driverUid,
    tripStatus,
  });
  const active = isTripActive(tripStatus);

  useEffect(() => {
    if (!canView && !canPublish) {
      setLive(null);
      return;
    }
    return carpoolLiveTripService.subscribe(tripId, setLive);
  }, [tripId, canView, canPublish]);

  const stopWatch = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
    setSharing(false);
  }, []);

  const publishSample = useCallback(
    async (sample: {
      latitude: number;
      longitude: number;
      heading?: number;
      accuracy_m?: number;
    }) => {
      if (publishBusy.current) return;
      publishBusy.current = true;
      try {
        await carpoolLiveTripService.publishLocation(tripId, driverUid, sample);
      } catch {
        /* ignore transient publish errors */
      } finally {
        publishBusy.current = false;
      }
    },
    [tripId, driverUid],
  );

  const startWatch = useCallback(async () => {
    stopWatch();
    try {
      const handle = await watchTripLocation((sample) => {
        void publishSample(sample);
      });
      watchRef.current = handle;
      setSharing(true);
    } catch (e) {
      Alert.alert(
        t('carpool.live.permissionTitle'),
        e instanceof Error ? e.message : t('carpool.live.permissionDenied'),
      );
      throw e;
    }
  }, [stopWatch, publishSample, t]);

  useEffect(() => {
    if (!canPublish) {
      stopWatch();
      return;
    }
    void startWatch().catch(() => {});

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active' && canPublish) {
        void startWatch().catch(() => {});
      } else {
        stopWatch();
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => {
      sub.remove();
      stopWatch();
    };
  }, [canPublish, startWatch, stopWatch]);

  const startTrip = useCallback(() => {
    Alert.alert(t('carpool.live.startTitle'), t('carpool.live.startBody', { name: driverName }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('carpool.live.startConfirm'),
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              await onStartTrip();
              onTripChanged?.();
            } catch (e) {
              Alert.alert(
                t('common.error'),
                e instanceof Error ? e.message : t('carpool.live.startFailed'),
              );
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  }, [driverName, onStartTrip, onTripChanged, t]);

  const endTrip = useCallback(() => {
    Alert.alert(t('carpool.live.endTitle'), t('carpool.live.endBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('carpool.live.endConfirm'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              stopWatch();
              await onEndTrip();
              onTripChanged?.();
            } catch (e) {
              Alert.alert(
                t('common.error'),
                e instanceof Error ? e.message : t('carpool.live.endFailed'),
              );
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  }, [onEndTrip, onTripChanged, stopWatch, t]);

  return {
    live,
    busy,
    sharing,
    active,
    canView,
    canPublish,
    startTrip,
    endTrip,
    driverLocation: live?.active ? live.location : undefined,
    lastUpdatedAt: live?.updated_at,
  };
}
