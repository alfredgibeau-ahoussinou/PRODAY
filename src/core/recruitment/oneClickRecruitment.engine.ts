/**
 * One-click recruitment workflow — ProDay exclusive.
 * Collapses shortlist → scout note → trial → message into a guided checklist
 * tied to the club application pipeline (not a TransferRoom clone).
 */

import type { ClubApplicationStage } from '../../models/ClubApplicationPipeline';
import type { OpportunityBand } from './opportunityScore.engine';
import { recommendFromOpportunityBand } from './scoutReport.engine';

export type OneClickStepId =
  | 'shortlist'
  | 'scout_report'
  | 'message_request'
  | 'schedule_trial'
  | 'share_docs'
  | 'pipeline_offer';

export type OneClickStepStatus = 'ready' | 'suggested' | 'blocked' | 'done';

export interface OneClickStep {
  id: OneClickStepId;
  title: string;
  description: string;
  status: OneClickStepStatus;
  pipelineTarget?: ClubApplicationStage;
}

export interface OneClickRecruitmentPlan {
  playerUid: string;
  postId?: string;
  opportunityScore: number;
  opportunityBand: OpportunityBand;
  suggestedRecommendation: ReturnType<typeof recommendFromOpportunityBand>;
  steps: OneClickStep[];
  /** Primary CTA for staff UI. */
  primaryAction: OneClickStepId;
}

export interface OneClickRecruitmentInput {
  playerUid: string;
  postId?: string;
  opportunityScore: number;
  opportunityBand: OpportunityBand;
  alreadyShortlisted?: boolean;
  hasScoutReport?: boolean;
  hasOpenMessageThread?: boolean;
  trialScheduled?: boolean;
  docsShared?: boolean;
  currentPipelineStage?: ClubApplicationStage;
}

const STEP_COPY: Record<OneClickStepId, { title: string; description: string }> = {
  shortlist: {
    title: 'Ajouter à la shortlist',
    description: 'Verrouille le profil dans le radar club.',
  },
  scout_report: {
    title: 'Créer un rapport scout',
    description: 'Évaluation structurée liée au Pulse et à l’Opportunity Score.',
  },
  message_request: {
    title: 'Contacter (demande sécurisée)',
    description: 'Message request joueur ↔ staff avec respect de la confidentialité.',
  },
  schedule_trial: {
    title: 'Planifier un essai',
    description: 'Passe le pipeline en essai et propose un créneau + covoiturage.',
  },
  share_docs: {
    title: 'Partager documents',
    description: 'Licence, CV, consentement parental si mineur — espace sécurisé.',
  },
  pipeline_offer: {
    title: 'Passer en offre',
    description: 'Formalise l’intérêt club après essai positif.',
  },
};

function statusFor(
  done: boolean,
  ready: boolean,
  suggested: boolean
): OneClickStepStatus {
  if (done) return 'done';
  if (ready) return 'ready';
  if (suggested) return 'suggested';
  return 'blocked';
}

/**
 * Build an actionable one-click recruitment plan from current context.
 */
export function buildOneClickRecruitmentPlan(
  input: OneClickRecruitmentInput
): OneClickRecruitmentPlan {
  const band = input.opportunityBand;
  const highFit = band === 'excellent' || band === 'strong';
  const stage = input.currentPipelineStage;

  const shortlisted =
    input.alreadyShortlisted ||
    stage === 'shortlist' ||
    stage === 'trial' ||
    stage === 'offer' ||
    stage === 'hired';

  const steps: OneClickStep[] = [
    {
      id: 'shortlist',
      ...STEP_COPY.shortlist,
      status: statusFor(Boolean(shortlisted), true, false),
      pipelineTarget: 'shortlist',
    },
    {
      id: 'scout_report',
      ...STEP_COPY.scout_report,
      status: statusFor(Boolean(input.hasScoutReport), Boolean(shortlisted) || highFit, highFit),
    },
    {
      id: 'message_request',
      ...STEP_COPY.message_request,
      status: statusFor(
        Boolean(input.hasOpenMessageThread),
        Boolean(shortlisted) || highFit,
        true
      ),
    },
    {
      id: 'schedule_trial',
      ...STEP_COPY.schedule_trial,
      status: statusFor(
        Boolean(input.trialScheduled) || stage === 'trial' || stage === 'offer' || stage === 'hired',
        Boolean(input.hasScoutReport) && highFit,
        band === 'excellent'
      ),
      pipelineTarget: 'trial',
    },
    {
      id: 'share_docs',
      ...STEP_COPY.share_docs,
      status: statusFor(
        Boolean(input.docsShared),
        Boolean(input.trialScheduled) || stage === 'trial',
        Boolean(input.trialScheduled)
      ),
    },
    {
      id: 'pipeline_offer',
      ...STEP_COPY.pipeline_offer,
      status: statusFor(
        stage === 'offer' || stage === 'hired',
        stage === 'trial' && Boolean(input.hasScoutReport),
        band === 'excellent'
      ),
      pipelineTarget: 'offer',
    },
  ];

  const primary =
    steps.find((s) => s.status === 'ready')?.id ??
    steps.find((s) => s.status === 'suggested')?.id ??
    'shortlist';

  return {
    playerUid: input.playerUid,
    postId: input.postId,
    opportunityScore: input.opportunityScore,
    opportunityBand: band,
    suggestedRecommendation: recommendFromOpportunityBand(band),
    steps,
    primaryAction: primary,
  };
}

/** Ordered ids for UI progress bar. */
export function oneClickProgress(plan: OneClickRecruitmentPlan): {
  done: number;
  total: number;
  percent: number;
} {
  const done = plan.steps.filter((s) => s.status === 'done').length;
  const total = plan.steps.length;
  return { done, total, percent: Math.round((done / total) * 100) };
}
