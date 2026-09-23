// src/components/discipline/DisciplinaryCheckModal.tsx
// Modal de consultation détaillée de l'éligibilité disciplinaire et audit d'override

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type {
  PlayerEligibilityResult,
  MatchEligibilityContext,
} from '../../models/PlayerDisciplinary';
import { playerDisciplinaryService } from '../../services/playerDisciplinary.service';
import { colors as c, spacing, radius } from '../../theme/designTokens';
import { PlayerSuspensionBadge } from './PlayerSuspensionBadge';

interface DisciplinaryCheckModalProps {
  visible: boolean;
  onClose: () => void;
  result: PlayerEligibilityResult | null;
  matchContext?: MatchEligibilityContext;
  clubId: string;
  currentUserName?: string;
  currentUserUid?: string;
  canOverride?: boolean;
  onOverrideSaved?: () => void;
}

export const DisciplinaryCheckModal: React.FC<DisciplinaryCheckModalProps> = ({
  visible,
  onClose,
  result,
  matchContext,
  clubId,
  currentUserName = 'Staff Technique',
  currentUserUid = 'staff_uid',
  canOverride = true,
  onOverrideSaved,
}) => {
  const styles = stylesStatic;

  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [officialDocRef, setOfficialDocRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!result) return null;

  const handleSaveOverride = async () => {
    if (!overrideReason.trim() || !officialDocRef.trim()) {
      Alert.alert(
        'Champs obligatoires',
        'Le motif et la référence du document officiel sont indispensables pour la traçabilité réglementaire.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await playerDisciplinaryService.recordManualOverride(clubId, {
        player_uid: result.player_uid,
        license_number: result.license_number || 'SANS_LICENCE',
        match_id: matchContext?.match_id,
        authorized_by_uid: currentUserUid,
        authorized_by_name: currentUserName,
        reason: overrideReason.trim(),
        official_document_ref: officialDocRef.trim(),
      });

      Alert.alert(
        'Déblocage enregistré',
        'Le déblocage exceptionnel a été consigné avec succès dans le registre d’audit du club.'
      );
      setShowOverrideForm(false);
      setOverrideReason('');
      setOfficialDocRef('');
      if (onOverrideSaved) {
        onOverrideSaved();
      }
    } catch {
      Alert.alert('Erreur', 'Impossible d’enregistrer le déblocage exceptionnel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFriendly = matchContext?.event_type === 'friendly' || matchContext?.is_official === false;
  const sanction = result.active_sanction;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* En-tête */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="shield-checkmark-outline" size={22} color={c.brand} />
              <Text style={styles.headerTitle}>Contrôle d'Éligibilité FFF</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Fermer la fiche d'éligibilité"
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={22} color={c.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Fiche Joueur */}
            <View style={styles.playerBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.playerName}>{result.player_name}</Text>
                <Text style={styles.playerMeta}>
                  {result.license_number
                    ? `N° Licence FFF : ${result.license_number}`
                    : 'Aucun N° de licence renseigné'}
                </Text>
              </View>
              <PlayerSuspensionBadge status={result.status} size="md" />
            </View>

            {/* Synthèse du Statut */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Statut réglementaire</Text>
              <View style={styles.statusBox}>
                <Text style={styles.statusSummary}>{result.summary}</Text>
                <Text style={styles.statusReason}>{result.detailed_reason}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>Source : {result.source_label}</Text>
                </View>
              </View>
            </View>

            {/* Note Match Amical si applicable */}
            {isFriendly && (
              <View style={styles.friendlyNoteBox}>
                <Ionicons name="information-circle-outline" size={18} color={c.brand} />
                <Text style={styles.friendlyNoteText}>
                  Match amical : les rencontres amicales ne purgent jamais une suspension
                  de compétition officielle (Règlements Généraux FFF Art. 226).
                </Text>
              </View>
            )}

            {/* Détails de la sanction si présente */}
            {sanction && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Détail de la décision disciplinaire</Text>
                <View style={styles.sanctionCard}>
                  <View style={styles.sanctionRow}>
                    <Text style={styles.sanctionLabel}>Commission :</Text>
                    <Text style={styles.sanctionValue}>{sanction.commission_name}</Text>
                  </View>
                  <View style={styles.sanctionRow}>
                    <Text style={styles.sanctionLabel}>Dossier / PV :</Text>
                    <Text style={styles.sanctionValue}>{sanction.pv_number}</Text>
                  </View>
                  <View style={styles.sanctionRow}>
                    <Text style={styles.sanctionLabel}>Date du PV :</Text>
                    <Text style={styles.sanctionValue}>{sanction.pv_date}</Text>
                  </View>
                  <View style={styles.sanctionRow}>
                    <Text style={styles.sanctionLabel}>Prise d'effet légale :</Text>
                    <Text style={[styles.sanctionValue, { color: c.error }]}>
                      {sanction.effective_date} (0h00)
                    </Text>
                  </View>
                  <View style={styles.sanctionRow}>
                    <Text style={styles.sanctionLabel}>Sanction prononcée :</Text>
                    <Text style={styles.sanctionValue}>
                      {sanction.sanction_type === 'time_fixed'
                        ? `Temps ferme : du ${sanction.start_date || 'N/A'} au ${sanction.end_date || 'N/A'}`
                        : `${sanction.matches_total} match(s) ferme(s) (${sanction.matches_served} purgé(s))`}
                    </Text>
                  </View>
                  {sanction.notes && (
                    <View style={[styles.sanctionRow, { flexDirection: 'column', gap: 4 }]}>
                      <Text style={styles.sanctionLabel}>Motif / Infraction :</Text>
                      <Text style={styles.sanctionNotes}>{sanction.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Override manuel actif */}
            {result.is_overridden && result.override_details && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Déblocage officiel consigné</Text>
                <View style={styles.overrideCard}>
                  <Text style={styles.overrideTitle}>
                    Autorisé par {result.override_details.authorized_by_name} le{' '}
                    {new Date(result.override_details.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                  <Text style={styles.overrideBody}>
                    Motif : {result.override_details.reason}
                  </Text>
                  <Text style={styles.overrideDoc}>
                    Réf. officielle : {result.override_details.official_document_ref}
                  </Text>
                </View>
              </View>
            )}

            {/* Section Déblocage Exceptionnel Traçable */}
            {canOverride && !result.is_overridden && (result.status === 'suspended' || result.status === 'verification_required') && (
              <View style={styles.section}>
                {!showOverrideForm ? (
                  <Pressable
                    onPress={() => setShowOverrideForm(true)}
                    style={styles.overrideToggleBtn}
                  >
                    <Ionicons name="document-text-outline" size={16} color={c.text} />
                    <Text style={styles.overrideToggleText}>
                      Consigner un déblocage exceptionnel (Revue officielle)
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.overrideForm}>
                    <Text style={styles.formTitle}>Déblocage officiel & Audit trail</Text>
                    <Text style={styles.formHelp}>
                      Cette action est tracée et engage la responsabilité du club. Indiquez la référence du PV de levée ou de conciliation.
                    </Text>

                    <Text style={styles.inputLabel}>Réf. Document Officiel *</Text>
                    <TextInput
                      value={officialDocRef}
                      onChangeText={setOfficialDocRef}
                      placeholder="ex: PV N°12 Rectificatif Commission d'Appel"
                      placeholderTextColor={c.textMuted}
                      style={styles.textInput}
                    />

                    <Text style={styles.inputLabel}>Motif du déblocage *</Text>
                    <TextInput
                      value={overrideReason}
                      onChangeText={setOverrideReason}
                      placeholder="ex: Recours suspensif accordé par la commission le 12/10"
                      placeholderTextColor={c.textMuted}
                      multiline
                      numberOfLines={3}
                      style={[styles.textInput, styles.textArea]}
                    />

                    <View style={styles.formActions}>
                      <Pressable
                        onPress={() => setShowOverrideForm(false)}
                        style={styles.btnSecondary}
                      >
                        <Text style={styles.btnSecondaryText}>Annuler</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleSaveOverride}
                        disabled={isSubmitting}
                        style={[styles.btnPrimary, isSubmitting && { opacity: 0.6 }]}
                      >
                        <Text style={styles.btnPrimaryText}>
                          {isSubmitting ? 'Enregistrement...' : 'Valider le déblocage'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Pied de carte */}
          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              style={styles.closeFooterBtn}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <Text style={styles.closeFooterBtnText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const stylesStatic = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.md,
    },
    card: {
      width: '100%',
      maxWidth: 520,
      maxHeight: '90%',
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
    },
    closeBtn: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    body: {
      flex: 1,
    },
    bodyContent: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    playerBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.sm,
    },
    playerName: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
    },
    playerMeta: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 2,
    },
    section: {
      gap: 6,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'uppercase',
      color: c.textMuted,
      letterSpacing: 0.5,
    },
    statusBox: {
      backgroundColor: c.surface,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      gap: 6,
    },
    statusSummary: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    statusReason: {
      fontSize: 13,
      color: c.textMuted,
      lineHeight: 18,
    },
    metaRow: {
      marginTop: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      paddingTop: 6,
    },
    metaText: {
      fontSize: 11,
      color: c.textMuted,
      fontStyle: 'italic',
    },
    friendlyNoteBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(59, 130, 246, 0.08)',
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: 'rgba(59, 130, 246, 0.25)',
      gap: 8,
    },
    friendlyNoteText: {
      flex: 1,
      fontSize: 12,
      color: c.text,
      lineHeight: 16,
    },
    sanctionCard: {
      backgroundColor: c.surface,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      gap: 8,
    },
    sanctionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    sanctionLabel: {
      fontSize: 12,
      color: c.textMuted,
      width: '40%',
    },
    sanctionValue: {
      fontSize: 12,
      fontWeight: '600',
      color: c.text,
      width: '60%',
      textAlign: 'right',
    },
    sanctionNotes: {
      fontSize: 12,
      color: c.text,
      fontStyle: 'italic',
    },
    overrideCard: {
      backgroundColor: 'rgba(34, 197, 94, 0.08)',
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: 'rgba(34, 197, 94, 0.3)',
      gap: 4,
    },
    overrideTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: c.success,
    },
    overrideBody: {
      fontSize: 12,
      color: c.text,
    },
    overrideDoc: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 2,
    },
    overrideToggleBtn: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: spacing.md,
    },
    overrideToggleText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.text,
    },
    overrideForm: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    formTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
    },
    formHelp: {
      fontSize: 12,
      color: c.textMuted,
      lineHeight: 16,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: c.text,
      marginTop: 4,
    },
    textInput: {
      minHeight: 44,
      backgroundColor: c.surface,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: spacing.md,
      fontSize: 13,
      color: c.text,
    },
    textArea: {
      minHeight: 70,
      paddingTop: spacing.sm,
      textAlignVertical: 'top',
    },
    formActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    btnSecondary: {
      flex: 1,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    btnSecondaryText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textMuted,
    },
    btnPrimary: {
      flex: 1,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: radius.sm,
      backgroundColor: c.brand,
    },
    btnPrimaryText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    footer: {
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    closeFooterBtn: {
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    closeFooterBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
    },
  });
