import React, { useMemo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { ProDayOfficialLockup } from '../../../components/branding/ProDayOfficialLockup';
import { AUTH_XP, AUTH_HERO_SOURCE } from './tokens';

type AuthHeroProps = {
  /** Compact mobile hero vs full brand panel. */
  compact?: boolean;
  showCopy?: boolean;
  source?: ImageSourcePropType;
};

/**
 * Photo football cinématique N&B + lockup officiel PRODAY + accroche éditoriale.
 */
export const AuthHero: React.FC<AuthHeroProps> = ({
  compact = false,
  showCopy = true,
  source = AUTH_HERO_SOURCE,
}) => {
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(compact), [compact]);
  const lockupWidth = compact ? Math.min(132, width * 0.36) : Math.min(200, width * 0.28);

  return (
    <View style={styles.root} accessibilityRole="image" accessibilityLabel="ProDay">
      <Image source={source} style={styles.photo} resizeMode="cover" />
      <View style={styles.scrim} />
      <View style={styles.content}>
        <View style={styles.logoBlock}>
          <ProDayOfficialLockup width={lockupWidth} />
        </View>
        {showCopy ? (
          <View style={styles.copy}>
            <ProDayText variant="title" style={styles.headline}>
              {AUTH_XP.headline}
            </ProDayText>
          </View>
        ) : null}
      </View>
    </View>
  );
};

function createStyles(compact: boolean) {
  return StyleSheet.create({
    root: {
      flex: 1,
      minHeight: compact ? 200 : 300,
      backgroundColor: AUTH_XP.black,
      overflow: 'hidden',
    },
    photo: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: compact ? AUTH_XP.overlayHeavy : AUTH_XP.overlay,
    },
    content: {
      flex: 1,
      justifyContent: compact ? 'flex-end' : 'space-between',
      paddingHorizontal: compact ? 20 : 36,
      paddingTop: compact ? 12 : 48,
      paddingBottom: compact ? 20 : 40,
      gap: compact ? 12 : 28,
    },
    logoBlock: {
      alignItems: 'flex-start',
    },
    copy: {
      gap: compact ? 6 : 10,
      maxWidth: 420,
    },
    headline: {
      color: AUTH_XP.white,
      fontSize: compact ? 22 : 34,
      lineHeight: compact ? 28 : 40,
      letterSpacing: -0.4,
    },
  });
}
