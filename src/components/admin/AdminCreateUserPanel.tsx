import React, { useMemo } from 'react';
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
import { useAdminStyles } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

const ROLES: UserRole[] = ['player', 'coach', 'club', 'agent', 'recruiter', 'organizer', 'physio', 'sponsor'];

const ROLE_LABEL: Record<UserRole, string> = {
  player: 'Joueur',
  coach: 'Coach',
  club: 'Club',
  agent: 'Agent',
  recruiter: 'Recruteur',
  organizer: 'Organisateur',
  sponsor: 'Sponsor',
  supporter: 'Supporter',
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
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  if (!visible) return null;

  return (
    <View style={styles.panel}>
      <View style={styles.panelHead}>
        <View style={styles.panelTitleRow}>
          <Icon name="add" size={20} color={c.brand} />
          <Text style={styles.panelTitle}>Nouveau compte</Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <Icon name="close" size={22} color={c.textMuted} />
        </TouchableOpacity>
      </View>

      <Field
        label="Email"
        value={form.email}
        onChangeText={(email) => onChange({ email })}
        keyboardType="email-address"
        styles={styles}
        textMuted={c.textMuted}
      />
      <Field
        label="Mot de passe"
        value={form.password}
        onChangeText={(password) => onChange({ password })}
        secure
        styles={styles}
        textMuted={c.textMuted}
      />
      <Field
        label="Nom affiché"
        value={form.display_name}
        onChangeText={(display_name) => onChange({ display_name })}
        styles={styles}
        textMuted={c.textMuted}
      />
      <Field
        label="Ville"
        value={form.city}
        onChangeText={(city) => onChange({ city })}
        styles={styles}
        textMuted={c.textMuted}
      />

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
          <ActivityIndicator color={c.brandInverse} />
        ) : (
          <>
            <Icon name="checkmark-circle" size={18} color={c.brandInverse} />
            <Text style={styles.submitText}>Créer le compte</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

type PanelStyles = ReturnType<typeof createStyles>;

const Field: React.FC<{
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address';
  styles: PanelStyles;
  textMuted: string;
}> = ({ label, value, onChangeText, secure, keyboardType, styles, textMuted }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secure}
      keyboardType={keyboardType}
      autoCapitalize="none"
      placeholderTextColor={textMuted}
    />
  </View>
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
    panel: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: c.brand,
    },
    panelHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    panelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    panelTitle: { fontSize: 18, fontWeight: '900', color: c.text },
    field: { marginBottom: spacing.md },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textSecondary,
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    input: {
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: 15,
      color: c.text,
    },
    roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
    roleChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    roleChipOn: { backgroundColor: c.ink, borderColor: c.brand },
    roleChipText: { fontSize: 12, fontWeight: '800', color: c.text },
    roleChipTextOn: { color: c.brandInverse },
    submit: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: c.ink,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.brand,
    },
    submitText: { color: c.brandInverse, fontWeight: '900', fontSize: 15 },
  });
}
