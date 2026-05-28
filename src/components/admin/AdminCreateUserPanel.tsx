import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { UserRole } from '../../models/User';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

const ROLES: UserRole[] = ['player', 'coach', 'agent', 'organizer', 'physio', 'sponsor'];

const ROLE_LABEL: Record<UserRole, string> = {
  player: 'Joueur',
  coach: 'Coach',
  agent: 'Agent',
  organizer: 'Organisateur',
  sponsor: 'Sponsor',
  physio: 'Kinésithérapeute',
};

export interface CreateUserFormState {
  email: string;
  password: string;
  display_name: string;
  city: string;
  role: UserRole;
}

interface AdminCreateUserPanelProps {
  visible: boolean;
  form: CreateUserFormState;
  onChange: (patch: Partial<CreateUserFormState>) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

export const AdminCreateUserPanel: React.FC<AdminCreateUserPanelProps> = ({
  visible,
  form,
  onChange,
  onClose,
  onSubmit,
  submitting,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.panel}>
      <View style={styles.panelHead}>
        <View style={styles.panelTitleRow}>
          <Icon name="add" size={20} color={colors.accent} />
          <Text style={styles.panelTitle}>Nouveau compte</Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <Icon name="close" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Field
        label="Email"
        value={form.email}
        onChangeText={(email) => onChange({ email })}
        keyboardType="email-address"
      />
      <Field
        label="Mot de passe"
        value={form.password}
        onChangeText={(password) => onChange({ password })}
        secure
      />
      <Field
        label="Nom affiché"
        value={form.display_name}
        onChangeText={(display_name) => onChange({ display_name })}
      />
      <Field label="Ville" value={form.city} onChangeText={(city) => onChange({ city })} />

      <Text style={styles.fieldLabel}>Rôle</Text>
      <View style={styles.roleGrid}>
        {ROLES.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleChip, form.role === r && styles.roleChipOn]}
            onPress={() => onChange({ role: r })}
          >
            <Text style={[styles.roleChipText, form.role === r && styles.roleChipTextOn]}>
              {ROLE_LABEL[r]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.submit} onPress={onSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={colors.brandInverse} />
        ) : (
          <>
            <Icon name="checkmark-circle" size={18} color={colors.brandInverse} />
            <Text style={styles.submitText}>Créer le compte</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address';
}> = ({ label, value, onChangeText, secure, keyboardType }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secure}
      keyboardType={keyboardType}
      autoCapitalize="none"
      placeholderTextColor={colors.textMuted}
    />
  </View>
);

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  panelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  panelTitle: { fontSize: 18, fontWeight: '900', color: colors.text },
  field: { marginBottom: spacing.md },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  roleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  roleChipOn: { backgroundColor: colors.ink, borderColor: colors.accent },
  roleChipText: { fontSize: 12, fontWeight: '800', color: colors.text },
  roleChipTextOn: { color: colors.brandInverse },
  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  submitText: { color: colors.brandInverse, fontWeight: '900', fontSize: 15 },
});
