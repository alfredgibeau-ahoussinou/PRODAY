import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { User, PlayerVerificationCheckId } from '../models/User';
import { playerVerificationProgress } from '../models/User';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { profileService } from '../services/profile.service';
import { ProDayErrorBanner } from '../components/ui/ProDayErrorBanner';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';

const CHECKS: {
  id: PlayerVerificationCheckId;
  title: string;
  subtitle: string;
}[] = [
  { id: 'identity', title: 'Pièce d’identité', subtitle: 'CNI ou passeport' },
  { id: 'club_license', title: 'Licence / carte club', subtitle: 'Justificatif FFF' },
];

interface PlayerVerificationScreenProps {
  user: User;
  onBack: () => void;
  onUpdated: () => Promise<void>;
}

export const PlayerVerificationScreen: React.FC<PlayerVerificationScreenProps> = ({
  user,
  onBack,
  onUpdated,
}) => {
  const { colors: c, productLine, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const isWoman = productLine === 'woman';
  const [loading, setLoading] = useState<PlayerVerificationCheckId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pv = user.player_verification;
  const progress = playerVerificationProgress(pv);

  const pick = async (checkId: PlayerVerificationCheckId) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setLoading(checkId);
    setError(null);
    try {
      const asset = result.assets[0];
      const upload = await profileService.uploadPlayerVerificationCheck(
        user.uid,
        { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' },
        checkId
      );
      if (!upload.success) throw new Error(upload.error);
      await onUpdated();
      Alert.alert('Document envoyé', 'Analyse en cours — vous serez notifié du résultat.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Envoi impossible');
    } finally {
      setLoading(null);
    }
  };

  const statusLabel = (checkId: PlayerVerificationCheckId) => {
    const s = pv?.[checkId]?.status ?? 'not_submitted';
    if (s === 'verified') return 'Validé';
    if (s === 'pending') return 'En analyse';
    if (s === 'rejected') return 'Refusé — renvoyer';
    return 'À envoyer';
  };

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader
        title={isWoman ? 'Vérification joueuse' : 'Vérification joueur'}
        onBack={onBack}
        centered
      />
      <View style={styles.body}>
        <Text style={styles.progress}>
          Progression {progress.label} — identité obligatoire pour la messagerie.
        </Text>
        {error ? <ProDayErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

        {CHECKS.map((check) => {
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
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => pick(check.id)}
                  disabled={loading !== null}
                >
                  <Text style={styles.btnText}>
                    {loading === check.id ? 'Envoi…' : st === 'pending' ? 'Remplacer' : 'Téléverser'}
                  </Text>
                </TouchableOpacity>
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
      backgroundColor: c.ink,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    btnText: { color: c.brandInverse, fontWeight: '800', fontSize: 13 },
  });
}
