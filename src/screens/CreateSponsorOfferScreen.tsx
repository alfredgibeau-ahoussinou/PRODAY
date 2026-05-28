import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { sponsorsService } from '../services/sponsors.service';
import { colors, spacing, radius } from '../theme/designTokens';

interface CreateSponsorOfferScreenProps {
  sponsorUid: string;
  onBack: () => void;
  onCreated: () => void;
}

export const CreateSponsorOfferScreen: React.FC<CreateSponsorOfferScreenProps> = ({
  sponsorUid,
  onBack,
  onCreated,
}) => {
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!company.trim() || !description.trim()) {
      Alert.alert('Champs requis', 'Nom et description sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      await sponsorsService.createOffer({
        sponsor_uid: sponsorUid,
        company_name: company.trim(),
        description: description.trim(),
        value: value.trim() || 'Offre partenaire',
        city: city.trim() || 'France',
      });
      Alert.alert('Offre publiée', 'Votre offre est visible sur ProDay.');
      onCreated();
      onBack();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Publication impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Nouvelle offre" subtitle="Sponsors ProDay" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <Field label="Entreprise" value={company} onChangeText={setCompany} />
        <Field label="Description" value={description} onChangeText={setDescription} multiline />
        <Field label="Valeur (ex. -20 %)" value={value} onChangeText={setValue} />
        <Field label="Ville" value={city} onChangeText={setCity} />
        <TouchableOpacity style={styles.btn} onPress={submit} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Publier l&apos;offre</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
}> = ({ label, value, onChangeText, multiline }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.inputMulti]}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      placeholderTextColor={colors.textMuted}
    />
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  field: { marginBottom: spacing.md },
  label: { fontSize: 12, fontWeight: '800', color: colors.textMuted, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  inputMulti: { minHeight: 100, textAlignVertical: 'top' },
  btn: {
    marginTop: spacing.lg,
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
