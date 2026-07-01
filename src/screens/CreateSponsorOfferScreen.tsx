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
import {
  SPONSOR_OFFER_TYPES,
  SPONSOR_TARGET_CATEGORIES,
} from '../content/sponsorContent';
import type { SponsorOfferType } from '../models/SponsorOffer';
import { SPONSOR_THEME } from '../content/sponsorExperience';
import { spacing, radius } from '../theme/designTokens';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { isSponsorCampaignAllowed } from '../utils/sponsorCampaignGate';
import { useTranslation } from '../context/LocaleContext';

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
  const profile = useSessionProfile();
  const { t } = useTranslation();
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [city, setCity] = useState('');
  const [offerType, setOfferType] = useState<SponsorOfferType>('equipment');
  const [categories, setCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const submit = async () => {
    const gate = isSponsorCampaignAllowed(profile);
    if (!gate.allowed) {
      Alert.alert(
        t('sponsor.gate.title'),
        t(gate.reasonKey ?? 'sponsor.gate.approval'),
      );
      return;
    }
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
        value: value.trim() || 'Offre sponsor',
        city: city.trim() || 'France',
        offer_type: offerType,
        target_categories: categories,
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
      <ScreenHeader
        title="Nouvelle offre"
        subtitle="Espace sponsor ProDay"
        onBack={onBack}
        centered
        sponsorDark
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Type d’offre</Text>
        <View style={styles.typeRow}>
          {SPONSOR_OFFER_TYPES.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.typeChip, offerType === t.id && styles.typeChipOn]}
              onPress={() => setOfferType(t.id)}
            >
              <Text style={[styles.typeChipText, offerType === t.id && styles.typeChipTextOn]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Field label="Entreprise / marque *" value={company} onChangeText={setCompany} />
        <Field label="Description *" value={description} onChangeText={setDescription} multiline />
        <Field label="Valeur (ex. -20 %, 500 €)" value={value} onChangeText={setValue} />
        <Field label="Ville ou zone" value={city} onChangeText={setCity} />

        <Text style={styles.section}>Catégories ciblées</Text>
        <View style={styles.catRow}>
          {SPONSOR_TARGET_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, categories.includes(cat) && styles.catChipOn]}
              onPress={() => toggleCategory(cat)}
            >
              <Text style={[styles.catChipText, categories.includes(cat) && styles.catChipTextOn]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
      placeholderTextColor={SPONSOR_THEME.textMuted}
    />
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SPONSOR_THEME.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  section: {
    fontSize: 11,
    fontWeight: '800',
    color: SPONSOR_THEME.sectionLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    backgroundColor: SPONSOR_THEME.surface,
  },
  typeChipOn: { backgroundColor: SPONSOR_THEME.primary, borderColor: SPONSOR_THEME.primary },
  typeChipText: { fontSize: 12, fontWeight: '700', color: SPONSOR_THEME.textMuted },
  typeChipTextOn: { color: SPONSOR_THEME.onPrimary },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  catChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    backgroundColor: SPONSOR_THEME.surface,
  },
  catChipOn: { backgroundColor: SPONSOR_THEME.primarySoft, borderColor: SPONSOR_THEME.primary },
  catChipText: { fontSize: 11, fontWeight: '700', color: SPONSOR_THEME.textMuted },
  catChipTextOn: { color: SPONSOR_THEME.heroSubtext },
  field: { marginBottom: spacing.md },
  label: { fontSize: 12, fontWeight: '800', color: SPONSOR_THEME.sectionLabel, marginBottom: 6 },
  input: {
    backgroundColor: SPONSOR_THEME.surface,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: SPONSOR_THEME.text,
  },
  inputMulti: { minHeight: 100, textAlignVertical: 'top' },
  btn: {
    marginTop: spacing.lg,
    backgroundColor: SPONSOR_THEME.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnText: { color: SPONSOR_THEME.onPrimary, fontWeight: '800', fontSize: 16 },
});
