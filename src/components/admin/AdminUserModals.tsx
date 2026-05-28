import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import type { User, UserRole, VerificationStatus } from '../../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../../models/User';
import { colors, spacing, radius } from '../../theme/designTokens';

const ROLES: UserRole[] = ['player', 'coach', 'club', 'agent', 'organizer', 'physio', 'sponsor'];
const VERIFY: VerificationStatus[] = ['NOT_REQUIRED', 'PENDING', 'VERIFIED', 'REJECTED'];

interface AdminUserEditModalProps {
  visible: boolean;
  user: User | null;
  saving: boolean;
  onClose: () => void;
  onSave: (patch: {
    display_name: string;
    city: string;
    role: UserRole;
    verification_status: VerificationStatus;
    is_verified: boolean;
  }) => void;
}

export const AdminUserEditModal: React.FC<AdminUserEditModalProps> = ({
  visible,
  user,
  saving,
  onClose,
  onSave,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState<UserRole>('player');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('NOT_REQUIRED');

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.display_name);
    setCity(user.city ?? '');
    setRole(user.role);
    setVerificationStatus(user.verification_status);
  }, [user]);

  if (!user) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Modifier l&apos;utilisateur</Text>
          <Text style={styles.sub}>{user.email}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Nom affiché</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.label}>Ville</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.label}>Rôle</Text>
            <View style={styles.chipRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.chip, role === r && styles.chipOn]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.chipText, role === r && styles.chipTextOn]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {(role === 'player' ||
              ROLES_REQUIRING_VERIFICATION.includes(role)) && (
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
            )}
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
                  verification_status: verificationStatus,
                  is_verified: verificationStatus === 'VERIFIED',
                })
              }
            >
              {saving ? (
                <ActivityIndicator color={colors.brandInverse} />
              ) : (
                <Text style={styles.saveText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  const [reason, setReason] = useState('');

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Rejeter la vérification</Text>
          <Text style={styles.sub}>{userName}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reason}
            onChangeText={setReason}
            placeholder="Motif (optionnel) — visible dans la notification"
            placeholderTextColor={colors.textMuted}
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
                <ActivityIndicator color={colors.brandInverse} />
              ) : (
                <Text style={styles.saveText}>Confirmer le rejet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  title: { fontSize: 20, fontWeight: '900', color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  chipTextOn: { color: colors.brandInverse },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: { fontWeight: '800', color: colors.text },
  saveBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    alignItems: 'center',
  },
  rejectBtn: { backgroundColor: colors.error },
  saveDisabled: { opacity: 0.6 },
  saveText: { fontWeight: '900', color: colors.brandInverse },
});
