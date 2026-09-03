#!/bin/bash

# Fix tokens
sed -i '' 's/tokens.foregroundMuted/tokens.muted/g' src/components/coach/FederationSyncDrawer.tsx
sed -i '' 's/tokens.background/tokens.bg/g' src/components/coach/FederationSyncDrawer.tsx
sed -i '' 's/tokens.foregroundMuted/tokens.muted/g' src/components/coach/CoachPlanningChapter.tsx

# Fix Icons
sed -i '' 's/name="x"/name="close"/g' src/components/coach/FederationSyncDrawer.tsx
sed -i '' 's/name="check-circle"/name="checkmark-circle"/g' src/components/coach/FederationSyncDrawer.tsx
sed -i '' 's/name="chevron-right"/name="chevron-forward"/g' src/components/coach/CoachPlanningChapter.tsx

# Fix PressableSpring children
sed -i '' 's/<PressableSpring style={StyleSheet.absoluteFill} onPress={onClose} \/>/<PressableSpring style={StyleSheet.absoluteFill} onPress={onClose}><View \/><\/PressableSpring>/g' src/components/coach/FederationSyncDrawer.tsx

