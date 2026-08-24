import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProDayLogo, brandVariantForProductLine } from '../branding/ProDayLogo';
import { ProDayOfficialLockup } from '../branding/ProDayOfficialLockup';
import { spacing } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import { brandForAuthContext, isSponsorAuthPreset } from '../../utils/authBrandContext';
import type { AppColors } from '../../theme/universeTheme';

interface AuthBrandHeaderProps {
  width?: number;
  /** Clair (#F7F7F7 / blanc) ou bandeau sombre (pitch legacy) */
  tone?: 'light' | 'dark';
  /**
   * Tagline en texte natif — désactivé par défaut.
   */
  showTagline?: boolean;
  /**
   * Force master (avant choix pôle). Sinon dérive du contexte auth.
   */
  forceMaster?: boolean;
}

/**
 * Logo ProDay auth — master avant choix pôle ; accent pôle après.
 */
export const AuthBrandHeader: React.FC<AuthBrandHeaderProps> = ({
  width = 220,
  tone = 'dark',
  showTagline = false,
  forceMaster = false,
}) => {
  const { productLine, colors: c, proSignupPresetRole } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const isLight = tone === 'light';
  const isSponsor = isSponsorAuthPreset(proSignupPresetRole);
  const brand = brandForAuthContext(productLine, proSignupPresetRole);

  const hasPoleChoice =
    forceMaster
      ? false
      : Boolean(
          isSponsor ||
            proSignupPresetRole ||
            (productLine &&
              productLine !== 'amateur' &&
              productLine !== 'homme'),
        );

  const variant = hasPoleChoice
    ? brandVariantForProductLine(productLine, {
        sponsor: isSponsor,
        role: proSignupPresetRole,
      })
    : 'master';

  return (
    <View style={styles.wrap}>
      <View style={styles.logoSlot}>
        {variant === 'master' && !isLight ? (
          <ProDayOfficialLockup width={Math.min(width, 220)} />
        ) : (
          <ProDayLogo
            width={width}
            variant={variant}
            onDark={!isLight}
            layout="stacked"
            showPoleLabel={variant !== 'master'}
          />
        )}
      </View>
      {showTagline && variant !== 'master' ? (
        <Text
          style={[styles.tagline, !isLight && styles.taglineDark]}
          accessibilityRole="text"
        >
          {brand.tagline}
        </Text>
      ) : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      width: '100%',
      paddingVertical: spacing.sm,
    },
    logoSlot: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    tagline: {
      marginTop: spacing.sm,
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: c.textMuted,
      textAlign: 'center',
    },
    taglineDark: {
      color: c.heroMuted,
      letterSpacing: 2.2,
      fontSize: 10,
      marginTop: spacing.md,
    },
  });
}
