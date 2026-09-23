import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion/PressableSpring';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { clubsService } from '../../services/clubs.service';
import { usersService } from '../../services/users.service';
import { extractSquadSheetCsv } from '../../services/squadSheet.service';
import { clubLicenseService } from '../../features/club/services/clubLicenseService';
import type { ParsedLicenseRow } from '../../features/club/utils/footclubsCsvParser';
import type { User } from '../../models/User';
import {
  COACH_COMPONENT_FALLBACK,
  type CoachComponentTokens,
} from '../../features/coach/theme/coachPitchTokens';
import {
  SCANNED_PDF_HINT,
  SPREADSHEET_HINT,
  classifySheetFile,
  parseImportedSheetText,
  resolvePdfWarnings,
  sheetCategories,
  sheetPreviewNames,
} from '../../utils/squadSheetImport';
import {
  proForm,
  proRadius,
  proSemantic,
  proSpace,
  proType,
} from '../../theme/professionalDesign';

type Props = {
  visible: boolean;
  onClose: () => void;
  onImported?: (summary: { updated: number; pending: number }) => void;
  tokens?: CoachComponentTokens;
};

type Stage = 'idle' | 'reading' | 'ready' | 'importing';

/**
 * Import d'effectif — CSV FootClubs / FFF ou feuille d'équipe PDF.
 *
 * Le PDF est converti **côté serveur** (le dépôt n'embarque aucun parseur PDF) ;
 * le tableau obtenu repasse par le parseur de licences du pôle Club, puis
 * l'écriture se fait dans les **vraies données du club** via
 * `clubLicenseService.importLicensedRoster` : adhésions et cache inscription FFF.
 * Rien n'est inventé : un document sans texte exploitable ne produit aucun joueur.
 */
export function CoachSquadImportPanel({ visible, onClose, onImported, tokens = COACH_COMPONENT_FALLBACK }: Props) {
  const profile = useSessionProfile();
  const uid = profile?.uid ?? '';
  const clubId = profile?.profile.club_id ?? '';

  const [stage, setStage] = useState<Stage>('idle');
  const [text, setText] = useState('');
  const [rows, setRows] = useState<ParsedLicenseRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busyLabel, setBusyLabel] = useState('');

  const [existingPlayers, setExistingPlayers] = useState<User[]>([]);
  const [club, setClub] = useState<{ name?: string; city?: string; fff?: string }>({});

  useEffect(() => {
    if (!visible || !clubId) return;
    let cancelled = false;
    void usersService
      .listMembersByClubId(clubId)
      .then((members) => {
        if (!cancelled) setExistingPlayers(members);
      })
      .catch(() => {
        if (!cancelled) setExistingPlayers([]);
      });
    void clubsService
      .getById(clubId)
      .then((found) => {
        if (cancelled || !found) return;
        setClub({
          name: found.name,
          city: found.city,
          fff: found.fff_affiliation_number,
        });
      })
      .catch(() => {
        if (!cancelled) setClub({});
      });
    return () => {
      cancelled = true;
    };
  }, [visible, clubId]);

  const reset = useCallback(() => {
    setStage('idle');
    setText('');
    setRows([]);
    setErrors([]);
    setWarnings([]);
    setBusyLabel('');
  }, []);

  const applyText = useCallback((value: string, incomingWarnings: string[] = []) => {
    setText(value);
    const parsed = parseImportedSheetText(value);
    setRows(parsed.rows);
    setErrors(parsed.errors);
    setWarnings(incomingWarnings);
    setStage(parsed.ok ? 'ready' : 'idle');
  }, []);

  const readPdf = useCallback(
    async (file: { uri: string; mimeType: string; fileName?: string }) => {
      if (!uid) {
        setErrors(['Connexion requise pour convertir une feuille PDF.']);
        return;
      }
      setStage('reading');
      setBusyLabel('Conversion de la feuille PDF…');
      setWarnings([]);
      setErrors([]);
      try {
        const extraction = await extractSquadSheetCsv({ uid, file });
        if (!extraction.csv.trim()) {
          setRows([]);
          setText('');
          setWarnings(resolvePdfWarnings(extraction.warnings));
          setErrors([]);
          setStage('idle');
          return;
        }
        applyText(extraction.csv, resolvePdfWarnings(extraction.warnings));
      } catch (error) {
        setErrors([
          error instanceof Error
            ? error.message
            : 'Conversion PDF impossible. Fournissez un export CSV FootClubs.',
        ]);
        setStage('idle');
      } finally {
        setBusyLabel('');
      }
    },
    [applyText, uid],
  );

  const pickCsv = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/*', 'text/csv', 'text/comma-separated-values', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const asset = result.assets[0];
      const kind = classifySheetFile(asset.name ?? '', asset.mimeType);
      if (kind === 'spreadsheet') {
        setWarnings([SPREADSHEET_HINT]);
        setRows([]);
        setStage('idle');
        return;
      }
      if (kind === 'pdf') {
        await readPdf({ uri: asset.uri, mimeType: asset.mimeType ?? 'application/pdf', fileName: asset.name ?? undefined });
        return;
      }
      setStage('reading');
      setBusyLabel('Lecture du fichier…');
      const content = await FileSystem.readAsStringAsync(asset.uri);
      applyText(content);
    } catch {
      setErrors(['Impossible de lire le fichier sélectionné.']);
      setStage('idle');
    } finally {
      setBusyLabel('');
    }
  }, [applyText, readPdf]);

  const runImport = useCallback(async () => {
    if (rows.length === 0) return;
    if (!clubId || !uid) {
      setErrors(['Aucun club rattaché à votre compte : import impossible.']);
      return;
    }
    setStage('importing');
    setBusyLabel('Écriture dans le club…');
    try {
      const summary = await clubLicenseService.importLicensedRoster({
        clubId,
        rows,
        approverUid: uid,
        existingPlayers,
        fffAffiliationNumber: club.fff,
        clubName: club.name,
        clubCity: club.city,
      });
      setErrors(summary.errors.filter(Boolean));
      if (summary.errors.length === 0) {
        onImported?.({
          updated: summary.updatedCount,
          pending: summary.newPendingCount,
        });
        reset();
        onClose();
        return;
      }
      setStage('ready');
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Échec de l’import.']);
      setStage('ready');
    } finally {
      setBusyLabel('');
    }
  }, [club, clubId, existingPlayers, onClose, onImported, reset, rows, uid]);

  const categories = useMemo(() => sheetCategories(rows), [rows]);
  const previewNames = useMemo(() => sheetPreviewNames(rows), [rows]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: tokens.bg }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.kicker, { color: tokens.accent }]}>IMPORT</Text>
            <Text style={[styles.title, { color: tokens.foreground }]}>Importer un effectif</Text>
            <Text style={[styles.subtitle, { color: tokens.muted }]}>
              CSV FootClubs / FFF ou feuille d’équipe PDF. Les joueurs sont écrits dans les données du club.
            </Text>
          </View>
          <PressableSpring
            onPress={onClose}
            scaleTo={0.94}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            style={[styles.closeBtn, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
          >
            <Icon name="close" size={18} color={tokens.foreground} />
          </PressableSpring>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pickRow}>
            <PressableSpring
              onPress={() => void pickCsv()}
              disabled={stage === 'reading' || stage === 'importing'}
              scaleTo={0.97}
              haptic
              accessibilityRole="button"
              accessibilityLabel="Choisir un fichier CSV ou PDF"
              style={[styles.pickBtn, { backgroundColor: tokens.accent }]}
            >
              <Icon name="document-text" size={17} color={tokens.onAccent} />
              <Text style={[styles.pickLabel, { color: tokens.onAccent }]}>
                Choisir un fichier
              </Text>
            </PressableSpring>
          </View>

          <Text style={[styles.hint, { color: tokens.muted }]}>
            Une feuille PDF est convertie sur le serveur puis effacée immédiatement. Un classeur
            Excel doit d’abord être exporté en CSV.
          </Text>

          {busyLabel ? (
            <View style={[styles.busy, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
              <ActivityIndicator color={tokens.accent} />
              <Text style={[styles.busyText, { color: tokens.foreground }]}>{busyLabel}</Text>
            </View>
          ) : null}

          <TextInput
            value={text}
            onChangeText={(value) => applyText(value)}
            placeholder="Ou coller le tableau ici (Licence;Nom;Prénom;Catégorie)"
            placeholderTextColor={tokens.muted}
            multiline
            autoCorrect={false}
            autoCapitalize="none"
            style={[
              styles.textArea,
              { backgroundColor: tokens.elevated, borderColor: tokens.border, color: tokens.foreground },
            ]}
          />

          {errors.length > 0 ? (
            <View style={[styles.noticeBox, { borderColor: proSemantic.danger }]}>
              {errors.slice(0, 4).map((entry) => (
                <Text key={entry} style={[styles.noticeText, { color: proSemantic.danger }]}>
                  {entry}
                </Text>
              ))}
            </View>
          ) : null}

          {warnings.length > 0 ? (
            <View style={[styles.noticeBox, { borderColor: proSemantic.warning }]}>
              {warnings.slice(0, 3).map((entry) => (
                <Text key={entry} style={[styles.noticeText, { color: proSemantic.warning }]}>
                  {entry}
                </Text>
              ))}
            </View>
          ) : null}

          {rows.length === 0 && warnings.length === 0 && !busyLabel ? (
            <Text style={[styles.hint, { color: tokens.muted }]}>{SCANNED_PDF_HINT}</Text>
          ) : null}

          {rows.length > 0 ? (
            <View style={[styles.preview, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
              <Text style={[styles.previewTitle, { color: tokens.foreground }]}>
                {`Aperçu · ${rows.length} licencié${rows.length > 1 ? 's' : ''}`}
              </Text>
              {categories.length > 0 ? (
                <Text style={[styles.previewMeta, { color: tokens.muted }]}>
                  {`Catégories : ${categories.join(' · ')}`}
                </Text>
              ) : null}
              {previewNames.map((name) => (
                <Text key={name} style={[styles.previewRow, { color: tokens.foreground }]} numberOfLines={1}>
                  {name}
                </Text>
              ))}
              {rows.length > previewNames.length ? (
                <Text style={[styles.previewMeta, { color: tokens.muted }]}>
                  {`+ ${rows.length - previewNames.length} autre(s)`}
                </Text>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: tokens.surface, borderTopColor: tokens.border }]}>
          <Text style={[styles.footerMeta, { color: tokens.muted }]}>
            {rows.length > 0 ? `${rows.length} joueur(s) prêt(s)` : 'Aucun joueur détecté'}
          </Text>
          <PressableSpring
            onPress={() => void runImport()}
            disabled={rows.length === 0 || stage === 'importing' || stage === 'reading'}
            scaleTo={0.97}
            haptic
            accessibilityRole="button"
            accessibilityLabel="Importer dans le club"
            style={[
              styles.importBtn,
              { backgroundColor: tokens.accent },
              (rows.length === 0 || stage === 'importing') && styles.disabled,
            ]}
          >
            <Text style={[styles.importLabel, { color: tokens.onAccent }]}>Importer</Text>
          </PressableSpring>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: proSpace.md,
    paddingHorizontal: proSpace.xl,
    paddingTop: proSpace.xxl,
    paddingBottom: proSpace.md,
  },
  headerText: { flex: 1, minWidth: 0, gap: 3 },
  kicker: { ...proType.label },
  title: { ...proType.h1 },
  subtitle: { ...proType.caption, lineHeight: 17 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: proRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: proSpace.xl, paddingBottom: proSpace.xl, gap: proSpace.md },
  pickRow: { flexDirection: 'row', gap: proSpace.sm },
  pickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: proSpace.sm,
    minHeight: proForm.actionMinHeight,
    borderRadius: proForm.actionRadius,
  },
  pickLabel: { ...proType.nav, fontWeight: '700' },
  hint: { ...proType.caption, lineHeight: 17 },
  busy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: proSpace.md,
    borderRadius: proRadius.md,
    borderWidth: 1,
    padding: proSpace.md,
  },
  busyText: { ...proType.caption, flex: 1 },
  textArea: {
    minHeight: 108,
    borderRadius: proForm.fieldRadius,
    borderWidth: 1,
    paddingHorizontal: proSpace.md,
    paddingVertical: proSpace.md,
    ...proType.body,
    textAlignVertical: 'top',
  },
  noticeBox: {
    borderLeftWidth: 3,
    paddingLeft: proSpace.md,
    gap: 3,
    paddingVertical: proSpace.xs,
  },
  noticeText: { ...proType.caption, lineHeight: 16 },
  preview: {
    borderRadius: proRadius.lg,
    borderWidth: 1,
    padding: proSpace.lg,
    gap: 4,
  },
  previewTitle: { ...proType.h3 },
  previewMeta: { ...proType.caption },
  previewRow: { ...proType.body },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingHorizontal: proSpace.xl,
    paddingTop: proSpace.md,
    paddingBottom: proSpace.xxl,
    gap: proSpace.md,
  },
  footerMeta: { ...proType.caption, flex: 1 },
  importBtn: {
    minWidth: 132,
    minHeight: proForm.actionMinHeight,
    borderRadius: proForm.actionRadius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: proSpace.lg,
  },
  importLabel: { ...proType.nav, fontWeight: '700' },
  disabled: { opacity: 0.45 },
});
