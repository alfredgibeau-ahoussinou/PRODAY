/**
 * Pôle Club — Suivi Global des Entraînements & Bibliothèque Pédagogique (RTJ)
 * Dashboard Directeur Technique, assiduité séances & assignation exercices aux coachs.
 * Design System Apple Obsidian Glass · Zéro émoji unicode.
 */
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
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

  const totalPresents = useMemo(
    () => sessions.reduce((sum, s) => sum + s.presentsCount, 0),
    [sessions],
  );
  const totalInvited = useMemo(
    () => sessions.reduce((sum, s) => sum + s.totalInvited, 0),
    [sessions],
  );
  const globalAttendanceRate = useMemo(
    () => (totalInvited > 0 ? Math.round((totalPresents / totalInvited) * 100) : 0),
    [totalPresents, totalInvited],
  );
  const pendingValidationCount = useMemo(
    () => sessions.filter((s) => s.validationStatus === 'pending').length,
    [sessions],
  );

  const handleAssignToCoach = (drill: PedagogicalDrill) => {
    Alert.alert(
      'Exercice assigné',
      `L'exercice "${drill.title}" a été poussé sur l'Espace Coach de l'ensemble des éducateurs concernés (${drill.category}).`,
    );
  };

  return (
    <View style={styles.container}>
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
            Pointages Séances ({sessions.length})
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
          {sessions.map((session) => (
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
});
