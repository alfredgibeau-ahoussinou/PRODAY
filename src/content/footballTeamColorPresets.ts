export type FootballTeamColorPreset = {
  id: string;
  /** Libellé UI — pas de marque déposée. */
  labelFr: string;
  accent: string;
  accentSecondary: string;
  background?: string;
  surface?: string;
  /** Mots-clés FR/EN pour recherche (sans accents). */
  aliases: string[];
};

/** Presets inspirés de clubs — libellés « style » / « inspiré » uniquement. */
export const FOOTBALL_TEAM_COLOR_PRESETS: FootballTeamColorPreset[] = [
  {
    id: 'barca',
    labelFr: 'Style Barça',
    accent: '#004D98',
    accentSecondary: '#A50044',
    background: '#050810',
    surface: '#0C1424',
    aliases: ['barca', 'barça', 'fc barcelona', 'blaugrana', 'barcelona'],
  },
  {
    id: 'real',
    labelFr: 'Style Real Madrid',
    accent: '#FEBE10',
    accentSecondary: '#FFFFFF',
    background: '#0A0806',
    surface: '#1A1610',
    aliases: ['real', 'madrid', 'real madrid', 'merengue', 'merengue blanc or'],
  },
  {
    id: 'psg',
    labelFr: 'Style PSG',
    accent: '#004170',
    accentSecondary: '#DA0024',
    background: '#050810',
    surface: '#0C1420',
    aliases: ['psg', 'paris', 'paris sg', 'paris rouge bleu'],
  },
  {
    id: 'om',
    labelFr: 'Style OM',
    accent: '#2FAEE0',
    accentSecondary: '#FFFFFF',
    background: '#060A10',
    surface: '#0E1824',
    aliases: ['om', 'marseille', 'olympique marseille', 'droit au but'],
  },
  {
    id: 'liverpool',
    labelFr: 'Style Liverpool',
    accent: '#C8102E',
    accentSecondary: '#F6EB61',
    background: '#0A0608',
    surface: '#180C10',
    aliases: ['liverpool', 'lfc', 'reds', 'youll never walk alone'],
  },
  {
    id: 'juventus',
    labelFr: 'Style Juventus',
    accent: '#FFFFFF',
    accentSecondary: '#000000',
    background: '#0A0A0A',
    surface: '#161616',
    aliases: ['juventus', 'juve', 'bianconeri', 'turin'],
  },
  {
    id: 'bayern',
    labelFr: 'Style Bayern',
    accent: '#DC052D',
    accentSecondary: '#0066B2',
    background: '#0A0608',
    surface: '#140C10',
    aliases: ['bayern', 'bayern munich', 'munchen', 'fcb munich'],
  },
  {
    id: 'chelsea',
    labelFr: 'Style Chelsea',
    accent: '#034694',
    accentSecondary: '#FFFFFF',
    background: '#050810',
    surface: '#0C1424',
    aliases: ['chelsea', 'blues', 'cfc'],
  },
  {
    id: 'arsenal',
    labelFr: 'Style Arsenal',
    accent: '#EF0107',
    accentSecondary: '#FFFFFF',
    background: '#0A0606',
    surface: '#180C0C',
    aliases: ['arsenal', 'gunners', 'afc'],
  },
  {
    id: 'milan',
    labelFr: 'Style Milan AC',
    accent: '#FB090B',
    accentSecondary: '#000000',
    background: '#0A0606',
    surface: '#140C0C',
    aliases: ['milan', 'ac milan', 'rossoneri'],
  },
  {
    id: 'dortmund',
    labelFr: 'Style Dortmund',
    accent: '#FDE100',
    accentSecondary: '#000000',
    background: '#0A0A06',
    surface: '#181810',
    aliases: ['dortmund', 'bvb', 'borussia', 'signal iduna'],
  },
  {
    id: 'man_city',
    labelFr: 'Style Man City',
    accent: '#6CABDD',
    accentSecondary: '#FFFFFF',
    background: '#060A10',
    surface: '#0C1420',
    aliases: ['man city', 'manchester city', 'city', 'mcfc', 'sky blues'],
  },
];

function normalizeAlias(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

function aliasMatches(text: string, alias: string): boolean {
  const a = normalizeAlias(alias);
  if (!a) return false;
  if (a.includes(' ')) return text.includes(a);
  const escaped = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(text);
}

/** Recherche un preset par alias ou fragment de phrase. */
export function findTeamColorPreset(text: string): FootballTeamColorPreset | null {
  const n = normalizeAlias(text);
  if (!n) return null;

  let best: FootballTeamColorPreset | null = null;
  let bestLen = 0;

  for (const preset of FOOTBALL_TEAM_COLOR_PRESETS) {
    for (const alias of preset.aliases) {
      const a = normalizeAlias(alias);
      if (aliasMatches(n, alias) && a.length > bestLen) {
        best = preset;
        bestLen = a.length;
      }
    }
  }

  return best;
}

export function getTeamColorPresetById(id: string): FootballTeamColorPreset | undefined {
  return FOOTBALL_TEAM_COLOR_PRESETS.find((p) => p.id === id);
}
