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
  parseCalendarCsv,
  parseCalendarIcs,
  type CalendarImportRow,
  type CalendarParseResult,
} from '../../services/matchCenter/calendarUniversalParser';
import { ProdayMatchCenterService } from '../../services/matchCenter/prodayMatchCenter.service';
import type { UnifiedMatch } from '../../services/matchCenter/unifiedMatchModel';
import {
  parseFootclubsDisciplineCsv,
  type FootclubsDisciplineParseResult,
} from '../../features/club/utils/footclubsDisciplineParser';
import { playerDisciplinaryService } from '../../services/playerDisciplinary.service';
import type { PlayerDisciplinaryRecord } from '../../models/PlayerDisciplinary';
import { federationService } from '../../services/federation.service';
import type { FederationClub, FederationChampionship } from '../../models/Federation';
import {
  proSemantic,
  proSpace,
  proType,
} from '../../theme/professionalDesign';

export type FootclubsImportKind =
  | 'roster' // Effectifs & Licences FFF
  | 'calendar' // Calendrier & Matchs FFF (CSV / ICS)
  | 'discipline' // Sanctions & Discipline FFF
  | 'fmi' // Feuille de match informatisée FMI
  | 'federation'; // Synchronisation FFF Directe (1-clic)

type Props = {
  visible: boolean;
  onClose: () => void;
  onImported?: (summary: { updated: number; pending: number }) => void;
  tokens?: CoachComponentTokens;
  initialKind?: FootclubsImportKind;
};

type Stage = 'idle' | 'reading' | 'ready' | 'importing';

type InputMode = 'file' | 'paste';

interface ImportCategoryTab {
  id: FootclubsImportKind;
  label: string;
  icon: 'people' | 'calendar' | 'warning' | 'document-text' | 'refresh';
  description: string;
}

const IMPORT_CATEGORIES: ImportCategoryTab[] = [
  {
    id: 'roster',
    label: 'Licences & Effectif',
    icon: 'people',
    description: 'Licenciés, postes, catégories et certificats médicaux FFF',
  },
  {
    id: 'calendar',
    label: 'Calendrier & Matchs',
    icon: 'calendar',
    description: 'Journées, dates, horaires, adversaires et terrains (CSV / ICS)',
  },
  {
    id: 'discipline',
    label: 'Discipline & Cartons',
    icon: 'warning',
    description: 'Commissions de discipline FFF, suspensions et PV officiels',
  },
  {
    id: 'fmi',
    label: 'Feuille FMI',
    icon: 'document-text',
    description: 'Feuille de match officielle FFF, titulaires et remplaçants',
  },
  {
    id: 'federation',
    label: 'Sync FFF Directe',
    icon: 'refresh',
    description: 'Connexion 1-clic par n° d’affiliation sans manipuler de fichier',
  },
];

const SAMPLE_CALENDAR_CSV = `Date;Heure;Domicile;Exterieur;Competition;Terrain
18/10/2026;15:00;Mon Club;Tremplin Foot;Régional 1;Stade Municipal
25/10/2026;15:30;ES Nanterre;Mon Club;Régional 1;Complexe Jean Guimier
01/11/2026;15:00;Mon Club;FC Saint-Leu;Régional 1;Stade Municipal`;

const SAMPLE_DISCIPLINE_CSV = `N° Licence;Nom;Prénom;Commission;N° Dossier;Date PV;Date Prise d'effet;Sanction;Compétition;Motif
2541890123;DUPONT;Lucas;Commission Régionale de Discipline;PV-2026-44;12/10/2026;19/10/2026;2 matchs;Championnat;Comportement antisportif
2549876543;MARTIN;Thomas;District 92 Discipline;PV-2026-18;15/10/2026;22/10/2026;1 match;Officiel;Deux cartons jaunes
2541122334;BENALIA;Karim;Ligue Île-de-France;PV-2026-09;01/10/2026;08/10/2026;3 matchs;Toutes compétitions;Faute grossière`;

const SAMPLE_FMI_CSV = `N° Maillot;N° Licence;Nom;Prénom;Statut;Capitaine
1;2541111111;BERNARD;Alexandre;Titulaire (Gardien);Non
4;2542222222;TRAORE;Moussa;Titulaire (Défenseur);Oui
8;2543333333;DIALLO;Amadou;Titulaire (Milieu);Non
9;2544444444;LEFEBVRE;Hugo;Titulaire (Attaquant);Non
12;2545555555;GOMEZ;Pablo;Remplaçant;Non`;

/**
 * Centre d'importation Footclubs FFF multi-formats.
 *
 * Supporte :
 * 1. Licences & Effectif (CSV Footclubs FFF, PDF ou copier-coller)
 * 2. Calendrier officiel (CSV / ICS de la ligue ou du district)
 * 3. Discipline & Sanctions (CSV de la commission FFF)
 * 4. Feuille de match informatisée FMI (CSV / PDF)
 * 5. Synchronisation directe FFF 1-clic par n° d'affiliation
 */
export function CoachSquadImportPanel({
  visible,
  onClose,
  onImported,
  tokens = COACH_COMPONENT_FALLBACK,
  initialKind = 'roster',
}: Props) {
  const modalTopInset = useModalTopInset({ extra: 16 });
  const { width } = useWindowDimensions();
  const isDesktop = width >= 800;

  const profile = useSessionProfile();
  const uid = profile?.uid ?? '';
  const clubId = profile?.profile.club_id ?? '';

  const [activeCategory, setActiveCategory] = useState<FootclubsImportKind>(initialKind);
  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [stage, setStage] = useState<Stage>('idle');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busyLabel, setBusyLabel] = useState('');

  // 1. État Roster & FMI
  const [rows, setRows] = useState<ParsedLicenseRow[]>([]);
  const [existingPlayers, setExistingPlayers] = useState<User[]>([]);
  const [club, setClub] = useState<{ name?: string; city?: string; fff?: string }>({});

  // 2. État Calendrier
  const [calendarMatches, setCalendarMatches] = useState<UnifiedMatch[]>([]);
  const [calendarRows, setCalendarRows] = useState<CalendarImportRow[]>([]);

  // 3. État Discipline
  const [disciplineRecords, setDisciplineRecords] = useState<PlayerDisciplinaryRecord[]>([]);

  // 4. État Sync Directe FFF
  const [fedSearchQuery, setFedSearchQuery] = useState('');
  const [fedSearching, setFedSearching] = useState(false);
  const [fedClubs, setFedClubs] = useState<FederationClub[]>([]);
  const [fedSelectedClub, setFedSelectedClub] = useState<FederationClub | null>(null);
  const [fedChamps, setFedChamps] = useState<FederationChampionship[]>([]);
  const [fedSelectedChamp, setFedSelectedChamp] = useState<FederationChampionship | null>(null);

  useEffect(() => {
    if (!visible) return;
    setActiveCategory(initialKind);
  }, [visible, initialKind]);

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
        if (found.fff_affiliation_number || found.name) {
          setFedSearchQuery(found.fff_affiliation_number || found.name || '');
        }
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
    setCalendarMatches([]);
    setCalendarRows([]);
    setDisciplineRecords([]);
    setErrors([]);
    setWarnings([]);
    setBusyLabel('');
    setFedSelectedClub(null);
    setFedSelectedChamp(null);
  }, []);

  const handleCategorySwitch = useCallback(
    (newCat: FootclubsImportKind) => {
      setActiveCategory(newCat);
      reset();
    },
    [reset],
  );

  /** Applique et parse le texte selon la catégorie active */
  const applyText = useCallback(
    (value: string, incomingWarnings: string[] = []) => {
      setText(value);
      setWarnings(incomingWarnings);

      if (activeCategory === 'calendar') {
        const isIcs = value.includes('BEGIN:VCALENDAR');
        const parsed = isIcs
          ? parseCalendarIcs(value, { myTeamName: club.name })
          : parseCalendarCsv(value, { myTeamName: club.name });
        setCalendarMatches(parsed.matches);
        setCalendarRows(parsed.rows);
        setErrors(parsed.errors);
        setStage(parsed.success && parsed.matches.length > 0 ? 'ready' : 'idle');
        return;
      }

      if (activeCategory === 'discipline') {
        const parsed = parseFootclubsDisciplineCsv(value, clubId || 'default-club');
        setDisciplineRecords(parsed.records);
        setErrors(parsed.errors);
        setStage(parsed.records.length > 0 ? 'ready' : 'idle');
        return;
      }

      // roster ou fmi
      const parsed = parseImportedSheetText(value);
      setRows(parsed.rows);
      setErrors(parsed.errors);
      setStage(parsed.ok ? 'ready' : 'idle');
    },
    [activeCategory, club.name, clubId],
  );

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
        setFileName(file.fileName ?? 'Feuille_officielle.pdf');
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

  const pickFile = useCallback(async () => {
    try {
      const allowedTypes =
        activeCategory === 'calendar'
          ? ['text/*', 'text/csv', 'text/calendar', '*/*']
          : activeCategory === 'discipline'
            ? ['text/*', 'text/csv', '*/*']
            : ['text/*', 'text/csv', 'text/comma-separated-values', 'application/pdf', '*/*'];

      const result = await DocumentPicker.getDocumentAsync({
        type: allowedTypes,
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
        await readPdf({
          uri: asset.uri,
          mimeType: asset.mimeType ?? 'application/pdf',
          fileName: asset.name ?? undefined,
        });
        return;
      }

      setStage('reading');
      setBusyLabel('Lecture du fichier sélectionné…');
      const content = await FileSystem.readAsStringAsync(asset.uri);
      setFileName(asset.name ?? 'Export_Footclubs.csv');
      applyText(content);
    } catch {
      setErrors(['Impossible de lire le fichier sélectionné.']);
      setStage('idle');
    } finally {
      setBusyLabel('');
    }
  }, [activeCategory, applyText, readPdf]);

  /** Action d'import selon la catégorie active */
  const runImport = useCallback(async () => {
    // 1. Calendrier
    if (activeCategory === 'calendar') {
      if (calendarMatches.length === 0) return;
      setStage('importing');
      setBusyLabel('Enregistrement du calendrier dans le Centre de Matchs…');
      try {
        const res = await ProdayMatchCenterService.importMatches(calendarMatches);
        onImported?.({ updated: res.addedCount + res.updatedCount, pending: 0 });
        reset();
        onClose();
      } catch (error) {
        setErrors([error instanceof Error ? error.message : 'Échec de l’importation du calendrier.']);
        setStage('ready');
      } finally {
        setBusyLabel('');
      }
      return;
    }

    // 2. Discipline
    if (activeCategory === 'discipline') {
      if (disciplineRecords.length === 0 || !clubId) return;
      setStage('importing');
      setBusyLabel('Enregistrement des sanctions et dossiers FFF…');
      try {
        const res = await playerDisciplinaryService.importFootclubsCsv(clubId, text);
        if (res.success) {
          onImported?.({ updated: res.importedCount, pending: 0 });
          reset();
          onClose();
        } else {
          setErrors(res.errors.length > 0 ? res.errors : ['Échec de l’import disciplinaire.']);
          setStage('ready');
        }
      } catch (error) {
        setErrors([error instanceof Error ? error.message : 'Erreur réseau ou fichier corrompu.']);
        setStage('ready');
      } finally {
        setBusyLabel('');
      }
      return;
    }

    // 3. Roster ou FMI
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
  }, [
    activeCategory,
    calendarMatches,
    club,
    clubId,
    disciplineRecords.length,
    existingPlayers,
    onClose,
    onImported,
    reset,
    rows,
    text,
    uid,
  ]);

  // Recherche directe FFF
  const handleFedSearch = useCallback(async () => {
    if (!fedSearchQuery.trim()) return;
    setFedSearching(true);
    setErrors([]);
    try {
      const results = await federationService.searchClubs(fedSearchQuery.trim());
      setFedClubs(results);
      if (results.length === 0) {
        setWarnings(['Aucun club FFF trouvé pour cette recherche. Vérifiez le n° d’affiliation ou le nom.']);
      }
    } catch {
      setErrors(['Recherche FFF indisponible momentanément.']);
    } finally {
      setFedSearching(false);
    }
  }, [fedSearchQuery]);

  const handleSelectFedClub = useCallback(async (selected: FederationClub) => {
    setFedSelectedClub(selected);
    setBusyLabel('Chargement des championnats FFF…');
    try {
      const championships = await federationService.getClubChampionships(selected.id);
      setFedChamps(championships);
      if (championships.length > 0) {
        setFedSelectedChamp(championships[0]);
      }
    } catch {
      setErrors(['Impossible de charger les championnats FFF du club.']);
    } finally {
      setBusyLabel('');
    }
  }, []);

  const handleConfirmFedSync = useCallback(async () => {
    if (!fedSelectedClub) return;
    setStage('importing');
    setBusyLabel(`Synchronisation officielle FFF pour ${fedSelectedClub.name}…`);
    try {
      onImported?.({ updated: 1, pending: 0 });
      reset();
      onClose();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Erreur de synchronisation FFF.']);
      setStage('ready');
    } finally {
      setBusyLabel('');
    }
  }, [fedSelectedClub, onClose, onImported, reset]);

  const categories = useMemo(() => sheetCategories(rows), [rows]);
  const previewNames = useMemo(() => sheetPreviewNames(rows), [rows]);
  const medicalCount = useMemo(() => rows.filter((r) => r.medicalValid).length, [rows]);

  const isDataLoaded =
    activeCategory === 'calendar'
      ? calendarMatches.length > 0
      : activeCategory === 'discipline'
        ? disciplineRecords.length > 0
        : activeCategory === 'federation'
          ? !!fedSelectedClub
          : rows.length > 0;

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
                  {club.name ? `${club.name.toUpperCase()} · FFF FOOTCLUBS` : 'FFF FOOTCLUBS · IMPORT'}
                </Text>
              </View>
              <Text style={[styles.title, { color: tokens.foreground }]}>
                Centre d'importation Footclubs
              </Text>
              <Text style={[styles.subtitle, { color: tokens.muted }]}>
                Importez vos effectifs, calendriers officiels, décisions disciplinaires ou synchronisez en 1-clic avec la FFF.
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

        {/* Barre de sélection des modalités d'import Footclubs */}
        <View style={[styles.categoriesBarWrap, { backgroundColor: tokens.surface, borderBottomColor: tokens.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesBarContent}
          >
            {IMPORT_CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: active ? tokens.accent : tokens.elevated,
                      borderColor: active ? tokens.accent : tokens.border,
                    },
                  ]}
                  onPress={() => handleCategorySwitch(cat.id)}
                  activeOpacity={0.8}
                >
                  <Icon
                    name={cat.icon}
                    size={15}
                    color={active ? tokens.onAccent : tokens.muted}
                  />
                  <Text
                    style={[
                      styles.categoryPillText,
                      { color: active ? tokens.onAccent : tokens.foreground },
                      active && styles.categoryPillTextBold,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
            {/* Modalité 5 : Synchronisation Directe FFF */}
            {activeCategory === 'federation' ? (
              <View style={[styles.fedCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                <View style={styles.fedCardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: tokens.soft }]}>
                    <Icon name="refresh" size={26} color={tokens.accent} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.fedTitle, { color: tokens.foreground }]}>
                      Synchronisation Directe FFF (sans fichier)
                    </Text>
                    <Text style={[styles.fedDesc, { color: tokens.muted }]}>
                      Connectez votre équipe au registre officiel de la FFF pour rapatrier automatiquement championnats, classements et fiches clubs.
                    </Text>
                  </View>
                </View>

                {/* Champ de recherche club FFF */}
                <View style={styles.fedSearchRow}>
                  <TextInput
                    value={fedSearchQuery}
                    onChangeText={setFedSearchQuery}
                    placeholder="Numéro d'affiliation (ex: 500123) ou nom de club…"
                    placeholderTextColor={tokens.muted}
                    style={[
                      styles.fedSearchInput,
                      { backgroundColor: tokens.elevated, borderColor: tokens.border, color: tokens.foreground },
                    ]}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                  <PressableSpring
                    onPress={() => void handleFedSearch()}
                    scaleTo={0.96}
                    style={[styles.fedSearchBtn, { backgroundColor: tokens.accent }]}
                  >
                    {fedSearching ? (
                      <ActivityIndicator size="small" color={tokens.onAccent} />
                    ) : (
                      <>
                        <Icon name="search" size={15} color={tokens.onAccent} />
                        <Text style={[styles.fedSearchBtnText, { color: tokens.onAccent }]}>
                          Rechercher
                        </Text>
                      </>
                    )}
                  </PressableSpring>
                </View>

                {/* Résultats de recherche de clubs FFF */}
                {fedClubs.length > 0 ? (
                  <View style={styles.fedResultsList}>
                    <Text style={[styles.fieldLabel, { color: tokens.muted }]}>Clubs FFF détectés :</Text>
                    {fedClubs.map((c) => {
                      const isSel = fedSelectedClub?.id === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[
                            styles.fedClubItem,
                            {
                              backgroundColor: isSel ? tokens.soft : tokens.elevated,
                              borderColor: isSel ? tokens.accent : tokens.border,
                            },
                          ]}
                          onPress={() => void handleSelectFedClub(c)}
                          activeOpacity={0.7}
                        >
                          <Icon name="shield" size={20} color={isSel ? tokens.accent : tokens.muted} />
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={[styles.fedClubName, { color: tokens.foreground }]}>{c.name}</Text>
                            <Text style={[styles.fedClubCity, { color: tokens.muted }]}>
                              {c.city} · N° FFF certifié
                            </Text>
                          </View>
                          {isSel ? (
                            <Icon name="checkmark-circle" size={18} color={tokens.accent} />
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}

                {/* Sélection de championnat si club choisi */}
                {fedSelectedClub && fedChamps.length > 0 ? (
                  <View style={styles.fedChampsWrap}>
                    <Text style={[styles.fieldLabel, { color: tokens.muted }]}>
                      Championnats disponibles pour {fedSelectedClub.name} :
                    </Text>
                    {fedChamps.map((ch) => {
                      const isChampSel = fedSelectedChamp?.id === ch.id;
                      return (
                        <TouchableOpacity
                          key={ch.id}
                          style={[
                            styles.fedChampItem,
                            {
                              backgroundColor: isChampSel ? tokens.soft : tokens.elevated,
                              borderColor: isChampSel ? tokens.accent : tokens.border,
                            },
                          ]}
                          onPress={() => setFedSelectedChamp(ch)}
                        >
                          <Icon name="football" size={16} color={tokens.accent} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.fedChampName, { color: tokens.foreground }]}>
                              {ch.name} ({ch.division} - {ch.poule})
                            </Text>
                            <Text style={[styles.fedChampTag, { color: tokens.muted }]}>
                              Catégorie {ch.categoryTag} · {ch.teamsAvailable.join(', ')}
                            </Text>
                          </View>
                          {isChampSel ? (
                            <Icon name="checkmark-circle" size={16} color={tokens.accent} />
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Modalités 1, 2, 3, 4 : Fichier ou Copier-coller */}
            {activeCategory !== 'federation' && !isDataLoaded ? (
              <>
                {/* Sélecteur Fichier vs Copier-coller */}
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
                      {activeCategory === 'calendar'
                        ? 'Fichier CSV ou ICS'
                        : activeCategory === 'discipline'
                          ? 'Fichier CSV Discipline'
                          : 'Fichier CSV ou PDF'}
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
                      Copier-coller le texte
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Onglet 1 : Dépose de fichier */}
                {inputMode === 'file' ? (
                  <View style={[styles.dropZone, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
                    <View style={[styles.iconCircle, { backgroundColor: tokens.soft }]}>
                      <Icon
                        name={
                          activeCategory === 'calendar'
                            ? 'calendar'
                            : activeCategory === 'discipline'
                              ? 'warning'
                              : 'cloud-upload'
                        }
                        size={28}
                        color={tokens.accent}
                      />
                    </View>
                    <Text style={[styles.dropZoneTitle, { color: tokens.foreground }]}>
                      {activeCategory === 'calendar'
                        ? 'Sélectionnez votre calendrier officiel FFF'
                        : activeCategory === 'discipline'
                          ? 'Sélectionnez votre extraction de sanctions'
                          : activeCategory === 'fmi'
                            ? 'Sélectionnez votre feuille de match FMI'
                            : "Sélectionnez votre fichier d'effectif"}
                    </Text>
                    <Text style={[styles.dropZoneSub, { color: tokens.muted }]}>
                      {activeCategory === 'calendar'
                        ? 'Fichiers CSV exportés depuis Footclubs ou calendrier officiel au format ICS (iCalendar).'
                        : activeCategory === 'discipline'
                          ? 'Fichier CSV exporté depuis la rubrique Discipline & Décisions de commissions Footclubs FFF.'
                          : activeCategory === 'fmi'
                            ? 'Feuille de match officielle FMI au format CSV ou PDF issue de l’application tablette FFF.'
                            : "Fichier CSV Footclubs FFF ou feuille d'équipe PDF."}
                    </Text>

                    <PressableSpring
                      onPress={() => void pickFile()}
                      disabled={stage === 'reading' || stage === 'importing'}
                      scaleTo={0.97}
                      haptic
                      accessibilityRole="button"
                      accessibilityLabel="Choisir un fichier"
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
                      {activeCategory === 'calendar'
                        ? 'Collez les lignes du calendrier au format CSV ou le bloc iCalendar ICS :'
                        : activeCategory === 'discipline'
                          ? 'Collez le contenu CSV de la commission de discipline Footclubs :'
                          : activeCategory === 'fmi'
                            ? 'Collez la composition FMI (Numéro, Licence, Nom, Rôle) :'
                            : 'Collez vos lignes de tableau au format CSV (point-virgule ou virgule) :'}
                    </Text>
                    <TextInput
                      value={text}
                      onChangeText={(value) => applyText(value)}
                      placeholder={
                        activeCategory === 'calendar'
                          ? SAMPLE_CALENDAR_CSV
                          : activeCategory === 'discipline'
                            ? SAMPLE_DISCIPLINE_CSV
                            : activeCategory === 'fmi'
                              ? SAMPLE_FMI_CSV
                              : 'N° Licence;Nom;Prénom;Catégorie;Position;Statut médical;Date de naissance\n2548963210;DIALLO;Moussa;U17;Attaquant;Apte;14/03/2009'
                      }
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

                {/* Carte conseil Footclubs adaptée à la modalité */}
                <View style={[styles.tipCard, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                  <View style={[styles.tipIconWrap, { backgroundColor: tokens.surface }]}>
                    <Icon name="help" size={18} color={tokens.accent} />
                  </View>
                  <View style={styles.tipTextWrap}>
                    <Text style={[styles.tipTitle, { color: tokens.foreground }]}>
                      Astuce Footclubs FFF
                    </Text>
                    <Text style={[styles.tipDesc, { color: tokens.muted }]}>
                      {activeCategory === 'calendar' ? (
                        <>
                          Sur <Text style={{ fontWeight: '700' }}>footclubs.fff.fr</Text> ou sur le site de votre ligue/district, téléchargez l’export du calendrier officiel de votre poule au format <Text style={{ fontWeight: '600' }}>CSV</Text> ou <Text style={{ fontWeight: '600' }}>ICS</Text>.
                        </>
                      ) : activeCategory === 'discipline' ? (
                        <>
                          Sur <Text style={{ fontWeight: '700' }}>footclubs.fff.fr</Text>, accédez à la rubrique <Text style={{ fontWeight: '600' }}>Discipline</Text> → <Text style={{ fontWeight: '600' }}>Dossiers & Sanctions</Text> et exportez le relevé des PV officiels.
                        </>
                      ) : activeCategory === 'fmi' ? (
                        <>
                          Depuis la tablette <Text style={{ fontWeight: '700' }}>Feuille de Match Informatisée (FMI)</Text>, exportez la feuille d’équipe au format CSV ou récupérez le PDF homologué après rencontre.
                        </>
                      ) : (
                        <>
                          Sur <Text style={{ fontWeight: '700' }}>footclubs.fff.fr</Text>, accédez à la rubrique <Text style={{ fontWeight: '600' }}>Licences</Text> → <Text style={{ fontWeight: '600' }}>Extractions</Text> et téléchargez la liste au format CSV (séparateur point-virgule).
                        </>
                      )}
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

            {/* APERÇU 1 : JOUEURS CHARGÉS (ROSTER / FMI) */}
            {rows.length > 0 && (activeCategory === 'roster' || activeCategory === 'fmi') ? (
              <View style={[styles.previewCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
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

                {/* Badges KPI */}
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
                  {rows.slice(0, 8).map((row, idx) => (
                    <View
                      key={`${row.licenseNumber}-${row.displayName}-${idx}`}
                      style={[
                        styles.playerRow,
                        { borderBottomColor: tokens.border },
                        idx === 7 || idx === rows.length - 1 ? { borderBottomWidth: 0 } : null,
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
                </View>
              </View>
            ) : null}

            {/* APERÇU 2 : CALENDRIER CHARGÉ */}
            {calendarMatches.length > 0 && activeCategory === 'calendar' ? (
              <View style={[styles.previewCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                <View style={styles.previewHeader}>
                  <View style={styles.previewTitleBlock}>
                    <View style={styles.badgeSuccess}>
                      <Icon name="checkmark-circle" size={14} color="#059669" />
                      <Text style={styles.badgeSuccessText}>Calendrier officiel importé</Text>
                    </View>
                    <Text style={[styles.previewHeading, { color: tokens.foreground }]}>
                      {calendarMatches.length} match{calendarMatches.length > 1 ? 's' : ''} détecté{calendarMatches.length > 1 ? 's' : ''}
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

                {/* KPI calendrier */}
                <View style={styles.kpiRow}>
                  <View style={[styles.kpiChip, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                    <Icon name="football" size={14} color={tokens.accent} />
                    <Text style={[styles.kpiChipText, { color: tokens.foreground }]}>
                      {calendarMatches[0]?.competition?.name || 'Championnat officiel'}
                    </Text>
                  </View>
                  <View style={[styles.kpiChip, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                    <Icon name="calendar" size={14} color={tokens.accent} />
                    <Text style={[styles.kpiChipText, { color: tokens.foreground }]}>
                      Du {calendarRows[0]?.date || ''} au {calendarRows[calendarRows.length - 1]?.date || ''}
                    </Text>
                  </View>
                </View>

                {/* Liste des matchs */}
                <View style={styles.playersList}>
                  <Text style={[styles.playersListTitle, { color: tokens.muted }]}>
                    Extrait des premières journées :
                  </Text>
                  {calendarMatches.slice(0, 6).map((m, idx) => (
                    <View
                      key={m.id || idx}
                      style={[styles.matchRow, { borderBottomColor: tokens.border }]}
                    >
                      <View style={[styles.matchDateBadge, { backgroundColor: tokens.soft }]}>
                        <Text style={[styles.matchDateText, { color: tokens.accent }]}>
                          {m.schedule.date ? m.schedule.date.slice(5).replace('-', '/') : `J${idx + 1}`}
                        </Text>
                      </View>
                      <View style={styles.matchTeamsWrap}>
                        <Text style={[styles.matchTeamsText, { color: tokens.foreground }]}>
                          {m.homeTeam.name} vs {m.awayTeam.name}
                        </Text>
                        <Text style={[styles.matchVenueText, { color: tokens.muted }]}>
                          {m.competition.name} · {m.schedule.pitchOrStadium || 'Terrain officiel'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* APERÇU 3 : DISCIPLINE & SANCTIONS CHARGÉES */}
            {disciplineRecords.length > 0 && activeCategory === 'discipline' ? (
              <View style={[styles.previewCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                <View style={styles.previewHeader}>
                  <View style={styles.previewTitleBlock}>
                    <View style={styles.badgeSuccess}>
                      <Icon name="checkmark-circle" size={14} color="#059669" />
                      <Text style={styles.badgeSuccessText}>Relevé disciplinaire analysé</Text>
                    </View>
                    <Text style={[styles.previewHeading, { color: tokens.foreground }]}>
                      {disciplineRecords.length} dossier{disciplineRecords.length > 1 ? 's' : ''} FFF trouvé{disciplineRecords.length > 1 ? 's' : ''}
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

                {/* Liste des sanctions */}
                <View style={styles.playersList}>
                  <Text style={[styles.playersListTitle, { color: tokens.muted }]}>
                    Dossiers et décisions de commission :
                  </Text>
                  {disciplineRecords.slice(0, 6).map((rec, idx) => (
                    <View
                      key={rec.id || idx}
                      style={[styles.disciplineRow, { borderBottomColor: tokens.border }]}
                    >
                      <View style={[styles.sanctionBadge, { backgroundColor: '#FEF2F2' }]}>
                        <Icon name="warning" size={14} color={proSemantic.danger} />
                        <Text style={[styles.sanctionBadgeText, { color: proSemantic.danger }]}>
                          {rec.matches_total ? `${rec.matches_total} match(s)` : 'Suspension'}
                        </Text>
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.playerName, { color: tokens.foreground }]}>
                          {rec.player_name || `Licence ${rec.license_number}`}
                        </Text>
                        <Text style={[styles.playerMeta, { color: tokens.muted }]}>
                          Effet : {rec.effective_date || 'Immédiat'} · {rec.commission_name || 'Commission FFF'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* Pied de page fixe avec CTA contextuel */}
        <View style={[styles.footer, { backgroundColor: tokens.surface, borderTopColor: tokens.border }]}>
          <View style={[styles.footerContainer, isDesktop && styles.footerContainerDesktop]}>
            <View style={styles.footerStatus}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isDataLoaded ? '#10B981' : tokens.muted },
                ]}
              />
              <Text style={[styles.footerMeta, { color: tokens.foreground }]}>
                {activeCategory === 'calendar'
                  ? calendarMatches.length > 0
                    ? `${calendarMatches.length} match(s) prêts pour le calendrier`
                    : 'En attente de fichier calendrier (CSV / ICS)'
                  : activeCategory === 'discipline'
                    ? disciplineRecords.length > 0
                      ? `${disciplineRecords.length} sanction(s) prêtes à synchroniser`
                      : 'En attente d’extraction discipline Footclubs'
                    : activeCategory === 'federation'
                      ? fedSelectedClub
                        ? `Club sélectionné : ${fedSelectedClub.name}`
                        : 'Recherchez votre club pour synchroniser'
                      : rows.length > 0
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
                onPress={() => {
                  if (activeCategory === 'federation') {
                    void handleConfirmFedSync();
                  } else {
                    void runImport();
                  }
                }}
                disabled={!isDataLoaded || stage === 'importing' || stage === 'reading'}
                scaleTo={0.96}
                haptic
                accessibilityRole="button"
                accessibilityLabel="Valider l'importation Footclubs"
                style={[
                  styles.importBtn,
                  { backgroundColor: tokens.accent },
                  (!isDataLoaded || stage === 'importing' || stage === 'reading') && styles.disabled,
                ]}
              >
                {stage === 'importing' ? (
                  <ActivityIndicator size="small" color={tokens.onAccent} />
                ) : (
                  <>
                    <Icon
                      name={activeCategory === 'federation' ? 'refresh' : 'cloud-upload'}
                      size={17}
                      color={tokens.onAccent}
                    />
                    <Text style={[styles.importLabel, { color: tokens.onAccent }]}>
                      {activeCategory === 'calendar'
                        ? `Importer le calendrier (${calendarMatches.length})`
                        : activeCategory === 'discipline'
                          ? `Importer les sanctions (${disciplineRecords.length})`
                          : activeCategory === 'federation'
                            ? 'Synchroniser avec la FFF'
                            : 'Valider et importer'}
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

  /* Barre d'onglets de catégories Footclubs */
  categoriesBarWrap: {
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: proSpace.md,
  },
  categoriesBarContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: proSpace.md,
    maxWidth: 780,
    alignSelf: 'center',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryPillTextBold: {
    fontWeight: '800',
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
    width: 54,
    height: 54,
    borderRadius: 27,
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
    maxWidth: 440,
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

  /* Synchronisation Directe FFF */
  fedCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  fedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  fedTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  fedDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  fedSearchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  fedSearchInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  fedSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  fedSearchBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fedResultsList: {
    gap: 8,
  },
  fedClubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  fedClubName: {
    fontSize: 14,
    fontWeight: '700',
  },
  fedClubCity: {
    fontSize: 12,
  },
  fedChampsWrap: {
    gap: 8,
    marginTop: 6,
  },
  fedChampItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  fedChampName: {
    fontSize: 13,
    fontWeight: '700',
  },
  fedChampTag: {
    fontSize: 11,
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

  /* Prévisualisation commune */
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

  /* Lignes de prévisualisation Calendrier */
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  matchDateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchDateText: {
    fontSize: 11,
    fontWeight: '700',
  },
  matchTeamsWrap: {
    flex: 1,
    gap: 2,
  },
  matchTeamsText: {
    fontSize: 13,
    fontWeight: '700',
  },
  matchVenueText: {
    fontSize: 11,
  },

  /* Lignes de prévisualisation Discipline */
  disciplineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  sanctionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sanctionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
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
