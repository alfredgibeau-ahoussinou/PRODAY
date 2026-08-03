import type {
  ClubApplicationStage,
  LegacyApplicationStatus,
} from '../models/ClubApplicationPipeline';
import {
  CLUB_APPLICATION_STAGE_LABELS,
  CLUB_APPLICATION_TERMINAL_STAGES,
} from '../models/ClubApplicationPipeline';

const ALLOWED_TRANSITIONS: Record<ClubApplicationStage, ClubApplicationStage[]> = {
  inbox: ['reviewing', 'shortlist', 'rejected', 'withdrawn'],
  reviewing: ['shortlist', 'trial', 'rejected', 'inbox', 'withdrawn'],
  shortlist: ['trial', 'offer', 'reviewing', 'rejected', 'withdrawn'],
  trial: ['offer', 'hired', 'shortlist', 'rejected', 'withdrawn'],
  offer: ['hired', 'trial', 'rejected', 'withdrawn'],
  hired: [],
  rejected: ['inbox'],
  withdrawn: [],
};

export function canTransitionClubApplication(
  from: ClubApplicationStage,
  to: ClubApplicationStage,
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionClubApplication(
  from: ClubApplicationStage,
  to: ClubApplicationStage,
): ClubApplicationStage {
  if (!canTransitionClubApplication(from, to)) {
    throw new Error(`Transition candidature invalide : ${from} → ${to}`);
  }
  return to;
}

export function isTerminalClubApplicationStage(stage: ClubApplicationStage): boolean {
  return CLUB_APPLICATION_TERMINAL_STAGES.includes(stage);
}

export function legacyStatusToPipelineStage(
  status: LegacyApplicationStatus,
): ClubApplicationStage {
  switch (status) {
    case 'PENDING':
      return 'inbox';
    case 'VIEWED':
      return 'reviewing';
    case 'IN_PROGRESS':
      return 'shortlist';
    case 'ACCEPTED':
      return 'hired';
    case 'REJECTED':
      return 'rejected';
    default:
      return 'inbox';
  }
}

export function pipelineStageToLegacyStatus(
  stage: ClubApplicationStage,
): LegacyApplicationStatus {
  switch (stage) {
    case 'inbox':
      return 'PENDING';
    case 'reviewing':
      return 'VIEWED';
    case 'shortlist':
    case 'trial':
    case 'offer':
      return 'IN_PROGRESS';
    case 'hired':
      return 'ACCEPTED';
    case 'rejected':
    case 'withdrawn':
      return 'REJECTED';
    default:
      return 'PENDING';
  }
}

/** Label kanban pour UI club (à partir du stage ou du statut legacy). */
export function applicationPipelineLabel(input: {
  status: LegacyApplicationStatus;
  pipeline_stage?: ClubApplicationStage;
}): string {
  const stage = input.pipeline_stage ?? legacyStatusToPipelineStage(input.status);
  return CLUB_APPLICATION_STAGE_LABELS[stage];
}
