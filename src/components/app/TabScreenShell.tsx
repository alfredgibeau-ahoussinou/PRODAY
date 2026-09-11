import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayScreenCanvas } from '../ui/ProDayScreenCanvas';
import { AuroraHeader } from '../aurora/AuroraHeader';
import { AppStatChips, type AppStatChip } from './AppStatChips';
import { ImmersiveAtmosphere } from '../poles/ImmersiveAtmosphere';
import type { ImmersivePitchMood } from '../poles/ImmersivePitchScene';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import {
  JoueurHudCorners,
  JoueurIdentityProvider,
} from '../player/joueurPortalUi';
import { JoueurWorldScene } from '../../features/joueur/JoueurWorldScene';
import { JoueurParticleField } from '../../features/joueur/JoueurGameFx';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { ProDayText } from '../ui/ProDayText';
import { spacing } from '../../theme/designTokens';
import { ScreenBackButton } from '../ui/ScreenBackButton';
import { useJoueurSecondaryTabBack } from '../../hooks/useJoueurSecondaryTabBack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';

export type TabScreenShellProps = {
  caption?: string;
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  stats?: AppStatChip[];
  flat?: boolean;
  immersive?: boolean;
  hideHeader?: boolean;
  atmosphere?: ImmersivePitchMood;
  joueurUniverse?: boolean;
  /** Masque la scène 2.5D décorative dans le header joueur (ex. onglet Matchs). */
  hideWorldScene?: boolean;
  children: React.ReactNode;
};

/** Enveloppe onglets — HUD arcade pôle joueur. */
export const TabScreenShell: React.FC<TabScreenShellProps> = ({
  caption,
  title,
  subtitle,
  left,
  right,
  stats,
  flat = false,
  immersive = false,
  hideHeader = false,
  atmosphere,
  joueurUniverse,
  hideWorldScene = true,
  children,
}) => {
  const session = useJoueurSession();
  const tabBack = useJoueurSecondaryTabBack();
  const joueurTheme = useJoueurTheme();
  const insets = useSafeAreaInsets();
  const useJoueur =
    joueurUniverse === true ||
    (joueurUniverse !== false &&
      Boolean(session?.isJoueurPlayer && session.ready && !session.needsGate));

  if (useJoueur && session) {
    const { identity, universeLabel } = session;
    const playerTheme = usePlayerThemeColors();
    const accent = joueurTheme.accent;
    const accentSoft = playerTheme.accentSoft ?? `${accent}22`;
    const headerLeft =
      left ?? (tabBack.showBack ? <ScreenBackButton onPress={tabBack.onBack} /> : null);

    return (
      <ProDayScreenCanvas flat immersive={false}>
        <JoueurIdentityProvider identity={identity}>
          <View style={[styles.root, { backgroundColor: joueurTheme.shellBg }]}>
            <LinearGradient
              colors={[PLAYER_DARK.bgElevated, PLAYER_DARK.bg, PLAYER_DARK.bg]}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <JoueurParticleField accent={accent} density={identity.density} />
            {!hideHeader ? (
              <View style={[styles.headPad, { paddingTop: spacing.xs }]}>
                {headerLeft ? <View style={styles.backRow}>{headerLeft}</View> : null}
                <View style={[styles.hudPlate, { borderColor: PLAYER_DARK.border }]}>
                  <View style={styles.hudTop}>
                    <View style={{ flex: 1, gap: 5 }}>
                      <View style={[styles.kickerBadge, { backgroundColor: accentSoft, borderColor: `${accent}33` }]}>
                        <View style={[styles.kickerDot, { backgroundColor: accent }]} />
                        <ProDayText
                          variant="caption"
                          style={[styles.kicker, { color: accent }]}
                          numberOfLines={1}
                        >
                          {(caption ?? universeLabel.short).toUpperCase()} · {identity.hudLabel}
                        </ProDayText>
                      </View>
                      <ProDayText variant="title" style={styles.title}>
                        {title}
                      </ProDayText>
                      {subtitle ? (
                        <ProDayText variant="caption" style={styles.sub}>
                          {subtitle}
                        </ProDayText>
                      ) : null}
                    </View>
                    <View style={{ width: hideWorldScene ? 0 : 88, overflow: 'hidden' }}>
                      {hideWorldScene ? null : (
                        <JoueurWorldScene
                          identity={identity}
                          compact
                          height={56}
                          showBanner={false}
                        />
                      )}
                    </View>
                  </View>
                  {stats && stats.length > 0 ? (
                    <View style={styles.stats}>
                      <AppStatChips items={stats} />
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}
            <View style={styles.body}>{children}</View>
          </View>
        </JoueurIdentityProvider>
      </ProDayScreenCanvas>
    );
  }

  return (
    <ProDayScreenCanvas
      flat={flat || Boolean(atmosphere) || hideHeader}
      immersive={immersive && !atmosphere}
    >
      <View style={styles.root}>
        {atmosphere ? <ImmersiveAtmosphere mood={atmosphere} /> : null}
        {!hideHeader ? (
          <AuroraHeader
            variant="sport"
            eyebrow={caption}
            title={title}
            subtitle={subtitle}
            left={left}
            right={right}
            footer={stats && stats.length > 0 ? <AppStatChips items={stats} /> : undefined}
          />
        ) : null}
        <View style={styles.body}>{children}</View>
      </View>
    </ProDayScreenCanvas>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, minHeight: 0, zIndex: 1 },
  headPad: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    zIndex: 2,
  },
  backRow: {
    marginBottom: spacing.xs,
    alignSelf: 'flex-start',
  },
  hudPlate: {
    borderWidth: 1,
    borderRadius: 20,
    backgroundColor: PLAYER_DARK.surfaceRaised,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md + 2,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  hudTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  kickerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  kickerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  kicker: {
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 9.5,
    fontWeight: '800',
  },
  title: {
    color: PLAYER_DARK.text,
    fontWeight: '900',
    letterSpacing: -0.4,
    fontSize: 22,
  },
  sub: {
    color: PLAYER_DARK.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  stats: { marginTop: 2 },
});
