import {
  validateStageApplicationMessage,
  validateStageOfferInput,
  MIN_STAGE_MESSAGE,
  MAX_STAGE_MESSAGE,
} from '../utils/stageValidation';

describe('stageValidation', () => {
  it('valide un message de candidature', () => {
    const msg = 'a'.repeat(MIN_STAGE_MESSAGE);
    expect(validateStageApplicationMessage(msg)).toBe(msg);
  });

  it('refuse un message trop court', () => {
    expect(() => validateStageApplicationMessage('court')).toThrow(/trop court/);
  });

  it('refuse un message trop long', () => {
    expect(() => validateStageApplicationMessage('a'.repeat(MAX_STAGE_MESSAGE + 1))).toThrow(
      /trop long/,
    );
  });

  it('valide les champs stage', () => {
    const out = validateStageOfferInput({
      title: 'Stage été',
      description: 'Programme intensif',
      city: 'Nice',
      category: 'U17',
    });
    expect(out.city).toBe('Nice');
  });
});
