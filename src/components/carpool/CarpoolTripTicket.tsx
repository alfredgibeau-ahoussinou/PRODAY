import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PressableSpring } from '../motion';
import { spacing, radius } from '../../theme/designTokens';
import { Icon } from '../ui/Icon';
import { useCarpoolThemedStyles, useCarpoolUi } from './CarpoolUiContext';
import { ProDayText } from '../ui/ProDayText';

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

export function CarpoolTripTicket({ meta, from, to, driver, seatsLabel, timeLabel, metaRight, onPress, footer }: Props) {
  const palette = useCarpoolUi();
  
  return (
    <PressableSpring onPress={onPress} style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.lane }]}>
      <View style={styles.header}>
        <ProDayText style={[styles.driverName, { color: palette.ink }]}>{driver}</ProDayText>
        {seatsLabel && (
          <View style={[styles.seatsBadge, { backgroundColor: palette.surface }]}>
            <Icon name="person" size={14} color={palette.ink} />
            <ProDayText style={[styles.seatsText, { color: palette.ink }]}>{seatsLabel}</ProDayText>
          </View>
        )}
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.timeline}>
          <View style={[styles.dot, { borderColor: palette.ink }]} />
          <View style={[styles.line, { backgroundColor: palette.lane }]} />
          <View style={[styles.dot, { borderColor: palette.signal, backgroundColor: palette.signal }]} />
        </View>
        
        <View style={styles.locations}>
          <View style={styles.locationRow}>
            <ProDayText style={[styles.time, { color: palette.ink }]}>{timeLabel?.split('-')[0]?.trim() || "10:00"}</ProDayText>
            <ProDayText style={[styles.address, { color: palette.ink }]} numberOfLines={1}>{from}</ProDayText>
          </View>
          <View style={[styles.locationRow, { marginTop: spacing.xl }]}>
            <ProDayText style={[styles.time, { color: palette.ink }]}>{timeLabel?.split('-')[1]?.trim() || "11:30"}</ProDayText>
            <ProDayText style={[styles.address, { color: palette.ink, fontWeight: '700' }]} numberOfLines={1}>{to}</ProDayText>
          </View>
        </View>
      </View>
      
      {footer && <View style={[styles.footer, { borderTopColor: palette.lane }]}>{footer}</View>}
    </PressableSpring>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  driverName: { fontSize: 16, fontWeight: '800' },
  seatsBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, gap: 4 },
  seatsText: { fontSize: 12, fontWeight: '700' },
  routeContainer: { flexDirection: 'row', marginBottom: spacing.sm },
  timeline: { width: 20, alignItems: 'center', marginRight: spacing.md, paddingVertical: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  line: { width: 2, flex: 1, marginVertical: 4 },
  locations: { flex: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  time: { fontSize: 16, fontWeight: '800', width: 50 },
  address: { flex: 1, fontSize: 16 },
  footer: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1 },
});
