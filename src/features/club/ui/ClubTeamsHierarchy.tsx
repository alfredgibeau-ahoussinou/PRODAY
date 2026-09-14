/**
 * Pôle Club — Gestion des Équipes & Structure Sportive
 * Vue hiérarchique par pôles d'âge + Surclassements FFF (Art. 73).
 * Design System Apple Obsidian Glass · Zéro émoji unicode.
 */
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { ProDayText } from '../../../components/ui/ProDayText';
import { useClubTheme } from '../shell/ClubThemeContext';
import { APPLE_TYPOGRAPHY } from '../../../theme/appleTypography';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';
import { PdfImportModal } from '../../../components/pdf/PdfImportModal';

export type CategoryBracket =
  | 'all'
  | 'ecole_de_foot'
  | 'formation'
  | 'seniors'
  | 'veterans';

export type CategoryBracketId = CategoryBracket;

export function inferTeamBracket(category?: string): CategoryBracket {
  if (!category) return 'formation';
  const c = category.toLowerCase();
  if (
    ['u6', 'u7', 'u8', 'u9', 'u10', 'u11', 'u12', 'u13', 'éveil', 'eveil', 'école', 'ecole'].some(
      (k) => c.includes(k),
    )
  ) {
    return 'ecole_de_foot';
  }
  if (['u14', 'u15', 'u16', 'u17', 'u18', 'u19'].some((k) => c.includes(k))) {
    return 'formation';
  }
  if (['senior', 'r1', 'r2', 'r3', 'd1', 'd2', 'd3', 'd4'].some((k) => c.includes(k))) {
    return 'seniors';
  }
  if (['vétéran', 'veteran', 'loisir', '+35', '+45'].some((k) => c.includes(k))) {
    return 'veterans';
  }
  return 'formation';
}

export type ClubTeamHierarchyItem = {
  teamId: string;
  name: string;
  bracket?: CategoryBracket;
  category?: string;
  genderLabel?: string;
  licensedCount: number;
  coachNames: string[];
  rankingPreview?: string;
  surclassesCount?: number;
  attendanceRate?: number;
};

export type FffSurclassementRecord = {
  id: string;
  playerName: string;
  originalCategory: string;
  targetCategory: string;
  medicalCertDate: string;
  status: 'valid' | 'pending' | 'rejected';
  fffValidationNumber: string;
};

export const DEMO_SURCLASSEMENTS: FffSurclassementRecord[] = [
  {
    id: 'sur-1',
    playerName: 'Lucas Moreau (2010)',
    originalCategory: 'U15',
    targetCategory: 'U17 R2',
    medicalCertDate: '12/08/2026',
    status: 'valid',
    fffValidationNumber: 'SUR-FFF-92-0482',
  },
  {
    id: 'sur-2',
    playerName: 'Noah Vidal (2009)',
    originalCategory: 'U17',
    targetCategory: 'Seniors R1',
    medicalCertDate: '28/08/2026',
    status: 'valid',
    fffValidationNumber: 'SUR-FFF-92-0511',
  },
];

export const CATEGORY_BRACKETS: { id: CategoryBracket; label: string }[] = [
  { id: 'all', label: 'Toutes les équipes' },
  { id: 'ecole_de_foot', label: 'École de foot (U7-U13)' },
  { id: 'formation', label: 'Formation (U14-U18)' },
  { id: 'seniors', label: 'Seniors' },
  { id: 'veterans', label: 'Vétérans & Loisirs' },
];

export const DEMO_TEAMS_HIERARCHY: ClubTeamHierarchyItem[] = [
  {
    teamId: 'team-1',
    name: 'Seniors R1 (Équipe Fanion)',
    bracket: 'seniors',
    category: 'Seniors Masculin',
    genderLabel: 'Masculin',
    licensedCount: 24,
    coachNames: ['Marc Lefevre (Entraîneur)'],
    rankingPreview: '1er (R1 Poule B)',
    surclassesCount: 1,
    attendanceRate: 94,
  },
  {
    teamId: 'team-2',
    name: 'Seniors B (D1)',
    bracket: 'seniors',
    category: 'Seniors Réserve',
    genderLabel: 'Masculin',
    licensedCount: 22,
    coachNames: ['David Rossi'],
    rankingPreview: '4e (Départemental 1)',
    attendanceRate: 91,
  },
  {
    teamId: 'team-3',
    name: 'U17 Régional 2',
    bracket: 'formation',
    category: 'U17 R2',
    genderLabel: 'Masculin',
    licensedCount: 20,
    coachNames: ['Karim Ziani'],
    rankingPreview: '2e (U17 R2)',
    surclassesCount: 1,
    attendanceRate: 95,
  },
  {
    teamId: 'team-4',
    name: 'U15 Régional 2',
    bracket: 'formation',
    category: 'U15 R2',
    genderLabel: 'Masculin',
    licensedCount: 18,
    coachNames: ['Alexandre Petit'],
    rankingPreview: '3e (U15 R2)',
    attendanceRate: 92,
  },
  {
    teamId: 'team-5',
    name: 'U13 Pôle Espoir',
    bracket: 'ecole_de_foot',
    category: 'U13 Région',
    genderLabel: 'Mixte',
    licensedCount: 16,
    coachNames: ['Lucas Bernard'],
    rankingPreview: 'Plateau Critérium',
    attendanceRate: 96,
  },
  {
    teamId: 'team-6',
    name: 'U11 A & B',
    bracket: 'ecole_de_foot',
    category: 'U11 Secteur',
    genderLabel: 'Mixte',
    licensedCount: 26,
    coachNames: ['Sébastien Roux'],
    rankingPreview: 'Rassemblements 92',
    attendanceRate: 93,
  },
  {
    teamId: 'team-7',
    name: 'U9 / U7 Découverte',
    bracket: 'ecole_de_foot',
    category: 'Éveil Football',
    genderLabel: 'Mixte',
    licensedCount: 38,
    coachNames: ['Thomas Martin', 'Clémentine Blanc'],
    rankingPreview: 'Plateaux Festi-Foot',
    attendanceRate: 89,
  },
  {
    teamId: 'team-8',
    name: 'Vétérans +35',
    bracket: 'veterans',
    category: 'Vétérans D2',
    genderLabel: 'Masculin',
    licensedCount: 19,
    coachNames: [],
    rankingPreview: 'Championnat Dimanche Matin',
    attendanceRate: 85,
  },
];

type Props = {
  teams?: ClubTeamHierarchyItem[];
  selectedBracket?: CategoryBracket;
  onSelectBracket?: (bracket: CategoryBracket) => void;
  onSelectTeam?: (teamId: string) => void;
  onOpenCreateTeam?: () => void;
};

export function ClubTeamsHierarchy({
  teams = DEMO_TEAMS_HIERARCHY,
  selectedBracket: controlledBracket,
  onSelectBracket: controlledOnSelectBracket,
  onSelectTeam = () => {},
  onOpenCreateTeam,
}: Props) {
  const { tokens } = useClubTheme();
  const [internalBracket, setInternalBracket] = useState<CategoryBracket>('all');
  const [surclassementOpen, setSurclassementOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [activeRecords] = useState<FffSurclassementRecord[]>(DEMO_SURCLASSEMENTS);

  const selectedBracket = controlledBracket ?? internalBracket;
  const onSelectBracket = controlledOnSelectBracket ?? setInternalBracket;

  const filteredTeams = useMemo(() => {
    if (selectedBracket === 'all') return teams;
    return teams.filter(
      (t) => (t.bracket ?? inferTeamBracket(t.category)) === selectedBracket,
    );
  }, [teams, selectedBracket]);

  const totalLicensed = useMemo(
    () => teams.reduce((sum, t) => sum + (t.licensedCount || 0), 0),
    [teams],
  );

  const teamsWithoutCoach = useMemo(
    () => teams.filter((t) => !t.coachNames || t.coachNames.length === 0).length,
    [teams],
  );

  return (
    <View style={styles.container}>
      {/* 1. Header Résumé Métriques */}
      <View style={[styles.kpiRow, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <View style={styles.kpiCol}>
          <ProDayText style={[styles.kpiValue, { color: tokens.foreground }]}>
            {teams.length}
          </ProDayText>
          <ProDayText style={[styles.kpiLabel, { color: tokens.muted }]}>
            Équipes engagées
          </ProDayText>
        </View>
        <View style={[styles.kpiDivider, { backgroundColor: tokens.border }]} />
        <View style={styles.kpiCol}>
          <ProDayText style={[styles.kpiValue, { color: tokens.accent }]}>
            {totalLicensed}
          </ProDayText>
          <ProDayText style={[styles.kpiLabel, { color: tokens.muted }]}>
            Licenciés actifs
          </ProDayText>
        </View>
        <View style={[styles.kpiDivider, { backgroundColor: tokens.border }]} />
        <View style={styles.kpiCol}>
          <ProDayText
            style={[
              styles.kpiValue,
              { color: teamsWithoutCoach > 0 ? tokens.warning : tokens.accent },
            ]}
          >
            {teamsWithoutCoach}
          </ProDayText>
          <ProDayText style={[styles.kpiLabel, { color: tokens.muted }]}>
            Sans éducateur
          </ProDayText>
        </View>
      </View>

      {/* 2. Boutons d'Action Rapide (Créer équipe / Import PDF / Surclassements FFF) */}
      <View style={styles.actionToolbar}>
        {onOpenCreateTeam ? (
          <PressableSpring
            onPress={onOpenCreateTeam}
            style={[styles.actionBtn, { backgroundColor: tokens.accent }]}
            scaleTo={0.98}
          >
            <Icon name="add" size={16} color="#000000" />
            <ProDayText style={[styles.actionBtnText, { color: '#000000', fontWeight: '700' }]}>
              Nouvelle équipe
            </ProDayText>
          </PressableSpring>
        ) : null}

        <PressableSpring
          onPress={() => setPdfModalOpen(true)}
          style={[styles.actionBtn, { backgroundColor: tokens.surface, borderColor: tokens.border, borderWidth: 1 }]}
          scaleTo={0.98}
        >
          <Icon name="document" size={16} color={tokens.accent} />
          <ProDayText style={[styles.actionBtnText, { color: tokens.foreground }]}>
            Import PDF Licenciés
          </ProDayText>
        </PressableSpring>

        <PressableSpring
          onPress={() => setSurclassementOpen(true)}
          style={[styles.actionBtn, { backgroundColor: tokens.surface, borderColor: tokens.border, borderWidth: 1 }]}
          scaleTo={0.98}
        >
          <Icon name="shield" size={16} color={tokens.accent} />
          <ProDayText style={[styles.actionBtnText, { color: tokens.foreground }]}>
            Surclassements ({activeRecords.length})
          </ProDayText>
        </PressableSpring>
      </View>

      {/* 3. Filtre par Pôles & Catégories (Pilules horizontales) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsScroll}
      >
        {CATEGORY_BRACKETS.map((bracket) => {
          const active = selectedBracket === bracket.id;
          return (
            <PressableSpring
              key={bracket.id}
              onPress={() => onSelectBracket(bracket.id)}
              style={[
                styles.bracketPill,
                active
                  ? { backgroundColor: tokens.accent, borderColor: tokens.accent }
                  : { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
              scaleTo={0.96}
            >
              <ProDayText
                style={[
                  styles.bracketPillText,
                  active ? { color: '#000000', fontWeight: '700' } : { color: tokens.muted },
                ]}
              >
                {bracket.label}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </ScrollView>

      {/* 4. Liste des Cartes d'Équipes */}
      <View style={styles.cardsList}>
        {filteredTeams.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <Icon name="football" size={36} color={tokens.muted} />
            <ProDayText style={[styles.emptyTitle, { color: tokens.foreground }]}>
              Aucune équipe dans ce pôle
            </ProDayText>
            <ProDayText style={[styles.emptyDesc, { color: tokens.muted }]}>
              Engagez une équipe ou modifiez le filtre de catégorie ci-dessus.
            </ProDayText>
          </View>
        ) : (
          filteredTeams.map((team) => {
            const hasCoach = team.coachNames && team.coachNames.length > 0;
            const coachName = hasCoach ? team.coachNames[0] : 'Sans éducateur assigné';
            const rate = team.attendanceRate ?? 92;
            const isRateGood = rate >= 90;

            return (
              <PressableSpring
                key={team.teamId}
                onPress={() => onSelectTeam(team.teamId)}
                style={[styles.teamCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                scaleTo={0.98}
              >
                <View style={styles.teamCardHeader}>
                  <View style={styles.teamIdentity}>
                    <View style={[styles.teamBadge, { backgroundColor: tokens.accentSoft }]}>
                      <Icon name="shield" size={20} color={tokens.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ProDayText style={[styles.teamTitle, { color: tokens.foreground }]}>
                        {team.name}
                      </ProDayText>
                      <ProDayText style={[styles.teamCategory, { color: tokens.muted }]}>
                        {team.category || 'Catégorie standard'} · {team.genderLabel || 'Mixte'}
                      </ProDayText>
                    </View>
                  </View>
                  <Icon name="chevron-forward" size={18} color={tokens.muted} />
                </View>

                {/* Bloc Coach Référent & Taux de Présence */}
                <View style={[styles.teamMetaGrid, { backgroundColor: '#181C26', borderColor: tokens.border }]}>
                  <View style={styles.teamMetaCol}>
                    <View style={styles.metaLabelRow}>
                      <Icon name="school" size={13} color={hasCoach ? tokens.accent : tokens.warning} />
                      <ProDayText style={[styles.metaLabelText, { color: tokens.muted }]}>
                        Coach Référent
                      </ProDayText>
                    </View>
                    <ProDayText
                      style={[
                        styles.metaValueText,
                        { color: hasCoach ? tokens.foreground : tokens.warning },
                      ]}
                      numberOfLines={1}
                    >
                      {coachName}
                    </ProDayText>
                  </View>

                  <View style={[styles.teamMetaDivider, { backgroundColor: tokens.border }]} />

                  <View style={styles.teamMetaCol}>
                    <View style={styles.metaLabelRow}>
                      <Icon
                        name="checkmark-circle"
                        size={13}
                        color={isRateGood ? '#10B981' : '#F59E0B'}
                      />
                      <ProDayText style={[styles.metaLabelText, { color: tokens.muted }]}>
                        Taux de Présence
                      </ProDayText>
                    </View>
                    <View style={styles.attendanceRow}>
                      <ProDayText
                        style={[
                          styles.metaValueText,
                          { color: isRateGood ? '#10B981' : '#F59E0B', fontWeight: '700' },
                        ]}
                      >
                        {rate}%
                      </ProDayText>
                      <View
                        style={[
                          styles.attendanceBadgePill,
                          {
                            backgroundColor: isRateGood
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                          },
                        ]}
                      >
                        <ProDayText
                          style={[
                            styles.attendanceBadgeText,
                            { color: isRateGood ? '#10B981' : '#F59E0B' },
                          ]}
                        >
                          {isRateGood ? 'Assidu' : 'À surveiller'}
                        </ProDayText>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={[styles.teamCardFooter, { borderTopColor: tokens.border }]}>
                  <View style={styles.footerItem}>
                    <Icon name="people" size={14} color={tokens.accent} />
                    <ProDayText style={[styles.footerText, { color: tokens.muted }]}>
                      {team.licensedCount || 0} licenciés
                    </ProDayText>
                  </View>

                  {team.rankingPreview ? (
                    <View style={styles.footerItem}>
                      <Icon name="trophy" size={14} color={tokens.muted} />
                      <ProDayText style={[styles.footerText, { color: tokens.muted }]}>
                        {team.rankingPreview}
                      </ProDayText>
                    </View>
                  ) : null}
                </View>
              </PressableSpring>
            );
          })
        )}
      </View>

      {/* Modal Surclassements FFF */}
      <Modal
        visible={surclassementOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSurclassementOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[styles.modalBox, { backgroundColor: '#12151C', borderColor: tokens.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <ProDayText style={[styles.modalTitle, { color: tokens.foreground }]}>
                  Surclassements FFF
                </ProDayText>
                <ProDayText style={[styles.modalSubtitle, { color: tokens.muted }]}>
                  Conformité médicale & quotas réglementaires
                </ProDayText>
              </View>
              <TouchableOpacity onPress={() => setSurclassementOpen(false)}>
                <Icon name="close" size={24} color={tokens.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={[styles.complianceAlert, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Icon name="checkmark-circle" size={20} color="#10B981" />
                <ProDayText style={[styles.complianceAlertText, { color: '#10B981' }]}>
                  Règlement FFF art. 73 : Maximum 3 joueurs surclassés inscrits sur la feuille de match officielle.
                </ProDayText>
              </View>

              {activeRecords.map((rec) => (
                <View
                  key={rec.id}
                  style={[styles.recordRow, { backgroundColor: '#181C26', borderColor: tokens.border }]}
                >
                  <View style={styles.recordTop}>
                    <ProDayText style={[styles.recordName, { color: tokens.foreground }]}>
                      {rec.playerName}
                    </ProDayText>
                    <View style={styles.validPill}>
                      <ProDayText style={styles.validPillText}>Validé FFF</ProDayText>
                    </View>
                  </View>
                  <ProDayText style={[styles.recordDesc, { color: tokens.muted }]}>
                    Passage : {rec.originalCategory} → {rec.targetCategory}
                  </ProDayText>
                  <View style={styles.recordDetails}>
                    <ProDayText style={[styles.recordMeta, { color: tokens.muted }]}>
                      Certificat : {rec.medicalCertDate}
                    </ProDayText>
                    <ProDayText style={[styles.recordMeta, { color: tokens.muted }]}>
                      Bordereau : {rec.fffValidationNumber}
                    </ProDayText>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <PressableSpring
                onPress={() => setSurclassementOpen(false)}
                style={[styles.modalCloseBtn, { backgroundColor: tokens.accent }]}
                scaleTo={0.97}
              >
                <ProDayText style={styles.modalCloseBtnText}>
                  Fermer
                </ProDayText>
              </PressableSpring>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Import PDF Licenciés (branché sur PdfImportModal) */}
      <PdfImportModal
        visible={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        onImportToSquad={(players) => {
          Alert.alert(
            'Importation FFF réussie',
            `${players.length} licencié(s) FFF détecté(s) et intégrés dans les effectifs du club avec succès.`
          );
          setPdfModalOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: clubSpace.lg,
    paddingTop: 8,
    gap: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: clubRadius.lg,
    borderWidth: 1,
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
  },
  kpiValue: {
    ...APPLE_TYPOGRAPHY.title1,
    fontSize: 22,
    lineHeight: 26,
  },
  kpiLabel: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 28,
  },
  actionToolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: clubRadius.lg,
  },
  actionBtnText: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '600',
  },
  teamMetaGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: clubRadius.md,
    borderWidth: 1,
    padding: 10,
  },
  teamMetaCol: {
    flex: 1,
    gap: 4,
  },
  metaLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaLabelText: {
    ...APPLE_TYPOGRAPHY.caption2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  metaValueText: {
    ...APPLE_TYPOGRAPHY.footnote,
    fontWeight: '600',
  },
  teamMetaDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 10,
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attendanceBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  attendanceBadgeText: {
    ...APPLE_TYPOGRAPHY.caption2,
    fontWeight: '700',
  },
  pillsScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  bracketPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  bracketPillText: {
    ...APPLE_TYPOGRAPHY.footnote,
  },
  cardsList: {
    gap: 12,
    paddingBottom: 40,
  },
  teamCard: {
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  teamCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamTitle: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  teamCategory: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  teamCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    gap: 8,
  },
  emptyTitle: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  emptyDesc: {
    ...APPLE_TYPOGRAPHY.footnote,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '80%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    ...APPLE_TYPOGRAPHY.title2,
  },
  modalSubtitle: {
    ...APPLE_TYPOGRAPHY.footnote,
    marginTop: 2,
  },
  modalBody: {
    flexGrow: 0,
  },
  complianceAlert: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    alignItems: 'center',
  },
  complianceAlertText: {
    ...APPLE_TYPOGRAPHY.caption1,
    flex: 1,
    lineHeight: 18,
  },
  recordRow: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 6,
  },
  recordTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordName: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
  },
  validPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  validPillText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#10B981',
    fontWeight: '700',
  },
  recordDesc: {
    ...APPLE_TYPOGRAPHY.footnote,
  },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  recordMeta: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  modalFooter: {
    marginTop: 16,
  },
  modalCloseBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
    color: '#000000',
  },
});
