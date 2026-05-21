import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { UserRole } from '../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../models/User';
import { authService } from '../services/auth.service';
import { profileService } from '../services/profile.service';
import { BrandHeader } from '../components/BrandHeader';
import { VerificationBadge } from '../components/VerificationBadge';
import { VerificationFlowScreen } from './VerificationFlowScreen';
import { VerificationSuccessScreen } from './VerificationSuccessScreen';
import { ParentalControlScreen } from './ParentalControlScreen';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius } from '../theme/designTokens';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'player', label: 'Joueur' },
  { value: 'coach', label: 'Coach' },
  { value: 'agent', label: 'Agent' },
  { value: 'organizer', label: 'Organisateur' },
  { value: 'sponsor', label: 'Sponsor' },
];

type Mode = 'signup' | 'login';

export const AuthScreen: React.FC = () => {
  const { profile, loading: authLoading, configured, refreshProfile, signOut } =
    useAuth();

  const [mode, setMode] = useState<Mode>('signup');
  const [step, setStep] = useState<'role' | 'info' | 'document' | 'pending'>('role');
  const [role, setRole] = useState<UserRole>('player');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [position, setPosition] = useState('');
  const [statMatches, setStatMatches] = useState('');
  const [statGoals, setStatGoals] = useState('');
  const [statAssists, setStatAssists] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerificationFlow, setShowVerificationFlow] = useState(false);
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);
  const [showParentalControl, setShowParentalControl] = useState(false);

  const needsDocument = ROLES_REQUIRING_VERIFICATION.includes(role);

  useEffect(() => {
    if (profile && mode === 'signup' && step === 'role') {
      setMode('login');
    }
  }, [profile, mode, step]);

  const parseStat = (value: string) => {
    const n = parseInt(value.replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const handleSignUp = async () => {
    if (!displayName.trim() || !email.trim() || password.length < 6) {
      setError('Nom, email et mot de passe (6 car. min.) requis.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const profilePayload =
        role === 'player'
          ? {
              ...(position.trim() ? { position: position.trim() } : {}),
              season_stats: {
                matches: parseStat(statMatches),
                goals: parseStat(statGoals),
                assists: parseStat(statAssists),
              },
            }
          : undefined;

      const user = await authService.signUp({
        email,
        password,
        display_name: displayName,
        role,
        city: city.trim() || undefined,
        profile: profilePayload,
      });
      await refreshProfile();
      setStep(needsDocument ? 'document' : 'pending');
      if (!needsDocument) {
        Alert.alert('Compte créé', `Bienvenue ${user.display_name} !`);
      }
    } catch (e) {
      setError(authService.getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Email et mot de passe requis.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authService.signIn(email, password);
      await refreshProfile();
      setError(null);
    } catch (e) {
      setError(authService.getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handlePickAndUploadDocument = async (uid: string, userRole: UserRole) => {
    const pick = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (pick.canceled || !pick.assets?.[0]) return;

    const asset = pick.assets[0];
    setLoading(true);
    setError(null);
    try {
      const result = await profileService.uploadVerificationDocument(
        uid,
        {
          uri: asset.uri,
          mimeType: asset.mimeType ?? 'image/jpeg',
        },
        userRole === 'agent' ? 'license' : 'diploma'
      );
      if (!result.success) throw new Error(result.error);
      await refreshProfile();
      setStep('pending');
      Alert.alert('Document envoyé', 'Votre dossier est en cours de validation.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload échoué');
    } finally {
      setLoading(false);
    }
  };

  if (!configured) {
    return (
      <View style={styles.container}>
        <BrandHeader size="screen" centered />
        <Text style={styles.errorBox}>
          Fichier .env manquant ou incomplet. Voir docs/FIREBASE_SETUP.md
        </Text>
      </View>
    );
  }

  if (authLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (profile && mode !== 'signup') {
    const isStaff =
      profile.role === 'coach' || profile.role === 'agent';
    const pendingVerification =
      isStaff && profile.verification_status === 'PENDING';
    const verifiedStaff =
      isStaff && profile.verification_status === 'VERIFIED';

    if (showVerificationSuccess && verifiedStaff) {
      return (
        <VerificationSuccessScreen
          onBack={() => setShowVerificationSuccess(false)}
        />
      );
    }

    if (showVerificationFlow && (pendingVerification || verifiedStaff)) {
      return (
        <VerificationFlowScreen
          onBack={() => setShowVerificationFlow(false)}
          initialSuccess={verifiedStaff}
        />
      );
    }

    if (showParentalControl) {
      return (
        <ParentalControlScreen onBack={() => setShowParentalControl(false)} />
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <BrandHeader size="screen" centered />
        <Text style={styles.profileName}>{profile.display_name}</Text>
        <Text style={styles.profileMeta}>
          {profile.email} · {profile.role}
        </Text>
        <VerificationBadge user={profile} />

        {profile.role === 'player' && profile.profile.season_stats && (
          <Text style={styles.profileStats}>
            Saison : {profile.profile.season_stats.matches} matchs ·{' '}
            {profile.profile.season_stats.goals} buts ·{' '}
            {profile.profile.season_stats.assists} passes décisives
          </Text>
        )}

        {pendingVerification && (
          <>
            <Text style={styles.warn}>
              Envoyez votre diplôme ou licence pour débloquer la messagerie.
            </Text>
            <TouchableOpacity
              style={styles.secondary}
              onPress={() => handlePickAndUploadDocument(profile.uid, profile.role)}
              disabled={loading}
            >
              <Text style={styles.secondaryText}>
                {loading ? 'Envoi…' : 'Choisir un document (PDF / image)'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowVerificationFlow(true)}>
              <Text style={styles.link}>Voir le suivi de vérification</Text>
            </TouchableOpacity>
          </>
        )}

        {verifiedStaff && (
          <TouchableOpacity onPress={() => setShowVerificationSuccess(true)}>
            <Text style={styles.link}>Voir diplôme vérifié</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.secondary}
          onPress={() => setShowParentalControl(true)}
        >
          <Text style={styles.secondaryText}>Contrôle parental</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primary}
          onPress={async () => {
            await signOut();
            setMode('login');
            setStep('role');
          }}
        >
          <Text style={styles.primaryText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BrandHeader size="hero" showTagline centered style={styles.authBrand} />

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'signup' && styles.modeBtnActive]}
          onPress={() => {
            setMode('signup');
            setStep('role');
            setError(null);
          }}
        >
          <Text style={[styles.modeText, mode === 'signup' && styles.modeTextActive]}>
            Inscription
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
          onPress={() => {
            setMode('login');
            setError(null);
          }}
        >
          <Text style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>
            Connexion
          </Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorBox}>{error}</Text>}

      {mode === 'login' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={styles.primary}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Se connecter</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {mode === 'signup' && step === 'role' && (
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

      {mode === 'signup' && step === 'info' && (
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
          <TextInput
            style={styles.input}
            placeholder="Mot de passe (6 car. min.)"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Ville (optionnel)"
            placeholderTextColor={colors.textMuted}
            value={city}
            onChangeText={setCity}
          />
          {role === 'player' && (
            <>
              <Text style={styles.label}>Stats saison (réelles)</Text>
              <TextInput
                style={styles.input}
                placeholder="Poste (ex. Milieu)"
                placeholderTextColor={colors.textMuted}
                value={position}
                onChangeText={setPosition}
              />
              <View style={styles.statRow}>
                <TextInput
                  style={[styles.input, styles.statInput]}
                  placeholder="Matchs"
                  placeholderTextColor={colors.textMuted}
                  value={statMatches}
                  onChangeText={setStatMatches}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={[styles.input, styles.statInput]}
                  placeholder="Buts"
                  placeholderTextColor={colors.textMuted}
                  value={statGoals}
                  onChangeText={setStatGoals}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={[styles.input, styles.statInput]}
                  placeholder="Passes d."
                  placeholderTextColor={colors.textMuted}
                  value={statAssists}
                  onChangeText={setStatAssists}
                  keyboardType="number-pad"
                />
              </View>
            </>
          )}
          <TouchableOpacity
            style={styles.primary}
            onPress={handleSignUp}
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

      {mode === 'signup' && step === 'document' && profile && (
        <>
          <Text style={styles.warn}>
            Photo de carte éducateur ou licence agent obligatoire. Accès messagerie bloqué
            tant que non validé.
          </Text>
          <TouchableOpacity
            style={styles.primary}
            onPress={() => handlePickAndUploadDocument(profile.uid, profile.role)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Choisir un document</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep('pending')}>
            <Text style={styles.link}>Passer pour l&apos;instant</Text>
          </TouchableOpacity>
        </>
      )}

      {mode === 'signup' && step === 'pending' && profile && (
        <View style={styles.pendingBox}>
          <VerificationBadge user={profile} />
          <Text style={styles.pendingText}>
            Compte créé sur Firebase. Connectez-vous depuis l&apos;onglet Profil pour
            gérer votre compte.
          </Text>
          <TouchableOpacity
            style={styles.secondary}
            onPress={() => setMode('login')}
          >
            <Text style={styles.secondaryText}>Aller à la connexion</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  centered: { justifyContent: 'center', alignItems: 'center' },
  modeRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 4,
  },
  modeBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
  modeBtnActive: { backgroundColor: colors.surface },
  modeText: { color: colors.textSecondary, fontWeight: '600' },
  modeTextActive: { color: colors.brand },
  label: { color: colors.text, marginBottom: spacing.md, fontWeight: '600' },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.lg,
  },
  profileMeta: { color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md },
  profileStats: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  roleBtn: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleBtnActive: { borderColor: colors.brand, borderWidth: 2 },
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
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
  secondary: {
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  secondaryText: { color: colors.brand, fontWeight: '700' },
  warn: { color: colors.warning, fontSize: 13, lineHeight: 20, marginTop: spacing.lg },
  pendingBox: { marginTop: spacing.lg, gap: spacing.md, alignItems: 'flex-start' },
  pendingText: { color: colors.textSecondary, lineHeight: 22, fontSize: 14 },
  errorBox: {
    color: colors.error,
    backgroundColor: colors.errorBg,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    fontSize: 13,
  },
  authBrand: { marginBottom: spacing.md },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statInput: { flex: 1, marginBottom: spacing.md },
  link: { color: colors.brand, fontWeight: '600', marginTop: spacing.md, textAlign: 'center' },
  backLink: { color: colors.brand, fontWeight: '600', marginBottom: spacing.md },
});
