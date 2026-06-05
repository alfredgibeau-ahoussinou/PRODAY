import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/ui/Icon';
import { SignupPlayerVerificationStep } from './signup/SignupPlayerVerificationStep';
import { SignupDocumentStep } from './signup/SignupDocumentStep';
import type { User } from '../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../models/User';
import { DEFAULT_APP_SPACE } from '../models/AppSpace';
import { spacing } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';

interface OnboardingDocumentsScreenProps {
  profile: User;
  onComplete: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export const OnboardingDocumentsScreen: React.FC<OnboardingDocumentsScreenProps> = ({
  profile,
  onComplete,
  onSignOut,
}) => {
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDone = async () => {
    await onComplete();
  };

  const isPlayer = profile.role === 'player';
  const isStaffDoc =
    ROLES_REQUIRING_VERIFICATION.includes(profile.role) || profile.role === 'physio';

  return (
    <SafeAreaView style={[styles.root, rootStyle]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Icon name="shield" size={28} color={c.accent} />
        </View>
        <Text style={styles.title}>Vérification par caméra</Text>
        <Text style={styles.sub}>
          Étape 1 — Photographiez votre CNI, passeport ou justificatif pro directement avec la
          caméra. Mistral IA analyse sans enregistrer (plan gratuit). Si conforme, accès à
          l’email.
        </Text>
        <View style={styles.stepsRow}>
          <View style={[styles.stepPill, styles.stepPillActive]}>
            <Text style={styles.stepPillTextActive}>1 · Documents + IA</Text>
          </View>
          <Icon name="chevron-forward" size={14} color={c.textMuted} />
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>2 · Email</Text>
          </View>
          <Icon name="chevron-forward" size={14} color={c.textMuted} />
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>3 · ProDay</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {isPlayer ? (
          <SignupPlayerVerificationStep
            uid={profile.uid}
            appSpace={profile.app_space ?? DEFAULT_APP_SPACE}
            stepIndex={0}
            stepTotal={1}
            stepName="Documents"
            onDone={() => void handleDone()}
          />
        ) : null}

        {isStaffDoc ? (
          <SignupDocumentStep
            stepIndex={0}
            stepTotal={1}
            stepName="Justificatif"
            uid={profile.uid}
            role={profile.role}
            loading={loading}
            error={error}
            onUploaded={() => void handleDone()}
            onError={(msg) => setError(msg || null)}
            setLoading={setLoading}
            allowSkip={false}
          />
        ) : null}
      </View>

      <Text style={styles.signOut} onPress={() => void onSignOut()}>
        Se déconnecter
      </Text>
    </SafeAreaView>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    header: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      alignItems: 'center',
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
    stepsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.md,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    stepPill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: c.surfaceMuted,
    },
    stepPillActive: { backgroundColor: c.ink },
    stepPillText: { fontSize: 10, fontWeight: '800', color: c.textMuted },
    stepPillTextActive: { fontSize: 10, fontWeight: '800', color: c.brandInverse },
    body: { flex: 1 },
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
