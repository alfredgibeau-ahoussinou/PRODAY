#!/bin/bash

# We just need to add the missing properties to createTicketStyles in StandaloneCarpoolRideCard.tsx
sed -i '' '/ticketGhost:/i\
    mineBlock: { padding: spacing.md, backgroundColor: palette.surfaceMuted, borderRadius: radius.md, marginBottom: spacing.sm },\
    ticketPassengerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs },\
    ticketAccept: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: palette.signal },\
' src/components/carpool/StandaloneCarpoolRideCard.tsx

