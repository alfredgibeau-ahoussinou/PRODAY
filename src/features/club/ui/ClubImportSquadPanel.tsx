/**
 * Import Squad — import CSV FootClubs / FFF depuis l’effectif Club.
 * Formats : CSV (; , tab), colonnes licence / nom / prénom / catégorie / email.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { useClubTheme } from '../shell/ClubThemeContext';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { ClubText } from './clubUi';
import {
  parseFootclubsCsv,
  type ParsedLicenseRow,
} from '../utils/footclubsCsvParser';
import { clubLicenseService } from '../services/clubLicenseService';
import type { User } from '../../../models/User';

type Props = {
  clubId: string;
  existingPlayers: User[];
  approverUid: string;
  fffAffiliationNumber?: string;
  clubName?: string;
  clubCity?: string;
  onImported?: () => void;
  /** Mode compact = carte CTA dans Effectifs. */
  compact?: boolean;
};

export function ClubImportSquadPanel({
  clubId,
  existingPlayers,
  approverUid,
  fffAffiliationNumber,
  clubName,
  clubCity,
  onImported,
  compact = true,
}: Props) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const [open, setOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [rows, setRows] = useState<ParsedLicenseRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const applyText = useCallback((text: string) => {
    setCsvText(text);
    if (text.trim().length < 8) {
      setRows([]);
      setParseErrors([]);
      return;
    }
    const res = parseFootclubsCsv(text);
    setRows(res.success ? res.rows : []);
    setParseErrors(res.errors);
  }, []);

  const pickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/*',
          'text/csv',
          'text/comma-separated-values',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const asset = result.assets[0];
      const name = (asset.name || '').toLowerCase();
      if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        Alert.alert(
          'Excel non supporté directement',
          'Exportez depuis FootClubs / FFF en CSV (séparateur ;), puis réimportez ce fichier.',
        );
        return;
      }
      const content = await FileSystem.readAsStringAsync(asset.uri);
      applyText(content);
    } catch {
      Alert.alert('Fichier', 'Impossible de lire le fichier sélectionné.');
    }
  }, [applyText]);

  const runImport = useCallback(async () => {
    if (rows.length === 0) {
      Alert.alert('Aucune donnée', 'Choisissez un CSV FootClubs valide ou collez le contenu.');
      return;
    }
    setBusy(true);
    try {
      const summary = await clubLicenseService.importLicensedRoster({
        clubId,
        rows,
        approverUid,
        existingPlayers,
        fffAffiliationNumber,
        clubName,
        clubCity,
      });
      setOpen(false);
      setCsvText('');
      setRows([]);
      setParseErrors([]);
      onImported?.();
      const warn = summary.errors.filter(Boolean).join('\n');
      Alert.alert(
        'Import Squad terminé',
        `${summary.updatedCount} joueur(s) mis à jour.\n${summary.newPendingCount} nouveau(x) en attente de confirmation.${
          warn ? `\n\n${warn}` : '\n\nCache inscription FFF mis à jour si n° d’affiliation présent.'
        }`,
      );
    } catch (e) {
      Alert.alert('Import', e instanceof Error ? e.message : 'Échec de l’import.');
    } finally {
      setBusy(false);
    }
  }, [
    rows,
    clubId,
    approverUid,
    existingPlayers,
    fffAffiliationNumber,
    clubName,
    clubCity,
    onImported,
  ]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.category?.trim()) set.add(r.category.trim());
    });
    return [...set].slice(0, 8);
  }, [rows]);

  return (
    <View>
      <PressableSpring
        onPress={() => setOpen(true)}
        scaleTo={0.97}
        haptic
        style={compact ? styles.ctaCard : styles.ctaWide}
      >
        <View style={[styles.ctaIcon, { backgroundColor: tokens.accentSoft }]}>
          <Icon name="document" size={18} color={tokens.accent} />
        </View>
        <View style={styles.ctaCopy}>
          <ClubText variant="body" style={styles.ctaTitle}>
            Import Squad
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={2}>
            CSV FootClubs / FFF → effectif, catégories & cache inscription
          </ClubText>
        </View>
        <Icon name="chevron-forward" size={16} color={tokens.muted} />
      </PressableSpring>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <ClubText variant="h2">Import Squad</ClubText>
              <PressableSpring onPress={() => setOpen(false)} scaleTo={0.94} haptic>
                <Icon name="close" size={20} color={tokens.foreground} />
              </PressableSpring>
            </View>
            <ClubText variant="caption" muted style={styles.hint}>
              Formats : CSV FootClubs / FFF (; , ou tab). Colonnes : Licence, Nom, Prénom,
              Catégorie, Email. Excel → exporter en CSV d’abord.
            </ClubText>

            <View style={styles.actions}>
              <PressableSpring onPress={() => void pickFile()} scaleTo={0.97} haptic style={styles.btnPrimary}>
                <Icon name="document" size={16} color={tokens.onAccent} />
                <ClubText variant="caption" style={styles.btnPrimaryLabel}>
                  Choisir un fichier
                </ClubText>
              </PressableSpring>
            </View>

            <TextInput
              value={csvText}
              onChangeText={applyText}
              placeholder="Ou coller le CSV ici…"
              placeholderTextColor={tokens.faint}
              multiline
              style={styles.textArea}
              autoCorrect={false}
              autoCapitalize="none"
            />

            {parseErrors.length > 0 ? (
              <View style={styles.errorBox}>
                {parseErrors.slice(0, 4).map((e) => (
                  <ClubText key={e} variant="caption" style={{ color: tokens.danger }}>
                    {e}
                  </ClubText>
                ))}
              </View>
            ) : null}

            {rows.length > 0 ? (
              <View style={styles.preview}>
                <ClubText variant="label">
                  Aperçu · {rows.length} licencié{rows.length > 1 ? 's' : ''}
                </ClubText>
                {categories.length > 0 ? (
                  <ClubText variant="caption" muted>
                    Catégories : {categories.join(' · ')}
                  </ClubText>
                ) : null}
                <ScrollView style={styles.previewList} nestedScrollEnabled>
                  {rows.slice(0, 12).map((r) => (
                    <View key={`${r.licenseNumber}-${r.displayName}`} style={styles.previewRow}>
                      <ClubText variant="caption" style={{ fontWeight: '700', flex: 1 }} numberOfLines={1}>
                        {r.displayName}
                      </ClubText>
                      <ClubText variant="caption" muted numberOfLines={1}>
                        {r.category || '—'} · {r.licenseNumber || 'sans n°'}
                      </ClubText>
                    </View>
                  ))}
                  {rows.length > 12 ? (
                    <ClubText variant="caption" muted>
                      +{rows.length - 12} autres…
                    </ClubText>
                  ) : null}
                </ScrollView>
              </View>
            ) : null}

            <PressableSpring
              onPress={() => void runImport()}
              disabled={busy || rows.length === 0}
              scaleTo={0.97}
              haptic
              style={[
                styles.btnImport,
                (busy || rows.length === 0) && { opacity: 0.45 },
              ]}
            >
              {busy ? (
                <ActivityIndicator color={tokens.onAccent} />
              ) : (
                <ClubText variant="body" style={styles.btnPrimaryLabel}>
                  Importer {rows.length > 0 ? `(${rows.length})` : ''}
                </ClubText>
              )}
            </PressableSpring>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    ctaCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      padding: clubSpace.md,
      borderRadius: clubRadius.lg,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
    },
    ctaWide: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      padding: clubSpace.lg,
      borderRadius: clubRadius.xl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.accent + '55',
    },
    ctaIcon: {
      width: 40,
      height: 40,
      borderRadius: clubRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaCopy: { flex: 1, gap: 2 },
    ctaTitle: { fontWeight: '800' },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      maxHeight: '88%',
      backgroundColor: tokens.bg,
      borderTopLeftRadius: clubRadius.xxl,
      borderTopRightRadius: clubRadius.xxl,
      padding: clubSpace.lg,
      gap: clubSpace.md,
    },
    modalHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    hint: { lineHeight: 18 },
    actions: { flexDirection: 'row', gap: clubSpace.sm },
    btnPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: clubRadius.pill,
      backgroundColor: tokens.accent,
    },
    btnPrimaryLabel: { color: tokens.onAccent, fontWeight: '800' },
    textArea: {
      minHeight: 100,
      maxHeight: 140,
      borderRadius: clubRadius.md,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surface,
      color: tokens.foreground,
      padding: 12,
      fontSize: 12,
      textAlignVertical: 'top',
    },
    errorBox: {
      gap: 4,
      padding: 10,
      borderRadius: clubRadius.md,
      backgroundColor: tokens.danger + '18',
      borderWidth: 1,
      borderColor: tokens.danger + '44',
    },
    preview: { gap: 6 },
    previewList: { maxHeight: 160 },
    previewRow: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    btnImport: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: clubRadius.lg,
      backgroundColor: tokens.accent,
      marginBottom: clubSpace.md,
    },
  });
