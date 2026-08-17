import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PressableSpring, AnimatedEntrance } from '../motion';
import { CARPOOL_SITE } from '../../content/carpoolSite';
import { spacing } from '../../theme/designTokens';
import { Icon } from '../ui/Icon';
import {
  type CarpoolUiPalette,
  useCarpoolThemedStyles,
  useCarpoolUi,
} from './CarpoolUiContext';

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

/** Ticket tactile — spring press, rail animé, CTA zone claire. */
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
  const styles = useCarpoolThemedStyles(createStyles);

  const body = (
    <View style={styles.ticket}>
      <View style={styles.stub}>
        <Icon name="car" size={16} color={palette.onSignal} variant="filled" />
      </View>

      <View style={styles.main}>
        <View style={styles.metaRow}>
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
          {metaRight ? (
            <Text style={styles.metaRight} numberOfLines={1}>
              {metaRight}
            </Text>
          ) : null}
        </View>

        <View style={styles.itinerary}>
          <View style={styles.rail}>
            <View style={styles.node} />
            <View style={styles.railLine} />
            <View style={[styles.node, styles.nodeEnd]} />
          </View>
          <View style={styles.stops}>
            <View>
              <Text style={styles.stopKicker}>DÉPART</Text>
              <Text style={styles.stop} numberOfLines={2}>
                {from}
              </Text>
            </View>
            <View>
              <Text style={styles.stopKicker}>ARRIVÉE</Text>
              <Text style={styles.stop} numberOfLines={2}>
                {to}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.driverRow}>
            <View style={styles.avatar}>
              <Icon name="person" size={12} color={palette.signalDeep} />
            </View>
            <Text style={styles.driver} numberOfLines={1}>
              {driver}
            </Text>
          </View>
          <View style={styles.tags}>
            {timeLabel ? <Text style={styles.tag}>{timeLabel}</Text> : null}
            {seatsLabel ? (
              <View style={styles.seatsPill}>
                <Text style={styles.seats}>{seatsLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {footer ? <View style={styles.actions}>{footer}</View> : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <AnimatedEntrance kind="fadeUp">
        <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={styles.wrap}>
          {body}
        </PressableSpring>
      </AnimatedEntrance>
    );
  }

  return (
    <AnimatedEntrance kind="fadeUp">
      <View style={styles.wrap}>{body}</View>
    </AnimatedEntrance>
  );
}

function createStyles(palette: CarpoolUiPalette) {
  return StyleSheet.create({
    wrap: { marginBottom: spacing.md },
    ticket: {
      flexDirection: 'row',
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.fog,
      borderRadius: 18,
      overflow: 'hidden',
      shadowColor: '#0B1220',
      shadowOpacity: 0.07,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    stub: {
      width: 40,
      backgroundColor: palette.signal,
      alignItems: 'center',
      justifyContent: 'center',
    },
    main: {
      flex: 1,
      padding: spacing.md,
      gap: spacing.sm,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    meta: {
      flex: 1,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: palette.inkDim,
    },
    metaRight: {
      fontSize: 11,
      fontWeight: '800',
      color: palette.signalDeep,
    },
    itinerary: { flexDirection: 'row', gap: 12 },
    rail: {
      width: 12,
      alignItems: 'center',
      paddingTop: 4,
      paddingBottom: 4,
    },
    node: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: palette.signal,
      backgroundColor: palette.surface,
    },
    nodeEnd: {
      backgroundColor: palette.signal,
    },
    railLine: {
      flex: 1,
      width: 2,
      marginVertical: 4,
      backgroundColor: palette.lane,
    },
    stops: { flex: 1, gap: 12 },
    stopKicker: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
      color: palette.inkDim,
      marginBottom: 2,
    },
    stop: {
      fontFamily: CARPOOL_SITE.display,
      fontSize: 16,
      lineHeight: 20,
      color: palette.ink,
      fontWeight: '800',
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: palette.fog,
    },
    driverRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    avatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.signalSoft,
    },
    driver: {
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      color: palette.inkMuted,
    },
    tags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tag: {
      fontSize: 12,
      fontWeight: '800',
      color: palette.ink,
    },
    seatsPill: {
      backgroundColor: palette.signal,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    seats: {
      fontSize: 11,
      fontWeight: '900',
      color: palette.onSignal,
    },
    actions: { gap: spacing.sm, marginTop: 4 },
  });
}
