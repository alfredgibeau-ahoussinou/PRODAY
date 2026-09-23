import {
  cameraConnectHonestMessage,
  coachVideoEmptyLibraryBody,
  coachVideoLockReason,
  coachVideoMissingSourceAlert,
  smartTacticsVideoHonestAlert,
} from '../utils/coachVideoHonesty';

describe('coachVideoHonesty', () => {
  it('explique le soft-lock sans promesse OAuth', () => {
    expect(coachVideoLockReason()).toMatch(/formule vidéo|admin/i);
    expect(coachVideoLockReason()).not.toMatch(/OAuth Veo magique/i);
    expect(coachVideoEmptyLibraryBody()).toMatch(/Centre Vidéo/i);
  });

  it('honnêtise la connexion caméra', () => {
    expect(cameraConnectHonestMessage('Veo', true)).toMatch(/fiche caméra/i);
    expect(cameraConnectHonestMessage('Veo', true)).toMatch(/OAuth|connecteur/i);
    expect(cameraConnectHonestMessage('XbotGo', false)).toMatch(/non branché/i);
  });

  it('refuse les highlights inventés dans le message Smart Tactics', () => {
    expect(smartTacticsVideoHonestAlert()).toMatch(/aucun highlight inventé/i);
  });

  it('refuse toute lecture sans fichier réel associé', () => {
    expect(coachVideoMissingSourceAlert()).toMatch(/aucun fichier vidéo associé/i);
    expect(coachVideoMissingSourceAlert()).toMatch(/aucune vidéo de démonstration/i);
  });
});
