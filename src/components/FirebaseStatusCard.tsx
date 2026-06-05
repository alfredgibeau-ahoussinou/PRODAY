import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import {
  isFirebaseConfigured,
  isFirebaseStorageConfigured,
  firebaseConfig,
} from '../config/firebase';
import { getGoogleAuthRequestConfig } from '../config/oauth';
import { Icon } from './ui/Icon';
import { useAppTheme } from '../context/ProductLineContext';
import { spacing, radius } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';

interface FirebaseStatusCardProps {
  profileLoaded?: boolean;
}

const STORAGE_CONSOLE =
  'https://console.firebase.google.com/project/proday-155b0/storage';

/** État connexion Firebase — visible dans Profil. */
export const FirebaseStatusCard: React.FC<FirebaseStatusCardProps> = ({
  profileLoaded,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  if (!isFirebaseConfigured()) return null;

  const storageReady = isFirebaseStorageConfigured();
  const googleReady = Boolean(getGoogleAuthRequestConfig());

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Icon name="shield" size={18} color={c.brand} />
        <Text style={styles.title}>Connexion Firebase</Text>
      </View>
      <StatusLine
        ok={Boolean(profileLoaded)}
        label="Firestore · profil"
        hint={profileLoaded ? 'Synchronisé' : 'Chargement…'}
        styles={styles}
      />
      <StatusLine
        ok={storageReady}
        label="Storage · photos"
        hint={
          storageReady
            ? firebaseConfig.storageBucket
            : 'Bucket manquant dans .env'
        }
        styles={styles}
      />
      <StatusLine
        ok={googleReady}
        label="Google · connexion"
        hint={googleReady ? 'ID clients .env OK' : 'Variables Google manquantes'}
        styles={styles}
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

const StatusLine: React.FC<{
  ok: boolean;
  label: string;
  hint: string;
  styles: ReturnType<typeof createStyles>;
}> = ({ ok, label, hint, styles }) => (
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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    title: { fontSize: 14, fontWeight: '900', color: c.text },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
    dot: { width: 8, height: 8, borderRadius: 4 },
    dotOk: { backgroundColor: c.success },
    dotWarn: { backgroundColor: c.warning },
    statusCopy: { flex: 1 },
    statusLabel: { fontSize: 12, fontWeight: '800', color: c.text },
    statusHint: { fontSize: 11, color: c.textMuted, marginTop: 1 },
    link: {
      marginTop: spacing.sm,
      fontSize: 12,
      fontWeight: '800',
      color: c.brand,
    },
    note: { marginTop: spacing.sm, fontSize: 11, color: c.textMuted },
  });
}
