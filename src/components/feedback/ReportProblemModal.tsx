import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme/designTokens';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { useAppearance } from '../../context/AppearanceContext';
import { LiquidGlassSurface } from '../ui/LiquidGlassSurface';
import {
  trialIssueReportService,
  APP_TRIAL_VERSION,
  type TrialIssueReportInput,
} from '../../services/trialIssueReport.service';
import type { UserRole } from '../../models/User';

export interface ReportProblemModalProps {
  visible: boolean;
  onClose: () => void;
  userRole?: UserRole;
  currentRoute?: string;
}

export const ReportProblemModal: React.FC<ReportProblemModalProps> = ({
  visible,
  onClose,
  userRole = 'player',
  currentRoute = 'App',
}) => {
  const { isEffectiveLight } = useAppearance();
  const isDark = !isEffectiveLight;

  const [title, setTitle] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [observedBehavior, setObservedBehavior] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReportId, setSuccessReportId] = useState<string | null>(null);

  // Charger le brouillon existant à l'ouverture
  useEffect(() => {
    if (visible) {
      setErrorMessage(null);
      setSuccessReportId(null);
      trialIssueReportService.getDraft().then((draft) => {
        if (draft) {
          if (draft.title) setTitle(draft.title);
          if (draft.expectedBehavior) setExpectedBehavior(draft.expectedBehavior);
          if (draft.observedBehavior) setObservedBehavior(draft.observedBehavior);
          if (draft.screenshotUrl) setScreenshotUrl(draft.screenshotUrl);
        }
      });
    }
  }, [visible]);

  // Sauvegarder automatiquement le brouillon lors de la saisie
  const handleTextChange = (field: keyof TrialIssueReportInput, value: string) => {
    if (field === 'title') setTitle(value);
    if (field === 'expectedBehavior') setExpectedBehavior(value);
    if (field === 'observedBehavior') setObservedBehavior(value);
    if (field === 'screenshotUrl') setScreenshotUrl(value);

    trialIssueReportService.saveDraft({
      title: field === 'title' ? value : title,
      expectedBehavior: field === 'expectedBehavior' ? value : expectedBehavior,
      observedBehavior: field === 'observedBehavior' ? value : observedBehavior,
      screenshotUrl: field === 'screenshotUrl' ? value : screenshotUrl,
      currentRoute,
      userRole,
    });
  };

  const handleSubmit = async () => {
    if (!title.trim() || !observedBehavior.trim()) {
      prodayHaptics.warning();
      setErrorMessage('Merci de remplir au moins le titre et ce qui s’est réellement passé.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    prodayHaptics.impactMedium();

    const result = await trialIssueReportService.submitReport({
      title,
      expectedBehavior,
      observedBehavior,
      screenshotUrl,
      currentRoute,
      userRole,
    });

    setSubmitting(false);

    if (result.success) {
      prodayHaptics.confirm();
      setSuccessReportId(result.reportId);
      // Réinitialiser les champs
      setTitle('');
      setExpectedBehavior('');
      setObservedBehavior('');
      setScreenshotUrl('');
    } else {
      prodayHaptics.error();
      setErrorMessage(result.error || 'Erreur lors de l’envoi. Ton texte reste sauvegardé.');
    }
  };

  const handleClose = () => {
    prodayHaptics.selection();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}
      >
        <LiquidGlassSurface
          variant="card"
          forceOpaque
          style={[
            styles.modalContent,
            { backgroundColor: isDark ? 'rgba(20, 24, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)' },
          ]}
        >
          {/* En-tête */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="bug" size={18} color="#FF9F43" />
              </View>
              <div>
                <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  Signaler un problème
                </Text>
                <Text style={styles.headerSub}>Retour d'essai club ProDay</Text>
              </div>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {successReportId ? (
              <View style={styles.successBox}>
                <View style={styles.successIconBadge}>
                  <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                </View>
                <Text style={[styles.successTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  Signalement bien transmis !
                </Text>
                <Text style={styles.successBody}>
                  Merci pour ton aide lors de cet essai club. Ton retour a été consigné avec le ticket de référence :
                </Text>
                <View style={styles.ticketBadge}>
                  <Text style={styles.ticketText}>{successReportId}</Text>
                </View>
                <Text style={styles.successHelp}>
                  Notre équipe technique examine l'incident. Tu peux fermer cette fenêtre et continuer d'utiliser ProDay.
                </Text>
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={handleClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnPrimaryText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Bandeau de transparence technique & confidentialité */}
                <View style={styles.privacyBanner}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                    <Text style={styles.privacyBannerTitle}>Contexte technique transmis</Text>
                  </View>
                  <Text style={styles.privacyBannerText}>
                    Version : {APP_TRIAL_VERSION} · Rôle : {userRole} · Écran : {currentRoute}
                  </Text>
                  <Text style={styles.privacyGuarantee}>
                    🔒 Garantie : Aucun mot de passe, message privé ni document médical n'est transmis.
                  </Text>
                </View>

                {errorMessage ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* 1. Titre / Description courte */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: isDark ? '#E5E7EB' : '#374151' }]}>
                    Description courte du problème <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.inputSingle,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        color: isDark ? '#FFFFFF' : '#111827',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      },
                    ]}
                    placeholder="Ex: Le bouton de validation du match ne réagit pas"
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    value={title}
                    onChangeText={(val) => handleTextChange('title', val)}
                  />
                </View>

                {/* 2. Ce que vous attendiez */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: isDark ? '#E5E7EB' : '#374151' }]}>
                    Ce que tu attendais (comportement attendu)
                  </Text>
                  <TextInput
                    style={[
                      styles.inputMulti,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        color: isDark ? '#FFFFFF' : '#111827',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      },
                    ]}
                    placeholder="Ex: La feuille de présence devait enregistrer mon pointage et passer au vert"
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    multiline
                    numberOfLines={3}
                    value={expectedBehavior}
                    onChangeText={(val) => handleTextChange('expectedBehavior', val)}
                  />
                </View>

                {/* 3. Ce qui s'est réellement passé */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: isDark ? '#E5E7EB' : '#374151' }]}>
                    Ce qui s'est réellement passé <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.inputMulti,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        color: isDark ? '#FFFFFF' : '#111827',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      },
                    ]}
                    placeholder="Ex: Une roue de chargement tourne sans fin ou un message d'erreur est apparu"
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    multiline
                    numberOfLines={3}
                    value={observedBehavior}
                    onChangeText={(val) => handleTextChange('observedBehavior', val)}
                  />
                </View>

                {/* 4. Capture d'écran (optionnelle) */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: isDark ? '#E5E7EB' : '#374151' }]}>
                    Lien ou référence de capture d'écran (optionnel)
                  </Text>
                  <TextInput
                    style={[
                      styles.inputSingle,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        color: isDark ? '#FFFFFF' : '#111827',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      },
                    ]}
                    placeholder="Ex: capture prise lors de la séance"
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    value={screenshotUrl}
                    onChangeText={(val) => handleTextChange('screenshotUrl', val)}
                  />
                </View>

                {/* Boutons d'action */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleClose}
                    activeOpacity={0.7}
                    disabled={submitting}
                  >
                    <Text style={[styles.cancelBtnText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                      Annuler
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtnPrimary, submitting && { opacity: 0.6 }]}
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
                        <Text style={styles.actionBtnPrimaryText}>Envoyer le rapport</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </LiquidGlassSurface>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 159, 67, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 12,
    color: '#8E8E93',
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    paddingVertical: spacing.md,
  },
  privacyBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: spacing.md,
  },
  privacyBannerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.3,
  },
  privacyBannerText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  privacyGuarantee: {
    fontSize: 10,
    color: '#6EE7B7',
    fontStyle: 'italic',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputSingle: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputMulti: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtnPrimary: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  successBox: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  successIconBadge: {
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  successBody: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  ticketBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: spacing.md,
  },
  ticketText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  successHelp: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: 20,
  },
});
