import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PressableSpring } from '../motion';
import { spacing, radius } from '../../theme/designTokens';
import { Icon } from '../ui/Icon';
import { useCarpoolUi } from './CarpoolUiContext';
import { ProDayText } from '../ui/ProDayText';
import { CARPOOL_SITE } from '../../content/carpoolSite';

type Props = {
  meta: string;
  from: string;
  to: string;
  driver: string;
  seatsLabel?: string;
  timeLabel?: string | null;
  metaRight?: string | null;
  onPress?: () => void;
  footer?: React.ReactNode;
};

export function CarpoolTripTicket({
  meta,
  from,
  to,
  driver,
  seatsLabel,
  timeLabel,
  metaRight,
  onPress,
  footer,
}: Props) {
  const palette = useCarpoolUi();

  const driverInitial = (driver || '?').trim().charAt(0).toUpperCase();

  return (
    <PressableSpring
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: CARPOOL_SITE.surface,
          borderColor: CARPOOL_SITE.lane,
        },
      ]}
      scaleTo={0.98}
      haptic
    >
      {/* Top Meta Line */}
      <View style={styles.metaRow}>
        {meta ? (
          <ProDayText style={styles.metaText} numberOfLines={1}>
            {meta}
          </ProDayText>
        ) : null}
        {metaRight ? (
          <ProDayText style={[styles.metaRightText, { color: palette.signal }]} numberOfLines={1}>
            {metaRight}
          </ProDayText>
        ) : null}
      </View>

      {/* Driver & Seats Header */}
      <View style={styles.header}>
        <View style={styles.driverRow}>
          <View
            style={[
              styles.avatarOrb,
              {
                backgroundColor: `${palette.signal}18`,
                borderColor: `${palette.signal}35`,
              },
            ]}
          >
            <ProDayText style={[styles.avatarText, { color: palette.signal }]}>
              {driverInitial}
            </ProDayText>
          </View>
          <View style={styles.driverInfo}>
            <ProDayText style={styles.driverName} numberOfLines={1}>
              {driver}
            </ProDayText>
            <ProDayText style={styles.driverRole}>Conducteur</ProDayText>
          </View>
        </View>

        {seatsLabel ? (
          <View
            style={[
              styles.seatsBadge,
              {
                backgroundColor: `${palette.signal}18`,
                borderColor: `${palette.signal}35`,
              },
            ]}
          >
            <Icon name="person" size={13} color={palette.signal} />
            <ProDayText style={[styles.seatsText, { color: palette.signal }]}>
              {seatsLabel}
            </ProDayText>
          </View>
        ) : null}
      </View>

      {/* Route & Timeline */}
      <View style={styles.routeContainer}>
        <View style={styles.timeline}>
          <View style={[styles.dotOrigin, { borderColor: '#8B8B9A' }]} />
          <View style={styles.timelineLine} />
          <View
            style={[
              styles.dotDest,
              {
                borderColor: palette.signal,
                backgroundColor: palette.signal,
              },
            ]}
          />
        </View>

        <View style={styles.locations}>
          <View style={styles.locationRow}>
            {timeLabel ? (
              <View
                style={[
                  styles.timeBadge,
                  {
                    backgroundColor: '#1C1D26',
                    borderColor: '#2A2A38',
                  },
                ]}
              >
                <ProDayText style={[styles.timeText, { color: palette.signal }]}>
                  {timeLabel}
                </ProDayText>
              </View>
            ) : null}
            <ProDayText style={styles.addressOrigin} numberOfLines={2}>
              {from || 'Lieu de rendez-vous non précisé'}
            </ProDayText>
          </View>

          <View style={[styles.locationRow, { marginTop: 14 }]}>
            <ProDayText style={styles.addressDest} numberOfLines={2}>
              {to || 'Destination'}
            </ProDayText>
          </View>
        </View>
      </View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </PressableSpring>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8B8B9A',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    flex: 1,
  },
  metaRightText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginLeft: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarOrb: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '900',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  driverRole: {
    fontSize: 11,
    color: '#8B8B9A',
    fontWeight: '600',
    marginTop: 1,
  },
  seatsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: 5,
  },
  seatsText: {
    fontSize: 12,
    fontWeight: '800',
  },
  routeContainer: {
    flexDirection: 'row',
    backgroundColor: '#0F1015',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1C1D26',
  },
  timeline: {
    width: 16,
    alignItems: 'center',
    marginRight: 12,
    paddingVertical: 4,
  },
  dotOrigin: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 2,
    backgroundColor: '#000000',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#2A2A38',
    marginVertical: 4,
  },
  dotDest: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 2,
  },
  locations: {
    flex: 1,
    justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  addressOrigin: {
    flex: 1,
    fontSize: 13,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  addressDest: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  footer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
});

