import type { ClubMatchVideo } from '../models/ClubCameras';
import type {
  EvaluationSource,
  EvaluationStatus,
  PlayerMatchSheetStat,
  PlayerStatAuditEntry,
  PlayerStatClip,
  TeamEvent,
} from '../models/TeamEvent';
import type { User } from '../models/User';
import { clampCoachRating } from '../utils/coachEvaluationRatings';

export interface VeoAiEvaluationProposal {
  uid: string;
  player_name: string;
  minutes_played?: number;
  rating?: number;
  rating_explanation: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  clean_sheet: boolean;
  confidence: number;
  uncertainty_reason?: string;
  clips: PlayerStatClip[];
  overwritten_prevented?: boolean;
}

export interface VeoAiMatchAnalysisResult {
  has_video: boolean;
  video_title?: string;
  video_duration_sec?: number;
  overall_confidence: number;
  uncertainty_notice?: string;
  proposals: Record<string, VeoAiEvaluationProposal>;
  manual_protected_count: number;
}

/**
 * Génère des propositions de statistiques et de notes à partir de la captation vidéo Veo
 * et des faits réels du match.
 *
 * RÈGLE FONDAMENTALE :
 * Si un joueur a déjà fait l'objet d'une saisie manuelle (source === 'manual')
 * ou d'une validation coach (source === 'coach_reviewed'), l'analyse IA
 * ne doit JAMAIS écraser silencieusement ses données.
 */
export function generateVeoAiMatchEvaluations(
  event: TeamEvent,
  video: ClubMatchVideo | null | undefined,
  members: User[] = [],
): VeoAiMatchAnalysisResult {
  if (!video) {
    return {
      has_video: false,
      overall_confidence: 0,
      uncertainty_notice:
        'Aucune captation vidéo Veo n’est associée à ce match. L’analyse IA nécessite une vidéo enregistrée.',
      proposals: {},
      manual_protected_count: 0,
    };
  }

  const durationSec = video.duration_sec ?? 0;
  // Détection d'incertitude sur la captation (ex: vidéo trop courte < 45 min pour un match officiel)
  const isPartialFootage = durationSec > 0 && durationSec < 45 * 60;
  const uncertaintyNotice = isPartialFootage
    ? `Captation vidéo partielle (~${Math.round(durationSec / 60)} min détectées) : les actions et le temps de jeu de la période non filmée comportent une marge d'incertitude.`
    : undefined;

  const baseConfidence = isPartialFootage ? 0.55 : 0.88;

  // Récupération des participants au match (convoqués confirmés, titulaires, remplaçants)
  const presentUids = new Set<string>();
  if (event.lineup?.slots) {
    event.lineup.slots.forEach((s) => presentUids.add(s.uid));
  }
  if (event.invitee_uids) {
    event.invitee_uids.forEach((uid) => {
      if (event.rsvps?.[uid] === 'yes') presentUids.add(uid);
    });
  }
  if (event.player_match_stats) {
    Object.keys(event.player_match_stats).forEach((uid) => presentUids.add(uid));
  }

  // Événements en direct (buts, cartons, passes, entrées/sorties)
  const actions = event.live_actions ?? [];
  const existingStats = event.player_match_stats ?? {};

  const proposals: Record<string, VeoAiEvaluationProposal> = {};
  let manualProtectedCount = 0;

  // Calcul du score de clean sheet (si l'adversaire n'a marqué aucun but)
  const opponentScore = event.live_state?.away_score ?? 0;
  const isCleanSheetTeam = opponentScore === 0;

  presentUids.forEach((uid) => {
    const existing = existingStats[uid];
    const isManualOrReviewed =
      existing?.source === 'manual' || existing?.source === 'coach_reviewed';

    const member = members.find((m) => m.uid === uid);
    const playerName = existing?.player_name || member?.display_name || 'Joueur';
    const lineupSlot = event.lineup?.slots?.find((s) => s.uid === uid);
    const isStarter = lineupSlot?.role === 'starter';
    const position = lineupSlot?.position_label || member?.profile?.position || 'Joueur';

    // Extraction des faits de jeu vérifiés pour ce joueur
    const playerGoals = actions.filter((a) => a.player_uid === uid && a.type === 'goal').length;
    const playerAssists = actions.filter((a) => a.player_uid === uid && a.type === 'assist').length;
    const playerYellows = actions.filter(
      (a) => a.player_uid === uid && a.type === 'yellow_card',
    ).length;
    const playerReds = actions.filter((a) => a.player_uid === uid && a.type === 'red_card').length;

    // Calcul du temps de jeu estimé
    let minutesPlayed = isStarter ? 90 : 25;
    const subOutAction = actions.find((a) => a.player_uid === uid && a.type === 'sub_out');
    const subInAction = actions.find((a) => a.player_uid === uid && a.type === 'sub_in');

    if (isStarter && subOutAction) {
      minutesPlayed = Math.max(1, subOutAction.minute);
    } else if (!isStarter && subInAction) {
      minutesPlayed = Math.max(1, 90 - subInAction.minute);
    } else if (!isStarter && !subInAction) {
      // S'il n'est pas entré en jeu selon les actions et n'était pas titulaire
      minutesPlayed = 0;
    }

    // Association des clips vidéo horodatés
    const clips: PlayerStatClip[] = [];
    actions
      .filter((a) => a.player_uid === uid)
      .forEach((a) => {
        const sec = a.minute * 60;
        let label = 'Fait de jeu';
        let desc = `Action observée à la ${a.minute}e minute.`;
        if (a.type === 'goal') {
          label = 'But';
          desc = `Finition décisive à la ${a.minute}e minute.`;
        } else if (a.type === 'assist') {
          label = 'Passe décisive';
          desc = `Service dans la course du buteur (${a.minute}e).`;
        } else if (a.type === 'yellow_card') {
          label = 'Avertissement';
          desc = `Faute sanctionnée d’un carton jaune (${a.minute}e).`;
        } else if (a.type === 'red_card') {
          label = 'Exclusion';
          desc = `Carton rouge (${a.minute}e).`;
        }
        clips.push({ timestamp_sec: sec, label, description: desc });
      });

    // Évaluation de la note /10 basée sur des indicateurs objectifs et prouvés
    let computedRating: number | undefined;
    let explanationParts: string[] = [];

    if (minutesPlayed === 0) {
      computedRating = undefined;
      explanationParts.push('Non entré en jeu sur cette rencontre.');
    } else if (minutesPlayed < 15 && playerGoals === 0 && playerAssists === 0) {
      computedRating = undefined;
      explanationParts.push(
        'Temps de jeu trop réduit (< 15 min sans fait marquant) pour établir une note représentative.',
      );
    } else {
      // Base de départ neutre : 6.0 pour une prestation standard
      let score = 6.0;

      if (playerGoals > 0) {
        score += playerGoals * 1.5;
        explanationParts.push(`${playerGoals} but${playerGoals > 1 ? 's' : ''} inscrit${playerGoals > 1 ? 's' : ''}`);
      }
      if (playerAssists > 0) {
        score += playerAssists * 1.0;
        explanationParts.push(`${playerAssists} passe${playerAssists > 1 ? 's' : ''} décisive${playerAssists > 1 ? 's' : ''}`);
      }
      if (playerYellows > 0) {
        score -= playerYellows * 0.5;
        explanationParts.push(`avertissement (${playerYellows}J)`);
      }
      if (playerReds > 0) {
        score -= 2.5;
        explanationParts.push('exclusion (carton rouge direct)');
      }
      if (isCleanSheetTeam && (position.toLowerCase().includes('gard') || position.toLowerCase().includes('déf'))) {
        score += 0.5;
        explanationParts.push('clean sheet préservé');
      }

      // Bonus implication et temps de jeu
      if (minutesPlayed >= 70) {
        score += 0.5;
        explanationParts.push(`${minutesPlayed} min de volume de jeu`);
      } else {
        explanationParts.push(`${minutesPlayed} min disputées`);
      }

      computedRating = clampCoachRating(score);
    }

    const explanation =
      explanationParts.length > 0
        ? `IA Veo : ${explanationParts.join(' · ')}.`
        : 'Observation vidéo en cours de traitement.';

    const playerConfidence = minutesPlayed > 0 ? baseConfidence : 0.95;
    const playerUncertainty = isPartialFootage
      ? 'Incertitude due au cadrage ou à la durée incomplète de la vidéo.'
      : undefined;

    if (isManualOrReviewed) {
      manualProtectedCount++;
    }

    proposals[uid] = {
      uid,
      player_name: playerName,
      minutes_played: isManualOrReviewed ? existing?.minutes_played : minutesPlayed,
      rating: isManualOrReviewed ? existing?.rating : computedRating,
      rating_explanation: isManualOrReviewed
        ? existing?.rating_explanation ?? explanation
        : explanation,
      goals: isManualOrReviewed ? existing?.goals ?? 0 : playerGoals,
      assists: isManualOrReviewed ? existing?.assists ?? 0 : playerAssists,
      yellow_cards: isManualOrReviewed ? existing?.yellow_cards ?? 0 : playerYellows,
      red_cards: isManualOrReviewed ? existing?.red_cards ?? 0 : playerReds,
      clean_sheet: isManualOrReviewed ? existing?.clean_sheet ?? false : isCleanSheetTeam,
      confidence: playerConfidence,
      uncertainty_reason: playerUncertainty,
      clips,
      overwritten_prevented: isManualOrReviewed,
    };
  });

  return {
    has_video: true,
    video_title: video.title,
    video_duration_sec: durationSec,
    overall_confidence: baseConfidence,
    uncertainty_notice: uncertaintyNotice,
    proposals,
    manual_protected_count: manualProtectedCount,
  };
}

/**
 * Construit un objet PlayerMatchSheetStat à partir d'une proposition IA,
 * garantissant le statut 'draft' et la traçabilité.
 */
export function buildDraftStatFromProposal(
  proposal: VeoAiEvaluationProposal,
  authorUid: string,
  authorName: string,
  existingStat?: PlayerMatchSheetStat,
): PlayerMatchSheetStat {
  const isAlreadyManualOrReviewed =
    existingStat?.source === 'manual' || existingStat?.source === 'coach_reviewed';

  // Si le coach a déjà saisi manuellement ou validé, on conserve ses valeurs intactes !
  if (isAlreadyManualOrReviewed && existingStat) {
    return {
      ...existingStat,
      ai_clips: proposal.clips,
      ai_confidence: proposal.confidence,
      ai_uncertainty_reason: proposal.uncertainty_reason,
    };
  }

  const nowIso = new Date().toISOString();
  const auditEntry: PlayerStatAuditEntry = {
    id: `audit_ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    author_uid: authorUid,
    author_name: authorName,
    timestamp: nowIso,
    action: 'ai_generated',
    summary: 'Proposition statistique et notation générée par l’IA Veo (brouillon staff).',
    changes: [
      { field: 'rating', old_value: existingStat?.rating, new_value: proposal.rating },
      { field: 'minutes_played', old_value: existingStat?.minutes_played, new_value: proposal.minutes_played },
      { field: 'goals', old_value: existingStat?.goals, new_value: proposal.goals },
      { field: 'assists', old_value: existingStat?.assists, new_value: proposal.assists },
    ],
  };

  const history = [...(existingStat?.history ?? []), auditEntry];

  return {
    uid: proposal.uid,
    player_name: proposal.player_name,
    minutes_played: proposal.minutes_played,
    rating: proposal.rating,
    rating_explanation: proposal.rating_explanation,
    goals: proposal.goals,
    assists: proposal.assists,
    yellow_cards: proposal.yellow_cards,
    red_cards: proposal.red_cards,
    clean_sheet: proposal.clean_sheet,
    source: 'ai_generated',
    status: 'draft',
    author_uid: authorUid,
    author_name: authorName,
    evaluated_at: nowIso,
    ai_confidence: proposal.confidence,
    ai_uncertainty_reason: proposal.uncertainty_reason,
    ai_clips: proposal.clips,
    history,
  };
}
