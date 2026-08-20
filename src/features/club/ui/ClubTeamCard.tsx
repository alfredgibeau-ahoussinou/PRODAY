import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedEntrance } from '../../../components/motion';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { ClubText } from './clubUi';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import type { ClubTeamRow } from '../../../utils/clubStructureView';
import { formatTeamRowLabel } from '../../../utils/clubStructureView';
import { clubRadius, clubShadow, clubSpace } from '../theme/clubDesignSystem';

type Props = {
  row: ClubTeamRow;
  index?: number;
  logoUrl?: string | null;
  onPress: () => void;
};

/** Carte équipe — crest / kit stripe, même famille que les cartes joueur Club. */
export function ClubTeamCard({ row, index = 0, logoUrl, onPress }: Props) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const label = formatTeamRowLabel(row);
  const coachHint = row.coachNames.length
    ? `Coach : ${row.coachNames.join(', ')}`
    : 'Sans coach';

  return (
    <AnimatedEntrance kind="fadeUp" index={index} delayStep={40}>
      <PressableSpring onPress={onPress} scaleTo={0.97} haptic style={styles.press}>
        <LinearGradient
          colors={[tokens.elevated, tokens.headerWash]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.pitchWash} pointerEvents="none" />
          <View style={[styles.kitStripe, { backgroundColor: tokens.accent }]} />
          <View style={[styles.crestWrap, { borderColor: tokens.accentSoft }]}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="cover" />
            ) : (
              <View style={[styles.logo, styles.logoPh, { backgroundColor: tokens.accentSoft }]}>
                <Icon name="football" size={20} color={tokens.accent} />
              </View>
            )}
            <View style={[styles.crestCap, { backgroundColor: tokens.accent }]} />
          </View>
          <View style={styles.copy}>
            <ClubText variant="h3" numberOfLines={1}>
              {label}
            </ClubText>
            <ClubText variant="caption" muted numberOfLines={2}>
              {`${row.licensedCount} licencié(s) · ${coachHint}`}
            </ClubText>
          </View>
          <View style={[styles.chevron, { backgroundColor: tokens.accentSoft }]}>
            <Icon name="chevron-forward" size={16} color={tokens.accent} />
          </View>
        </LinearGradient>
      </PressableSpring>
    </AnimatedEntrance>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    press: { borderRadius: clubRadius.xl },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
      paddingVertical: clubSpace.md,
      paddingRight: clubSpace.md,
      paddingLeft: clubSpace.md + 4,
      borderRadius: clubRadius.xl,
      borderWidth: 1,
      borderColor: tokens.border,
      overflow: 'hidden',
      minHeight: 84,
      ...clubShadow.soft,
    },
    pitchWash: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: tokens.pitchSoft,
      opacity: 0.18,
    },
    kitStripe: {
      position: 'absolute',
      left: 0,
      top: 14,
      bottom: 14,
      width: 3,
      borderTopRightRadius: 2,
      borderBottomRightRadius: 2,
    },
    crestWrap: {
      width: 52,
      height: 60,
      borderRadius: clubRadius.md,
      borderTopLeftRadius: clubRadius.lg,
      borderTopRightRadius: clubRadius.lg,
      overflow: 'hidden',
      borderWidth: 1.5,
      backgroundColor: tokens.elevated,
    },
    crestCap: {
      position: 'absolute',
      top: 0,
      left: '24%',
      right: '24%',
      height: 4,
      borderBottomLeftRadius: 2,
      borderBottomRightRadius: 2,
    },
    logo: { width: '100%', height: '100%' },
    logoPh: { alignItems: 'center', justifyContent: 'center' },
    copy: { flex: 1, minWidth: 0, gap: 4 },
    chevron: {
      width: 34,
      height: 34,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
