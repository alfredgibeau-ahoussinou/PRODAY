import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProDayScreenCanvas } from '../components/ui/ProDayScreenCanvas';
import { PressableSpring, AnimatedEntrance } from '../components/motion';
import { Icon } from '../components/ui/Icon';
import { useAppTheme } from '../context/ProductLineContext';
import { brandForProductLine } from '../models/ProductLine';
import {
  getGuestProfileHeroCopy,
  getGuestProfileUnlockItems,
} from '../content/guestProfileExperience';
import { gradientsForLine } from '../theme/universeGradients';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';
import { spacing, radius, shadows } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';

const STICKY_HEIGHT = 56;

interface GuestProfileScreenProps {
  onLogin: () => void;
  onSignup: () => void;
}

export const GuestProfileScreen: React.FC<GuestProfileScreenProps> = ({
  onLogin,
  onSignup,
}) => {
  const insets = useSafeAreaInsets();
  const { productLine, colors: c } = useAppTheme();
  const brand = brandForProductLine(productLine);
  const unlockItems = useMemo(() => getGuestProfileUnlockItems(productLine), [productLine]);
  const heroCopy = useMemo(
    () => getGuestProfileHeroCopy(productLine, brand.name),
    [productLine, brand.name],
  );
  const stops = gradientsForLine(productLine);
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <ProDayScreenCanvas>
      <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + spacing.sm,
              paddingBottom: STICKY_HEIGHT + spacing.xl * 2,
            },
          ]}
        >
          <AnimatedEntrance index={0}>
            <View style={styles.heroCard}>
              <LinearGradient
                colors={[...stops.hero]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.heroScrim} />
              <View style={styles.avatarRing}>
                <Icon name="person" size={32} color="rgba(255,255,255,0.9)" />
              </View>
              <Text style={styles.heroTitle}>Mon profil</Text>
              <Text style={styles.heroSub}>{heroCopy}</Text>
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={1}>
            <Text style={styles.sectionLabel}>Connexion requise</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Connectez-vous pour accéder à votre compte. Vos données restent privées et
                synchronisées sur tous vos appareils.
              </Text>
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={2}>
            <Text style={styles.sectionLabel}>Ce que vous débloquez</Text>
            <View style={styles.steps}>
              {unlockItems.map((item) => (
                <View key={item.step} style={styles.stepRow}>
                  <View style={styles.stepIcon}>
                    <Icon name={item.icon} size={18} color={c.accent} variant="filled" />
                  </View>
                  <View style={styles.stepCopy}>
                    <Text style={styles.stepTitle}>
                      <Text style={styles.stepNum}>{item.step} · </Text>
                      {item.title}
                    </Text>
                    <Text style={styles.stepBody}>{item.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={3}>
            <PressableSpring onPress={onSignup} scaleTo={0.98} style={styles.linkRow}>
              <Text style={styles.linkText}>Pas encore de compte ?</Text>
              <Text style={styles.linkCta}>Créer un compte</Text>
              <Icon name="chevron-forward" size={16} color={c.accent} />
            </PressableSpring>
          </AnimatedEntrance>
        </ScrollView>

        <View style={styles.stickyDock}>
          <LinearGradient
            colors={['transparent', c.background]}
            style={styles.stickyFade}
            pointerEvents="none"
          />
          <View style={[styles.stickyBar, { backgroundColor: c.background, borderTopColor: c.border }]}>
            <PressableSpring
              onPress={onLogin}
              scaleTo={0.98}
              haptic
              style={[styles.stickyBtn, shadows.fab]}
            >
              <Text style={styles.stickyBtnText}>Se connecter à mon compte</Text>
              <Icon name="chevron-forward" size={18} color={c.brandInverse} />
            </PressableSpring>
          </View>
        </View>
      </View>
    </ProDayScreenCanvas>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    scroll: {
      paddingHorizontal: spacing.lg,
      gap: spacing.lg,
    },
    heroCard: {
      borderRadius: radius.xl + 4,
      overflow: 'hidden',
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 168,
      justifyContent: 'center',
    },
    heroScrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.22)',
    },
    avatarRing: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    heroTitle: {
      fontSize: 26,
      fontWeight: '900',
      color: '#fff',
      letterSpacing: -0.6,
    },
    heroSub: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.88)',
      textAlign: 'center',
      maxWidth: 300,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: c.textMuted,
      marginBottom: -spacing.sm,
    },
    infoCard: {
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderLeftWidth: 3,
      borderLeftColor: c.accent,
      ...shadows.soft,
    },
    infoText: {
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '500',
      color: c.textSecondary,
    },
    steps: {
      gap: spacing.sm,
    },
    stepRow: {
      flexDirection: 'row',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      ...shadows.soft,
    },
    stepIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepCopy: { flex: 1, gap: 4 },
    stepNum: {
      fontWeight: '900',
      color: c.accent,
    },
    stepTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.2,
    },
    stepBody: {
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '500',
      color: c.textSecondary,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
    },
    linkText: {
      fontSize: 14,
      fontWeight: '500',
      color: c.textSecondary,
    },
    linkCta: {
      fontSize: 14,
      fontWeight: '800',
      color: c.accent,
    },
    stickyDock: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: TAB_BAR_CONTENT_INSET - spacing.md,
    },
    stickyFade: {
      height: spacing.xl,
      marginBottom: -1,
    },
    stickyBar: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    stickyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: c.ink,
      borderRadius: radius.pill,
      paddingVertical: spacing.md + 2,
      minHeight: STICKY_HEIGHT,
    },
    stickyBtnText: {
      fontSize: 16,
      fontWeight: '800',
      color: c.brandInverse,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
