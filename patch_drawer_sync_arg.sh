#!/bin/bash

sed -i '' 's/onSyncStarted: () => void;/onSyncStarted: (teamName?: string) => void;/g' src/components/coach/FederationSyncDrawer.tsx
sed -i '' 's/onSyncStarted();/onSyncStarted(selectedTeam.name);/g' src/components/coach/FederationSyncDrawer.tsx

