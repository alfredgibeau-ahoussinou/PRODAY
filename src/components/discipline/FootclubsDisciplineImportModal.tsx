// src/components/discipline/FootclubsDisciplineImportModal.tsx
// Modal d'importation des extractions de sanctions Footclubs FFF (CSV / Manuel)

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
import { playerDisciplinaryService } from '../../services/playerDisciplinary.service';
import { parseFootclubsDisciplineCsv } from '../../features/club/utils/footclubsDisciplineParser';
import { colors as c, spacing, radius } from '../../theme/designTokens';

interface FootclubsDisciplineImportModalProps {
  visible: boolean;
  onClose: () => void;
  clubId: string;
  onImportSuccess?: (count: number) => void;
}

const SAMPLE_CSV_TEMPLATE = `N° Licence;Nom;Prénom;Commission;N° Dossier;Date PV;Date Prise d'effet;Sanction;Compétition;Motif
2541890123;DUPONT;Lucas;Commission Régionale de Discipline;PV-2023-44;12/10/2023;16/10/2023;2 matchs;Championnat;Comportement antisportif
2549876543;MARTIN;Thomas;District 92 Discipline;PV-2023-18;15/10/2023;;1 match;Officiel;Deux cartons jaunes dans le même match
2541122334;BENALIA;Karim;Ligue Île-de-France;PV-2023-09;01/10/2023;02/10/2023;3 matchs;Toutes compétitions;Faute grossière`;

export const FootclubsDisciplineImportModal: React.FC<FootclubsDisciplineImportModalProps> = ({
  visible,
  onClose,
  clubId,
  onImportSuccess,
}) => {
  const styles = stylesStatic;

  const [csvText, setCsvText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewSummary, setPreviewSummary] = useState<{
    validCount: number;
    errors: string[];
  } | null>(null);

  const handlePreview = () => {
    if (!csvText.trim()) {
      Alert.alert('Contenu vide', 'Veuillez coller le contenu CSV extrait de Footclubs.');
      return;
    }

    const parsed = parseFootclubsDisciplineCsv(csvText.trim(), clubId);
    setPreviewSummary({
      validCount: parsed.validRowsCount,
      errors: parsed.errors,
    });
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      Alert.alert('Contenu vide', 'Veuillez coller le contenu CSV extrait de Footclubs.');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await playerDisciplinaryService.importFootclubsCsv(clubId, csvText.trim());
      if (res.success) {
        Alert.alert(
          'Importation réussie',
          `${res.importedCount} sanction(s) synchronisée(s) avec succès pour le club.`
        );
        if (onImportSuccess) {
          onImportSuccess(res.importedCount);
        }
        onClose();
      } else {
        Alert.alert(
          'Erreur d’import',
          res.errors.join('\n') || 'Impossible d’importer les sanctions.'
        );
      }
    } catch {
      Alert.alert('Erreur', 'Une erreur est survenue lors de l’enregistrement des sanctions.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = () => {
    setCsvText(SAMPLE_CSV_TEMPLATE);
    const parsed = parseFootclubsDisciplineCsv(SAMPLE_CSV_TEMPLATE, clubId);
    setPreviewSummary({
      validCount: parsed.validRowsCount,
      errors: parsed.errors,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="cloud-upload-outline" size={22} color={c.brand} />
              <Text style={styles.headerTitle}>Import Sanctions Footclubs (FFF)</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Fermer la modal d'import"
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
            {/* Guide Officiel Footclubs */}
            <View style={styles.guideCard}>
              <Text style={styles.guideTitle}>Procédure officielle d'extraction Footclubs</Text>
              <Text style={styles.guideStep}>
                1. Connectez-vous sur <Text style={styles.guideBold}>footclubs.fff.fr</Text> avec vos accès habilités.
              </Text>
              <Text style={styles.guideStep}>
                2. Rendez-vous dans le menu <Text style={styles.guideBold}>Discipline &gt; Extractions des sanctions / Cartons</Text>.
              </Text>
              <Text style={styles.guideStep}>
                3. Téléchargez l'export CSV ou copiez/collez le tableau ci-dessous.
              </Text>
              <Text style={styles.guideDisclaimer}>
                La FFF n'offrant pas d'API temps réel tierce, cette synchronisation par fichier officiel garantit des données certifiées et opposables.
              </Text>
            </View>

            {/* Zone de collage CSV */}
            <View style={styles.inputSection}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Contenu CSV extrait de Footclubs *</Text>
                <Pressable onPress={handleLoadSample}>
                  <Text style={styles.sampleLink}>Charger un exemple FFF</Text>
                </Pressable>
              </View>

              <TextInput
                value={csvText}
                onChangeText={(t) => {
                  setCsvText(t);
                  setPreviewSummary(null);
                }}
                placeholder="Collez ici le texte CSV Footclubs (séparateur point-virgule ou virgule)..."
                placeholderTextColor={c.textMuted}
                multiline
                numberOfLines={8}
                style={[styles.textInput, styles.textArea]}
              />

              <Pressable onPress={handlePreview} style={styles.previewBtn}>
                <Ionicons name="eye-outline" size={16} color={c.text} />
                <Text style={styles.previewBtnText}>Vérifier le fichier avant import</Text>
              </Pressable>
            </View>

            {/* Prévisualisation & Analyse */}
            {previewSummary && (
              <View style={styles.previewCard}>
                <View style={styles.previewRow}>
                  <Ionicons
                    name={previewSummary.validCount > 0 ? 'checkmark-circle' : 'alert-circle'}
                    size={20}
                    color={previewSummary.validCount > 0 ? c.success : c.error}
                  />
                  <Text style={styles.previewSummaryText}>
                    {previewSummary.validCount} sanction(s) reconnue(s) et prête(s) à être importée(s).
                  </Text>
                </View>

                {previewSummary.errors.length > 0 && (
                  <View style={styles.errorsBox}>
                    <Text style={styles.errorsTitle}>Alertes de parsing :</Text>
                    {previewSummary.errors.map((err, idx) => (
                      <Text key={idx} style={styles.errorItem}>
                        • {err}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.btnCancel}>
              <Text style={styles.btnCancelText}>Annuler</Text>
            </Pressable>
            <Pressable
              onPress={handleImport}
              disabled={isProcessing || !csvText.trim()}
              style={[
                styles.btnSubmit,
                (isProcessing || !csvText.trim()) && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.btnSubmitText}>
                {isProcessing ? 'Importation...' : 'Confirmer et Synchroniser'}
              </Text>
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
      maxWidth: 540,
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
    guideCard: {
      backgroundColor: 'rgba(59, 130, 246, 0.08)',
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: 'rgba(59, 130, 246, 0.25)',
      gap: 6,
    },
    guideTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: c.text,
      marginBottom: 2,
    },
    guideStep: {
      fontSize: 12,
      color: c.text,
      lineHeight: 18,
    },
    guideBold: {
      fontWeight: '700',
      color: c.brand,
    },
    guideDisclaimer: {
      fontSize: 11,
      color: c.textMuted,
      fontStyle: 'italic',
      marginTop: 4,
    },
    inputSection: {
      gap: 6,
    },
    inputHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: c.text,
    },
    sampleLink: {
      fontSize: 12,
      fontWeight: '600',
      color: c.brand,
    },
    textInput: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      fontSize: 12,
      fontFamily: 'monospace',
      color: c.text,
    },
    textArea: {
      minHeight: 140,
      textAlignVertical: 'top',
    },
    previewBtn: {
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
      marginTop: 4,
    },
    previewBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.text,
    },
    previewCard: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    previewSummaryText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.text,
      flex: 1,
    },
    errorsBox: {
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      padding: spacing.sm,
      borderRadius: radius.sm,
      gap: 2,
    },
    errorsTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: c.error,
    },
    errorItem: {
      fontSize: 11,
      color: c.error,
    },
    footer: {
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    btnCancel: {
      flex: 1,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    btnCancelText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textMuted,
    },
    btnSubmit: {
      flex: 2,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: radius.sm,
      backgroundColor: c.brand,
    },
    btnSubmitText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
