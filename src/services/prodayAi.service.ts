import { callFunction } from '../lib/firebaseFunctions';
import { parseCoachSessionPrompt, composedPlanFromPrompt } from '../utils/coachSessionPrompt';

export type ProdayAiMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ProdayAiResult = {
  reply: string;
  agents_used: string[];
  model: string;
};

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Moteur de réponse locale IA ProDay :
 * Fournit une réponse tactique complète et guide précisément l'utilisateur dans l'application.
 */
export function buildLocalProdayAiReply(query: string): ProdayAiResult {
  const norm = normalize(query);

  // Demande de création de séance / entraînement / bloc bas / blood bath / tactique
  if (
    norm.includes('seance') ||
    norm.includes('entrainement') ||
    norm.includes('bloc bas') ||
    norm.includes('bloc haut') ||
    norm.includes('bloodbath') ||
    norm.includes('blood bath') ||
    norm.includes('pressing') ||
    norm.includes('possession') ||
    norm.includes('finition') ||
    norm.includes('atelier') ||
    norm.includes('tactique')
  ) {
    const parsed = parseCoachSessionPrompt(query);
    const plan = composedPlanFromPrompt(query);

    const isBlocBas = norm.includes('bloc bas') || parsed.theme === 'bloc_bas';
    const isBloodBath = norm.includes('bloodbath') || norm.includes('blood bath') || parsed.theme === 'bloodbath';

    let locationGuide = `📍 **Où créer cette séance dans l'application :**\n` +
      `1. Rendez-vous dans le **Pôle Coach** (sélectionnable depuis le choix d'univers ou le menu).\n` +
      `2. Ouvrez l'onglet **Séances / Planning (Today)** dans la barre de navigation basse.\n` +
      `3. Appuyez sur **« Générer une séance IA »** ou entrez directement votre consigne dans le champ de prompt.\n` +
      `4. Vous pouvez également ajuster le dispositif dans l'onglet **Tactique (Smart Tactics)** pour aligner votre bloc équipe.\n\n`;

    let drillsBreakdown = `📋 **Proposition de séance générée : ${plan.title} (${plan.totalMinutes} min)**\n` +
      `*Objectif principal : ${plan.focus}*\n\n`;

    plan.blocks.forEach((block, index) => {
      drillsBreakdown += `${index + 1}. **${block.label}** (${block.minutes} min)\n` +
        `   • Objectif : ${block.objective}\n` +
        (block.material ? `   • Matériel : ${block.material}\n` : '');
    });

    if (isBlocBas) {
      drillsBreakdown += `\n💡 **Consignes clés pour le Bloc Bas :**\n` +
        `• Maintenir une compacité axiale stricte (15 à 20 mètres entre la ligne défensive et les milieux).\n` +
        `• Déclencher le pressing uniquement à l'entrée du ballon dans la zone médiane définie.\n` +
        `• Activer une projection verticale rapide dès la récupération du ballon.`;
    } else if (isBloodBath) {
      drillsBreakdown += `\n🔥 **Mode Blood Bath (Haute Intensité) :**\n` +
        `• Séries courtes à 95-100% de VMA.\n` +
        `• Temps de récupération incomplets pour développer la résistance lactique.`;
    }

    return {
      reply: `${locationGuide}${drillsBreakdown}`,
      agents_used: ['coach', 'training'],
      model: 'proday-local-tactical-v2',
    };
  }

  // Demande d'orientation générale
  return {
    reply: `Je suis ProDay AI, votre assistant tactique et opérationnel.\n\n` +
      `Vous pouvez me demander de concevoir des séances complètes (ex. Bloc bas, Pressing haut, Blood Bath, Finition), d'analyser vos compositions ou de vous guider dans l'application.`,
    agents_used: ['analytics'],
    model: 'proday-local-v2',
  };
}

export async function askProdayAi(
  messages: ProdayAiMessage[],
  teamId?: string,
): Promise<ProdayAiResult> {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

  try {
    const remoteResult = await callFunction<
      { messages: ProdayAiMessage[]; team_id?: string },
      ProdayAiResult
    >('prodayAiChat', { messages, team_id: teamId }, 'europe-west1');

    if (remoteResult && remoteResult.reply) {
      return remoteResult;
    }
  } catch (error) {
    // Si la fonction distante est indisponible ou non déployée, bascule fluide vers l'assistant local
  }

  return buildLocalProdayAiReply(lastUserMessage);
}
