import React, { useMemo, useState } from 'react';
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
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';

interface CreateClubFundingGoalScreenProps {
  clubId: string;
  onBack: () => void;
  onCreated: () => void;
}

export const CreateClubFundingGoalScreen: React.FC<CreateClubFundingGoalScreenProps> = ({
  clubId,
  onBack,
  onCreated,
}) => {
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const amount = Number(target.replace(/\s/g, ''));
    if (!title.trim() || !amount || amount <= 0) {
      Alert.alert('Champs requis', 'Titre et objectif (€) valides requis.');
      return;
    }
    setSaving(true);
    try {
      await sponsorsService.createFundingGoal({
        club_id: clubId,
        title: title.trim(),
        description: description.trim(),
        target_amount_eur: amount,
      });
      Alert.alert('Objectif créé', 'La campagne de financement est en ligne.');
      onCreated();
      onBack();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title="Financement club" subtitle="Campagne ProDay" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <Field styles={styles} colors={c} label="Titre" value={title} onChangeText={setTitle} />
        <Field
          styles={styles}
          colors={c}
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Field
          styles={styles}
          colors={c}
          label="Objectif (€)"
          value={target}
          onChangeText={setTarget}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.btn} onPress={submit} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={c.brandInverse} />
          ) : (
            <Text style={styles.btnText}>Lancer la campagne</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const Field: React.FC<{
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
}> = ({ styles, colors, label, value, onChangeText, multiline, keyboardType }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.inputMulti]}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      keyboardType={keyboardType}
      placeholderTextColor={colors.textMuted}
    />
  </View>
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    field: { marginBottom: spacing.md },
    label: { fontSize: 12, fontWeight: '800', color: c.textMuted, marginBottom: 6 },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: 15,
      color: c.text,
    },
    inputMulti: { minHeight: 88, textAlignVertical: 'top' },
    btn: {
      marginTop: spacing.lg,
      backgroundColor: c.brand,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    btnText: { color: c.brandInverse, fontWeight: '800', fontSize: 16 },
  });
}
