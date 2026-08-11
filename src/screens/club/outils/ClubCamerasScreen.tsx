import React from 'react';
import { ScrollView, View } from 'react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { ClubCamerasPanel } from '../../../components/club/ClubCamerasPanel';
import { useThemedScreen } from '../../../hooks/useThemedScreen';
import type { User } from '../../../models/User';
import { spacing } from '../../../theme/designTokens';

interface ClubCamerasScreenProps {
  profile: User;
  clubId: string;
  onBack: () => void;
}

/** Page plein écran Caméras & Vidéo. */
export const ClubCamerasScreen: React.FC<ClubCamerasScreenProps> = ({
  profile,
  clubId,
  onBack,
}) => {
  const { rootStyle } = useThemedScreen();

  return (
    <View style={rootStyle}>
      <ScreenHeader title="Caméras & Vidéo" onBack={onBack} centered />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl * 2 }}>
        <ClubCamerasPanel profile={profile} clubId={clubId} />
      </ScrollView>
    </View>
  );
};
