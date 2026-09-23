import fs from 'fs';
import path from 'path';

describe('Coach Profile & Screens Back Navigation Integrity', () => {
  it('CoachScreenHeader doit afficher le bouton retour si fallbackNavId est défini', () => {
    const headerCode = fs.readFileSync(
      path.resolve(__dirname, '../components/coach/CoachScreenHeader.tsx'),
      'utf-8',
    );
    expect(headerCode).toContain('shellNav?.canGoBack || fallbackNavId');
  });

  it('ProfileHomeScreen doit configurer CoachPane avec un bouton retour vers today pour le profil coach', () => {
    const profileHomeCode = fs.readFileSync(
      path.resolve(__dirname, '../components/profile/ProfileHomeScreen.tsx'),
      'utf-8',
    );
    expect(profileHomeCode).toContain('showBack={true}');
    expect(profileHomeCode).toContain('fallbackNavId="today"');
    expect(profileHomeCode).toContain('onBack=');
  });

  it('ProfileHomeScreen doit passer onBack au CoachProfileHub', () => {
    const profileHomeCode = fs.readFileSync(
      path.resolve(__dirname, '../components/profile/ProfileHomeScreen.tsx'),
      'utf-8',
    );
    expect(profileHomeCode).toMatch(/<CoachProfileHub[^>]*onBack=\{/);
  });

  it('CoachProfileHub doit toujours afficher le bouton retour au sommet de la fiche coach', () => {
    const hubCode = fs.readFileSync(
      path.resolve(__dirname, '../components/coach/CoachProfileHub.tsx'),
      'utf-8',
    );
    expect(hubCode).toContain('accessibilityLabel="Retour"');
    expect(hubCode).toContain('shellNav?.canGoBack');
    expect(hubCode).toContain("requestNav('today')");
  });

  it('CoachAccountPanels doit intégrer un bouton retour dans PanelHeader pour tous les sous-onglets', () => {
    const panelsCode = fs.readFileSync(
      path.resolve(__dirname, '../components/coach/CoachAccountPanels.tsx'),
      'utf-8',
    );
    expect(panelsCode).toContain('panelBackBtn');
    expect(panelsCode).toContain('accessibilityLabel="Retour"');
  });

  it('CoachMesVideosScreen doit définir fallbackNavId="plus" sur ses CoachPane', () => {
    const videoCode = fs.readFileSync(
      path.resolve(__dirname, '../screens/coach/CoachMesVideosScreen.tsx'),
      'utf-8',
    );
    expect(videoCode).toContain('fallbackNavId="plus"');
  });

  it('CoachTwinMatchLabScreen doit inclure AppBackButton pour revenir au pôle Coach', () => {
    const twinCode = fs.readFileSync(
      path.resolve(__dirname, '../screens/coach/CoachTwinMatchLabScreen.tsx'),
      'utf-8',
    );
    expect(twinCode).toContain('AppBackButton');
    expect(twinCode).toContain('fallbackNavId="plus"');
  });

  it('CoachAiTrainingGen et CoachAiOpponentAnalysis doivent passer onBack={onBack} à CoachPane', () => {
    const genCode = fs.readFileSync(
      path.resolve(__dirname, '../components/coach/ai/CoachAiTrainingGen.tsx'),
      'utf-8',
    );
    const oppCode = fs.readFileSync(
      path.resolve(__dirname, '../components/coach/ai/CoachAiOpponentAnalysis.tsx'),
      'utf-8',
    );
    expect(genCode).toContain('onBack={onBack}');
    expect(oppCode).toContain('onBack={onBack}');
  });
});
