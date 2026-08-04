import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import type { User } from '../../models/User';
import type { ClubApplicationStage } from '../../models/ClubApplicationPipeline';
import {
  buildOneClickRecruitmentPlan,
  oneClickProgress,
  type OneClickStepId,
} from '../../core/recruitment/oneClickRecruitment.engine';
import { computeOpportunityScore } from '../../core/recruitment/opportunityScore.engine';
import { scoutingShortlistService } from '../../services/scoutingShortlist.service';
import { scoutReportsService } from '../../services/scoutReports.service';
import { AnimatedModalShell, PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { spacing, radius } from '../../theme/designTokens';
import { openContactConversation } from '../../utils/openContactConversation';
import { useTabNavigation } from '../../context/TabNavigationContext';

interface OneClickRecruitmentSheetProps {
  visible: boolean;
  onClose: () => void;
  staff: User;
  player: User;
  postId?: string;
  currentPipelineStage?: ClubApplicationStage;
  onOpenScoutReport?: () => void;
  onRefresh?: () => void;
}

export const OneClickRecruitmentSheet: React.FC<OneClickRecruitmentSheetProps> = ({
  visible,
  onClose,
  staff,
  player,
  postId,
  currentPipelineStage,
  onOpenScoutReport,
  onRefresh,
}) => {
  const clubId = staff.profile.club_id;
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const nav = useTabNavigationActions();
  const { openChat } = useTabNavigation();
  const [busy, setBusy] = useState(false);
  const [doneSteps, setDoneSteps] = useState<Partial<Record<OneClickStepId, boolean>>>({});

  const opportunity = useMemo(
    () => computeOpportunityScore({ player, viewer: staff }),
    [player, staff]
  );

  const plan = useMemo(
    () =>
      buildOneClickRecruitmentPlan({
        playerUid: player.uid,
        postId,
        opportunityScore: opportunity.score,
        opportunityBand: opportunity.band,
        alreadyShortlisted: doneSteps.shortlist,
        hasScoutReport: doneSteps.scout_report,
        hasOpenMessageThread: doneSteps.message_request,
        trialScheduled: doneSteps.schedule_trial,
        docsShared: doneSteps.share_docs,
        currentPipelineStage,
      }),
    [player.uid, postId, opportunity, doneSteps, currentPipelineStage]
  );

  const progress = oneClickProgress(plan);

  const markDone = (id: OneClickStepId) => {
    setDoneSteps((prev) => ({ ...prev, [id]: true }));
    onRefresh?.();
  };

  const runStep = async (id: OneClickStepId) => {
    setBusy(true);
    try {
      switch (id) {
        case 'shortlist': {
          if (!clubId) {
            Alert.alert('Club requis', 'Associez un club pour utiliser la shortlist.');
            break;
          }
          await scoutingShortlistService.upsert(clubId, player.uid, staff.uid, {
            notes: `One-click · Opp. ${opportunity.score}%`,
            scouting_score: opportunity.score,
          });
          markDone('shortlist');
          break;
        }
        case 'scout_report': {
          onOpenScoutReport?.();
          markDone('scout_report');
          onClose();
          break;
        }
        case 'message_request': {
          await openContactConversation(staff, player, player.display_name, openChat);
          markDone('message_request');
          break;
        }
        case 'schedule_trial': {
          nav.openMatchs({ homeTab: 'convocations' });
          markDone('schedule_trial');
          // Offer carpool deep-link after trial planning entry point
          setTimeout(() => {
            nav.openCarpool({ chapter: 'proposer' });
          }, 400);
          break;
        }
        case 'share_docs': {
          Alert.alert(
            'Documents',
            'Ouvrez la candidature associée pour partager licence, CV et consentements dans le coffre sécurisé.'
          );
          markDone('share_docs');
          break;
        }
        case 'pipeline_offer': {
          nav.openMercato('home');
          markDone('pipeline_offer');
          break;
        }
        default:
          break;
      }
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatedModalShell visible={visible} onClose={onClose} variant="full" handleOnly>
      <View style={styles.header}>
        <ProDayText variant="section">Recrutement 1 clic</ProDayText>
        <ProDayText variant="caption" muted>
          {player.display_name} · Opportunity {opportunity.score}% · {progress.percent}% du parcours
        </ProDayText>
        <View style={[styles.progressTrack, { backgroundColor: c.surfaceMuted }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress.percent}%`, backgroundColor: c.brand },
            ]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {plan.steps.map((step) => {
          const isDone = step.status === 'done' || doneSteps[step.id];
          const canRun = step.status === 'ready' || step.status === 'suggested' || isDone;
          return (
            <PressableSpring
              key={step.id}
              disabled={busy || (!canRun && !isDone)}
              onPress={() => void runStep(step.id)}
              scaleTo={0.98}
              style={[
                styles.step,
                {
                  borderColor: isDone ? c.brand : c.border,
                  backgroundColor: isDone ? c.accentSoft : c.surface,
                  opacity: canRun || isDone ? 1 : 0.55,
                },
              ]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <ProDayText variant="body" style={{ fontWeight: '800' }}>
                  {step.title}
                </ProDayText>
                <ProDayText variant="caption" muted>
                  {step.description}
                </ProDayText>
              </View>
              <ProDayText variant="caption" accent style={{ fontWeight: '800' }}>
                {isDone ? 'OK' : step.status === 'ready' ? 'Go' : step.status === 'suggested' ? 'Sug.' : '—'}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </ScrollView>

      {busy ? (
        <ActivityIndicator color={c.brand} style={{ marginBottom: spacing.md }} />
      ) : null}
    </AnimatedModalShell>
  );
};

function createStyles(_c: { border: string }) {
  return StyleSheet.create({
    header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: 6 },
    progressTrack: { height: 6, borderRadius: 999, overflow: 'hidden', marginTop: 4 },
    progressFill: { height: '100%', borderRadius: 999 },
    body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
    step: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
    },
  });
}
