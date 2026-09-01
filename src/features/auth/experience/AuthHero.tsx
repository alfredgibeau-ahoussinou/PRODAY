import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { ProDaySymbol } from '../../../components/branding/ProDaySymbol';
import { ProDayWordmark } from '../../../components/branding/ProDayWordmark';
import { AUTH_XP } from './tokens';

type AuthHeroProps = {
  compact?: boolean;
  showCopy?: boolean;
};

/**
 * Hero minimaliste épuré ProDay — symbole centré, wordmark et typographie sobre.
 */
export const AuthHero: React.FC<AuthHeroProps> = ({
  compact = false,
  showCopy = true,
}) => {
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(compact), [compact]);
  const symbolSize = compact ? Math.min(60, width * 0.15) : Math.min(84, width * 0.18);

  return (
    <View style={styles.root} accessibilityRole="image" accessibilityLabel="ProDay">
      <View style={styles.content}>
        <View style={styles.logoBlock}>
          <ProDaySymbol size={symbolSize} variant="master" tone="white" />
          <View style={styles.wordmark}>
            <ProDayWordmark width={compact ? 124 : 160} onDark align="center" />
          </View>
        </View>
        {showCopy ? (
          <View style={styles.copy}>
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
      backgroundColor: '#000000',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: compact ? 8 : 16,
      paddingBottom: compact ? 10 : 20,
    },
    content: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: compact ? 6 : 10,
    },
    logoBlock: {
      alignItems: 'center',
      gap: 8,
    },
    wordmark: {
      alignItems: 'center',
    },
    copy: {
      alignItems: 'center',
      marginTop: 2,
    },
    tagline: {
      color: 'rgba(255, 255, 255, 0.45)',
      letterSpacing: 1.2,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
  });
}
