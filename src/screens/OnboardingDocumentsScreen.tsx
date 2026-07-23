import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/ui/Icon';
import type { User, PlayerVerificationCheckId } from '../models/User';
import {
  ROLES_REQUIRING_VERIFICATION,
  playerVerificationProgress,
  verificationDocumentTypeForRole,
} from '../models/User';
import { DEFAULT_APP_SPACE } from '../models/AppSpace';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { ProDayErrorBanner } from '../components/ui/ProDayErrorBanner';
import { PressableSpring } from '../components/motion';
import {
  pickVerificationFromCamera,
  pickVerificationFromGallery,
  pickVerificationPdf,
} from '../utils/pickVerificationDocument';
import { profileService } from '../services/profile.service';
import { getPlayerVerificationChecks } from './signup/signupFlowConfig';
import { tabBarScrollInset } from '../navigation/tabBarLayout';
import { getErrorMessage } from '../utils/errors';
import { useTranslation } from '../context/LocaleContext';

interface OnboardingDocumentsScreenProps {
  profile: User;
  onComplete: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onDismiss?: () => void;
  variant?: 'profile';
}

type UploadTarget =
  | { kind: 'player'; checkId: PlayerVerificationCheckId }
  | { kind: 'staff' };

function statusLabel(status: string | undefined, t: (key: string) => string): string {
  if (status === 'verified') return t('verification.status.verified');
  if (status === 'pending') return t('verification.status.pending');
  if (status === 'rejected') return t('verification.status.rejected');
  return t('verification.status.todo');
}

function VerificationDocCard({
  title,
  subtitle,
  statusCode,
  status,
  loading,
  onCamera,
  onGallery,
  onPdf,
  colors,
  t,
}: {
  title: string;
  subtitle: string;
  statusCode: string | undefined;
  status: string;
  loading: boolean;
  onCamera: () => void;
  onGallery: () => void;
  onPdf: () => void;
  colors: AppColors;
  t: (key: string) => string;
}) {
  const styles = useMemo(() => createCardStyles(colors), [colors]);
  const done = statusCode === 'verified';

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Icon
          name={done ? 'checkmark-circle' : 'document'}
          size={22}
          color={done ? colors.success : colors.accent}
        />
        <View style={styles.cardCopy}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSub}>{subtitle}</Text>
          <Text style={styles.status}>{status}</Text>
        </View>
      </View>

      {!done ? (
        <View style={styles.actions}>
          <PickButton
            label={t('onboarding.camera')}
            icon="camera"
            onPress={onCamera}
            disabled={loading}
            colors={colors}
          />
          <PickButton
            label={t('onboarding.gallery')}
            icon="image"
            onPress={onGallery}
            disabled={loading}
            colors={colors}
          />
          <PickButton
            label={t('verification.upload.pdf')}
            icon="document"
            onPress={onPdf}
            disabled={loading}
            colors={colors}
          />
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.loadingText}>Envoi en cours…</Text>
        </View>
      ) : null}
    </View>
  );
}

function PickButton({
  label,
  icon,
  onPress,
  disabled,
  colors,
}: {
  label: string;
  icon: 'camera' | 'image' | 'document';
  onPress: () => void;
  disabled: boolean;
  colors: AppColors;
}) {
  const styles = useMemo(() => createCardStyles(colors), [colors]);
  return (
    <PressableSpring
      style={[styles.pickBtn, disabled && styles.pickBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.97}
      haptic
    >
      <Icon name={icon} size={18} color={colors.brandInverse} />
      <Text style={styles.pickBtnText}>{label}</Text>
    </PressableSpring>
  );
}

export const OnboardingDocumentsScreen: React.FC<OnboardingDocumentsScreenProps> = ({
  profile,
  onComplete,
  onSignOut,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const [error, setError] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const isPlayer = profile.role === 'player';
  const isStaffDoc =
    ROLES_REQUIRING_VERIFICATION.includes(profile.role) || profile.role === 'physio';
  const playerChecks = useMemo(
    () => getPlayerVerificationChecks(profile.app_space ?? DEFAULT_APP_SPACE, t),
    [profile.app_space, t]
  );
  const playerProgress = playerVerificationProgress(profile.player_verification);

  const uploadFile = useCallback(
    async (file: { uri: string; mimeType: string }, target: UploadTarget) => {
      setError(null);
      const key = target.kind === 'player' ? target.checkId : 'staff';
      setLoadingKey(key);
      try {
        if (target.kind === 'player') {
          const result = await profileService.uploadPlayerVerificationCheck(
            profile.uid,
            file,
            target.checkId
          );
          if (!result.success) throw new Error(result.error);
        } else {
          const result = await profileService.uploadVerificationDocument(
            profile.uid,
            file,
            verificationDocumentTypeForRole(profile.role)
          );
          if (!result.success) throw new Error(result.error);
        }
        await onComplete();
        Alert.alert(t('onboarding.alert.sent.title'), t('onboarding.alert.sent.body'));
      } catch (e) {
        setError(getErrorMessage(e, t('onboarding.error.send')));
      } finally {
        setLoadingKey(null);
      }
    },
    [profile.uid, profile.role, onComplete, t]
  );

  const handlePick = useCallback(
    async (
      source: 'camera' | 'gallery' | 'pdf',
      target: UploadTarget,
      cameraKind: 'identity' | 'document' = 'document'
    ) => {
      const file =
        source === 'camera'
          ? await pickVerificationFromCamera(cameraKind)
          : source === 'gallery'
            ? await pickVerificationFromGallery()
            : await pickVerificationPdf();
      if (!file) return;
      await uploadFile(file, target);
    },
    [uploadFile]
  );

  const scrollPad = { paddingBottom: tabBarScrollInset({ extra: spacing.xl }) };

  return (
    <SafeAreaView style={[styles.root, rootStyle]} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={t('onboarding.title')}
        subtitle="Image ou PDF"
        onBack={onDismiss}
        centered
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, scrollPad]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <Icon name="shield" size={28} color={c.accent} />
          </View>
          <Text style={styles.title}>Envoyez vos justificatifs</Text>
          <Text style={styles.sub}>
            Choisissez une photo (caméra ou galerie) ou un fichier PDF. Vous pouvez continuer à
            explorer l’application — seule la messagerie reste bloquée jusqu’à validation.
          </Text>
        </View>

        {error ? <ProDayErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

        {isPlayer ? (
          <>
            <Text style={styles.sectionLabel}>
              Progression {playerProgress.label} — identité obligatoire
            </Text>
            {playerChecks.map((check) => {
              const st = profile.player_verification?.[check.id]?.status ?? 'not_submitted';
              const cameraKind = check.id === 'identity' ? 'identity' : 'document';
              const busy = loadingKey === check.id;
              return (
                <VerificationDocCard
                  key={check.id}
                  title={`${check.title}${check.required ? ' *' : ''}`}
                  subtitle={`${check.subtitle} · JPG, PNG ou PDF`}
                  statusCode={st}
                  status={statusLabel(st, t)}
                  loading={busy}
                  colors={c}
                  t={t}
                  onCamera={() => void handlePick('camera', { kind: 'player', checkId: check.id }, cameraKind)}
                  onGallery={() => void handlePick('gallery', { kind: 'player', checkId: check.id }, cameraKind)}
                  onPdf={() => void handlePick('pdf', { kind: 'player', checkId: check.id }, cameraKind)}
                />
              );
            })}
          </>
        ) : null}

        {isStaffDoc ? (
          <VerificationDocCard
            title="Justificatif professionnel"
            subtitle={t('onboarding.staff.subtitle')}
            statusCode={
              profile.verification_status === 'VERIFIED'
                ? 'verified'
                : profile.onboarding_documents_submitted ||
                    profile.verification_status === 'PENDING'
                  ? 'pending'
                  : 'not_submitted'
            }
            status={
              profile.verification_status === 'VERIFIED'
                ? t('verification.status.verified')
                : profile.onboarding_documents_submitted ||
                    profile.verification_status === 'PENDING'
                  ? t('verification.status.pending')
                  : t('verification.status.todo')
            }
            loading={loadingKey === 'staff'}
            colors={c}
            t={t}
            onCamera={() => void handlePick('camera', { kind: 'staff' })}
            onGallery={() => void handlePick('gallery', { kind: 'staff' })}
            onPdf={() => void handlePick('pdf', { kind: 'staff' })}
          />
        ) : null}

        {onDismiss ? (
          <PressableSpring style={styles.exploreBtn} onPress={onDismiss} scaleTo={0.98} haptic>
            <Text style={styles.exploreBtnText}>Explorer l’application</Text>
            <Icon name="chevron-forward" size={16} color={c.accent} />
          </PressableSpring>
        ) : null}

        <Text style={styles.signOut} onPress={() => void onSignOut()}>
          Se déconnecter
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

function createCardStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.sm,
    },
    cardHead: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
    cardCopy: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '800', color: c.text },
    cardSub: { fontSize: 13, color: c.textSecondary, marginTop: 4, lineHeight: 18 },
    status: { fontSize: 12, fontWeight: '700', color: c.accent, marginTop: 6 },
    actions: { flexDirection: 'row', gap: spacing.xs },
    pickBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: c.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      minHeight: 44,
    },
    pickBtnDisabled: { opacity: 0.5 },
    pickBtnText: { color: c.brandInverse, fontWeight: '800', fontSize: 12 },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    loadingText: { fontSize: 13, color: c.textSecondary },
  });
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    hero: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: c.text,
      textAlign: 'center',
    },
    sub: {
      marginTop: spacing.sm,
      fontSize: 14,
      lineHeight: 21,
      color: c.textSecondary,
      textAlign: 'center',
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textMuted,
      marginBottom: spacing.sm,
    },
    exploreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      marginTop: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: c.accentSoft,
    },
    exploreBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: c.accent,
    },
    signOut: {
      textAlign: 'center',
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '600',
      paddingVertical: spacing.lg,
      textDecorationLine: 'underline',
    },
  });
}
