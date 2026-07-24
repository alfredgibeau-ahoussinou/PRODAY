import {
  MEDICAL_SPECIALTY_IDS,
  MEDICAL_CANONICAL_LABELS,
  resolveMedicalSpecialtyId,
  getMedicalSpecialtyConfigs,
} from '../screens/signup/signupMedicalI18n';

describe('medical specialties santé', () => {
  it('expose les 7 métiers du pôle', () => {
    expect(MEDICAL_SPECIALTY_IDS).toEqual([
      'kine',
      'osteo',
      'medecin',
      'prepa',
      'mental',
      'nutrition',
      'podologue',
    ]);
    expect(Object.keys(MEDICAL_CANONICAL_LABELS)).toHaveLength(7);
    expect(getMedicalSpecialtyConfigs()).toHaveLength(7);
  });

  it('résout coach mental et variantes', () => {
    expect(resolveMedicalSpecialtyId('mental')).toBe('mental');
    expect(resolveMedicalSpecialtyId('Coach mental / préparateur mental')).toBe('mental');
    expect(resolveMedicalSpecialtyId('Kinésithérapeute du sport')).toBe('kine');
    expect(resolveMedicalSpecialtyId('Podologue du sport')).toBe('podologue');
  });
});
