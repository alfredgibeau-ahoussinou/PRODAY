import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
function source(rel: string) {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('page unique Profil et paramètres', () => {
  it('rend le shell coach sur la page unifiée (plus de ProfilTabScreen)', () => {
    const shell = source('features/coach/shell/CoachAppShell.tsx');
    expect(shell).toContain('CoachProfileSettingsScreen');
    expect(shell).not.toContain('ProfilTabScreen');
    expect(shell).not.toContain('UnifiedSettingsModal');
    expect(shell).not.toContain('ProdaySettingsScreen');
  });

  it('ne réintroduit pas UnifiedSettingsModal sur le chemin coach / profil générique', () => {
    const profileScreen = source('screens/ProfileScreen.tsx');
    const home = source('components/profile/ProfileHomeScreen.tsx');
    const espace = source('screens/coach/CoachProfileSettingsScreen.tsx');
    expect(profileScreen).not.toContain('UnifiedSettingsModal');
    expect(home).not.toContain('UnifiedSettingsModal');
    expect(espace).not.toContain('UnifiedSettingsModal');
    expect(espace).not.toContain('ProdaySettingsScreen');
    // ProfileScreen / hub : réglages génériques = ProdaySettings, jamais pour coach.
    expect(profileScreen).toContain('ProdaySettingsScreen');
    expect(profileScreen).toContain("profile.role !== 'coach'");
    expect(home).toContain("requestNav('profil')");
    expect(home).toContain('settingsOpen && !isCoach');
  });

  it('expose photo, édition, compte, préférences, sécurité et actions rouges', () => {
    const screen = source('screens/coach/CoachProfileSettingsScreen.tsx');
    for (const id of [
      'coach-profile-settings',
      'coach-profile-avatar',
      'coach-profile-edit-open',
      'coach-profile-save',
      'coach-signout',
      'coach-delete-account',
    ]) {
      expect(screen).toContain(id);
    }
    // Déconnexion = mécanisme d'auth existant ; suppression = double confirmation sécurisée.
    expect(screen).toContain('shellNav?.signOut');
    expect(screen).toContain('confirmDeleteAccount');
    expect(screen).toContain('Se déconnecter');
    expect(screen).toContain('Supprimer mon compte');
  });

  it('WAVE 4 P-017 — aligne Mon espace au proto (tokens, modal guides, desktop ≥850)', () => {
    const screen = source('screens/coach/CoachProfileSettingsScreen.tsx');
    expect(screen).toContain("tr(t, 'coach.espace.title', t('coach.desktop.mon.espace'))");
    expect(screen).toContain("t('coach.espace.settings.profil.preferences.et.services')");
    expect(screen).toContain("tr(t, 'coach.espace.editProfile', 'Modifier le profil complet')");
    expect(screen).toContain('surfaces.segmentedTrack');
    expect(screen).not.toContain('#E5E5EA');
    expect(screen).toContain('CoachInteractiveGuideModal');
    expect(screen).toContain('width >= 850');
    expect(screen).toContain('COACH_PROTO_DESKTOP');
    expect(screen).toContain("requestNav('coach_ia')");
    // Pas de fausses routes guides/onboarding
    expect(screen).not.toMatch(/requestNav\(['"]guides['"]\)/);
    expect(screen).not.toMatch(/requestNav\(['"]onboarding['"]\)/);
  });

  it('ouvre la page depuis le haut droit de l’Accueil (avatar)', () => {
    const home = source('screens/coach/CoachHomeScreen.tsx');
    expect(home).toContain('coach-home-profile');
    expect(home).toContain("requestNav('profil')");
  });

  it('le menu ne garde plus l’ancien écran Paramètres séparé', () => {
    const menu = source('features/coach/shell/CoachMenuPane.tsx');
    expect(menu).not.toContain('ProdaySettingsScreen');
    expect(menu).not.toContain('setSettingsOpen');
  });

  it('propose l’import d’effectif Footclubs directement depuis les paramètres du compte coach', () => {
    const screen = source('screens/coach/CoachProfileSettingsScreen.tsx');
    expect(screen).toContain('coach-settings-import-squad');
    expect(screen).toContain('CoachSquadImportPanel');
    expect(screen).toContain('squadImportVisible');
  });
});
