import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../context/LocaleContext';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import type { User } from '../../models/User';
import { adminService, type AdminUserDocument } from '../../services/admin.service';
import { useAdminStyles } from './adminStyles';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AdminUserDocumentsModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
}

export const AdminUserDocumentsModal: React.FC<AdminUserDocumentsModalProps> = ({
  visible,
  user,
  onClose,
}) => {
  const { t } = useTranslation();
  const { colors: c } = useAdminStyles();
  const checkLabel: Record<string, string> = useMemo(
    () => ({
      identity: t('admin.doc.identity'),
      club_license: t('admin.doc.clubLicense'),
      parental_consent: t('admin.doc.parentalConsent'),
    }),
    [t]
  );
  const styles = useMemo(() => createStyles(c), [c]);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<AdminUserDocument[]>([]);

  useEffect(() => {
    if (!visible || !user) {
      setDocuments([]);
      return;
    }
    setLoading(true);
    adminService
      .listUserDocuments(user.uid)
      .then(setDocuments)
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, [visible, user?.uid]);

  if (!user) return null;

  const openDoc = (doc: AdminUserDocument) => {
    if (!doc.url) {
      Alert.alert(t('admin.doc.unavailable'), t('admin.doc.noUrl'));
      return;
    }
    Linking.openURL(doc.url).catch(() => {
      Alert.alert(t('admin.doc.openFailed'), t('admin.doc.storageRules'));
    });
  };

  return (
    <AnimatedModalShell visible={visible} onClose={onClose} closeLabel="Fermer">
      <View style={styles.sheet}>
        <Text style={styles.title}>Documents · {user.display_name}</Text>
        <Text style={styles.sub}>{user.email}</Text>

        {loading ? (
          <ActivityIndicator color={c.brand} style={styles.loader} />
        ) : documents.length === 0 ? (
          <Text style={styles.empty}>Aucun document uploadé pour ce compte.</Text>
        ) : (
          documents.map((doc) => (
            <TouchableOpacity key={doc.id} style={styles.row} onPress={() => openDoc(doc)}>
              <View style={styles.rowIcon}>
                <Icon name="document" size={18} color={c.brand} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>
                  {doc.verification_check
                    ? checkLabel[doc.verification_check] ?? doc.verification_check
                    : doc.name}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {doc.type}
                  {doc.url ? ' · Ouvrir' : ' · URL manquante'}
                </Text>
              </View>
              <Icon name="chevron-forward" size={16} color={c.textMuted} />
            </TouchableOpacity>
          ))
        )}
      </View>
    </AnimatedModalShell>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    sheet: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    title: { fontSize: 20, fontWeight: '900', color: c.text },
    sub: { fontSize: 13, color: c.textMuted, marginBottom: spacing.md },
    loader: { marginVertical: spacing.xl },
    empty: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      marginVertical: spacing.xl,
      lineHeight: 20,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.sm,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowCopy: { flex: 1, minWidth: 0 },
    rowTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    rowMeta: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  });
}
