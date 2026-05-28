import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import {
  isFirebaseConfigured,
  isFirebaseStorageConfigured,
  firebaseConfig,
} from '../config/firebase';
import { getGoogleAuthRequestConfig } from '../config/oauth';
import { Icon } from './ui/Icon';
import { colors, spacing, radius } from '../theme/designTokens';

interface FirebaseStatusCardProps {
  profileLoaded?: boolean;
}

const STORAGE_CONSOLE =
  'https://console.firebase.google.com/project/proday-155b0/storage';

/** État connexion Firebase — visible dans Profil. */
export const FirebaseStatusCard: React.FC<FirebaseStatusCardProps> = ({
  profileLoaded,
}) => {
  if (!isFirebaseConfigured()) return null;

  const storageReady = isFirebaseStorageConfigured();
  const googleReady = Boolean(getGoogleAuthRequestConfig());

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Icon name="shield" size={18} color={colors.brand} />
        <Text style={styles.title}>Connexion Firebase</Text>
      </View>
      <StatusLine
        ok={Boolean(profileLoaded)}
        label="Firestore · profil"
        hint={profileLoaded ? 'Synchronisé' : 'Chargement…'}
      />
      <StatusLine
        ok={storageReady}
        label="Storage · photos"
        hint={
          storageReady
            ? firebaseConfig.storageBucket
            : 'Bucket manquant dans .env'
        }
      />
      <StatusLine
        ok={googleReady}
        label="Google · connexion"
        hint={googleReady ? 'ID clients .env OK' : 'Variables Google manquantes'}
      />
      {!storageReady ? (
        <TouchableOpacity onPress={() => Linking.openURL(STORAGE_CONSOLE)}>
          <Text style={styles.link}>
            Activer Storage dans la console Firebase →
          </Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.note}>
          Projet {firebaseConfig.projectId} · relancez Expo après changement .env
        </Text>
      )}
    </View>
  );
};

const StatusLine: React.FC<{ ok: boolean; label: string; hint: string }> = ({
  ok,
  label,
  hint,
}) => (
  <View style={styles.statusRow}>
    <View style={[styles.dot, ok ? styles.dotOk : styles.dotWarn]} />
    <View style={styles.statusCopy}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusHint} numberOfLines={1}>
        {hint}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  title: { fontSize: 14, fontWeight: '900', color: colors.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOk: { backgroundColor: colors.success },
  dotWarn: { backgroundColor: colors.warning },
  statusCopy: { flex: 1 },
  statusLabel: { fontSize: 12, fontWeight: '800', color: colors.text },
  statusHint: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  link: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: '800',
    color: colors.brand,
  },
  note: { marginTop: spacing.sm, fontSize: 11, color: colors.textMuted },
});
