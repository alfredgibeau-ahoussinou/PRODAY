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
import type { ProductLineId } from '../../models/ProductLine';
import { Icon } from '../ui/Icon';
import { useAdminStyles } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import {
  ADMIN_PRODUCT_LINES,
  adminProductLineLabel,
  adminRoleHint,
  adminRolesForProductLine,
  resolveAdminProductLine,
} from '../../utils/adminProductLine';
import { defaultRoleForProductLine } from '../../content/universeRoles';
import { getRoleLabel } from '../../screens/signup/signupFlowConfig';
import { useTranslation } from '../../context/LocaleContext';

export interface CreateUserFormState {
  email: string;
  password: string;
  display_name: string;
  city: string;
  role: UserRole;
  product_line: ProductLineId;
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
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(c), [c]);
  const metierRoles = adminRolesForProductLine(form.product_line);

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

      <Text style={styles.fieldLabel}>Univers</Text>
      <View style={styles.roleGrid}>
        {ADMIN_PRODUCT_LINES.map((line) => (
          <TouchableOpacity
            key={line}
            style={[styles.roleChip, form.product_line === line && styles.roleChipOn]}
            onPress={() => {
              const allowed = adminRolesForProductLine(line);
              const role = allowed.includes(form.role)
                ? form.role
                : defaultRoleForProductLine(line);
              onChange({
                product_line: resolveAdminProductLine(role, line),
                role,
              });
            }}
          >
            <Text
              style={[
                styles.roleChipText,
                form.product_line === line && styles.roleChipTextOn,
              ]}
            >
              {adminProductLineLabel(line)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Rôle métier</Text>
      <Text style={styles.hint}>
        Rôles compatibles avec {adminProductLineLabel(form.product_line)}
      </Text>
      <View style={styles.roleList}>
        {metierRoles.map((r) => {
          const active = form.role === r;
          const hint = adminRoleHint(r);
          return (
            <TouchableOpacity
              key={r}
              style={[styles.roleCard, active && styles.roleCardOn]}
              onPress={() =>
                onChange({
                  role: r,
                  product_line: resolveAdminProductLine(r, form.product_line),
                })
              }
            >
              <Text style={[styles.roleCardTitle, active && styles.roleCardTitleOn]}>
                {getRoleLabel(r, t)}
              </Text>
              {hint ? (
                <Text style={[styles.roleCardHint, active && styles.roleCardHintOn]}>
                  {hint}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
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
    hint: {
      fontSize: 11,
      color: c.textMuted,
      marginBottom: spacing.sm,
      marginTop: -2,
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
    roleChipOn: { backgroundColor: c.accent, borderColor: c.brand },
    roleChipText: { fontSize: 12, fontWeight: '800', color: c.text },
    roleChipTextOn: { color: c.brandInverse },
    roleList: { gap: spacing.xs, marginBottom: spacing.lg },
    roleCard: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: c.background,
    },
    roleCardOn: {
      backgroundColor: c.accent,
      borderColor: c.brand,
    },
    roleCardTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    roleCardTitleOn: { color: c.brandInverse },
    roleCardHint: { fontSize: 11, color: c.textMuted, marginTop: 2 },
    roleCardHintOn: { color: c.brandInverse, opacity: 0.85 },
    submit: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: c.accent,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.brand,
    },
    submitText: { color: c.brandInverse, fontWeight: '900', fontSize: 15 },
  });
}
