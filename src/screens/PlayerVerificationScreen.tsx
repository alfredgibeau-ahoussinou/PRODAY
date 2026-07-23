import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { User, PlayerVerificationCheckId } from '../models/User';
import { playerVerificationProgress } from '../models/User';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { profileService } from '../services/profile.service';
import { ProDayErrorBanner } from '../components/ui/ProDayErrorBanner';
import { pickVerificationFromGallery, pickVerificationPdf } from '../utils/pickVerificationDocument';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';
import { useTranslation } from '../context/LocaleContext';

interface PlayerVerificationScreenProps {
  user: User;
  onBack: () => void;
  onUpdated: () => Promise<void>;
  /** Intégré dans l’écran profil (sans en-tête séparé). */
  embedded?: boolean;
}

export const PlayerVerificationScreen: React.FC<PlayerVerificationScreenProps> = ({
  user,
  onBack,
  onUpdated,
  embedded = false,
}) => {
  const { t } = useTranslation();
  const { colors: c, productLine, isWoman, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  
  const [loading, setLoading] = useState<PlayerVerificationCheckId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pv = user.player_verification;
  const progress = playerVerificationProgress(pv);

  const checks = useMemo(
    () =>
      [
        {
          id: 'identity' as const,
          title: t('verification.check.identity.title'),
          subtitle: t('verification.check.identity.subtitle'),
        },
        {
          id: 'club_license' as const,
          title: t('verification.check.license.title'),
          subtitle: t('verification.check.license.subtitle'),
        },
      ],
    [t]
  );

  const pick = async (checkId: PlayerVerificationCheckId, source: 'gallery' | 'pdf') => {
    const file =
      source === 'pdf'
        ? await pickVerificationPdf()
        : await pickVerificationFromGallery();
    if (!file) return;

    setLoading(checkId);
    setError(null);
    try {
      const upload = await profileService.uploadPlayerVerificationCheck(
        user.uid,
        { uri: file.uri, mimeType: file.mimeType },
        checkId
      );
      if (!upload.success) throw new Error(upload.error);
      await onUpdated();
      Alert.alert(t('verification.alert.sent.title'), t('verification.alert.sent.body'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('verification.upload.failed'));
    } finally {
      setLoading(null);
    }
  };

  const statusLabel = (checkId: PlayerVerificationCheckId) => {
    const s = pv?.[checkId]?.status ?? 'not_submitted';
    if (s === 'verified') return t('verification.status.verified');
    if (s === 'pending') return t('verification.status.pending');
    if (s === 'rejected') return t('verification.status.rejected');
    return t('verification.status.todo');
  };

  return (
    <View style={[styles.root, rootStyle]}>
      {!embedded ? (
        <ScreenHeader
          title={isWoman ? t('verification.title.player.woman') : t('verification.title.player')}
          onBack={onBack}
          centered
        />
      ) : null}
      <View style={styles.body}>
        <Text style={styles.progress}>
          {t('verification.progress', { label: progress.label })}
        </Text>
        {error ? <ProDayErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

        {checks.map((check) => {
          const st = pv?.[check.id]?.status ?? 'not_submitted';
          const done = st === 'verified';
          return (
            <View key={check.id} style={styles.card}>
              <View style={styles.cardHead}>
                <Icon
                  name={done ? 'checkmark-circle' : 'document'}
                  size={22}
                  color={done ? c.success : c.accent}
                />
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>{check.title}</Text>
                  <Text style={styles.cardSub}>{check.subtitle}</Text>
                  <Text style={styles.status}>{statusLabel(check.id)}</Text>
                </View>
              </View>
              {st !== 'verified' ? (
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnHalf]}
                    onPress={() => pick(check.id, 'gallery')}
                    disabled={loading !== null}
                  >
                    <Text style={styles.btnText}>
                      {loading === check.id ? t('verification.upload.sending') : t('verification.upload.image')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnHalf]}
                    onPress={() => pick(check.id, 'pdf')}
                    disabled={loading !== null}
                  >
                    <Text style={styles.btnText}>{t('verification.upload.pdf')}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    body: { padding: spacing.lg, gap: spacing.sm },
    progress: { fontSize: 13, color: c.textSecondary, marginBottom: spacing.sm },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardHead: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
    cardCopy: { flex: 1 },
    cardTitle: { fontSize: 14, fontWeight: '900', color: c.text },
    cardSub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    status: { fontSize: 11, fontWeight: '800', color: c.accent, marginTop: 4 },
    btn: {
      backgroundColor: c.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    btnRow: { flexDirection: 'row', gap: spacing.xs },
    btnHalf: { flex: 1 },
    btnText: { color: c.brandInverse, fontWeight: '800', fontSize: 13 },
  });
}
