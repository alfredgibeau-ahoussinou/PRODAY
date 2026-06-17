import React, { useState } from 'react';
import { useTranslation } from '../context/LocaleContext';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/ui/Icon';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDayGradient } from '../components/ui/ProDayGradient';
import { PressableSpring } from '../components/motion';
import type { ScreenTimeBlockReason } from '../utils/parentalScreenTime';
import type { ParentalSettings } from '../models/ParentalSettings';
import { parentalUnlockService } from '../services/parentalUnlock.service';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';

interface ParentalScreenTimeBlockedScreenProps {
  uid: string;
  parentalSettings?: ParentalSettings;
  minutesUsed: number;
  limitMinutes: number;
  reason?: ScreenTimeBlockReason;
  onSignOut: () => void;
  onUnlockRequested?: () => void;
}

export const ParentalScreenTimeBlockedScreen: React.FC<ParentalScreenTimeBlockedScreenProps> = ({
  uid,
  parentalSettings,
  minutesUsed,
  limitMinutes,
  reason,
  onSignOut,
  onUnlockRequested,
}) => {
  const { t } = useTranslation();
  const { colors: c, rootStyle } = useThemedScreen();
  const [busy, setBusy] = useState(false);
  const pending = parentalSettings?.unlock_request?.status === 'pending';

  const title = reason === 'off_day' ? t('parental.blocked.offDay.title') : t('parental.blocked.time.title');

  const body =
    reason === 'off_day'
      ? t('parental.blocked.offDay.body')
      : t('parental.blocked.time.bodyDetailed', { used: minutesUsed, limit: limitMinutes });

  const handleUnlockRequest = async () => {
    setBusy(true);
    try {
      await parentalUnlockService.requestUnlock(uid, parentalSettings);
      onUnlockRequested?.();
    } catch (e) {
      // Affichage minimal — l’écran reste bloqué.
      console.warn('[ParentalScreenTimeBlockedScreen]', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, rootStyle]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.content}>
        <View style={[styles.iconRing, { backgroundColor: c.brandSoft }]}>
          <Icon name="time" size={40} color={c.brand} />
        </View>
        <ProDayText variant="title" style={styles.title}>
          {title}
        </ProDayText>
        <ProDayText variant="body" muted style={styles.body}>
          {body}
        </ProDayText>

        {reason === 'limit_reached' ? (
          pending ? (
            <ProDaySurfaceMuted colors={c}>
              <ProDayText variant="caption" accent style={styles.pendingText}>
                {t('parental.blocked.pending')}
              </ProDayText>
            </ProDaySurfaceMuted>
          ) : (
            <PressableSpring onPress={() => void handleUnlockRequest()} scaleTo={0.97} haptic disabled={busy}>
              <ProDayGradient kind="cta" style={styles.cta}>
                <ProDayText variant="section" inverse style={styles.ctaText}>
                  {busy ? t('parental.blocked.sending') : t('parental.blocked.requestCta')}
                </ProDayText>
              </ProDayGradient>
            </PressableSpring>
          )
        ) : null}

        <PressableSpring onPress={onSignOut} scaleTo={0.97} haptic>
          <ProDayText variant="caption" muted style={styles.signOut}>
            {t('onboarding.signOut')}
          </ProDayText>
        </PressableSpring>
      </View>
    </SafeAreaView>
  );
};

function ProDaySurfaceMuted({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: { surfaceMuted: string; border: string };
}) {
  return (
    <View
      style={[
        styles.pendingBox,
        { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { textAlign: 'center' },
  body: { textAlign: 'center', lineHeight: 22 },
  cta: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  ctaText: { fontWeight: '800' },
  pendingBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pendingText: { textAlign: 'center', fontWeight: '700' },
  signOut: { marginTop: spacing.lg, textDecorationLine: 'underline' },
});
