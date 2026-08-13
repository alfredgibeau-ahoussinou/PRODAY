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
import { useAdminStyles, ADMIN_COLORS } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import {
  ADMIN_PRODUCT_LINES,
  adminProductLineLabel,
  adminRoleHint,
  adminRolesForProductLine,
  resolveAdminProductLine,
} from '../../utils/adminProductLine';
import { adminGenderLabel } from '../../utils/adminUserDisplay';
import { getUserProductLine } from '../../utils/productLineAccess';
import { getRoleLabel } from '../../screens/signup/signupFlowConfig';
import { defaultRoleForProductLine } from '../../content/universeRoles';
import { useTranslation } from '../../context/LocaleContext';
import { PlayerLevelBadgePill } from '../player/PlayerLevelBadgePill';
import { isJoueurProductLine, playerLevelBadgeFor } from '../../utils/playerLevelBadge';

const VERIFY: VerificationStatus[] = ['NOT_REQUIRED', 'PENDING', 'VERIFIED', 'REJECTED'];

const VERIFY_LABEL: Record<VerificationStatus, string> = {
  NOT_REQUIRED: 'Non requise',
  PENDING: 'En attente',
  VERIFIED: 'Vérifié',
  REJECTED: 'Rejeté',
};

export type AdminUserEditPatch = {
  display_name: string;
  city: string;
  role: UserRole;
  product_line: ProductLineId;
  verification_status: VerificationStatus;
  is_verified: boolean;
  sponsor_approved: boolean;
  job_title: string;
  medical_specialty: string | null;
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
    setRole(user.role === 'physio' ? 'coach' : user.role);
    const line = getUserProductLine(user);
    setProductLine(line === 'sante' ? 'pro_staff' : line);
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
    // Pôle Joueur unifié : conserver le stockage existant (amateur / pro_player / legacy).
    if (isJoueurProductLine(line) && isJoueurProductLine(productLine)) {
      setProductLine(resolveAdminProductLine(nextRole, productLine));
      return;
    }
    setProductLine(resolveAdminProductLine(nextRole, line));
  };

  const metierRoles = adminRolesForProductLine(
    isJoueurProductLine(productLine) ? 'amateur' : productLine,
  );

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
    role === 'sponsor';

  return (
    <AnimatedModalShell
      visible={visible}
      onClose={onClose}
      closeLabel="Fermer"
      themeColors={ADMIN_COLORS}
    >
      <View style={styles.sheetInner}>
        <Text style={styles.eyebrow}>Administration</Text>
        <Text style={styles.title}>Modifier l&apos;utilisateur</Text>
        <Text style={styles.sub}>{user.email}</Text>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {(user.role === 'player' || user.profile?.gender != null) && (
            <View style={styles.readOnlyBlock}>
              <Text style={styles.label}>Genre (lecture seule)</Text>
              <Text style={styles.readOnlyValue}>{adminGenderLabel(user.profile?.gender)}</Text>
              {user.role === 'player' ? (
                <>
                  <Text style={[styles.label, styles.labelFollow]}>Badge niveau joueur (lecture seule)</Text>
                  <View style={styles.readOnlyBadgeRow}>
                    <PlayerLevelBadgePill user={user} showVerified={false} />
                    <Text style={styles.readOnlyHint}>
                      {playerLevelBadgeFor(user).label}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Nom affiché</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholderTextColor={c.textMuted}
            />
            <Text style={[styles.label, styles.labelFollow]}>Ville</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholderTextColor={c.textMuted}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Univers</Text>
            <View style={styles.chipRow}>
              {ADMIN_PRODUCT_LINES.map((line) => {
                const active = isJoueurProductLine(line)
                  ? isJoueurProductLine(productLine)
                  : productLine === line;
                return (
                  <TouchableOpacity
                    key={line}
                    style={[styles.chip, active && styles.chipOn]}
                    onPress={() => applyProductLine(line)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextOn]}>
                      {adminProductLineLabel(line)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
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
          </View>

          {showJobTitle ? (
            <View style={styles.section}>
              <Text style={styles.label}>Intitulé métier (profil)</Text>
              <TextInput
                style={styles.input}
                value={jobTitle}
                onChangeText={setJobTitle}
                placeholder="Ex. Coach U17, Agent FIFA, Kiné du sport…"
                placeholderTextColor={c.textMuted}
              />
            </View>
          ) : null}

          {needsVerifyUi ? (
            <View style={styles.section}>
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
                      {VERIFY_LABEL[v]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
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
                thumbColor={c.surface}
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
                medical_specialty: null,
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
          placeholder="Motif (optionnel). Visible dans la notification"
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
      backgroundColor: c.backgroundAlt,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    sheet: {
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: c.brand,
      marginBottom: spacing.xs,
    },
    title: { fontSize: 22, fontWeight: '800', color: c.text, letterSpacing: -0.3 },
    sub: { fontSize: 13, color: c.textMuted, marginBottom: spacing.md, marginTop: 2 },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: spacing.md, gap: spacing.sm },
    section: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
    },
    readOnlyBlock: {
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    readOnlyValue: { fontSize: 15, fontWeight: '800', color: c.text, marginBottom: spacing.xs },
    readOnlyBadgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: 2,
    },
    readOnlyHint: { fontSize: 11, color: c.textMuted, fontWeight: '600' },
    label: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: c.textMuted,
      marginBottom: spacing.xs,
    },
    labelFollow: { marginTop: spacing.sm },
    hint: {
      fontSize: 12,
      color: c.textMuted,
      marginBottom: spacing.sm,
      marginTop: -2,
      lineHeight: 16,
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: 15,
      color: c.text,
      backgroundColor: c.backgroundAlt,
      marginBottom: spacing.sm,
    },
    textArea: { minHeight: 88, textAlignVertical: 'top' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: 2 },
    chip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.backgroundAlt,
    },
    chipOn: { backgroundColor: c.accent, borderColor: c.accent },
    chipText: { fontSize: 12, fontWeight: '700', color: c.textSecondary },
    chipTextOn: { color: c.brandInverse },
    roleList: { gap: spacing.xs },
    roleCard: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: c.backgroundAlt,
    },
    roleCardOn: {
      backgroundColor: c.brandSoft,
      borderColor: c.brand,
    },
    roleCardTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    roleCardTitleOn: { color: c.brand },
    roleCardHint: { fontSize: 11, color: c.textMuted, marginTop: 2 },
    roleCardHintOn: { color: c.textSecondary },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    switchCopy: { flex: 1 },
    switchTitle: { fontSize: 13, fontWeight: '800', color: c.text },
    switchSub: { fontSize: 11, color: c.textMuted, marginTop: 2, lineHeight: 15 },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.backgroundAlt,
    },
    cancelBtn: {
      flex: 1,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      backgroundColor: c.surface,
    },
    cancelText: { fontWeight: '800', color: c.text },
    saveBtn: {
      flex: 1.2,
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
