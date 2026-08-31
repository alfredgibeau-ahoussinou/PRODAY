import React, { useMemo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { ProDaySymbol } from '../../../components/branding/ProDaySymbol';
import { ProDayWordmark } from '../../../components/branding/ProDayWordmark';
import { AUTH_XP, AUTH_HERO_SOURCE } from './tokens';

type AuthHeroProps = {
  /** Compact mobile hero vs full brand panel. */
  compact?: boolean;
  showCopy?: boolean;
  source?: ImageSourcePropType;
};

/**
 * Photo football cinématique N&B + symbole blanc transparent + wordmark.
 * Pas de lockup splash/icon (fond noir carré opaque).
 */
export const AuthHero: React.FC<AuthHeroProps> = ({
  compact = false,
  showCopy = true,
  source = AUTH_HERO_SOURCE,
}) => {
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(compact), [compact]);
  const symbolSize = compact ? Math.min(56, width * 0.14) : Math.min(88, width * 0.12);

  return (
    <View style={styles.root} accessibilityRole="image" accessibilityLabel="ProDay">
      <Image source={source} style={styles.photo} resizeMode="cover" />
      <View style={styles.scrim} />
      <View style={styles.content}>
        <View style={styles.logoBlock}>
          <ProDaySymbol size={symbolSize} variant="master" tone="white" />
          <View style={styles.wordmark}>
            <ProDayWordmark width={compact ? 120 : 168} onDark align="left" />
          </View>
        </View>
        {showCopy ? (
          <View style={styles.copy}>
            <ProDayText variant="title" style={styles.headline}>
              {AUTH_XP.headline}
            </ProDayText>
            <ProDayText variant="eyebrow" style={styles.tagline}>
              {AUTH_XP.taglineDisplay}
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
      minHeight: compact ? 168 : 280,
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
      gap: compact ? 10 : 16,
    },
    wordmark: {
      marginTop: 2,
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
    tagline: {
      color: AUTH_XP.goldBright,
      letterSpacing: 1.6,
      fontSize: compact ? 10 : 11,
    },
  });
}
