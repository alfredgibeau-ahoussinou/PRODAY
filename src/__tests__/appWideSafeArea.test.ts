/**
 * Safe area / status-bar — couverture multi-pôles (Modales opaque + shells).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useModalTopInset } from '../hooks/useModalTopInset';
import {
  resolveShellChrome,
  statusBarStyleFor,
} from '../theme/shellSurfaces';
import { COACH_DARK_SURFACES } from '../utils/coachTeamTheme';

const read = (rel: string) => readFileSync(resolve(__dirname, '..', rel), 'utf8');

/** Modales plein écran (opaque) qui doivent inset le haut. */
const OPAQUE_MODAL_SAFE_FILES = [
  'features/coach/training/CoachExerciseLibraryModal.tsx',
  'features/coach/training/CoachSessionDebriefModal.tsx',
  'features/video/CoachVideoWorkspace.tsx',
  'components/coach/CoachSquadImportPanel.tsx',
  'components/coach/CoachLineupGuide.tsx',
  'components/coach/matches/CoachOrganizeFriendlyModal.tsx',
  'components/legal/LegalDocumentModal.tsx',
  'components/coach/diagram/CoachDiagramEditorModal.tsx',
  'components/coach/diagram/CoachDiagramAnimationEditor.tsx',
  'components/coach/diagram/CoachDiagramViewerModal.tsx',
  'components/coach/diagram/CoachDiagramPlayerPresentationModal.tsx',
  'components/coach/match/CoachMatchTalkPresentationModal.tsx',
] as const;

describe('App-wide safe area — opaque Modals', () => {
  it('expose useModalTopInset (helper partagé)', () => {
    const hook = read('hooks/useModalTopInset.ts');
    expect(hook).toContain('export function useModalTopInset');
    expect(hook).toContain('export function useModalBottomInset');
    expect(hook).toContain('pageSheet');
    expect(hook).toContain('embedded');
    // Hook est une vraie fonction (pas un stub) — callable en tests via mock context.
    expect(typeof useModalTopInset).toBe('function');
  });

  it.each(OPAQUE_MODAL_SAFE_FILES)('%s inset le haut (context SafeArea / useModalTopInset)', (rel) => {
    const src = read(rel);
    const usesHook = src.includes('useModalTopInset') || src.includes('useSafeAreaInsets');
    const usesContextSafe =
      src.includes("from 'react-native-safe-area-context'") && src.includes('SafeAreaView');
    expect(usesHook || usesContextSafe).toBe(true);
    // Plus de SafeAreaView issu de react-native seul (insets fiables via context).
    expect(src).not.toMatch(/SafeAreaView[^;]*from 'react-native'/);
  });

  it('Club devis : SafeAreaView dans l’écran (Modal pageSheet ClubHub)', () => {
    const quote = read('screens/club/ClubQuoteRequestScreen.tsx');
    expect(quote).toContain("from 'react-native-safe-area-context'");
    expect(quote).toContain("edges={['top', 'bottom']}");
  });
});

describe('App-wide safe area — shell topSurface', () => {
  it('Coach déclare tokens.bg (OLED)', () => {
    const shell = read('features/coach/shell/CoachAppShell.tsx');
    expect(shell).toContain('useDeclareShellTopSurface(tokens.bg)');
  });

  it('override sombre coach → icônes claires', () => {
    const chrome = resolveShellChrome({
      productLine: 'coach',
      topSurfaceOverride: COACH_DARK_SURFACES.bg,
    });
    expect(chrome.topSurface).toBe('#000000');
    expect(statusBarStyleFor(chrome)).toBe('light');
  });

  it('Community : SafeAreaView + StatusBar', () => {
    const src = read('navigation/CommunityAppShell.tsx');
    expect(src).toContain('SafeAreaView');
    expect(src).toContain('StatusBar');
  });

  it('Club reste clair (pas de declare OLED — tokens.isLight figé)', () => {
    const shell = read('features/club/shell/ClubAppShell.tsx');
    expect(shell).not.toContain('useDeclareShellTopSurface');
    expect(shell).toContain("StatusBar style={tokens.isLight ? 'dark' : 'light'}");
  });
});
