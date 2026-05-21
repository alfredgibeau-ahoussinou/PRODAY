import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import type { UserRole } from '../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../models/User';
import { authService } from '../services/auth.service';
import { profileService } from '../services/profile.service';
import { Logo } from '../components/Logo';
import { VerificationBadge } from '../components/VerificationBadge';
import { colors, spacing, radius } from '../theme/designTokens';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'player', label: 'Joueur' },
  { value: 'coach', label: 'Coach' },
  { value: 'agent', label: 'Agent' },
  { value: 'organizer', label: 'Organisateur' },
  { value: 'sponsor', label: 'Sponsor' },
];

export const AuthScreen: React.FC = () => {
  const [step, setStep] = useState<'role' | 'info' | 'document' | 'pending'>('role');
  const [role, setRole] = useState<UserRole>('player');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<Awaited<
    ReturnType<typeof authService.signUp>
  > | null>(null);

  const needsDocument = ROLES_REQUIRING_VERIFICATION.includes(role);

  const handleCreateProfile = async () => {
    setLoading(true);
    try {
      const user = await authService.signUp({
        email,
        password: '***',
        display_name: displayName,
        role,
      });
      setCreatedUser(user);
      setStep(needsDocument ? 'document' : 'pending');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!createdUser) return;
    setLoading(true);
    await profileService.uploadVerificationDocument(
      createdUser.uid,
      new Blob(),
      role === 'agent' ? 'license' : 'diploma'
    );
    setLoading(false);
    setStep('pending');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Logo variant="light" width={180} />

      {step === 'role' && (
        <>
          <Text style={styles.label}>Choisissez votre rôle</Text>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.roleBtn, role === r.value && styles.roleBtnActive]}
              onPress={() => setRole(r.value)}
            >
              <Text style={styles.roleText}>{r.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.primary} onPress={() => setStep('info')}>
            <Text style={styles.primaryText}>Continuer</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 'info' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Nom affiché"
            placeholderTextColor={colors.textMuted}
            value={displayName}
            onChangeText={setDisplayName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.primary}
            onPress={handleCreateProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Créer mon profil</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {step === 'document' && (
        <>
          <Text style={styles.warn}>
            Photo de carte éducateur ou licence agent obligatoire. Accès messagerie bloqué
            tant que non validé.
          </Text>
          <TouchableOpacity style={styles.primary} onPress={handleUploadDocument}>
            <Text style={styles.primaryText}>Envoyer mon document</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 'pending' && createdUser && (
        <View style={styles.pendingBox}>
          <VerificationBadge user={createdUser} />
          <Text style={styles.pendingText}>
            Vérification en cours — document reçu, en attente de validation admin.
            Consultez l&apos;écran « Vérification des diplômes » pour le suivi détaillé.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  label: { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md, fontWeight: '600' },
  roleBtn: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleBtnActive: { borderColor: colors.bluePrimary, borderWidth: 2 },
  roleText: { color: colors.text },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primary: {
    backgroundColor: colors.bluePrimary,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
  warn: { color: colors.warning, fontSize: 13, lineHeight: 20, marginTop: spacing.lg },
  pendingBox: { marginTop: spacing.lg, gap: spacing.md, alignItems: 'flex-start' },
  pendingText: { color: colors.textSecondary, lineHeight: 22, fontSize: 14 },
});
