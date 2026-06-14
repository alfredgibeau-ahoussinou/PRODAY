import {
  getGuestProfileHeroCopy,
  getGuestProfileUnlockItems,
} from '../content/guestProfileExperience';

describe('guestProfileExperience', () => {
  it('adapte les étapes débloquées par univers', () => {
    expect(getGuestProfileUnlockItems('homme')[0].title).toMatch(/identité/i);
    expect(getGuestProfileUnlockItems('pro')[0].title).toMatch(/staff/i);
    expect(getGuestProfileUnlockItems('sante')[0].title).toMatch(/cabinet/i);
    expect(getGuestProfileUnlockItems('sante')).toHaveLength(3);
  });

  it('personnalise le sous-titre hero', () => {
    expect(getGuestProfileHeroCopy('sante', 'Pro Day Santé')).toMatch(/praticien/i);
    expect(getGuestProfileHeroCopy('pro', 'Pro Day Pro')).toMatch(/staff/i);
    expect(getGuestProfileHeroCopy('homme', 'Pro Day Man')).toMatch(/personnel/i);
  });
});
