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
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { ProDayText } from '../ui/ProDayText';
import { spacing } from '../../theme/designTokens';

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
  children,
}) => {
  const session = useJoueurSession();
  const useJoueur =
    joueurUniverse === true ||
    (joueurUniverse !== false &&
      Boolean(session?.isJoueurPlayer && session.ready && !session.needsGate));

  if (useJoueur && session) {
    const { identity, universeLabel } = session;

    return (
      <ProDayScreenCanvas flat immersive={false}>
        <JoueurIdentityProvider identity={identity}>
          <View style={[styles.root, { backgroundColor: PLAYER_DARK.bg }]}>
            <LinearGradient
              colors={[PLAYER_DARK.bgElevated, PLAYER_DARK.bg, PLAYER_DARK.bg]}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <JoueurParticleField accent={identity.accent} density={identity.density} />
            <View style={[styles.accentBar, { backgroundColor: identity.accent }]} />
            {!hideHeader ? (
              <View style={styles.headPad}>
                <View style={[styles.hudPlate, { borderColor: identity.accent }]}>
                  <JoueurHudCorners color={identity.accent} size={12} thickness={2} />
                  <View style={styles.hudTop}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <ProDayText
                        variant="caption"
                        style={[styles.kicker, { color: identity.accent }]}
                      >
                        ▶ {(caption ?? universeLabel.short).toUpperCase()} ·{' '}
                        {identity.hudLabel}
                      </ProDayText>
                      <ProDayText variant="title" style={styles.title}>
                        {title.toUpperCase()}
                      </ProDayText>
                      {subtitle ? (
                        <ProDayText variant="caption" style={styles.sub}>
                          {subtitle}
                        </ProDayText>
                      ) : null}
                    </View>
                    <View style={{ width: 88 }}>
                      <JoueurWorldScene
                        identity={identity}
                        compact
                        height={56}
                        showBanner={false}
                      />
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
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 3,
  },
  headPad: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    zIndex: 2,
  },
  hudPlate: {
    borderWidth: 1.5,
    borderRadius: 22,
    backgroundColor: PLAYER_DARK.surface,
    padding: spacing.md,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  hudTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  kicker: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 9,
    fontWeight: '900',
  },
  title: {
    color: PLAYER_DARK.text,
    fontWeight: '900',
    letterSpacing: 0.4,
    fontSize: 20,
  },
  sub: { color: PLAYER_DARK.textMuted, lineHeight: 17 },
  stats: { marginTop: 2 },
});
