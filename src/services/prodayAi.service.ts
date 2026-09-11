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

  // Causerie d'avant match / motivation / mi-temps
  if (
    norm.includes('causerie') ||
    norm.includes('discours') ||
    norm.includes('motiver') ||
    norm.includes('mi-temps') ||
    norm.includes('avant match') ||
    norm.includes('vestiaire')
  ) {
    const isHalftime = norm.includes('mi-temps');
    if (isHalftime) {
      return {
        reply: `**Structure de Causerie Mi-Temps Recommandée (3 à 5 min)**\n\n` +
          `1. **Phase de Calme (1ère min) :** Laissez les joueurs boire et reprendre leur souffle sans parler. Évitez les réactions à chaud.\n` +
          `2. **Constat Lucide (2 min) :** Donnez 2 corrections tactiques majeures maximum (ex: resserrer l'axe, déclencher la 1ère passe plus vite vers l'avant).\n` +
          `3. **Re-mobilisation Émotionnelle (1 min) :** Rappelez l'objectif du match, valorisez l'effort collectif et terminez par un mot d'ordre d'impact (ex: « Les 15 premières minutes du second acte sont à nous ! »).`,
        agents_used: ['coach', 'psychology'],
        model: 'proday-local-tactical-v2',
      };
    }
    return {
      reply: `**Plan de Causerie d'Avant-Match (6 à 8 min)**\n\n` +
        `1. **Le Contexte & L'Enjeu (2 min) :** Présentation du match, respect de l'adversaire mais affirmation de notre identité de jeu.\n` +
        `2. **Les 3 Principes Clés (3 min) :**\n` +
        `   • *En phase défensive* : Compacité axiale et déclenchement du pressing à la perte.\n` +
        `   • *En phase offensive* : Utiliser la largeur pour étirer leur bloc et trouver les interlignes.\n` +
        `   • *Sur coups de pied arrêtés* : Concentration maximale et marquage strict.\n` +
        `3. **L'Émotion & L'Engagement (2 min) :** Insister sur la solidarité, le body language et l'énergie dès le coup de sifflet initial.`,
      agents_used: ['coach', 'motivation'],
      model: 'proday-local-tactical-v2',
    };
  }

  // Analyse tactique / Contrer un dispositif
  if (
    norm.includes('contrer') ||
    norm.includes('battre') ||
    norm.includes('face a') ||
    norm.includes('adversaire') ||
    norm.includes('3-5-2') ||
    norm.includes('4-3-3') ||
    norm.includes('4-2-3-1') ||
    norm.includes('5-3-2') ||
    norm.includes('4-4-2')
  ) {
    let specificTips = '';
    if (norm.includes('3-5-2') || norm.includes('5-3-2')) {
      specificTips = `• **Exploiter l'espace dans le dos des pistons :** Fixer à l'opposé pour renverser rapidement dans le couloir libéré.\n` +
        `• **Attaquer à 3 attaquants (4-3-3 ou 4-2-3-1) :** Écarter au maximum pour forcer les centraux excentrés à sortir de leur zone de confort.\n` +
        `• **Bloquer la relance axiale :** Mettre un marquage individuel sur leur sentinelle.`;
    } else if (norm.includes('4-3-3')) {
      specificTips = `• **Créer une supériorité au milieu (ex: 4-2-3-1 ou 4-1-2-1-2) :** Utiliser un numéro 10 entre leurs lignes pour créer le doute chez leur 6.\n` +
        `• **Verrouiller les dédoublements de leurs latéraux :** Demander à nos ailiers d'assurer un repli rigoureux.\n` +
        `• **Contre-attaques directes :** Jouer dans le dos de leurs latéraux qui montent haut.`;
    } else if (norm.includes('4-2-3-1')) {
      specificTips = `• **Isoler leur meneur axial (le 10) :** Placer une sentinelle dédiée pour couper ses lignes de passes.\n` +
        `• **Attaquer les espaces entre les deux pivots :** Les forcer à coulisser latéralement.\n` +
        `• **Pressing agressif sur leur première relance.**`;
    } else {
      specificTips = `• **Identifier le joueur cible :** Couper l'alimentation de leur créateur de jeu principal.\n` +
        `• **Gérer la hauteur du bloc :** Si l'adversaire a des flèches devant, adopter un bloc médian compact pour éviter d'être pris dans la profondeur.\n` +
        `• **Optimiser les transitions :** Jouer la première passe verticale dans les 3 secondes suivant la récupération.`;
    }

    return {
      reply: `**Plan Tactique pour Contrer l'Adversaire**\n\n` +
        `${specificTips}\n\n` +
        `*Conseil ProDay Copilote :* Vous pouvez ouvrir le panneau **Analyse Tactique** ou **Smart Tactics** dans l'application pour simuler cette opposition et ajuster vos flèches de déplacement.`,
      agents_used: ['coach', 'tactics'],
      model: 'proday-local-tactical-v2',
    };
  }

  // Management / Gestion de joueurs / Remplaçants / Confiance
  if (
    norm.includes('remplacant') ||
    norm.includes('confiance') ||
    norm.includes('mental') ||
    norm.includes('conflit') ||
    norm.includes('temps de jeu') ||
    norm.includes('capitaine')
  ) {
    return {
      reply: `**Conseils de Management & Psychologie du Groupe**\n\n` +
        `1. **Gestion des Remplaçants (Impact Players) :** Ne les qualifiez pas de « remplaçants » mais de *finisseurs*. Donnez-leur une mission tactique précise avant leur entrée.\n` +
        `2. **Joueur en Manque de Confiance :**\n` +
        `   • Fixez-lui des micro-objectifs simples (ex: 5 passes réussies de suite, 3 duels gagnés) plutôt que de lui demander de marquer à tout prix.\n` +
        `   • Valorisez publiquement son travail défensif et de pressing.\n` +
        `3. **Communication avec les Parents & l'Entourage :** Maintenez une règle claire : débriefing technique uniquement après 24h de recul, jamais à chaud après le coup de sifflet.`,
      agents_used: ['coach', 'leadership'],
      model: 'proday-local-tactical-v2',
    };
  }

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
    norm.includes('exercice')
  ) {
    const parsed = parseCoachSessionPrompt(query);
    const plan = composedPlanFromPrompt(query);

    const isBlocBas = norm.includes('bloc bas') || parsed.theme === 'bloc_bas';
    const isBloodBath = norm.includes('bloodbath') || norm.includes('blood bath') || parsed.theme === 'bloodbath';

    let locationGuide = `**Séance Conçue par le Copilote : ${plan.title} (${plan.totalMinutes} min)**\n` +
      `*Objectif : ${plan.focus}*\n\n`;

    plan.blocks.forEach((block, index) => {
      locationGuide += `${index + 1}. **${block.label}** (${block.minutes} min)\n` +
        `   • Objectif : ${block.objective}\n` +
        (block.material ? `   • Matériel : ${block.material}\n` : '');
    });

    if (isBlocBas) {
      locationGuide += `\n**Points d'attention Bloc Bas :**\n` +
        `• Garder 15-20m max entre la ligne arrière et le milieu.\n` +
        `• Ne pas se jeter : cadrer et forcer l'adversaire à jouer vers l'arrière.\n` +
        `• Dès la récupération, lancer les flèches offensives dans les couloirs.`;
    } else if (isBloodBath) {
      locationGuide += `\n**Consignes Haute Intensité :**\n` +
        `• Rythme maximal sans temps morts.\n` +
        `• Développer la résistance mentale et physique sous acide lactique.`;
    }

    locationGuide += `\n\n*Vous pouvez appliquer directement cette séance dans l'outil « Préparer une séance » de votre Copilote IA.*`;

    return {
      reply: locationGuide,
      agents_used: ['coach', 'training'],
      model: 'proday-local-tactical-v2',
    };
  }

  // Demande d'orientation générale
  return {
    reply: `Je suis votre **Copilote IA Entraîneur ProDay**.\n\n` +
      `Je peux vous aider à tout moment pour :\n` +
      `• **Préparer une séance complète** (Bloc bas, Pressing haut, Blood Bath, Finition, CPA)\n` +
      `• **Analyser un adversaire & adapter votre tactique** (Contrer un 4-3-3, 3-5-2, bloc compact)\n` +
      `• **Préparer vos causeries de match** (Avant-match, mi-temps, gestion émotionnelle)\n` +
      `• **Gérer votre effectif & la psychologie du groupe** (Remplaçants, confiance, leadership)\n\n` +
      `Posez-moi votre question ou choisissez une consigne ci-dessous !`,
    agents_used: ['coach', 'assistant'],
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
