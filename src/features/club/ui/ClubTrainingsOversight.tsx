/**
 * Pôle Club — Suivi Global des Entraînements & Bibliothèque Pédagogique (RTJ)
 * Dashboard Directeur Technique, assiduité séances & assignation exercices aux coachs.
 * Design System Apple Obsidian Glass · Zéro émoji unicode.
 */
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { ProDayText } from '../../../components/ui/ProDayText';
import { useClubTheme } from '../shell/ClubThemeContext';
import { APPLE_TYPOGRAPHY } from '../../../theme/appleTypography';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';

export type SessionCheckInItem = {
  sessionId: string;
  teamName: string;
  category: string;
  coachName: string;
  timeRange: string;
  pitchName: string;
  status: 'in_progress' | 'upcoming' | 'completed';
  totalInvited: number;
  presentsCount: number;
  absentsCount: number;
  injuredCount: number;
  validationStatus: 'validated' | 'pending';
  dtComment?: string;
  dtCommentAuthor?: string;
  dtCommentDate?: string;
};

export type PedagogicalDrill = {
  id: string;
  title: string;
  category: string;
  durationMin: number;
  intensity: 'Basse' | 'Modérée' | 'Haute';
  focus: string;
  objective: string;
};

export const DEMO_SESSIONS_CHECKIN: SessionCheckInItem[] = [
  {
    sessionId: 'chk-1',
    teamName: 'Seniors R1',
    category: 'Seniors',
    coachName: 'Marc Lefevre',
    timeRange: '19:30 - 21:00',
    pitchName: 'Synthétique A',
    status: 'in_progress',
    totalInvited: 22,
    presentsCount: 19,
    absentsCount: 2,
    injuredCount: 1,
    validationStatus: 'pending',
    dtComment: 'Très bon engagement au pressing haut. Veiller à doser l’effort des latéraux avant le match de dimanche.',
    dtCommentAuthor: 'Directeur Technique (DT)',
    dtCommentDate: 'Aujourd’hui 20:15',
  },
  {
    sessionId: 'chk-2',
    teamName: 'U17 R2',
    category: 'Formation',
    coachName: 'Karim Ziani',
    timeRange: '19:00 - 20:30',
    pitchName: 'Synthétique A',
    status: 'completed',
    totalInvited: 20,
    presentsCount: 18,
    absentsCount: 1,
    injuredCount: 1,
    validationStatus: 'validated',
    dtComment: 'Séance conforme au plan de formation. Les circuits de relance axiaux progressent bien.',
    dtCommentAuthor: 'Directeur Technique (DT)',
    dtCommentDate: 'Aujourd’hui 20:35',
  },
  {
    sessionId: 'chk-3',
    teamName: 'U15 R2',
    category: 'Formation',
    coachName: 'Alexandre Petit',
    timeRange: '17:30 - 19:00',
    pitchName: 'Synthétique B',
    status: 'completed',
    totalInvited: 18,
    presentsCount: 16,
    absentsCount: 2,
    injuredCount: 0,
    validationStatus: 'validated',
    dtComment: 'Pointage assiduité complet. Relancer les 2 absents pour la convocation du week-end.',
    dtCommentAuthor: 'Directeur Technique (DT)',
    dtCommentDate: 'Aujourd’hui 19:10',
  },
  {
    sessionId: 'chk-4',
    teamName: 'U13 Pôle Espoir',
    category: 'Pré-formation',
    coachName: 'Lucas Bernard',
    timeRange: '17:30 - 19:00',
    pitchName: 'Synthétique A',
    status: 'completed',
    totalInvited: 16,
    presentsCount: 15,
    absentsCount: 1,
    injuredCount: 0,
    validationStatus: 'validated',
  },
];

export const DEMO_DRILLS_LIBRARY: PedagogicalDrill[] = [
  {
    id: 'dr-1',
    title: 'Conservation sous pressing & Sortie de balle',
    category: 'Formation (U14-U18) & Seniors',
    durationMin: 20,
    intensity: 'Haute',
    focus: 'Jeu de transition & Déplacements axiaux',
    objective: 'Trouver le joueur libre entre les lignes sous pression active.',
  },
  {
    id: 'dr-2',
    title: 'Attaque placée contre Bloc Bas 4-4-2',
    category: 'Seniors',
    durationMin: 25,
    intensity: 'Haute',
    focus: 'Animation Défensive/Offensive',
    objective: 'Fixer dans la largeur pour trouver le milieu intercalé.',
  },
  {
    id: 'dr-3',
    title: 'Parcours Motricité & Dribbles U11',
    category: 'École de foot (U9-U11)',
    durationMin: 15,
    intensity: 'Modérée',
    focus: 'Coordination',
    objective: 'Appuis dynamiques, feinte de corps et conduite deux pieds.',
  },
];

type Props = {
  sessions?: SessionCheckInItem[];
  drills?: PedagogicalDrill[];
  onAssignDrill?: (drillId: string) => void;
};

export function ClubTrainingsOversight({
  sessions = DEMO_SESSIONS_CHECKIN,
  drills = DEMO_DRILLS_LIBRARY,
}: Props) {
  const { tokens } = useClubTheme();
  const [activeTab, setActiveTab] = useState<'checkin' | 'library'>('checkin');
  const [sessionList, setSessionList] = useState<SessionCheckInItem[]>(sessions);
  const [editingSession, setEditingSession] = useState<SessionCheckInItem | null>(null);
  const [dtDraftComment, setDtDraftComment] = useState('');

  const totalPresents = useMemo(
    () => sessionList.reduce((sum, s) => sum + s.presentsCount, 0),
    [sessionList],
  );
  const totalInvited = useMemo(
    () => sessionList.reduce((sum, s) => sum + s.totalInvited, 0),
    [sessionList],
  );
  const globalAttendanceRate = useMemo(
    () => (totalInvited > 0 ? Math.round((totalPresents / totalInvited) * 100) : 0),
    [totalPresents, totalInvited],
  );
  const pendingValidationCount = useMemo(
    () => sessionList.filter((s) => s.validationStatus === 'pending').length,
    [sessionList],
  );

  const handleAssignToCoach = (drill: PedagogicalDrill) => {
    Alert.alert(
      'Exercice assigné',
      `L'exercice "${drill.title}" a été poussé sur l'Espace Coach de l'ensemble des éducateurs concernés (${drill.category}).`,
    );
  };

  return (
    <View style={styles.container}>
      {/* BANNER VUE CONSOLIDÉE DT (PAGE 14 SPÉCIFICATIONS V4) */}
      <View style={[styles.dtBanner, { backgroundColor: tokens.surface, borderColor: `${tokens.accent}40` }]}>
        <View style={[styles.dtBannerIcon, { backgroundColor: tokens.accentSoft }]}>
          <Icon name="school" size={16} color={tokens.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <ProDayText style={[styles.dtBannerTitle, { color: tokens.foreground }]}>
            Vue Consolidée DT · Lecture Seule
          </ProDayText>
          <ProDayText style={[styles.dtBannerSubtitle, { color: tokens.muted }]}>
            Supervision de toutes les séances éducateurs · Commentaires internes DT
          </ProDayText>
        </View>
      </View>

      {/* 1. Baromètre RTJ (Assiduité & Feuilles en attente) */}
      <View style={[styles.kpiCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <View style={styles.kpiCol}>
          <ProDayText style={[styles.kpiVal, { color: tokens.accent }]}>
            {globalAttendanceRate}%
          </ProDayText>
          <ProDayText style={[styles.kpiLabel, { color: tokens.muted }]}>
            Taux d'assiduité global
          </ProDayText>
        </View>

        <View style={[styles.kpiSep, { backgroundColor: tokens.border }]} />

        <View style={styles.kpiCol}>
          <ProDayText style={[styles.kpiVal, { color: tokens.foreground }]}>
            {totalPresents} / {totalInvited}
          </ProDayText>
          <ProDayText style={[styles.kpiLabel, { color: tokens.muted }]}>
            Joueurs présents ce soir
          </ProDayText>
        </View>

        <View style={[styles.kpiSep, { backgroundColor: tokens.border }]} />

        <View style={styles.kpiCol}>
          <ProDayText style={[styles.kpiVal, { color: pendingValidationCount > 0 ? tokens.warning : tokens.accent }]}>
            {pendingValidationCount}
          </ProDayText>
          <ProDayText style={[styles.kpiLabel, { color: tokens.muted }]}>
            Feuille(s) à signer
          </ProDayText>
        </View>
      </View>

      {/* 2. Onglets Suivi du jour vs Bibliothèque Pédagogique */}
      <View style={[styles.tabBar, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <PressableSpring
          onPress={() => setActiveTab('checkin')}
          style={[styles.tabItem, activeTab === 'checkin' && { backgroundColor: tokens.accentSoft }]}
          scaleTo={0.97}
        >
          <ProDayText
            style={[
              styles.tabText,
              { color: activeTab === 'checkin' ? tokens.accent : tokens.muted },
            ]}
          >
            Pointages Séances ({sessionList.length})
          </ProDayText>
        </PressableSpring>

        <PressableSpring
          onPress={() => setActiveTab('library')}
          style={[styles.tabItem, activeTab === 'library' && { backgroundColor: tokens.accentSoft }]}
          scaleTo={0.97}
        >
          <ProDayText
            style={[
              styles.tabText,
              { color: activeTab === 'library' ? tokens.accent : tokens.muted },
            ]}
          >
            Bibliothèque Exercices ({drills.length})
          </ProDayText>
        </PressableSpring>
      </View>

      {/* VUE 1 : POINTAGES DU JOUR */}
      {activeTab === 'checkin' ? (
        <View style={styles.sessionsList}>
          {sessionList.map((session) => (
            <View
              key={session.sessionId}
              style={[styles.sessionCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            >
              <View style={styles.sessionHeader}>
                <View>
                  <ProDayText style={[styles.sessionTitle, { color: tokens.foreground }]}>
                    {session.teamName} · {session.category}
                  </ProDayText>
                  <ProDayText style={[styles.sessionCoach, { color: tokens.muted }]}>
                    Éducateur : {session.coachName} · {session.pitchName}
                  </ProDayText>
                </View>

                <View style={styles.sessionBadgesCol}>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          session.status === 'in_progress'
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'rgba(59, 130, 246, 0.2)',
                      },
                    ]}
                  >
                    <ProDayText
                      style={[
                        styles.statusPillText,
                        {
                          color:
                            session.status === 'in_progress' ? '#10B981' : '#3B82F6',
                        },
                      ]}
                    >
                      {session.status === 'in_progress' ? 'EN COURS' : 'TERMINÉ'}
                    </ProDayText>
                  </View>
                  <View style={[styles.readOnlyPill, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                    <ProDayText style={[styles.readOnlyText, { color: tokens.muted }]}>
                      Lecture seule
                    </ProDayText>
                  </View>
                </View>
              </View>

              {/* Compteurs Présents / Absents / Blessés */}
              <View style={[styles.presenceRow, { borderTopColor: tokens.border }]}>
                <View style={styles.counterBox}>
                  <Icon name="checkmark-circle" size={15} color="#10B981" />
                  <ProDayText style={[styles.counterText, { color: tokens.foreground }]}>
                    {session.presentsCount} présents
                  </ProDayText>
                </View>

                <View style={styles.counterBox}>
                  <Icon name="close" size={15} color="#EF4444" />
                  <ProDayText style={[styles.counterText, { color: tokens.muted }]}>
                    {session.absentsCount} absents
                  </ProDayText>
                </View>

                {session.injuredCount > 0 ? (
                  <View style={styles.counterBox}>
                    <Icon name="fitness" size={15} color="#F59E0B" />
                    <ProDayText style={[styles.counterText, { color: tokens.muted }]}>
                      {session.injuredCount} blessé
                    </ProDayText>
                  </View>
                ) : null}
              </View>

              {/* Commentaires Internes DT */}
              <View style={[styles.dtCommentContainer, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                <View style={styles.dtCommentHeader}>
                  <View style={styles.dtCommentBadge}>
                    <Icon name="chat" size={13} color={tokens.accent} />
                    <ProDayText style={[styles.dtCommentBadgeText, { color: tokens.accent }]}>
                      Commentaire Interne DT
                    </ProDayText>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingSession(session);
                      setDtDraftComment(session.dtComment || '');
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <ProDayText style={[styles.dtEditBtnText, { color: tokens.accent }]}>
                      {session.dtComment ? 'Modifier' : '+ Ajouter note DT'}
                    </ProDayText>
                  </TouchableOpacity>
                </View>

                {session.dtComment ? (
                  <View style={styles.dtCommentBody}>
                    <ProDayText style={[styles.dtCommentText, { color: tokens.foreground }]}>
                      « {session.dtComment} »
                    </ProDayText>
                    {session.dtCommentDate ? (
                      <ProDayText style={[styles.dtCommentDate, { color: tokens.muted }]}>
                        {session.dtCommentAuthor ? `${session.dtCommentAuthor} · ` : ''}{session.dtCommentDate}
                      </ProDayText>
                    ) : null}
                  </View>
                ) : (
                  <ProDayText style={[styles.dtNoCommentText, { color: tokens.muted }]}>
                    Aucune observation DT enregistrée pour cette séance.
                  </ProDayText>
                )}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* VUE 2 : BIBLIOTHÈQUE PÉDAGOGIQUE (EXERCICES RTJ) */}
      {activeTab === 'library' ? (
        <View style={styles.drillsList}>
          {drills.map((drill) => (
            <View
              key={drill.id}
              style={[styles.drillCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            >
              <View style={styles.drillHeader}>
                <View style={{ flex: 1 }}>
                  <ProDayText style={[styles.drillTitle, { color: tokens.foreground }]}>
                    {drill.title}
                  </ProDayText>
                  <ProDayText style={[styles.drillCat, { color: tokens.muted }]}>
                    {drill.category} · {drill.durationMin} min · Intensité {drill.intensity}
                  </ProDayText>
                </View>

                <PressableSpring
                  onPress={() => handleAssignToCoach(drill)}
                  style={[styles.assignBtn, { backgroundColor: tokens.accentSoft }]}
                  scaleTo={0.96}
                >
                  <Icon name="flash" size={14} color={tokens.accent} />
                  <ProDayText style={[styles.assignBtnText, { color: tokens.accent }]}>
                    Assigner
                  </ProDayText>
                </PressableSpring>
              </View>

              <View style={[styles.drillFooter, { borderTopColor: tokens.border }]}>
                <ProDayText style={[styles.drillFocus, { color: tokens.foreground }]}>
                  Focus : {drill.focus}
                </ProDayText>
                <ProDayText style={[styles.drillObj, { color: tokens.muted }]}>
                  {drill.objective}
                </ProDayText>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* MODAL COMMENTAIRE INTERNE DT (PAGE 14) */}
      <Modal
        visible={editingSession != null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingSession(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <ProDayText style={[styles.modalTitle, { color: tokens.foreground }]}>
                  Commentaire Interne DT
                </ProDayText>
                <ProDayText style={[styles.modalSubtitle, { color: tokens.muted }]}>
                  {editingSession?.teamName} · Éducateur {editingSession?.coachName}
                </ProDayText>
              </View>
              <TouchableOpacity onPress={() => setEditingSession(null)}>
                <Icon name="close" size={20} color={tokens.muted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.modalTextInput,
                { color: tokens.foreground, borderColor: tokens.border, backgroundColor: tokens.elevated },
              ]}
              placeholder="Consigne ou observation pédagogique du Directeur Technique..."
              placeholderTextColor={tokens.muted}
              multiline
              numberOfLines={4}
              value={dtDraftComment}
              onChangeText={setDtDraftComment}
            />

            <View style={styles.modalFooter}>
              <PressableSpring
                onPress={() => {
                  if (!editingSession) return;
                  setSessionList((prev) =>
                    prev.map((s) =>
                      s.sessionId === editingSession.sessionId
                        ? {
                            ...s,
                            dtComment: dtDraftComment.trim() || undefined,
                            dtCommentAuthor: 'Directeur Technique (DT)',
                            dtCommentDate: 'Aujourd’hui (validé)',
                          }
                        : s,
                    ),
                  );
                  setEditingSession(null);
                  Alert.alert('Commentaire DT enregistré', 'L’observation interne a été enregistrée sur la séance.');
                }}
                style={[styles.modalSaveBtn, { backgroundColor: tokens.accent }]}
                scaleTo={0.97}
              >
                <ProDayText style={styles.modalSaveBtnText}>Enregistrer la note DT</ProDayText>
              </PressableSpring>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: clubSpace.lg,
    paddingTop: 8,
    gap: 14,
  },
  kpiCard: {
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
  kpiVal: {
    ...APPLE_TYPOGRAPHY.title2,
    fontSize: 20,
    lineHeight: 24,
  },
  kpiLabel: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
    textAlign: 'center',
  },
  kpiSep: {
    width: 1,
    height: 28,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabText: {
    ...APPLE_TYPOGRAPHY.footnote,
    fontWeight: '600',
  },
  sessionsList: {
    gap: 12,
    paddingBottom: 40,
  },
  sessionCard: {
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionTitle: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  sessionCoach: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
    fontSize: 10,
  },
  presenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '600',
  },
  drillsList: {
    gap: 12,
    paddingBottom: 40,
  },
  drillCard: {
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  drillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  drillTitle: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  drillCat: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  assignBtnText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
  },
  drillFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 4,
  },
  drillFocus: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '600',
  },
  drillObj: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  dtBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    marginBottom: 4,
  },
  dtBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dtBannerTitle: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
  },
  dtBannerSubtitle: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  sessionBadgesCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  readOnlyPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  readOnlyText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dtCommentContainer: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 6,
    marginTop: 4,
  },
  dtCommentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dtCommentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dtCommentBadgeText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
    fontSize: 11,
  },
  dtEditBtnText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '600',
    fontSize: 11,
  },
  dtCommentBody: {
    gap: 3,
  },
  dtCommentText: {
    ...APPLE_TYPOGRAPHY.footnote,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  dtCommentDate: {
    fontSize: 10,
  },
  dtNoCommentText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  modalSubtitle: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  modalTextInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    ...APPLE_TYPOGRAPHY.body,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    alignItems: 'stretch',
  },
  modalSaveBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
    color: '#000000',
  },
});
