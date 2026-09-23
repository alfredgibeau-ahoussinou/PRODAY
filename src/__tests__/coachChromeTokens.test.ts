import fs from 'fs';
import path from 'path';
import { COACH_SITE } from '../content/coachPageIdentity';
import { buildCoachThemeTokens } from '../utils/coachTeamTheme';

/**
 * Chrome Pôle Coach — surfaces Dark Premium (DESIGN.md §2).
 *
 * Les écrans et composants Coach doivent dériver leurs surfaces des tokens
 * partagés (`COACH_SITE` / `useCoachTokens`) : #121218 (surface) et #1A1A24
 * (elevated) sur le canvas #000000. Aucun gris local hors spec ne doit
 * réapparaître — notamment les surfaces du pôle Club (#141418, #181820…)
 * qui avaient fuité dans les écrans Coach.
 */

const OFF_SPEC_GREYS = [
  '#141418', // surface du pôle Club
  '#181820', // elevated du pôle Club
  '#22222E', // raised du pôle Club
  '#14141A',
  '#121216',
  '#0F0F14',
  '#101014',
  '#1C1C22',
  '#1C1C24',
  '#16161C',
  '#16161E',
  '#18181B',
  '#1E1E28',
  '#1F1F27',
];

const COACH_SOURCE_DIRS = [
  'features/coach',
  'components/coach',
  'screens/coach',
];

function listSourceFiles(dir: string): string[] {
  const abs = path.join(__dirname, '..', dir);
  if (!fs.existsSync(abs)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(rel));
    } else if (/\.(t|j)sx?$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

describe('Chrome Pôle Coach — tokens Dark Premium', () => {
  it('expose les surfaces spec alignées sur DESIGN.md §2', () => {
    expect(COACH_SITE.bg).toBe('#000000');
    expect(COACH_SITE.surface).toBe('#121218');
    expect(COACH_SITE.elevated).toBe('#1A1A24');
    expect(COACH_SITE.border).toBe('rgba(255, 255, 255, 0.14)');
    expect(COACH_SITE.foreground).toBe('#FFFFFF');
    expect(COACH_SITE.muted).toBe('#8B8B9A');
  });

  it('propage ces surfaces via buildCoachThemeTokens (variante solid)', () => {
    const tokens = buildCoachThemeTokens({ variant: 'solid' });
    expect(tokens.isLight).toBe(false);
    expect(tokens.bg).toBe(COACH_SITE.bg);
    expect(tokens.surface).toBe('#121218');
    expect(tokens.elevated).toBe('#1A1A24');
    expect(tokens.border).toBe(COACH_SITE.border);
    expect(tokens.foreground).toBe('#FFFFFF');
    expect(tokens.muted).toBe('#8B8B9A');
  });

  it('conserve une variante claire distincte (aucune surface sombre imposée)', () => {
    const light = buildCoachThemeTokens({ variant: 'clear' });
    expect(light.isLight).toBe(true);
    expect(light.surface).not.toBe('#121218');
  });

  it('ne réintroduit aucun gris hors spec dans le chrome Coach', () => {
    const offenders: string[] = [];
    for (const dir of COACH_SOURCE_DIRS) {
      for (const file of listSourceFiles(dir)) {
        const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
        for (const grey of OFF_SPEC_GREYS) {
          if (src.toLowerCase().includes(grey.toLowerCase())) {
            offenders.push(`${file} → ${grey}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('route les surfaces Coach par COACH_SITE au lieu de littéraux locaux', () => {
    const squad = fs.readFileSync(
      path.join(__dirname, '../screens/coach/CoachSquadScreen.tsx'),
      'utf8',
    );
    expect(squad).toContain("import { COACH_SITE } from '../../content/coachPageIdentity'");
    expect(squad).toContain('COACH_SITE.surface');
  });
});
