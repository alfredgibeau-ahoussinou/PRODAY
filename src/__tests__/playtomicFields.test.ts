import {
  suggestFieldSlots,
  PLAYTOMIC_FIELDS_AVAILABLE,
} from '../features/v3/engines/playtomicFields.engine';

describe('playtomicFields.engine', () => {
  it('ne renvoie pas de créneaux fictifs', () => {
    expect(PLAYTOMIC_FIELDS_AVAILABLE).toBe(false);
    expect(suggestFieldSlots({ city: 'Paris', limit: 3 })).toEqual([]);
  });
});
