import type { AgentName, AgentContext, AgentResult } from './types';
import { clubAgent } from './agents/clubAgent';
import { coachAgent } from './agents/coachAgent';
import { matchAgent } from './agents/matchAgent';
import { trainingAgent } from './agents/trainingAgent';
import { playerAgent } from './agents/playerAgent';
import { analyticsAgent } from './agents/analyticsAgent';
import { videoAgent } from './agents/videoAgent';
import { revenueAgent } from './agents/revenueAgent';

type AgentFn = (ctx: AgentContext) => Promise<AgentResult>;

const AGENT_REGISTRY: Record<AgentName, AgentFn> = {
  club: clubAgent,
  coach: coachAgent,
  match: matchAgent,
  training: trainingAgent,
  player: playerAgent,
  analytics: analyticsAgent,
  video: videoAgent,
  revenue: revenueAgent,
};

export async function dispatchAgents(
  agents: AgentName[],
  ctx: AgentContext,
): Promise<AgentResult[]> {
  const promises = agents.map((name) => {
    const fn = AGENT_REGISTRY[name];
    if (!fn) {
      return Promise.resolve<AgentResult>({
        agent: name,
        summary: `Agent « ${name} » non trouvé.`,
        facts: {},
        error: 'unknown_agent',
      });
    }
    return fn(ctx).catch((e): AgentResult => ({
      agent: name,
      summary: `Erreur agent ${name}.`,
      facts: {},
      error: String(e),
    }));
  });

  return Promise.all(promises);
}
