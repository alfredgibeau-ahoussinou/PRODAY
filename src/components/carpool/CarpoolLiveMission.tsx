import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View, Share, Alert } from 'react-native';
import type { CarpoolPassenger } from '../../models/TeamEvent';
import type { CarpoolTripStatus } from '../../models/CarpoolLiveTrip';
import type { GeoMarker } from '../../core/types/geo';
import type { GeoPoint } from '../../models/User';
import { useCarpoolLiveTrip } from '../../hooks/useCarpoolLiveTrip';
import { ProDayLiveMap } from '../geo/ProDayLiveMap';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { useCarpoolUi } from './CarpoolUiContext';
import { openMapsAt, formatCoordinates } from '../../utils/geoLocation';
import {
  canEndCarpoolTrip,
  canStartCarpoolTrip,
  confirmedPassengerUids,
} from '../../utils/carpoolLiveTrip';
import { spacing, radius } from '../../theme/designTokens';
import { prodayHaptics } from '../../utils/prodayHaptics';

interface CarpoolLiveMissionProps {
  tripId: string;
  viewerUid: string;
  driverUid: string;
  driverName: string;
  passengers: CarpoolPassenger[] | undefined;
  tripStatus: CarpoolTripStatus;
  title?: string;
  meetingPlace?: string;
  meetingLocation?: GeoPoint;
  destinationLabel?: string;
  destinationLocation?: GeoPoint;
  onStartTrip: () => Promise<void>;
  onEndTrip: () => Promise<void>;
  onTripChanged?: () => void;
  onContactDriver?: () => void;
  compact?: boolean;
}

const STEPS: CarpoolTripStatus[] = ['scheduled', 'in_progress', 'completed'];

/** Centre de mission live — carte large, timeline, actions conducteur/passager. */
export const CarpoolLiveMission: React.FC<CarpoolLiveMissionProps> = ({
  tripId,
  viewerUid,
  driverUid,
  driverName,
  passengers,
  tripStatus,
  title,
  meetingPlace,
  meetingLocation,
  destinationLabel,
  destinationLocation,
  onStartTrip,
  onEndTrip,
  onTripChanged,
  onContactDriver,
  compact = false,
}) => {
  const { colors } = useAppTheme();
  const palette = useCarpoolUi();
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
  const confirmed = confirmedPassengerUids(passengers);
  const showStart = canStartCarpoolTrip({ viewerUid, driverUid, tripStatus });
  const showEnd = canEndCarpoolTrip({ viewerUid, driverUid, tripStatus });
  const stepIndex = Math.max(0, STEPS.indexOf(tripStatus));

  const markers: GeoMarker[] = useMemo(() => {
    const list: GeoMarker[] = [];
    if (meetingLocation) {
      list.push({
        id: 'meeting',
        kind: 'field',
        title: t('carpool.hub.meetingPin'),
        subtitle: meetingPlace ?? '',
        city: '',
        location: meetingLocation,
        distanceKm: 0,
        tab: 'covoiturage',
        entityId: tripId,
      });
    }
    if (destinationLocation) {
      list.push({
        id: 'dest',
        kind: 'match',
        title: t('carpool.hub.destPin'),
        subtitle: destinationLabel ?? '',
        city: '',
        location: destinationLocation,
        distanceKm: 0,
        tab: 'covoiturage',
        entityId: tripId,
      });
    }
    if (driverLocation) {
      list.push({
        id: `driver-${driverUid}`,
        kind: 'user',
        title: driverName,
        subtitle: t('carpool.live.driverPin'),
        city: '',
        location: driverLocation,
        distanceKm: 0,
        tab: 'covoiturage',
        entityId: tripId,
      });
    }
    return list;
  }, [
    meetingLocation,
    meetingPlace,
    destinationLocation,
    destinationLabel,
    driverLocation,
    driverUid,
    driverName,
    t,
    tripId,
  ]);

  const mapCenter =
    driverLocation ?? meetingLocation ?? destinationLocation ?? undefined;

  const handleStart = async () => {
    prodayHaptics.confirm();
    await startTrip();
  };

  const handleEnd = async () => {
    prodayHaptics.confirm();
    await endTrip();
  };

  if (tripStatus === 'completed') {
    return (
      <View style={[styles.done, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
        <Icon name="checkmark-circle" size={18} color={colors.success} />
        <ProDayText variant="caption" muted style={{ fontWeight: '700' }}>
          {t('carpool.live.completed')}
        </ProDayText>
      </View>
    );
  }

  if (!isDriver && !confirmed.includes(viewerUid)) {
    return null;
  }

  return (
    <View
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        { borderColor: palette.fog, backgroundColor: palette.surface },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.liveBadge, { backgroundColor: active ? colors.accent : colors.surfaceMuted }]}>
          <View
            style={[
              styles.pulse,
              { backgroundColor: active ? '#000' : colors.textMuted },
            ]}
          />
          <ProDayText
            variant="caption"
            style={{ fontWeight: '900', color: active ? '#000' : colors.text }}
          >
            {active ? t('carpool.hub.liveNow') : t('carpool.hub.ready')}
          </ProDayText>
        </View>
        <ProDayText variant="section" style={styles.title} numberOfLines={1}>
          {title ?? t('carpool.live.activeTitle')}
        </ProDayText>
        <ProDayText variant="caption" muted>
          {isDriver ? t('carpool.hub.youDrive') : t('carpool.hub.youRide', { name: driverName })}
        </ProDayText>
      </View>

      <View style={styles.timeline}>
        {STEPS.map((step, i) => {
          const done = i <= stepIndex;
          return (
            <View key={step} style={styles.stepCol}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: done ? colors.accent : colors.surfaceMuted,
                    borderColor: done ? colors.accent : colors.border,
                  },
                ]}
              />
              <ProDayText variant="caption" muted={!done} style={styles.stepLabel}>
                {t(`carpool.hub.step.${step}`)}
              </ProDayText>
              {i < STEPS.length - 1 ? (
                <View
                  style={[
                    styles.stepLine,
                    { backgroundColor: i < stepIndex ? colors.accent : colors.border },
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.crew}>
        <ProDayText variant="caption" accent style={{ fontWeight: '800' }}>
          {t('carpool.hub.crew', { n: 1 + confirmed.length })}
        </ProDayText>
        <View style={styles.crewRow}>
          <View style={[styles.avatar, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}>
            <Icon name="car" size={14} color={colors.accent} />
          </View>
          {confirmed.map((uid) => (
            <View
              key={uid}
              style={[styles.avatar, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
            >
              <Icon name="person" size={14} color={colors.textMuted} />
            </View>
          ))}
        </View>
      </View>

      {mapCenter && (active || meetingLocation || destinationLocation) ? (
        <View style={styles.mapWrap}>
          <ProDayLiveMap
            center={mapCenter}
            radiusKm={active ? 1 : 5}
            markers={markers}
            height={compact ? 200 : 260}
          />
          {driverLocation ? (
            <PressableSpring
              onPress={() => openMapsAt(driverLocation, driverName)}
              scaleTo={0.97}
              style={[styles.mapAction, { backgroundColor: palette.surfaceMuted }]}
            >
              <Icon name="location" size={14} color={colors.accent} />
              <ProDayText variant="caption" accent style={{ fontWeight: '800' }}>
                {formatCoordinates(driverLocation)} · {t('carpool.live.openMaps')}
              </ProDayText>
            </PressableSpring>
          ) : null}
        </View>
      ) : active && canView ? (
        <ProDayText variant="caption" muted>
          {t('carpool.live.waitingFix')}
        </ProDayText>
      ) : null}

      {canPublish && sharing ? (
        <ProDayText variant="caption" muted>
          {t('carpool.live.sharingHint')}
        </ProDayText>
      ) : null}

      {lastUpdatedAt && active ? (
        <ProDayText variant="caption" muted>
          {t('carpool.live.lastUpdate', {
            when: Math.max(0, Math.round((Date.now() - lastUpdatedAt.getTime()) / 1000)) < 20
              ? t('carpool.live.justNow')
              : t('carpool.live.secondsAgo', {
                  n: Math.max(0, Math.round((Date.now() - lastUpdatedAt.getTime()) / 1000)),
                }),
          })}
        </ProDayText>
      ) : null}

      <View style={styles.actions}>
        {showStart ? (
          <PressableSpring onPress={() => void handleStart()} disabled={busy} scaleTo={0.97} haptic>
            <ProDayGradient kind="cta" style={styles.cta}>
              {busy ? (
                <ActivityIndicator color={palette.onSignal} />
              ) : (
                <>
                  <Icon name="car" size={16} color={palette.onSignal} />
                  <ProDayText variant="caption" inverse style={styles.ctaText}>
                    {t('carpool.live.startCta')}
                  </ProDayText>
                </>
              )}
            </ProDayGradient>
          </PressableSpring>
        ) : null}

        {showEnd ? (
          <PressableSpring onPress={() => void handleEnd()} disabled={busy} scaleTo={0.97} haptic>
            <View style={[styles.endBtn, { borderColor: colors.accent }]}>
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

        <PressableSpring
          onPress={async () => {
            try {
              await Share.share({
                title: 'Statut Covoiturage ProDay',
                message: `Je suis bien arrivé(e) à destination (${destinationLabel || 'au stade / complexe'}) pour le match/entraînement avec ProDay Covoiturage !`,
              });
            } catch {
              Alert.alert('Info', 'Message de statut partagé.');
            }
          }}
          scaleTo={0.97}
          haptic
        >
          <View style={[styles.arrivedBtn, { borderColor: `${colors.accent}66`, backgroundColor: colors.accentSoft }]}>
            <Icon name="checkmark-circle" size={14} color={colors.accent} />
            <ProDayText variant="caption" accent style={styles.ctaText}>
              Prévenir : « Je suis bien arrivé »
            </ProDayText>
          </View>
        </PressableSpring>

        {onContactDriver && !isDriver ? (
          <PressableSpring onPress={onContactDriver} scaleTo={0.97} haptic>
            <View style={[styles.secondary, { borderColor: colors.border }]}>
              <Icon name="chat" size={14} color={colors.accent} />
              <ProDayText variant="caption" accent style={styles.ctaText}>
                {t('carpool.ride.contactDriver')}
              </ProDayText>
            </View>
          </PressableSpring>
        ) : null}
      </View>

      {!isDriver && !active ? (
        <ProDayText variant="caption" muted style={{ textAlign: 'center' }}>
          {t('carpool.live.passengerIdle')}
        </ProDayText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  wrapCompact: { padding: spacing.sm },
  header: { gap: 4 },
  liveBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  pulse: { width: 7, height: 7, borderRadius: 4 },
  title: { fontWeight: '900' },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
    paddingHorizontal: spacing.xs,
  },
  stepCol: { flex: 1, alignItems: 'center', gap: 4 },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    zIndex: 1,
  },
  stepLine: {
    position: 'absolute',
    top: 5,
    left: '55%',
    right: '-45%',
    height: 2,
  },
  stepLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  crew: { gap: spacing.xs },
  crewRow: { flexDirection: 'row', gap: spacing.xs },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapWrap: { gap: spacing.xs, borderRadius: radius.lg, overflow: 'hidden' },
  mapAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  actions: { gap: spacing.sm },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
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
  arrivedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
});
