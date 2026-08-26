/**
 * Intent NLP coach → brouillon de séance collective (local, honnête).
 * Couvre « crée une séance bloc bas », « bas du corps », etc.
 */
import type {
  TrainingObjective,
  TrainingPhase,
} from '../models/TrainingSession';
import type { CoachComposedPlan, CoachComposedPlanBlock } from './coachTrainingRecommendation';

export type CoachSessionTheme =
  | 'bloc_bas'
  | 'bloc_haut'
  | 'pressing'
  | 'transitions'
  | 'physique_bas'
  | 'physique'
  | 'technique'
  | 'tactique'
  | 'possession'
  | 'finition'
  | 'coups_de_pied'
  | 'duels'
  | 'mental'
  | 'recuperation'
  | 'generic';

export interface ParsedCoachSessionPrompt {
  isCreateIntent: boolean;
  theme: CoachSessionTheme;
  objective: TrainingObjective;
  focus: string;
  title: string;
  duration_min: number;
  /** Indice libre pour coach_notes Mistral. */
  coachNotes: string;
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

/** Détecte une demande de création / génération de séance. */
export function isCoachCreateSessionIntent(text: string): boolean {
  const n = normalize(text);
  if (!n) return false;
  if (
    /(cree|creer|genere|generer|fabrique|prepare|propose|compose|imagine|construis|elabore)\b/.test(
      n,
    ) &&
    /(seance|entrainement|training|programme|atelier|exo|exercice)/.test(n)
  ) {
    return true;
  }
  if (/\b(je veux|besoin d|fais[- ]moi|donne[- ]moi)\b/.test(n) && /seance|entrainement/.test(n)) {
    return true;
  }
  if (/^seance\b/.test(n) && n.length >= 6) return true;
  if (/^entrainement\b/.test(n) && n.length >= 12) return true;
  if (
    /\b(bloc bas|bloc haut|bas du corps|lower body|pressing|possession|finition|coups? de pied|CPA)\b/i.test(
      n,
    )
  ) {
    return true;
  }
  return false;
}

function detectTheme(n: string): CoachSessionTheme {
  if (/bloc\s*bas|ligne\s*basse|defense\s*basse|low\s*block/.test(n)) return 'bloc_bas';
  if (/bloc\s*haut|ligne\s*haute|high\s*block/.test(n)) return 'bloc_haut';
  if (/bas\s*du\s*corps|lower\s*body|jambes|ischio|quadriceps|mollets/.test(n)) {
    return 'physique_bas';
  }
  if (/pressing|contre-?pressing|\bpress\b/.test(n)) return 'pressing';
  if (/transition|relance|contre-?attaque/.test(n)) return 'transitions';
  if (/possession|conservation|jeu\s*de\s*position|circuler/.test(n)) return 'possession';
  if (/finition|finitions|tir\b|tirs|face\s*au\s*but|shooting/.test(n)) return 'finition';
  if (/coup(s)?\s*de\s*pied|cpa\b|corner|coup\s*franc|penalty|set\s*piece/.test(n)) {
    return 'coups_de_pied';
  }
  if (/duel|1\s*v\s*1|un\s*contre\s*un|opposition\s*individuelle/.test(n)) return 'duels';
  if (/mental|concentration|confiance|leadership|motivation/.test(n)) return 'mental';
  if (/recuperation|recup\b|leger|legerement/.test(n)) return 'recuperation';
  if (/physique|endurance|intermittent|vitesse|sprint/.test(n)) return 'physique';
  if (/tactique|organisation|compacit/.test(n)) return 'tactique';
  if (/technique|passes|controle|dribble|frappe/.test(n)) return 'technique';
  return 'generic';
}

/** Titre lisible depuis une demande libre (hors thèmes nommés). */
function freeformTitle(raw: string, fallback: string): string {
  const cleaned = raw
    .replace(
      /\b(cree|créer|creer|genere|générer|generer|fabrique|prepare|prépare|propose|compose|une|un|la|le|des|de|du|d)\b/gi,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length < 4) return fallback;
  const slice = cleaned.slice(0, 48);
  const titled = slice.charAt(0).toUpperCase() + slice.slice(1);
  return titled.length >= 8 ? `Séance — ${titled}` : fallback;
}

function themeMeta(theme: CoachSessionTheme): {
  objective: TrainingObjective;
  focus: string;
  title: string;
} {
  switch (theme) {
    case 'bloc_bas':
      return {
        objective: 'tactique',
        focus: 'Bloc bas — compacité et ligne basse',
        title: 'Séance bloc bas',
      };
    case 'bloc_haut':
      return {
        objective: 'tactique',
        focus: 'Bloc haut — pressing et ligne haute',
        title: 'Séance bloc haut',
      };
    case 'pressing':
      return {
        objective: 'tactique',
        focus: 'Pressing collectif et triggers',
        title: 'Séance pressing',
      };
    case 'transitions':
      return {
        objective: 'tactique',
        focus: 'Transitions offensives / défensives',
        title: 'Séance transitions',
      };
    case 'physique_bas':
      return {
        objective: 'physique',
        focus: 'Prépa physique — bas du corps',
        title: 'Séance bas du corps',
      };
    case 'physique':
      return {
        objective: 'physique',
        focus: 'Charge physique contrôlée',
        title: 'Séance physique',
      };
    case 'recuperation':
      return {
        objective: 'recuperation',
        focus: 'Récupération active',
        title: 'Séance récupération',
      };
    case 'technique':
      return {
        objective: 'technique',
        focus: 'Technique individuelle et collective',
        title: 'Séance technique',
      };
    case 'tactique':
      return {
        objective: 'tactique',
        focus: 'Organisation tactique',
        title: 'Séance tactique',
      };
    case 'possession':
      return {
        objective: 'tactique',
        focus: 'Possession et circulation',
        title: 'Séance possession',
      };
    case 'finition':
      return {
        objective: 'technique',
        focus: 'Finitions et face au but',
        title: 'Séance finition',
      };
    case 'coups_de_pied':
      return {
        objective: 'tactique',
        focus: 'Coups de pied arrêtés',
        title: 'Séance coups de pied arrêtés',
      };
    case 'duels':
      return {
        objective: 'technique',
        focus: 'Duels 1v1 et opposition',
        title: 'Séance duels',
      };
    case 'mental':
      return {
        objective: 'technique',
        focus: 'Concentration et attitude',
        title: 'Séance mental',
      };
    default:
      return {
        objective: 'technique',
        focus: 'Séance collective',
        title: 'Séance d’entraînement',
      };
  }
}

function parseDuration(n: string): number {
  const m = n.match(/(\d{2,3})\s*min/);
  if (!m) return 90;
  return Math.min(120, Math.max(45, parseInt(m[1], 10)));
}

/** Parse une demande coach (FR) vers un brouillon exploitable. */
export function parseCoachSessionPrompt(text: string): ParsedCoachSessionPrompt {
  const raw = text.trim();
  const n = normalize(raw);
  const theme = detectTheme(n);
  const meta = themeMeta(theme);
  const title =
    theme === 'generic' ? freeformTitle(raw, meta.title) : meta.title;
  const focus =
    theme === 'generic' && raw.length >= 8
      ? `Demande libre — ${raw.slice(0, 120)}${raw.length > 120 ? '…' : ''}`
      : meta.focus;
  return {
    isCreateIntent: isCoachCreateSessionIntent(raw),
    theme,
    objective: meta.objective,
    focus,
    title,
    duration_min: parseDuration(n),
    coachNotes: raw.slice(0, 400),
  };
}

function themeBlocks(theme: CoachSessionTheme, totalMin: number): CoachComposedPlanBlock[] {
  const scale = (parts: number[]) => {
    const sum = parts.reduce((a, b) => a + b, 0);
    return parts.map((p) => Math.max(5, Math.round((p / sum) * totalMin)));
  };

  switch (theme) {
    case 'bloc_bas': {
      const [w, a, b, c, d] = scale([10, 18, 22, 20, 10]);
      return [
        { label: 'Échauffement', minutes: w, objective: 'Activation + passes courtes', material: 'Ballons' },
        {
          label: 'Ligne basse 4+2',
          minutes: a,
          objective: 'Espacements, couvertures, recul organisé',
          material: 'Cônes, chasubles',
        },
        {
          label: 'Défense du bloc',
          minutes: b,
          objective: 'Fermer les intervalles, sorties timing',
          material: 'Chasubles',
        },
        {
          label: 'Jeu réduit 8v8',
          minutes: c,
          objective: 'Respecter le bloc bas sous pression',
          material: 'Mini-buts',
        },
        { label: 'Retour au calme', minutes: d, objective: 'Débrief principes bloc', material: '—' },
      ];
    }
    case 'bloc_haut': {
      const [w, a, b, c, d] = scale([10, 18, 22, 20, 10]);
      return [
        { label: 'Échauffement', minutes: w, objective: 'Activation + intensité progressive', material: 'Ballons' },
        {
          label: 'Ligne haute',
          minutes: a,
          objective: 'Compacité haute, hors-jeu collectif',
          material: 'Cônes',
        },
        {
          label: 'Triggers pressing',
          minutes: b,
          objective: 'Quand presser, qui déclenche',
          material: 'Chasubles',
        },
        {
          label: 'Opposition 7v7',
          minutes: c,
          objective: 'Maintenir le bloc haut',
          material: 'Mini-buts',
        },
        { label: 'Retour au calme', minutes: d, objective: 'Débrief', material: '—' },
      ];
    }
    case 'physique_bas': {
      const [w, a, b, c, d] = scale([12, 20, 18, 20, 10]);
      return [
        { label: 'Échauffement', minutes: w, objective: 'Mobilité hanches / genoux / chevilles', material: 'Cônes' },
        {
          label: 'Force bas du corps',
          minutes: a,
          objective: 'Fentes, squats assistés, gainage bas',
          material: 'Plots / poids corps',
        },
        {
          label: 'Intermittent jambes',
          minutes: b,
          objective: 'Efforts répétés + changements de direction',
          material: 'Cônes',
        },
        {
          label: 'Jeu réduit intense',
          minutes: c,
          objective: '5v5 rythme élevé, appels de jambes',
          material: 'Ballons',
        },
        { label: 'Retour au calme', minutes: d, objective: 'Étirements ischio / mollets', material: '—' },
      ];
    }
    case 'pressing': {
      const [w, a, b, c, d] = scale([10, 18, 22, 20, 10]);
      return [
        { label: 'Échauffement', minutes: w, objective: 'Activation + duels légers', material: 'Ballons' },
        {
          label: 'Triggers',
          minutes: a,
          objective: 'Signaux de pressing (mauvais contrôle, dos au jeu)',
          material: 'Cônes',
        },
        {
          label: '3v3+2 pressing',
          minutes: b,
          objective: 'Fermer les lignes de passe',
          material: 'Chasubles',
        },
        {
          label: 'Opposition',
          minutes: c,
          objective: 'Pressing en bloc sur terrain réduit',
          material: 'Mini-buts',
        },
        { label: 'Retour au calme', minutes: d, objective: 'Débrief triggers', material: '—' },
      ];
    }
    case 'transitions': {
      const [w, a, b, c, d] = scale([10, 16, 22, 22, 10]);
      return [
        { label: 'Échauffement', minutes: w, objective: 'Passes + orientation', material: 'Ballons' },
        {
          label: 'Perte / gain de balle',
          minutes: a,
          objective: 'Réaction immédiate + 1re passe',
          material: 'Cônes',
        },
        {
          label: 'Contre-attaque',
          minutes: b,
          objective: '3v2 / 4v3 en transition',
          material: 'Mini-buts',
        },
        {
          label: 'Jeu libre',
          minutes: c,
          objective: 'Transitions réelles 8v8',
          material: 'Chasubles',
        },
        { label: 'Retour au calme', minutes: d, objective: 'Débrief', material: '—' },
      ];
    }
    case 'physique': {
      const [w, a, b, c, d] = scale([12, 18, 20, 20, 10]);
      return [
        { label: 'Échauffement', minutes: w, objective: 'Course progressive + mobilité', material: 'Cônes' },
        {
          label: 'Intermittent',
          minutes: a,
          objective: 'Efforts courts, récup active',
          material: 'Cônes',
        },
        {
          label: 'Puissance',
          minutes: b,
          objective: 'Sprints / COD répétés',
          material: 'Échelle / plots',
        },
        {
          label: 'Jeu réduit',
          minutes: c,
          objective: '5v5 intensité haute',
          material: 'Ballons',
        },
        { label: 'Retour au calme', minutes: d, objective: 'Étirements', material: '—' },
      ];
    }
    case 'recuperation': {
      const [w, a, b, c, d] = scale([10, 15, 20, 15, 10]);
      return [
        { label: 'Échauffement', minutes: w, objective: 'Marche + mobilité', material: '—' },
        {
          label: 'Technique douce',
          minutes: a,
          objective: 'Touches à faible intensité',
          material: 'Ballons',
        },
        {
          label: 'Jeu plaisir',
          minutes: b,
          objective: '4v4 sans contact',
          material: 'Mini-buts',
        },
        {
          label: 'Mobilité',
          minutes: c,
          objective: 'Étirements + respiration',
          material: 'Tapis',
        },
        { label: 'Retour au calme', minutes: d, objective: 'Hydratation + débrief', material: '—' },
      ];
    }
    case 'tactique': {
      const [w, a, b, c, d] = scale([10, 18, 22, 20, 10]);
      return [
        { label: 'Échauffement', minutes: w, objective: 'Activation + consignes', material: 'Cônes' },
        {
          label: 'Organisation',
          minutes: a,
          objective: 'Compacité et déplacements',
          material: 'Chasubles',
        },
        {
          label: 'Situations',
          minutes: b,
          objective: 'Scénarios tactiques ciblés',
          material: 'Cônes',
        },
        {
          label: 'Opposition',
          minutes: c,
          objective: '8v8 respect du plan',
          material: 'Mini-buts',
        },
        { label: 'Retour au calme', minutes: d, objective: 'Débrief', material: '—' },
      ];
    }
    case 'possession': {
      const [w, a, b, c, d] = scale([10, 18, 22, 20, 10]);
      return [
        { label: 'Échauffement', minutes: w, objective: 'Passes + orientation', material: 'Ballons' },
        {
          label: 'Rondo',
          minutes: a,
          objective: 'Conservation sous pression',
          material: 'Chasubles',
        },
        {
          label: 'Jeu de position',
          minutes: b,
          objective: 'Triangles, 3e homme, largeur',
          material: 'Cônes',
        },
        {
          label: 'Opposition',
          minutes: c,
          objective: '7v7 garder le ballon',
          material: 'Mini-buts',
        },
        { label: 'Retour au calme', minutes: d, objective: 'Débrief possession', material: '—' },
      ];
    }
    case 'finition': {
      const [w, a, b, c, d] = scale([10, 18, 22, 20, 10]);
      return [
        { label: 'Échauffement', minutes: w, objective: 'Mobilité + frappes légères', material: 'Ballons' },
        {
          label: 'Ateliers tir',
          minutes: a,
          objective: 'Placement pied / corps, zones',
          material: 'Mini-buts',
        },
        {
          label: 'Combinaisons',
          minutes: b,
          objective: 'Centres + finition, 2v1',
          material: 'Cônes',
        },
        {
          label: 'Jeu réduit',
          minutes: c,
          objective: '4v4 buts multi, finir vite',
          material: 'Chasubles',
        },
        { label: 'Retour au calme', minutes: d, objective: 'Débrief finitions', material: '—' },
      ];
    }
    case 'coups_de_pied': {
      const [w, a, b, c, d] = scale([10, 16, 24, 20, 10]);
      return [
        { label: 'Échauffement', minutes: w, objective: 'Touches + mobilité', material: 'Ballons' },
        {
          label: 'Corners',
          minutes: a,
          objective: 'Zones de livraison + 1re intention',
          material: 'Cônes',
        },
        {
          label: 'Coups francs',
          minutes: b,
          objective: 'Mur, trajectoires, 2e ballon',
          material: 'Chasubles',
        },
        {
          label: 'Situations match',
          minutes: c,
          objective: 'CPA en opposition réelle',
          material: 'Mini-buts',
        },
        { label: 'Retour au calme', minutes: d, objective: 'Débrief CPA', material: '—' },
      ];
    }
    case 'duels': {
      const [w, a, b, c, d] = scale([10, 18, 22, 20, 10]);
      return [
        { label: 'Échauffement', minutes: w, objective: 'Activation + contacts légers', material: 'Ballons' },
        {
          label: '1v1',
          minutes: a,
          objective: 'Dribbles, feintes, timing défense',
          material: 'Cônes',
        },
        {
          label: '2v2 / 3v3',
          minutes: b,
          objective: 'Duels + soutien',
          material: 'Chasubles',
        },
        {
          label: 'Opposition',
          minutes: c,
          objective: 'Jeu réduit intensité duels',
          material: 'Mini-buts',
        },
        { label: 'Retour au calme', minutes: d, objective: 'Débrief', material: '—' },
      ];
    }
    case 'mental': {
      const [w, a, b, c, d] = scale([10, 15, 25, 20, 10]);
      return [
        { label: 'Échauffement', minutes: w, objective: 'Activation + consigne focus', material: 'Ballons' },
        {
          label: 'Routine',
          minutes: a,
          objective: 'Respiration, objectifs individuels',
          material: '—',
        },
        {
          label: 'Scénarios pression',
          minutes: b,
          objective: 'Décisions sous contrainte temps',
          material: 'Cônes',
        },
        {
          label: 'Jeu appliqué',
          minutes: c,
          objective: 'Respect consignes mentales en opposition',
          material: 'Chasubles',
        },
        { label: 'Retour au calme', minutes: d, objective: 'Débrief attitude', material: '—' },
      ];
    }
    case 'technique':
    case 'generic':
    default: {
      const [w, a, b, c, d] = scale([10, 20, 20, 20, 10]);
      return [
        { label: 'Échauffement', minutes: w, objective: 'Mobilité + touches', material: 'Cônes' },
        {
          label: 'Circuit technique',
          minutes: a,
          objective: 'Contrôle orienté, passes sous pression',
          material: 'Ballons, cônes',
        },
        {
          label: 'Ateliers',
          minutes: b,
          objective: 'Finitions / 1v1 / 2v1',
          material: 'Mini-buts',
        },
        {
          label: 'Jeu réduit',
          minutes: c,
          objective: '4v4+2 application technique',
          material: 'Chasubles',
        },
        { label: 'Retour au calme', minutes: d, objective: 'Étirements + débrief', material: '—' },
      ];
    }
  }
}

/** Brouillon CoachComposedPlan depuis une demande langage naturel (source locale). */
export function composedPlanFromPrompt(
  text: string,
  opts?: { targetEventId?: string; playerCount?: number },
): CoachComposedPlan {
  const parsed = parseCoachSessionPrompt(text);
  const blocks = themeBlocks(parsed.theme, parsed.duration_min);
  const totalMinutes = blocks.reduce((n, b) => n + b.minutes, 0);
  const archetype =
    parsed.objective === 'physique'
      ? 'physical'
      : parsed.objective === 'recuperation'
        ? 'recovery'
        : parsed.objective === 'tactique'
          ? 'tactical'
          : parsed.objective === 'technique'
            ? 'technical'
            : 'collective';

  return {
    context: 'training',
    archetype,
    title: parsed.title,
    focus: parsed.focus,
    reason: `Brouillon local depuis votre demande (« ${parsed.coachNotes.slice(0, 80)}${
      parsed.coachNotes.length > 80 ? '…' : ''
    } »). Pas de cloud — vous pouvez l’appliquer au planning.`,
    totalMinutes,
    blocks,
    difficulty: parsed.theme === 'recuperation' ? 'facile' : 'moyen',
    dataConfidence: 'none',
    playerCount: opts?.playerCount,
    targetEventId: opts?.targetEventId,
  };
}

/** Convertit un plan en phases TrainingPhase (affichage hub séance IA). */
export function phasesFromComposedBlocks(
  plan: Pick<CoachComposedPlan, 'blocks' | 'focus'>,
): TrainingPhase[] {
  const blocks = plan.blocks.filter((b) => b.minutes > 0);
  if (blocks.length === 0) return [];

  const mapName = (i: number, total: number): TrainingPhase['name'] => {
    if (i === 0) return 'warmup';
    if (i === total - 1) return 'cooldown';
    if (i === total - 2) return 'game';
    return 'exercises';
  };

  return blocks.map((b, i) => ({
    name: mapName(i, blocks.length),
    label: b.label,
    duration_min: b.minutes,
    exercises: [
      {
        name: b.label,
        description: b.objective ?? plan.focus,
        duration_min: b.minutes,
        equipment: b.material && b.material !== '—' ? [b.material] : undefined,
        tips: [`Focus : ${plan.focus}`],
      },
    ],
  }));
}

/** Notes structurées pour session_plan (Mistral ou local). */
export function formatTrainingPhasesAsSessionNotes(
  phases: TrainingPhase[],
  meta: { focus: string; source: 'mistral' | 'local'; objectiveLabel?: string },
): string {
  const sourceLabel =
    meta.source === 'mistral' ? 'Séance IA (cloud)' : 'Brouillon local (pas de cloud)';
  const header = [
    sourceLabel,
    `Focus : ${meta.focus}`,
    meta.objectiveLabel ? `Objectif : ${meta.objectiveLabel}` : null,
    '',
  ]
    .filter((l) => l != null)
    .join('\n');

  const body = phases
    .map((phase) => {
      const lines = [`• ${phase.label || phase.name} (${phase.duration_min} min)`];
      for (const ex of phase.exercises ?? []) {
        lines.push(`  – ${ex.name}${ex.description ? ` : ${ex.description}` : ''}`);
        if (ex.equipment?.length) lines.push(`    Matériel : ${ex.equipment.join(', ')}`);
        for (const tip of ex.tips ?? []) lines.push(`    → ${tip}`);
      }
      return lines.join('\n');
    })
    .join('\n');

  return `${header}${body}`.slice(0, 8000);
}
