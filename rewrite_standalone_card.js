const fs = require('fs');

let file = fs.readFileSync('src/components/carpool/StandaloneCarpoolRideCard.tsx', 'utf8');

const blockToReplaceRegex = /if \(compact\) \{[\s\S]*$/m;

const replacement = `
  const fullFooter = (
    <View style={styles.ticketActions}>
      {ticketFooter}

      {!compact && (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {offer.meeting_location && (
            <PressableSpring
              onPress={() => openMapsAt(offer.meeting_location!, offer.meeting_place)}
              scaleTo={0.98}
            >
              <ProDayText variant="caption" accent style={cardStyles.mapLink}>
                📍 Voir le RDV ({offer.meeting_place?.trim() || 'GPS'}) sur Maps
              </ProDayText>
            </PressableSpring>
          )}

          {(offer.passengers?.length ?? 0) > 0 && (
            <View style={cardStyles.passengers}>
              <ProDayText variant="caption" muted>
                Passagers : {(offer.passengers ?? []).map((p) => p.name).join(', ')}
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
        </View>
      )}
    </View>
  );

  return (
    <CarpoolTripTicket
      meta={\`\${formatFrenchDepartureDate(offer.departs_at)}\${
        offer.meeting_time ? t('carpool.standalone.departure', { time: offer.meeting_time }) : ''
      }\`}
      metaRight={offer.club_only ? t('carpool.standalone.clubOnly') : t('carpool.standalone.freeTrip')}
      from={fromLabel}
      to={toLabel}
      driver={driverLabel}
      seatsLabel={seatsLabel}
      timeLabel={offer.meeting_time || null}
      footer={fullFooter}
    />
  );
}

const cardStyles = StyleSheet.create({
  card: {},
  inner: {},
  header: {},
  pillRow: {},
  typePill: {},
  typeText: {},
  freePill: {},
  freeText: {},
  seatsPill: {},
  seatsText: {},
  body: {},
  driverRow: {},
  avatar: {},
  driverCopy: {},
  actions: { marginTop: spacing.sm },
  ghostBtn: {},
  btnText: {},
  primaryBtn: {},
  routeGroup: {},
  routeRow: {},
  routeIcon: {},
  routeText: {},
  passengers: {},
  mapLink: { fontWeight: '700', marginTop: 2 },
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
fs.writeFileSync('src/components/carpool/StandaloneCarpoolRideCard.tsx', file);
