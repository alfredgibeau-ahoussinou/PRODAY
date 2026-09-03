#!/bin/bash

# Fix CarpoolTripTicket
sed -i '' 's/palette.foreground/palette.ink/g' src/components/carpool/CarpoolTripTicket.tsx
sed -i '' 's/palette.border/palette.lane/g' src/components/carpool/CarpoolTripTicket.tsx
sed -i '' 's/palette.accent/palette.signal/g' src/components/carpool/CarpoolTripTicket.tsx
sed -i '' 's/palette.card/palette.surface/g' src/components/carpool/CarpoolTripTicket.tsx

# Fix CarpoolHomeScreen
sed -i '' 's/palette.foregroundMuted/palette.inkMuted/g' src/components/carpool/CarpoolHomeScreen.tsx
sed -i '' 's/palette.foreground/palette.ink/g' src/components/carpool/CarpoolHomeScreen.tsx
sed -i '' 's/palette.border/palette.lane/g' src/components/carpool/CarpoolHomeScreen.tsx

