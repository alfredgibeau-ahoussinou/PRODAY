import { enforceMinorParentalPatch } from '../utils/minorProfileGuard';
import { DEFAULT_PARENTAL_SETTINGS } from '../models/ParentalSettings';

describe('minorProfileGuard', () => {
  it('empêche la désactivation des protections mineur', () => {
    const current = { ...DEFAULT_PARENTAL_SETTINGS, is_minor: true };
    const patch = enforceMinorParentalPatch(current, {
      contacts_filter_enabled: false,
      supervision_enabled: false,
      is_minor: false,
    });
    expect(patch.contacts_filter_enabled).toBe(true);
    expect(patch.supervision_enabled).toBe(true);
    expect(patch.is_minor).toBeUndefined();
  });

  it('laisse passer les patchs sur compte majeur', () => {
    const patch = enforceMinorParentalPatch(
      { ...DEFAULT_PARENTAL_SETTINGS, is_minor: false },
      { contacts_filter_enabled: false },
    );
    expect(patch.contacts_filter_enabled).toBe(false);
  });
});
