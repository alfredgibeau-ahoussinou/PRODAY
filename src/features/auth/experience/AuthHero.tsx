import React, { useMemo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
 * Photo football cinématique N&B + symbole or/blanc transparent + wordmark luxe + halo.
 */
export const AuthHero: React.FC<AuthHeroProps> = ({
  compact = false,
  showCopy = true,
  source = AUTH_HERO_SOURCE,
}) => {
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(compact), [compact]);
  const symbolSize = compact ? Math.min(54, width * 0.13) : Math.min(84, width * 0.12);

  return (
    <View style={styles.root} accessibilityRole="image" accessibilityLabel="ProDay">
      <Image source={source} style={styles.photo} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(7, 16, 12, 0.45)', 'rgba(7, 16, 12, 0.85)', '#07100C']}
        style={StyleSheet.absoluteFill}
      />
      {/* Halo lumineux gold */}
      <View style={styles.goldHalo} />

      <View style={styles.content}>
        <View style={styles.logoBlock}>
          <View style={styles.symbolWrapper}>
            <ProDaySymbol size={symbolSize} variant="master" tone="white" />
          </View>
          <View style={styles.wordmark}>
            <ProDayWordmark width={compact ? 120 : 164} onDark align="left" />
          </View>
        </View>
        {showCopy ? (
          <View style={styles.copy}>
            <View style={styles.kickerBadge}>
              <View style={styles.kickerDot} />
              <ProDayText variant="eyebrow" style={styles.kickerText}>
                PLATEFORME FOOTBALL 2026
              </ProDayText>
            </View>
            <ProDayText variant="title" style={styles.headline}>
              {AUTH_XP.headline}
            </ProDayText>
            <ProDayText variant="caption" style={styles.tagline}>
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
      minHeight: compact ? 175 : 300,
      backgroundColor: AUTH_XP.black,
      overflow: 'hidden',
      position: 'relative',
    },
    photo: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
      opacity: 0.55,
    },
    goldHalo: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: '#F5D04A',
      opacity: 0.12,
      top: -40,
      left: -20,
    },
    content: {
      flex: 1,
      justifyContent: compact ? 'flex-end' : 'space-between',
      paddingHorizontal: compact ? 22 : 36,
      paddingTop: compact ? 16 : 48,
      paddingBottom: compact ? 22 : 40,
      gap: compact ? 12 : 24,
    },
    logoBlock: {
      alignItems: 'flex-start',
      gap: compact ? 8 : 14,
    },
    symbolWrapper: {
      shadowColor: '#F5D04A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
    wordmark: {
      marginTop: 2,
    },
    copy: {
      gap: compact ? 4 : 8,
      maxWidth: 440,
    },
    kickerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(245, 208, 74, 0.12)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: 'rgba(245, 208, 74, 0.3)',
      marginBottom: 2,
    },
    kickerDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: '#F5D04A',
    },
    kickerText: {
      color: '#F5D04A',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.2,
    },
    headline: {
      color: '#FFFFFF',
      fontSize: compact ? 22 : 32,
      lineHeight: compact ? 28 : 38,
      letterSpacing: -0.5,
      fontWeight: '900',
    },
    tagline: {
      color: 'rgba(255, 255, 255, 0.65)',
      letterSpacing: 0.5,
      fontSize: compact ? 12 : 13,
      fontWeight: '600',
    },
  });
}
