import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion/PressableSpring';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useModalTopInset } from '../../hooks/useModalTopInset';
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
  COACH_PROTO_BUTTON,
  COACH_PROTO_RADII,
  COACH_PROTO_SPACING,
} from '../../features/coach/theme/coachProtoTokens';
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

type InputMode = 'file' | 'paste';

/**
 * Import d'effectif — CSV FootClubs / FFF ou feuille d'équipe PDF.
 *
 * Le PDF est converti **côté serveur** (le dépôt n'embarque aucun parseur PDF) ;
 * le tableau obtenu repasse par le parseur de licences du pôle Club, puis
 * l'écriture se fait dans les **vraies données du club** via
 * `clubLicenseService.importLicensedRoster` : adhésions et cache inscription FFF.
 * Rien n'est inventé : un document sans texte exploitable ne produit aucun joueur.
 */
export function CoachSquadImportPanel({
  visible,
  onClose,
  onImported,
  tokens = COACH_COMPONENT_FALLBACK,
}: Props) {
  const modalTopInset = useModalTopInset({ extra: 16 });
  const { width } = useWindowDimensions();
  const isDesktop = width >= 800;

  const profile = useSessionProfile();
  const uid = profile?.uid ?? '';
  const clubId = profile?.profile.club_id ?? '';

  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [stage, setStage] = useState<Stage>('idle');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
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
    setFileName(null);
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
      setBusyLabel('Analyse de la feuille PDF en cours…');
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
        setFileName(file.fileName ?? 'Feuille_effectif.pdf');
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
        type: ['text/*', 'text/csv', 'text/comma-separated-values', 'application/pdf', '*/*'],
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
      setBusyLabel('Lecture du fichier CSV…');
      const content = await FileSystem.readAsStringAsync(asset.uri);
      setFileName(asset.name ?? 'Export_Footclubs.csv');
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
    setBusyLabel('Enregistrement des effectifs dans le club…');
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
  const medicalCount = useMemo(() => rows.filter((r) => r.medicalValid).length, [rows]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: tokens.bg }]}>
        {/* En-tête centré et aéré */}
        <View style={[styles.header, { paddingTop: modalTopInset }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleWrap}>
              <View style={[styles.kickerBadge, { backgroundColor: tokens.soft }]}>
                <Icon name="shield-checkmark" size={13} color={tokens.accent} />
                <Text style={[styles.kicker, { color: tokens.accent }]}>
                  {club.name ? `${club.name.toUpperCase()} · FFF FOOTCLUBS` : 'FFF FOOTCLUBS · EFFECTIFS'}
                </Text>
              </View>
              <Text style={[styles.title, { color: tokens.foreground }]}>Importer des effectifs</Text>
              <Text style={[styles.subtitle, { color: tokens.muted }]}>
                Intégrez rapidement vos licenciés, catégories et licences depuis un export Footclubs ou une feuille d'équipe.
              </Text>
            </View>

            <PressableSpring
              onPress={onClose}
              scaleTo={0.92}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              style={[styles.closeBtn, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
            >
              <Icon name="close" size={18} color={tokens.foreground} />
            </PressableSpring>
          </View>
        </View>

        {/* Corps de page avec contrainte de largeur pour grand écran */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            isDesktop && styles.bodyContentDesktop,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.mainCard, isDesktop && styles.mainCardDesktop]}>
            {/* Si aucun joueur n'a encore été chargé, afficher les onglets et le sélecteur */}
            {rows.length === 0 ? (
              <>
                {/* Sélecteur d'onglet : Fichier vs Copier-coller */}
                <View style={[styles.segmentContainer, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                  <TouchableOpacity
                    style={[
                      styles.segmentTab,
                      inputMode === 'file' && [styles.segmentTabActive, { backgroundColor: tokens.surface }],
                    ]}
                    onPress={() => setInputMode('file')}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name="document-text"
                      size={15}
                      color={inputMode === 'file' ? tokens.foreground : tokens.muted}
                    />
                    <Text
                      style={[
                        styles.segmentText,
                        { color: inputMode === 'file' ? tokens.foreground : tokens.muted },
                        inputMode === 'file' && styles.segmentTextBold,
                      ]}
                    >
                      Fichier CSV ou PDF
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.segmentTab,
                      inputMode === 'paste' && [styles.segmentTabActive, { backgroundColor: tokens.surface }],
                    ]}
                    onPress={() => setInputMode('paste')}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name="create-outline"
                      size={15}
                      color={inputMode === 'paste' ? tokens.foreground : tokens.muted}
                    />
                    <Text
                      style={[
                        styles.segmentText,
                        { color: inputMode === 'paste' ? tokens.foreground : tokens.muted },
                        inputMode === 'paste' && styles.segmentTextBold,
                      ]}
                    >
                      Copier-coller le tableau
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Onglet 1 : Dépose de fichier */}
                {inputMode === 'file' ? (
                  <View style={[styles.dropZone, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
                    <View style={[styles.iconCircle, { backgroundColor: tokens.soft }]}>
                      <Icon name="cloud-upload" size={28} color={tokens.accent} />
                    </View>
                    <Text style={[styles.dropZoneTitle, { color: tokens.foreground }]}>
                      Sélectionnez votre fichier d'effectif
                    </Text>
                    <Text style={[styles.dropZoneSub, { color: tokens.muted }]}>
                      Glissez ou choisissez votre fichier CSV Footclubs FFF ou votre feuille PDF.
                    </Text>

                    <PressableSpring
                      onPress={() => void pickCsv()}
                      disabled={stage === 'reading' || stage === 'importing'}
                      scaleTo={0.97}
                      haptic
                      accessibilityRole="button"
                      accessibilityLabel="Choisir un fichier CSV ou PDF"
                      style={[styles.browseBtn, { backgroundColor: tokens.accent }]}
                    >
                      <Icon name="document-text" size={16} color={tokens.onAccent} />
                      <Text style={[styles.browseBtnText, { color: tokens.onAccent }]}>
                        Parcourir les fichiers
                      </Text>
                    </PressableSpring>
                  </View>
                ) : (
                  /* Onglet 2 : Copier-coller */
                  <View style={styles.pasteWrap}>
                    <Text style={[styles.fieldLabel, { color: tokens.muted }]}>
                      Collez vos lignes de tableau au format CSV (point-virgule ou virgule) :
                    </Text>
                    <TextInput
                      value={text}
                      onChangeText={(value) => applyText(value)}
                      placeholder={'N° Licence;Nom;Prénom;Catégorie;Certificat\n2548963210;DIALLO;Moussa;U17;Valide\n2548963211;MARTIN;Lucas;U15;Oui'}
                      placeholderTextColor={tokens.muted}
                      multiline
                      autoCorrect={false}
                      autoCapitalize="none"
                      style={[
                        styles.textArea,
                        { backgroundColor: tokens.elevated, borderColor: tokens.border, color: tokens.foreground },
                      ]}
                    />
                  </View>
                )}

                {/* Carte conseil Footclubs */}
                <View style={[styles.tipCard, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                  <View style={[styles.tipIconWrap, { backgroundColor: tokens.surface }]}>
                    <Icon name="help" size={18} color={tokens.accent} />
                  </View>
                  <View style={styles.tipTextWrap}>
                    <Text style={[styles.tipTitle, { color: tokens.foreground }]}>
                      Astuce Export Footclubs FFF
                    </Text>
                    <Text style={[styles.tipDesc, { color: tokens.muted }]}>
                      Sur <Text style={{ fontWeight: '700' }}>footclubs.fff.fr</Text>, accédez à la rubrique <Text style={{ fontWeight: '600' }}>Licences</Text> → <Text style={{ fontWeight: '600' }}>Extractions</Text> et téléchargez la liste au format CSV (séparateur point-virgule).
                    </Text>
                  </View>
                </View>
              </>
            ) : null}

            {/* Indicateur de chargement en cours */}
            {busyLabel ? (
              <View style={[styles.busyBox, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                <ActivityIndicator size="small" color={tokens.accent} />
                <Text style={[styles.busyText, { color: tokens.foreground }]}>{busyLabel}</Text>
              </View>
            ) : null}

            {/* Alertes d'erreurs éventuelles */}
            {errors.length > 0 ? (
              <View style={[styles.alertBox, { backgroundColor: '#FEF2F2', borderColor: proSemantic.danger }]}>
                <Icon name="alert-circle" size={18} color={proSemantic.danger} />
                <View style={styles.alertContent}>
                  {errors.slice(0, 4).map((entry) => (
                    <Text key={entry} style={[styles.alertText, { color: proSemantic.danger }]}>
                      {entry}
                    </Text>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Avertissements légers */}
            {warnings.length > 0 ? (
              <View style={[styles.alertBox, { backgroundColor: '#FFFBEB', borderColor: proSemantic.warning }]}>
                <Icon name="alert-circle" size={18} color={proSemantic.warning} />
                <View style={styles.alertContent}>
                  {warnings.slice(0, 3).map((entry) => (
                    <Text key={entry} style={[styles.alertText, { color: proSemantic.warning }]}>
                      {entry}
                    </Text>
                  ))}
                </View>
              </View>
            ) : null}

            {/* APERÇU STRUCTURÉ DES JOUEURS CHARGÉS */}
            {rows.length > 0 ? (
              <View style={[styles.previewCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                {/* En-tête de la prévisualisation */}
                <View style={styles.previewHeader}>
                  <View style={styles.previewTitleBlock}>
                    <View style={styles.badgeSuccess}>
                      <Icon name="checkmark-circle" size={14} color="#059669" />
                      <Text style={styles.badgeSuccessText}>Fichier analysé avec succès</Text>
                    </View>
                    <Text style={[styles.previewHeading, { color: tokens.foreground }]}>
                      {fileName ? `${fileName} (${rows.length} licenciés)` : `${rows.length} licenciés détectés`}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={reset}
                    style={[styles.resetButton, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
                    activeOpacity={0.7}
                  >
                    <Icon name="refresh" size={14} color={tokens.foreground} />
                    <Text style={[styles.resetButtonText, { color: tokens.foreground }]}>Changer</Text>
                  </TouchableOpacity>
                </View>

                {/* Métriques / badges clés */}
                <View style={styles.kpiRow}>
                  <View style={[styles.kpiChip, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                    <Icon name="person" size={14} color={tokens.accent} />
                    <Text style={[styles.kpiChipText, { color: tokens.foreground }]}>
                      {rows.length} {rows.length > 1 ? 'joueurs' : 'joueur'}
                    </Text>
                  </View>

                  {categories.length > 0 ? (
                    <View style={[styles.kpiChip, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                      <Icon name="shield" size={14} color={tokens.accent} />
                      <Text style={[styles.kpiChipText, { color: tokens.foreground }]} numberOfLines={1}>
                        {categories.join(', ')}
                      </Text>
                    </View>
                  ) : null}

                  <View style={[styles.kpiChip, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                    <Icon name="shield-checkmark" size={14} color="#059669" />
                    <Text style={[styles.kpiChipText, { color: tokens.foreground }]}>
                      {medicalCount} {medicalCount > 1 ? 'médicaux valides' : 'médical valide'}
                    </Text>
                  </View>
                </View>

                {/* Liste détaillée des premiers joueurs */}
                <View style={styles.playersList}>
                  <Text style={[styles.playersListTitle, { color: tokens.muted }]}>
                    Extrait des premiers licenciés :
                  </Text>
                  {rows.slice(0, 10).map((row, idx) => (
                    <View
                      key={`${row.licenseNumber}-${row.displayName}-${idx}`}
                      style={[
                        styles.playerRow,
                        { borderBottomColor: tokens.border },
                        idx === 9 || idx === rows.length - 1 ? { borderBottomWidth: 0 } : null,
                      ]}
                    >
                      <View style={[styles.playerAvatar, { backgroundColor: tokens.soft }]}>
                        <Text style={[styles.playerAvatarText, { color: tokens.accent }]}>
                          {(row.firstName?.[0] || row.displayName?.[0] || 'J').toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.playerInfo}>
                        <Text style={[styles.playerName, { color: tokens.foreground }]} numberOfLines={1}>
                          {row.displayName}
                        </Text>
                        <Text style={[styles.playerMeta, { color: tokens.muted }]} numberOfLines={1}>
                          Licence : {row.licenseNumber || 'En attente'} {row.category ? `· ${row.category}` : ''}
                        </Text>
                      </View>
                      <View style={styles.playerBadgeEnd}>
                        <Text
                          style={[
                            styles.medicalStatusText,
                            { color: row.medicalValid ? '#059669' : '#D97706' },
                          ]}
                        >
                          {row.medicalValid ? 'Médical OK' : 'À vérifier'}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {rows.length > 10 ? (
                    <View style={styles.morePlayersBanner}>
                      <Text style={[styles.morePlayersText, { color: tokens.muted }]}>
                        + {rows.length - 10} autres licenciés prêts à être importés dans l'effectif
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* Pied de page fixe avec CTA pro */}
        <View style={[styles.footer, { backgroundColor: tokens.surface, borderTopColor: tokens.border }]}>
          <View style={[styles.footerContainer, isDesktop && styles.footerContainerDesktop]}>
            <View style={styles.footerStatus}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: rows.length > 0 ? '#10B981' : tokens.muted },
                ]}
              />
              <Text style={[styles.footerMeta, { color: tokens.foreground }]}>
                {rows.length > 0
                  ? `${rows.length} licencié${rows.length > 1 ? 's' : ''} prêt${rows.length > 1 ? 's' : ''} pour l'effectif`
                  : 'En attente de fichier ou de tableau'}
              </Text>
            </View>

            <View style={styles.footerButtons}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.cancelBtn, { borderColor: tokens.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelBtnText, { color: tokens.foreground }]}>Annuler</Text>
              </TouchableOpacity>

              <PressableSpring
                onPress={() => void runImport()}
                disabled={rows.length === 0 || stage === 'importing' || stage === 'reading'}
                scaleTo={0.96}
                haptic
                accessibilityRole="button"
                accessibilityLabel="Importer dans le club"
                style={[
                  styles.importBtn,
                  { backgroundColor: tokens.accent },
                  (rows.length === 0 || stage === 'importing' || stage === 'reading') && styles.disabled,
                ]}
              >
                {stage === 'importing' ? (
                  <ActivityIndicator size="small" color={tokens.onAccent} />
                ) : (
                  <>
                    <Icon name="cloud-upload" size={17} color={tokens.onAccent} />
                    <Text style={[styles.importLabel, { color: tokens.onAccent }]}>
                      Valider et importer
                    </Text>
                  </>
                )}
              </PressableSpring>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: proSpace.xl,
    paddingBottom: proSpace.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    maxWidth: 780,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: proSpace.md,
  },
  headerTitleWrap: {
    flex: 1,
    gap: 6,
  },
  kickerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 2,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: proSpace.xl,
    paddingVertical: proSpace.xl,
  },
  bodyContentDesktop: {
    alignItems: 'center',
  },
  mainCard: {
    width: '100%',
    gap: proSpace.lg,
  },
  mainCardDesktop: {
    maxWidth: 780,
  },

  /* Sélecteur d'onglets Fichier vs Copier-coller */
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    gap: 8,
  },
  segmentTabActive: {
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
  },
  segmentTextBold: {
    fontWeight: '700',
  },

  /* Zone de dépôt / sélection fichier */
  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dropZoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  dropZoneSub: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 18,
    marginBottom: 8,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    gap: 8,
    minHeight: COACH_PROTO_BUTTON.primary.minHeight,
  },
  browseBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },

  /* Zone copier-coller */
  pasteWrap: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 130,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: proSpace.md,
    paddingVertical: proSpace.md,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlignVertical: 'top',
  },

  /* Carte d'astuce */
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  tipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTextWrap: {
    flex: 1,
    gap: 3,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  tipDesc: {
    fontSize: 12,
    lineHeight: 17,
  },

  /* Alertes & état de chargement */
  busyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
  },
  busyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  alertContent: {
    flex: 1,
    gap: 2,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Prévisualisation des effectifs */
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  previewTitleBlock: {
    flex: 1,
    gap: 6,
  },
  badgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  previewHeading: {
    fontSize: 16,
    fontWeight: '800',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },

  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  kpiChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  playersList: {
    gap: 8,
    paddingTop: 8,
  },
  playersListTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  playerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    fontSize: 12,
    fontWeight: '800',
  },
  playerInfo: {
    flex: 1,
    gap: 2,
  },
  playerName: {
    fontSize: 13,
    fontWeight: '700',
  },
  playerMeta: {
    fontSize: 11,
  },
  playerBadgeEnd: {
    alignItems: 'flex-end',
  },
  medicalStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  morePlayersBanner: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  morePlayersText: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },

  /* Footer fixe */
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: proSpace.xl,
    paddingVertical: 14,
  },
  footerContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  footerContainerDesktop: {
    maxWidth: 780,
    alignSelf: 'center',
  },
  footerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footerMeta: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: COACH_PROTO_BUTTON.primary.minHeight,
  },
  importLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.45,
  },
});
