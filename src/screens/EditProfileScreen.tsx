import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { User } from '../models/User';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { profileService } from '../services/profile.service';
import { colors, spacing, radius } from '../theme/designTokens';

interface EditProfileScreenProps {
  user: User;
  onBack: () => void;
  onSaved: () => void;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  user,
  onBack,
  onSaved,
}) => {
  const p = user.profile;
  const [displayName, setDisplayName] = useState(user.display_name);
  const [city, setCity] = useState(user.city ?? '');
  const [position, setPosition] = useState(p.position ?? '');
  const [level, setLevel] = useState(p.level ?? '');
  const [statMatches, setStatMatches] = useState(String(p.season_stats?.matches ?? ''));
  const [statGoals, setStatGoals] = useState(String(p.season_stats?.goals ?? ''));
  const [statAssists, setStatAssists] = useState(String(p.season_stats?.assists ?? ''));
  const [bio, setBio] = useState(p.bio ?? '');
  const [saving, setSaving] = useState(false);

  const parseStat = (value: string) => {
    const n = parseInt(value.replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Champ requis', 'Indiquez un nom affiché.');
      return;
    }
    setSaving(true);
    try {
      const profileUpdate: Partial<User['profile']> = {
        bio: bio.trim() || undefined,
      };
      if (user.role === 'player') {
        profileUpdate.position = position.trim() || undefined;
        profileUpdate.level = level.trim() || undefined;
        profileUpdate.season_stats = {
          matches: parseStat(statMatches),
          goals: parseStat(statGoals),
          assists: parseStat(statAssists),
        };
      }
      await profileService.updateProfile(user.uid, {
        display_name: displayName.trim(),
        city: city.trim(),
        profile: profileUpdate,
      });
      Alert.alert('Profil mis à jour', 'Vos informations ont été enregistrées.');
      onSaved();
      onBack();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Modifier le profil" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Nom affiché"
          placeholderTextColor={colors.textMuted}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <TextInput
          style={styles.input}
          placeholder="Ville"
          placeholderTextColor={colors.textMuted}
          value={city}
          onChangeText={setCity}
        />
        {user.role === 'player' && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Poste"
              placeholderTextColor={colors.textMuted}
              value={position}
              onChangeText={setPosition}
            />
            <TextInput
              style={styles.input}
              placeholder="Niveau (ex. R2)"
              placeholderTextColor={colors.textMuted}
              value={level}
              onChangeText={setLevel}
            />
            <Text style={styles.label}>Stats saison</Text>
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
        <TextInput
          style={[styles.input, styles.bio]}
          placeholder="Bio (optionnel)"
          placeholderTextColor={colors.textMuted}
          value={bio}
          onChangeText={setBio}
          multiline
        />
        <TouchableOpacity
          style={styles.primary}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
  },
  bio: { minHeight: 88, textAlignVertical: 'top' },
  label: { color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.sm },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statInput: { flex: 1 },
  primary: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
});
