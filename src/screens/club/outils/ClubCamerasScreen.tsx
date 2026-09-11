import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { ClubCamerasPanel } from '../../../components/club/ClubCamerasPanel';
import { useClubTheme } from '../../../features/club/shell/ClubThemeContext';
import { ClubBrandHeader } from '../../../features/club/ui/ClubBrandHeader';
import { ClubChapterScroll } from '../../../features/club/ui/clubUi';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { ProDayText } from '../../../components/ui/ProDayText';
import type { User } from '../../../models/User';
import { spacing } from '../../../theme/designTokens';

interface ClubCamerasScreenProps {
  profile: User;
  clubId: string;
  onBack: () => void;
}

/** Page plein écran Caméras & Vidéo — design moderne Obsidian Glass. */
export const ClubCamerasScreen: React.FC<ClubCamerasScreenProps> = ({
  profile,
  clubId,
  onBack,
}) => {
  const { tokens } = useClubTheme();

  return (
    <View style={[styles.root, { backgroundColor: tokens.bg }]}>
      <ClubChapterScroll>
        <PressableSpring onPress={onBack} scaleTo={0.97} haptic style={styles.back}>
          <Icon name="arrow-back" size={18} color={tokens.accent} />
          <ProDayText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
            Retour
          </ProDayText>
        </PressableSpring>
        <ClubBrandHeader
          title="Caméras & Vidéo"
          subtitle="Captation des séances, Veo, XbotGo & smartphones"
        />
        <View style={styles.panelWrap}>
          <ClubCamerasPanel profile={profile} clubId={clubId} />
        </View>
      </ClubChapterScroll>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
  },
  panelWrap: {
    paddingBottom: spacing.xl * 2,
  },
});

