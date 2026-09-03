#!/bin/bash

# Insert imports
sed -i '' '/import { CoachTeamSwitcher/i\
import { FederationSyncDrawer } from "./planning/FederationSyncDrawer";\
import { federationService } from "../../services/federation.service";\
import { ActivityIndicator } from "react-native";
' src/components/coach/CoachPlanningChapter.tsx

# Insert state
sed -i '' '/const \[remindingRsvp, setRemindingRsvp\] = useState(false);/a\
  const [syncDrawerVisible, setSyncDrawerVisible] = useState(false);\
  const [isSyncing, setIsSyncing] = useState(false);
' src/components/coach/CoachPlanningChapter.tsx

