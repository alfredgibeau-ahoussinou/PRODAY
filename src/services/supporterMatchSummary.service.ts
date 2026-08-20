import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { callFunction, isFunctionsUnavailable } from '../lib/firebaseFunctions';

const COL = 'supporter_match_summaries';

export interface SupporterMatchSummary {
  matchId: string;
  happened: string[];
  keyMoment: string;
  stats: string[];
  evolution: string[];
  players: string[];
  conclusion: string;
  disclaimer: string;
  generatedAt?: Date;
}

function fromFirestore(matchId: string, data: Record<string, unknown>): SupporterMatchSummary {
  const arr = (key: string): string[] =>
    Array.isArray(data[key]) ? data[key].map(String) : [];
  let generatedAt: Date | undefined;
  const raw = data.generated_at;
  if (raw && typeof raw === 'object' && 'toDate' in raw) {
    generatedAt = (raw as { toDate: () => Date }).toDate();
  }
  return {
    matchId,
    happened: arr('happened'),
    keyMoment: String(data.key_moment ?? data.keyMoment ?? ''),
    stats: arr('stats'),
    evolution: arr('evolution'),
    players: arr('players'),
    conclusion: String(data.conclusion ?? ''),
    disclaimer: String(
      data.disclaimer ??
        'Résumé généré par IA à partir de données publiques — interprétation indicative.',
    ),
    generatedAt,
  };
}

export const supporterMatchSummaryService = {
  async getCached(matchId: string): Promise<SupporterMatchSummary | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    try {
      const snap = await getDoc(doc(database, COL, matchId));
      if (!snap.exists()) return null;
      return fromFirestore(matchId, snap.data() as Record<string, unknown>);
    } catch {
      return null;
    }
  },

  async generate(matchPayload: Record<string, unknown>): Promise<SupporterMatchSummary> {
    try {
      const result = await callFunction<
        { match: Record<string, unknown> },
        SupporterMatchSummary
      >('generateSupporterMatchSummary', { match: matchPayload }, 'europe-west1');
      return result;
    } catch (e) {
      if (isFunctionsUnavailable(e)) {
        return supporterMatchSummaryService.buildLocalStub(matchPayload);
      }
      throw e;
    }
  },

  buildLocalStub(match: Record<string, unknown>): SupporterMatchSummary {
    const home = String(match.homeLabel ?? match.home ?? 'Domicile');
    const away = String(match.awayLabel ?? match.away ?? 'Extérieur');
    const scoreHome = match.scoreHome ?? match.score_home;
    const scoreAway = match.scoreAway ?? match.score_away;
    const score =
      scoreHome != null && scoreAway != null ? `${scoreHome}-${scoreAway}` : 'score inconnu';
    return {
      matchId: String(match.matchId ?? match.id ?? ''),
      happened: [`Rencontre ${home} vs ${away}`, `Score final : ${score}`],
      keyMoment: 'Moment clé non disponible hors ligne.',
      stats: ['Statistiques détaillées via Cloud Function'],
      evolution: ['Génération IA disponible après le match'],
      players: [],
      conclusion: 'Connectez-vous pour générer le résumé IA complet.',
      disclaimer:
        'Résumé local — données publiques uniquement. Interprétation indicative.',
    };
  },

  async cacheLocally(summary: SupporterMatchSummary): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await setDoc(doc(database, COL, summary.matchId), {
      happened: summary.happened,
      key_moment: summary.keyMoment,
      stats: summary.stats,
      evolution: summary.evolution,
      players: summary.players,
      conclusion: summary.conclusion,
      disclaimer: summary.disclaimer,
      generated_at: serverTimestamp(),
    });
  },
};
