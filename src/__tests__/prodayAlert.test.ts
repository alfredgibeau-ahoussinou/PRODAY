import { Platform, Alert } from 'react-native';
import { prodayAlert } from '../utils/prodayAlert';

describe('prodayAlert cross-platform compatibility', () => {
  const originalPlatform = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalPlatform, configurable: true });
    jest.restoreAllMocks();
  });

  describe('on native platforms (iOS / Android)', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    });

    it('delegates to native Alert.alert', () => {
      const spy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const buttons = [{ text: 'OK', onPress: jest.fn() }];
      
      prodayAlert.alert('Titre', 'Message', buttons);
      
      expect(spy).toHaveBeenCalledWith('Titre', 'Message', buttons);
    });
  });

  describe('on web platform', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    });

    it('triggers window.alert for informational messages without buttons', () => {
      const windowAlert = jest.fn();
      global.window = { ...global.window, alert: windowAlert } as unknown as Window & typeof globalThis;

      prodayAlert.alert('Photo mise à jour', 'Votre photo de profil est en ligne.');

      expect(windowAlert).toHaveBeenCalledWith('Photo mise à jour\n\nVotre photo de profil est en ligne.');
    });

    it('triggers window.confirm and calls callback when confirmed for actionable buttons', () => {
      const windowConfirm = jest.fn().mockReturnValue(true);
      global.window = { ...global.window, confirm: windowConfirm } as unknown as Window & typeof globalThis;

      const onConfirm = jest.fn();
      prodayAlert.alert('Supprimer la photo', 'Retirer cette image ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: onConfirm },
      ]);

      expect(windowConfirm).toHaveBeenCalledWith('Supprimer la photo\n\nRetirer cette image ?');
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('does not call callback when user cancels window.confirm', () => {
      const windowConfirm = jest.fn().mockReturnValue(false);
      global.window = { ...global.window, confirm: windowConfirm } as unknown as Window & typeof globalThis;

      const onConfirm = jest.fn();
      prodayAlert.alert('Supprimer la photo', 'Retirer cette image ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: onConfirm },
      ]);

      expect(windowConfirm).toHaveBeenCalled();
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });
});
