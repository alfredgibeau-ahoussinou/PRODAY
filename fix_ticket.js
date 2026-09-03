const fs = require('fs');
let file = fs.readFileSync('src/components/carpool/CarpoolTripTicket.tsx', 'utf8');

const targetLocations = `<View style={styles.locations}>
          <View style={styles.locationRow}>
            <ProDayText style={[styles.time, { color: palette.ink }]}>{timeLabel?.split('-')[0]?.trim() || "10:00"}</ProDayText>
            <ProDayText style={[styles.address, { color: palette.ink }]} numberOfLines={1}>{from}</ProDayText>
          </View>
          <View style={[styles.locationRow, { marginTop: spacing.xl }]}>
            <ProDayText style={[styles.time, { color: palette.ink }]}>{timeLabel?.split('-')[1]?.trim() || "11:30"}</ProDayText>
            <ProDayText style={[styles.address, { color: palette.ink, fontWeight: '700' }]} numberOfLines={1}>{to}</ProDayText>
          </View>
        </View>`;

const newLocations = `<View style={styles.locations}>
          <View style={styles.locationRow}>
            <ProDayText style={[styles.time, { color: palette.ink }]} numberOfLines={1}>{timeLabel || "--:--"}</ProDayText>
            <ProDayText style={[styles.address, { color: palette.ink }]} numberOfLines={2}>{from}</ProDayText>
          </View>
          <View style={[styles.locationRow, { marginTop: spacing.lg }]}>
            <View style={styles.timePlaceholder} />
            <ProDayText style={[styles.address, { color: palette.ink, fontWeight: '700' }]} numberOfLines={2}>{to}</ProDayText>
          </View>
        </View>`;

file = file.replace(targetLocations, newLocations);

file = file.replace(/time: \{ fontSize: 16, fontWeight: '800', minWidth: 60, maxWidth: 80 \},/g, "time: { fontSize: 14, fontWeight: '800', width: 65, marginRight: 8 },\n  timePlaceholder: { width: 65, marginRight: 8 },");

// Re-add the meta info that I previously deleted, because it's important!
const targetHeader = `<View style={styles.header}>
        <ProDayText style={[styles.driverName, { color: palette.ink }]}>{driver}</ProDayText>`;

const newHeader = `<View style={styles.metaRow}>
        {meta && <ProDayText style={[styles.metaText, { color: palette.inkDim }]}>{meta}</ProDayText>}
      </View>
      <View style={styles.header}>
        <ProDayText style={[styles.driverName, { color: palette.ink }]}>{driver}</ProDayText>`;

file = file.replace(targetHeader, newHeader);

file = file.replace(/card: \{ padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.md \},/, `card: { padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.md },\n  metaRow: { marginBottom: spacing.sm },\n  metaText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },`);

fs.writeFileSync('src/components/carpool/CarpoolTripTicket.tsx', file);
