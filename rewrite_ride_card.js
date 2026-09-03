const fs = require('fs');

let file = fs.readFileSync('src/components/carpool/CarpoolRideCard.tsx', 'utf8');

// I will just remove the if (compact) check and the entire non-compact render branch,
// and make it ALWAYS return CarpoolTripTicket.

const blockToReplaceRegex = /if \(compact\) \{[\s\S]*$/m;

const replacement = `
  const fullFooter = (
    <View style={styles.ticketActions}>
      {ticketActions}
      
      {!compact && (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {slot.meeting_location && (
            <PressableSpring
              onPress={() => openMapsAt(slot.meeting_location!, slot.meeting_place)}
              scaleTo={0.98}
            >
              <ProDayText variant="caption" accent style={cardStyles.mapLink}>
                📍 Voir le RDV ({slot.meeting_place?.trim() || 'GPS'}) sur Maps
              </ProDayText>
            </PressableSpring>
          )}

          {(slot.passengers?.length ?? 0) > 0 && (
            <View style={cardStyles.passengers}>
              <ProDayText variant="caption" muted>
                Passagers : {(slot.passengers ?? []).map((p) => p.name).join(', ')}
              </ProDayText>
            </View>
          )}

          {!isMine && tabNav && (
            <PressableSpring
              style={styles.ticketGhost}
              onPress={() => void handleContactDriver()}
              disabled={contactBusy}
            >
              {contactBusy ? <ActivityIndicator color={palette.signal} size="small" /> : (
                <>
                  <Icon name="chat" size={14} color={palette.signal} />
                  <ProDayText variant="caption" style={styles.ticketGhostText}>
                    {t('carpool.ride.contactDriver')}
                  </ProDayText>
                </>
              )}
            </PressableSpring>
          )}

          {canBook && !compact && (
             <CarpoolLocationCapture
               label={t('carpool.standalone.pickupPoint')}
               place={pickupPlace}
               location={pickupLocation}
               onPlaceChange={setPickupPlace}
               onLocationChange={setPickupLocation}
               disabled={busy}
               compact
             />
          )}
        </View>
      )}
    </View>
  );

  return (
    <CarpoolTripTicket
      meta={\`\${formatCalendarDate(event.starts_at)} · \${event.title}\`}
      metaRight={metaRight || null}
      from={fromLabel}
      to={toLabel}
      driver={slot.driver_name}
      seatsLabel={seatsLabel}
      timeLabel={slot.meeting_time ? \`Départ \${slot.meeting_time}\` : null}
      onPress={onOpenDetail}
      footer={fullFooter}
    />
  );
}

const cardStyles = StyleSheet.create({
  card: {},
  body: {},
  driverRow: {},
  avatar: {},
  driverCopy: {},
  seatsPill: {},
  seatsText: {},
  scorePill: {},
  etaRow: {},
  etaText: {},
  route: {},
  routeText: {},
  mapLink: { fontWeight: '700', marginTop: 2 },
  passengers: { gap: 2 },
  time: {},
  notes: {},
  actions: { marginTop: spacing.sm },
  primaryBtn: {},
  ghostBtn: {},
  btnText: {},
});

function createTicketStyles(palette: CarpoolUiPalette) {
  return StyleSheet.create({
    ticketActions: { gap: spacing.sm },
    ticketGhost: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1.5,
      borderColor: palette.fog,
      borderRadius: 999,
      backgroundColor: palette.surfaceMuted,
    },
    ticketGhostText: { fontWeight: '800', color: palette.ink },
    ticketCta: {
      alignSelf: 'stretch',
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: 999,
      backgroundColor: palette.signal,
    },
    ticketCtaText: { fontWeight: '800', color: palette.onSignal },
    bookButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    ticketDirectCta: {
      flex: 1.2,
      paddingVertical: 12,
    },
    directBtnContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
  });
}
`;

file = file.replace(blockToReplaceRegex, replacement);
fs.writeFileSync('src/components/carpool/CarpoolRideCard.tsx', file);
