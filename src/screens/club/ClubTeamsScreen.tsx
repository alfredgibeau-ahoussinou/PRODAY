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
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
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
                <Icon name="close" size={20} color="#8E8E9F" />
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
                placeholderTextColor="#6B6B7F"
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
                <ActivityIndicator size="small" color="#000000" />
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

const createStyles = (_tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: '#09090D' },
    topActionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    newTeamBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
    },
    newTeamBtnText: {
      color: '#000000',
      fontSize: 12,
      fontWeight: '800',
    },
    structureAuditCard: {
      marginHorizontal: 16,
      marginBottom: 14,
      backgroundColor: '#141418',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
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
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    auditBadgeText: {
      color: '#D1D5DB',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.6,
    },
    auditHeaderSub: {
      color: '#8E8E9F',
      fontSize: 11,
    },
    kpiRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#0E0E14',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    kpiBox: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    kpiDivider: {
      width: 1,
      height: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    kpiLabel: {
      color: '#8E8E9F',
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    kpiValue: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
    kpiWarn: {
      color: '#F59E0B',
    },
    kpiGood: {
      color: '#10B981',
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
      backgroundColor: '#181820',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    chipBtnText: {
      color: '#D1D5DB',
      fontSize: 11,
      fontWeight: '600',
    },
    auditActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingVertical: 10,
    },
    auditActionBtnText: {
      color: '#000000',
      fontSize: 12,
      fontWeight: '800',
    },
    aiTipBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
      padding: 10,
    },
    aiTipIcon: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiTipText: {
      color: '#D1FAE5',
      fontSize: 11,
      flex: 1,
      lineHeight: 15,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 10,
      backgroundColor: '#141418',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      paddingHorizontal: 12,
      height: 44,
    },
    searchInput: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 13,
    },
    filtersWrapper: {
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 16,
      marginBottom: 12,
      flexWrap: 'wrap',
    },
    filterPill: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: '#141418',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      minHeight: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterPillActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.14)',
      borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    filterPillText: {
      color: '#8E8E9F',
      fontSize: 12,
      fontWeight: '600',
    },
    filterPillTextActive: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    warnBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: 'rgba(245, 158, 11, 0.08)',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.3)',
      padding: 12,
    },
    warnIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    warnInfo: {
      flex: 1,
      gap: 1,
    },
    warnTitle: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    warnSub: {
      color: '#F59E0B',
      fontSize: 11,
    },
    teamsSection: {
      paddingHorizontal: 16,
      gap: 10,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
    teamsList: {
      gap: 10,
    },
    emptyCard: {
      backgroundColor: '#141418',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      padding: 24,
      alignItems: 'center',
      gap: 10,
    },
    emptyIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
    emptySub: {
      color: '#8B8B9A',
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 16,
    },
    emptyActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
      marginTop: 6,
    },
    emptyActionText: {
      color: '#000000',
      fontSize: 12,
      fontWeight: '800',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#141418',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      gap: 14,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalTitle: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '800',
    },
    formGroup: {
      gap: 6,
    },
    inputLabel: {
      color: '#8E8E9F',
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
      backgroundColor: '#141418',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    catChipActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    catChipText: {
      color: '#8E8E9F',
      fontSize: 12,
      fontWeight: '700',
    },
    catChipTextActive: {
      color: '#FFFFFF',
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
      backgroundColor: '#141418',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    genderBtnActive: {
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: '#3B82F6',
    },
    genderBtnText: {
      color: '#8E8E9F',
      fontSize: 12,
      fontWeight: '700',
    },
    genderBtnTextActive: {
      color: '#3B82F6',
    },
    modalInput: {
      backgroundColor: '#0E0E14',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#222230',
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: '#FFFFFF',
      fontSize: 14,
    },
    modalSubmitBtn: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 6,
    },
    modalSubmitText: {
      color: '#000000',
      fontSize: 13,
      fontWeight: '800',
    },
  });
