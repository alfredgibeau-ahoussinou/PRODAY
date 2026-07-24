import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Icon } from '../ui/Icon';
import type { AiVerificationResult } from '../../utils/aiVerification';
import { isAiVerificationPassing } from '../../utils/aiVerification';
import { spacing, radius } from '../../theme/designTokens';
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';
import type { AppColors } from '../../theme/universeTheme';

interface SignupDocumentAiPanelProps {
  /** Affichage direct du résultat (mode éphémère, sans Firestore). */
  result?: AiVerificationResult;
  loading?: boolean;
}

export const SignupDocumentAiPanel: React.FC<SignupDocumentAiPanelProps> = ({
  result,
  loading,
}) => {
  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  if (loading) {
    return (
      <View style={styles.wrap}>
        <View style={styles.badge}>
          <ActivityIndicator color={c.brand} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Analyse IA Mistral en cours…</Text>
          <Text style={styles.body}>
            Vérification instantanée par caméra. Le fichier n'est pas enregistré sur nos serveurs.
          </Text>
        </View>
      </View>
    );
  }

  if (!result) return null;

  const passing = isAiVerificationPassing(result.status);
  const rejected = result.status === 'rejected';

  return (
    <View style={styles.wrap}>
      <View style={[styles.badge, passing && styles.badgeOk, rejected && styles.badgeErr]}>
        <Icon
          name={passing ? 'checkmark-circle' : rejected ? 'alert-circle' : 'shield'}
          size={22}
          color={passing ? c.success : rejected ? c.error : c.warning}
        />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>
          {passing ? 'Document accepté' : rejected ? 'Document refusé' : 'Analyse terminée'}
        </Text>
        <Text style={styles.body}>{result.summary_fr ?? 'Analyse IA terminée.'}</Text>
        {result.document_type_detected ? (
          <Text style={styles.detected}>
            Détecté : {result.document_type_detected}
            {result.confidence != null ? ` · ${Math.round(result.confidence * 100)} % confiance` : ''}
          </Text>
        ) : null}
        {rejected && result.rejection_reason_fr ? (
          <Text style={styles.reject}>{result.rejection_reason_fr}</Text>
        ) : null}
        {passing ? (
          <Text style={styles.privacy}>
            Aucune copie du document n'a été stockée. Conforme au plan gratuit.
          </Text>
        ) : null}
      </View>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.md,
    },
    badge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeOk: { backgroundColor: c.successBg },
    badgeErr: { backgroundColor: c.errorBg },
    copy: { flex: 1 },
    title: { fontSize: 14, fontWeight: '900', color: c.text },
    body: { fontSize: 12, lineHeight: 18, color: c.textSecondary, marginTop: 4 },
    detected: { fontSize: 11, fontWeight: '700', color: c.textMuted, marginTop: spacing.xs },
    reject: {
      fontSize: 12,
      fontWeight: '700',
      color: c.error,
      marginTop: spacing.xs,
      lineHeight: 18,
    },
    privacy: {
      fontSize: 11,
      color: c.success,
      fontWeight: '600',
      marginTop: spacing.xs,
      lineHeight: 16,
    },
  });
}
