import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { AnimatedDialogShell } from '../motion/AnimatedDialogShell';
import type { User, UserRole, VerificationStatus } from '../../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../../models/User';
import type { ProductLineId } from '../../models/ProductLine';
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
import { getUserProductLine } from '../../utils/productLineAccess';
import { getRoleLabel } from '../../screens/signup/signupFlowConfig';
import { defaultRoleForProductLine } from '../../content/universeRoles';
import { useTranslation } from '../../context/LocaleContext';

const VERIFY: VerificationStatus[] = ['NOT_REQUIRED', 'PENDING', 'VERIFIED', 'REJECTED'];

export type AdminUserEditPatch = {
  display_name: string;
  city: string;
  role: UserRole;
  product_line: ProductLineId;
  verification_status: VerificationStatus;
  is_verified: boolean;
  sponsor_approved: boolean;
  job_title: string;
};

interface AdminUserEditModalProps {
  visible: boolean;
  user: User | null;
  saving: boolean;
  onClose: () => void;
  onSave: (patch: AdminUserEditPatch) => void;
}

export const AdminUserEditModal: React.FC<AdminUserEditModalProps> = ({
  visible,
  user,
  saving,
  onClose,
  onSave,
}) => {
  const { colors: c } = useAdminStyles();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(c), [c]);
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<UserRole>('player');
  const [productLine, setProductLine] = useState<ProductLineId>('amateur');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('NOT_REQUIRED');
  const [sponsorApproved, setSponsorApproved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.display_name);
    setCity(user.city ?? '');
    setJobTitle(user.profile?.job_title ?? '');
    setRole(user.role);
    setProductLine(getUserProductLine(user));
    setVerificationStatus(user.verification_status);
    setSponsorApproved(user.sponsor_approved === true);
  }, [user]);

  const applyRole = (next: UserRole) => {
    setRole(next);
    setProductLine(resolveAdminProductLine(next, productLine));
    if (next !== 'sponsor') setSponsorApproved(false);
  };

  const applyProductLine = (line: ProductLineId) => {
    const allowed = adminRolesForProductLine(line);
    const nextRole = allowed.includes(role) ? role : defaultRoleForProductLine(line);
    setRole(nextRole);
    if (nextRole !== 'sponsor') setSponsorApproved(false);
    setProductLine(resolveAdminProductLine(nextRole, line));
  };

  const metierRoles = adminRolesForProductLine(productLine);

  if (!user) return null;

  const needsVerifyUi =
    role === 'player' ||
    role === 'sponsor' ||
    ROLES_REQUIRING_VERIFICATION.includes(role);

  const showJobTitle =
    role === 'coach' ||
    role === 'agent' ||
    role === 'recruiter' ||
    role === 'organizer' ||
    role === 'club' ||
    role === 'sponsor' ||
    role === 'physio';

  return (
    <AnimatedModalShell visible={visible} onClose={onClose} closeLabel="Fermer">
      <View style={styles.sheetInner}>
        <Text style={styles.title}>Modifier l&apos;utilisateur</Text>
        <Text style={styles.sub}>{user.email}</Text>
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Nom affiché</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholderTextColor={c.textMuted}
          />
          <Text style={styles.label}>Ville</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholderTextColor={c.textMuted}
          />

          <Text style={styles.label}>Univers</Text>
          <View style={styles.chipRow}>
            {ADMIN_PRODUCT_LINES.map((line) => (
              <TouchableOpacity
                key={line}
                style={[styles.chip, productLine === line && styles.chipOn]}
                onPress={() => applyProductLine(line)}
              >
                <Text style={[styles.chipText, productLine === line && styles.chipTextOn]}>
                  {adminProductLineLabel(line)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Rôle métier</Text>
          <Text style={styles.hint}>
            Rôles compatibles avec {adminProductLineLabel(productLine)}
          </Text>
          <View style={styles.roleList}>
            {metierRoles.map((r) => {
              const active = role === r;
              const hint = adminRoleHint(r);
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleCard, active && styles.roleCardOn]}
                  onPress={() => applyRole(r)}
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

          {showJobTitle ? (
            <>
              <Text style={styles.label}>Intitulé métier (profil)</Text>
              <TextInput
                style={styles.input}
                value={jobTitle}
                onChangeText={setJobTitle}
                placeholder="Ex. Coach U17, Agent FIFA, Kiné du sport…"
                placeholderTextColor={c.textMuted}
              />
            </>
          ) : null}

          {needsVerifyUi ? (
            <>
              <Text style={styles.label}>Vérification</Text>
              <View style={styles.chipRow}>
                {VERIFY.map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.chip, verificationStatus === v && styles.chipOn]}
                    onPress={() => setVerificationStatus(v)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        verificationStatus === v && styles.chipTextOn,
                      ]}
                    >
                      {v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}

          {role === 'sponsor' ? (
            <View style={styles.switchRow}>
              <View style={styles.switchCopy}>
                <Text style={styles.switchTitle}>Campagnes sponsor approuvées</Text>
                <Text style={styles.switchSub}>
                  Débloque la publication d’offres dans l’app (sponsor_approved).
                </Text>
              </View>
              <Switch
                value={sponsorApproved}
                onValueChange={setSponsorApproved}
                trackColor={{ false: c.border, true: c.accent }}
              />
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveDisabled]}
            disabled={saving}
            onPress={() =>
              onSave({
                display_name: displayName.trim(),
                city: city.trim(),
                role,
                product_line: resolveAdminProductLine(role, productLine),
                verification_status: verificationStatus,
                is_verified: verificationStatus === 'VERIFIED',
                sponsor_approved: role === 'sponsor' ? sponsorApproved : false,
                job_title: jobTitle.trim(),
              })
            }
          >
            {saving ? (
              <ActivityIndicator color={c.brandInverse} />
            ) : (
              <Text style={styles.saveText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedModalShell>
  );
};

interface AdminRejectModalProps {
  visible: boolean;
  userName: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const AdminRejectModal: React.FC<AdminRejectModalProps> = ({
  visible,
  userName,
  submitting,
  onClose,
  onConfirm,
}) => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const [reason, setReason] = useState('');

  return (
    <AnimatedDialogShell visible={visible} onClose={onClose}>
      <View style={[styles.sheet, { backgroundColor: c.surface }]}>
        <Text style={styles.title}>Rejeter la vérification</Text>
        <Text style={styles.sub}>{userName}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={reason}
          onChangeText={setReason}
          placeholder="Motif (optionnel) — visible dans la notification"
          placeholderTextColor={c.textMuted}
          multiline
        />
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, styles.rejectBtn, submitting && styles.saveDisabled]}
            disabled={submitting}
            onPress={() => onConfirm(reason.trim())}
          >
            {submitting ? (
              <ActivityIndicator color={c.brandInverse} />
            ) : (
              <Text style={styles.saveText}>Confirmer le rejet</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedDialogShell>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    sheetInner: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    sheet: {
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    title: { fontSize: 20, fontWeight: '900', color: c.text },
    sub: { fontSize: 13, color: c.textMuted, marginBottom: spacing.md },
    label: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textSecondary,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    hint: {
      fontSize: 11,
      color: c.textMuted,
      marginBottom: spacing.sm,
      marginTop: -2,
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: 15,
      color: c.text,
      backgroundColor: c.background,
    },
    textArea: { minHeight: 88, textAlignVertical: 'top' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
    chip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipOn: { backgroundColor: c.accent, borderColor: c.accent },
    chipText: { fontSize: 11, fontWeight: '700', color: c.textSecondary },
    chipTextOn: { color: c.brandInverse },
    roleList: { gap: spacing.xs, marginBottom: spacing.sm },
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
      borderColor: c.accent,
    },
    roleCardTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    roleCardTitleOn: { color: c.brandInverse },
    roleCardHint: { fontSize: 11, color: c.textMuted, marginTop: 2 },
    roleCardHintOn: { color: c.brandInverse, opacity: 0.85 },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
    },
    switchCopy: { flex: 1 },
    switchTitle: { fontSize: 13, fontWeight: '800', color: c.text },
    switchSub: { fontSize: 11, color: c.textMuted, marginTop: 2, lineHeight: 15 },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
    cancelBtn: {
      flex: 1,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    cancelText: { fontWeight: '800', color: c.text },
    saveBtn: {
      flex: 1,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: c.accent,
      alignItems: 'center',
    },
    rejectBtn: { backgroundColor: c.error },
    saveDisabled: { opacity: 0.6 },
    saveText: { fontWeight: '900', color: c.brandInverse },
  });
}
