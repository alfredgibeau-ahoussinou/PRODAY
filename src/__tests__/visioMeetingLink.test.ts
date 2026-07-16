import {
  buildCalComMeetingLink,
  buildMeetingLinkForPhysio,
  canJoinVisioSession,
  isVisioConsultation,
} from '../utils/visioMeetingLink';
import type { MedicalAppointment } from '../models/MedicalAppointment';

describe('visioMeetingLink', () => {
  const physioProfile = {
    profile: {
      cal_com_username: 'cabinet-martin-kine',
    },
  };

  it('génère un lien Cal.com avec date et créneau', () => {
    const startAt = new Date('2026-07-20T14:30:00+02:00');
    const link = buildCalComMeetingLink('https://cal.com/cabinet-martin-kine', startAt);
    expect(link).toContain('cal.com/cabinet-martin-kine');
    expect(link).toContain('date=2026-07-20');
    expect(link).toContain('slot=');
  });

  it('construit le lien visio depuis le profil praticien', () => {
    const startAt = new Date('2026-07-20T14:30:00+02:00');
    const result = buildMeetingLinkForPhysio(physioProfile, startAt);
    expect(result).not.toBeNull();
    expect(result?.visioProvider).toBe('cal');
    expect(result?.meetingLink).toContain('cabinet-martin-kine');
  });

  it('retourne null sans Cal.com configuré', () => {
    expect(buildMeetingLinkForPhysio({ profile: {} })).toBeNull();
  });

  it('détecte les consultations visio', () => {
    expect(isVisioConsultation('visio')).toBe(true);
    expect(isVisioConsultation('both')).toBe(true);
    expect(isVisioConsultation(undefined)).toBe(true);
    expect(isVisioConsultation('cabinet')).toBe(false);
  });

  it('autorise le bouton visio pour un RDV confirmé avec lien', () => {
    const appt = {
      status: 'confirmed',
      meeting_link: 'https://cal.com/test',
      consultation_type: 'visio',
    } as MedicalAppointment;
    expect(canJoinVisioSession(appt)).toBe(true);
  });

  it('masque le bouton visio sans lien ou non confirmé', () => {
    expect(
      canJoinVisioSession({
        status: 'pending',
        meeting_link: 'https://cal.com/test',
        consultation_type: 'visio',
      } as MedicalAppointment)
    ).toBe(false);
    expect(
      canJoinVisioSession({
        status: 'confirmed',
        consultation_type: 'cabinet',
      } as MedicalAppointment)
    ).toBe(false);
  });
});
