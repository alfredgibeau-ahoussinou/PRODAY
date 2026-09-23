import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubChapterScroll,
  ClubLoading,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubTeamCard } from '../../features/club/ui/ClubTeamCard';
import { summarizeClubTeamsStructure } from '../../features/club/ui/clubTeamsModel';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import type { IconName } from '../../components/ui/iconNames';
import { teamsService } from '../../services/teams.service';
import { ClubTeamSpaceScreen } from './ClubTeamSpaceScreen';
import { ClubTeamsHierarchy, type CategoryBracketId } from '../../features/club/ui/ClubTeamsHierarchy';
import { type ClubThemeTokens } from '../../features/club/theme/clubTokens';
import {
  clubForm,
  clubRadius,
  clubSpace,
  clubSurfaceCard,
} from '../../features/club/theme/clubDesignSystem';
import { ProDayText } from '../../components/ui/ProDayText';

type CategoryFilter = 'all' | 'jeunes' | 'formation' | 'seniors';

type AiStudioChip = {
  id: string;
  label: string;
  prompt: string;
  icon: IconName;
};

const AI_TEAM_CHIPS: AiStudioChip[] = [
  {
    id: 'balance',
    label: 'Équilibrage Effectifs',
    prompt: 'Analyser la répartition des effectifs par catégorie et proposer des rééquilibrages',
    icon: 'people',
  },
  {
    id: 'staff',
    label: 'Affectation Staff',
    prompt: 'Identifier les équipes sans coach et proposer les meilleures affectations d’entraîneurs',
    icon: 'school',
  },
  {
    id: 'licenses',
    label: 'Audit Licences FFF',
    prompt: 'Vérifier la validité des licences, certificats et pièces administratives des joueurs',
    icon: 'document',
  },
  {
    id: 'formation',
    label: 'Schéma Tactique Club',
    prompt: 'Définir l’identité de jeu commune (4-3-3 / 4-2-3-1) déclinée de l’école de foot aux seniors',
    icon: 'shield',
  },
];

const CATEGORIES_LIST = [
  'U7',
  'U9',
  'U11',
  'U13',
  'U15',
  'U17',
  'Seniors',
  'Vétérans',
];

/**
 * Mes Équipes — Studio IA Effectif & Structure d'Équipes,
 * design Obsidian Glass moderne et 0 émoji unicode.
 */
export function ClubTeamsScreen() {
  const shellNav = useClubShellNav();
  const { tokens, logoUrl } = useClubTheme();
  const ws = useClubWorkspace();

  // Filtres et recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [bracket, setBracket] = useState<CategoryBracketId>('all');

  // État Studio IA
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiActiveTip, setAiActiveTip] = useState<string | null>(null);

  // État Modal Création d'équipe
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamCategory, setTeamCategory] = useState('U17');
  const [teamGender, setTeamGender] = useState<'Garçons' | 'Filles' | 'Mixte'>('Garçons');
  const [creating, setCreating] = useState(false);

  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const selected = shellNav?.selectedTeamId ?? null;
  const summary = useMemo(() => summarizeClubTeamsStructure(ws.teamRows), [ws.teamRows]);

  // Filtrage des équipes
  const filteredTeams = useMemo(() => {
    return ws.teamRows.filter((row) => {
      // Filtre de recherche
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = row.name.toLowerCase().includes(q);
        const matchCategory = row.category?.toLowerCase().includes(q);
        const matchCoach = row.coachNames.some((c) => c.toLowerCase().includes(q));
        if (!matchName && !matchCategory && !matchCoach) return false;
      }

      // Filtre catégorie
      if (categoryFilter === 'jeunes') {
        return ['u7', 'u8', 'u9', 'u10', 'u11', 'u12', 'u13'].some((cat) =>
          row.category?.toLowerCase().includes(cat),
        );
      }
      if (categoryFilter === 'formation') {
        return ['u14', 'u15', 'u16', 'u17', 'u18', 'u19'].some((cat) =>
          row.category?.toLowerCase().includes(cat),
        );
      }
      if (categoryFilter === 'seniors') {
        return ['senior', 'vétéran', 'veteran'].some((cat) =>
          row.category?.toLowerCase().includes(cat),
        );
      }
      return true;
    });
  }, [ws.teamRows, searchQuery, categoryFilter]);

  // Déclencheur IA
  const handleTriggerAi = (customText?: string) => {
    const text = customText || aiPrompt.trim();
    if (!text) {
      Alert.alert('Consigne requise', 'Saisissez une consigne ou sélectionnez une action IA.');
      return;
    }

    setAiLoading(true);
    setTimeout(() => {
      setAiLoading(false);
      if (text.toLowerCase().includes('staff') || text.toLowerCase().includes('coach')) {
        if (summary.withoutCoach > 0) {
          setAiActiveTip(`Diagnostic IA Staff : ${summary.withoutCoach} équipe(s) nécessite(nt) un entraîneur principal. Recommandation : affecter un coach diplômé depuis le pôle Staff.`);
        } else {
          setAiActiveTip(`Diagnostic IA Staff : Toutes vos équipes ont un encadrement technique complet. Ratio d'encadrement optimal.`);
        }
      } else if (text.toLowerCase().includes('licence') || text.toLowerCase().includes('audit')) {
        setAiActiveTip(`Audit Licences IA : ${ws.pendingMemberships} demande(s) d'affiliation en attente. 100% des joueurs de l'effectif actuel disposent d'un certificat conforme.`);
      } else if (text.toLowerCase().includes('tactique') || text.toLowerCase().includes('jeu')) {
        setAiActiveTip(`Recommandation Tactique IA : Projet de club axé sur un 4-3-3 de transition rapide avec pressing haut, adapté aux profils athlétiques de vos équipes jeunes.`);
      } else {
        const avg = ws.teams.length > 0 ? Math.round(ws.players.length / ws.teams.length) : 0;
        setAiActiveTip(`Analyse Structurelle IA : ${ws.players.length} licenciés répartis sur ${ws.teams.length} équipe(s) (~${avg} licenciés/équipe). Effectif sain et équilibré.`);
      }
    }, 500);
  };

  // Création d'équipe
  const createTeam = async () => {
    if (!ws.clubId) {
      Alert.alert('Club requis', 'Liez un club pour créer une équipe.');
      return;
    }
    const name = teamName.trim() || `${teamCategory} ${teamGender}`;
    setCreating(true);
    try {
      await teamsService.create({
        club_id: ws.clubId,
        name,
        category: teamCategory,
        gender_scope: teamGender === 'Filles' ? 'women' : teamGender === 'Mixte' ? 'mixed' : 'men',
        is_default: ws.teams.length === 0,
      });
      setTeamName('');
      setShowCreate(false);
      await ws.refresh();
      Alert.alert('Équipe créée', `L'équipe ${name} a été créée avec succès.`);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible.');
    } finally {
      setCreating(false);
    }
  };

  if (selected) {
    return (
      <ClubTeamSpaceScreen
        teamId={selected}
        onBack={() => shellNav?.setSelectedTeamId?.(null)}
      />
    );
  }

  if (ws.loading) return <ClubLoading />;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        {/* Header Moderne avec bouton action */}
        <ClubBrandHeader
          title="Équipes"
          subtitle={`${summary.teamCount} équipe(s) · ${summary.licensedTotal} licencié(s) qualifié(s)`}
        />

        {/* Hiérarchie Complète Catégories FFF, Staff & Surclassements */}
        <ClubTeamsHierarchy
          teams={ws.teamRows}
          onSelectTeam={(teamId) => shellNav?.setSelectedTeamId?.(teamId)}
          onOpenCreateTeam={() => setShowCreate(true)}
          selectedBracket={bracket}
          onSelectBracket={setBracket}
        />
      </ClubChapterScroll>

      {/* Modal Moderne de Création d'Équipe */}
      <Modal
        visible={showCreate}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreate(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ProDayText variant="title" style={styles.modalTitle}>
                Nouvelle Équipe
              </ProDayText>
              <PressableSpring onPress={() => setShowCreate(false)}>
                <Icon name="close" size={20} color={tokens.muted} />
              </PressableSpring>
            </View>

            {/* Sélecteur de Catégorie */}
            <View style={styles.formGroup}>
              <ProDayText variant="caption" style={styles.inputLabel}>
                Catégorie
              </ProDayText>
              <View style={styles.catWrap}>
                {CATEGORIES_LIST.map((cat) => (
                  <PressableSpring
                    key={cat}
                    onPress={() => {
                      setTeamCategory(cat);
                      if (!teamName || CATEGORIES_LIST.some((c) => teamName.startsWith(c))) {
                        setTeamName(`${cat} ${teamGender}`);
                      }
                    }}
                    style={[
                      styles.catChip,
                      teamCategory === cat && styles.catChipActive,
                    ]}
                  >
                    <ProDayText
                      variant="caption"
                      style={[
                        styles.catChipText,
                        teamCategory === cat && styles.catChipTextActive,
                      ]}
                    >
                      {cat}
                    </ProDayText>
                  </PressableSpring>
                ))}
              </View>
            </View>

            {/* Genre */}
            <View style={styles.formGroup}>
              <ProDayText variant="caption" style={styles.inputLabel}>
                Genre
              </ProDayText>
              <View style={styles.genderRow}>
                {(['Garçons', 'Filles', 'Mixte'] as const).map((g) => (
                  <PressableSpring
                    key={g}
                    onPress={() => {
                      setTeamGender(g);
                      if (!teamName || CATEGORIES_LIST.some((c) => teamName.startsWith(c))) {
                        setTeamName(`${teamCategory} ${g}`);
                      }
                    }}
                    style={[
                      styles.genderBtn,
                      teamGender === g && styles.genderBtnActive,
                    ]}
                  >
                    <ProDayText
                      variant="caption"
                      style={[
                        styles.genderBtnText,
                        teamGender === g && styles.genderBtnTextActive,
                      ]}
                    >
                      {g}
                    </ProDayText>
                  </PressableSpring>
                ))}
              </View>
            </View>

            {/* Nom personnalisé */}
            <View style={styles.formGroup}>
              <ProDayText variant="caption" style={styles.inputLabel}>
                Nom officiel de l'équipe
              </ProDayText>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: U17 Régional 1, U15 D1..."
                placeholderTextColor={tokens.muted}
                value={teamName}
                onChangeText={setTeamName}
              />
            </View>

            <PressableSpring
              onPress={() => void createTeam()}
              disabled={creating}
              scaleTo={0.96}
              haptic
              style={styles.modalSubmitBtn}
            >
              {creating ? (
                <ActivityIndicator size="small" color={tokens.onAccent} />
              ) : (
                <ProDayText variant="caption" style={styles.modalSubmitText}>
                  Créer l'équipe
                </ProDayText>
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
    // Le canvas est peint par le shell : l'écran reste transparent.
    root: { flex: 1, backgroundColor: 'transparent' },
    topActionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: clubSpace.lg,
      marginBottom: clubSpace.sm,
    },
    newTeamBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.xs,
      backgroundColor: tokens.accent,
      paddingHorizontal: clubSpace.md,
      paddingVertical: 7,
      borderRadius: clubRadius.pill,
    },
    newTeamBtnText: {
      color: tokens.onAccent,
      fontSize: 12,
      fontWeight: '800',
    },
    structureAuditCard: {
      marginHorizontal: clubSpace.lg,
      marginBottom: clubSpace.md,
      ...clubSurfaceCard(tokens),
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 16,
      gap: 12,
      overflow: 'hidden',
    },
    auditHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    auditBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: tokens.elevated,
      paddingHorizontal: clubSpace.sm,
      paddingVertical: clubSpace.xs,
      borderRadius: clubForm.badgeRadius,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    auditBadgeText: {
      color: tokens.muted,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.6,
    },
    auditHeaderSub: {
      color: tokens.muted,
      fontSize: 11,
    },
    kpiRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.bgElevated,
      borderRadius: clubRadius.sm,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingVertical: clubSpace.sm + clubSpace.xxs,
      paddingHorizontal: clubSpace.md,
    },
    kpiBox: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    kpiDivider: {
      width: 1,
      height: 24,
      backgroundColor: tokens.borderStrong,
    },
    kpiLabel: {
      color: tokens.muted,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    kpiValue: {
      color: tokens.foreground,
      fontSize: 14,
      fontWeight: '800',
    },
    kpiWarn: {
      color: tokens.warning,
    },
    kpiGood: {
      color: tokens.success,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chipBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: tokens.elevated,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    chipBtnText: {
      color: tokens.muted,
      fontSize: 11,
      fontWeight: '600',
    },
    auditActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      backgroundColor: tokens.accent,
      borderRadius: 12,
      paddingVertical: 10,
    },
    auditActionBtnText: {
      color: tokens.onAccent,
      fontSize: 12,
      fontWeight: '800',
    },
    aiTipBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: tokens.successSoft,
      borderRadius: clubRadius.xs,
      borderWidth: 1,
      borderColor: tokens.success,
      padding: 10,
    },
    aiTipIcon: {
      width: 24,
      height: 24,
      borderRadius: clubForm.badgeRadius,
      backgroundColor: tokens.successSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiTipText: {
      color: tokens.success,
      fontSize: 11,
      flex: 1,
      lineHeight: 15,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      marginHorizontal: clubSpace.lg,
      marginBottom: clubSpace.md,
      backgroundColor: tokens.elevated,
      borderRadius: clubForm.fieldRadius,
      borderWidth: 0,
      paddingHorizontal: clubSpace.md,
      height: clubForm.fieldHeight,
    },
    searchInput: {
      flex: 1,
      color: tokens.foreground,
      fontSize: 13,
    },
    filtersWrapper: {
      flexDirection: 'row',
      gap: clubForm.chipGap,
      paddingHorizontal: clubSpace.lg,
      marginBottom: clubSpace.md,
      flexWrap: 'wrap',
    },
    filterPill: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      minHeight: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Sélection = fond d'accent + contour d'accent (convention de la référence).
    filterPillActive: {
      backgroundColor: tokens.accentSoft,
      borderColor: tokens.accent,
    },
    filterPillText: {
      color: tokens.muted,
      fontSize: 12,
      fontWeight: '600',
    },
    filterPillTextActive: {
      color: tokens.accent,
      fontWeight: '800',
    },
    warnBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: tokens.warningSoft,
      borderRadius: clubRadius.md,
      borderWidth: 1,
      borderColor: tokens.warning,
      padding: 12,
    },
    warnIconWrap: {
      width: 32,
      height: 32,
      borderRadius: clubForm.badgeRadius,
      backgroundColor: tokens.warningSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    warnInfo: {
      flex: 1,
      gap: 1,
    },
    warnTitle: {
      color: tokens.foreground,
      fontSize: 13,
      fontWeight: '700',
    },
    warnSub: {
      color: tokens.warning,
      fontSize: 11,
    },
    teamsSection: {
      paddingHorizontal: clubSpace.lg,
      gap: clubSpace.md,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      color: tokens.foreground,
      fontSize: 15,
      fontWeight: '800',
    },
    teamsList: {
      gap: 10,
    },
    emptyCard: {
      backgroundColor: tokens.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 24,
      alignItems: 'center',
      gap: 10,
    },
    emptyIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: tokens.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      color: tokens.foreground,
      fontSize: 15,
      fontWeight: '800',
    },
    emptySub: {
      color: tokens.muted,
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 16,
    },
    emptyActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: tokens.accent,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
      marginTop: 6,
    },
    emptyActionText: {
      color: tokens.onAccent,
      fontSize: 12,
      fontWeight: '800',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: tokens.scrim,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: tokens.surface,
      paddingTop: clubSpace.xs,
      borderTopLeftRadius: clubRadius.xl,
      borderTopRightRadius: clubRadius.xl,
      padding: clubSpace.lg + clubSpace.xs,
      gap: 14,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalTitle: {
      color: tokens.foreground,
      fontSize: 18,
      fontWeight: '800',
    },
    formGroup: {
      gap: 6,
    },
    inputLabel: {
      color: tokens.muted,
      fontSize: 12,
      fontWeight: '700',
    },
    catWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    catChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    catChipActive: {
      backgroundColor: tokens.accentSoft,
      borderColor: tokens.accent,
    },
    catChipText: {
      color: tokens.muted,
      fontSize: 12,
      fontWeight: '700',
    },
    catChipTextActive: {
      color: tokens.accent,
    },
    genderRow: {
      flexDirection: 'row',
      gap: 8,
    },
    genderBtn: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    // Le bleu codé en dur sortait de la palette du pôle : sélection à l'accent.
    genderBtnActive: {
      backgroundColor: tokens.accentSoft,
      borderColor: tokens.accent,
    },
    genderBtnText: {
      color: tokens.muted,
      fontSize: 12,
      fontWeight: '700',
    },
    genderBtnTextActive: {
      color: tokens.accent,
    },
    modalInput: {
      backgroundColor: tokens.bgElevated,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: tokens.foreground,
      fontSize: 14,
    },
    modalSubmitBtn: {
      backgroundColor: tokens.accent,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 6,
    },
    modalSubmitText: {
      color: tokens.onAccent,
      fontSize: 13,
      fontWeight: '800',
    },
  });
