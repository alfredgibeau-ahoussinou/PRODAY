import {
  buildCalComMeetingLink,
  buildDailyMeetingLink,
  buildDailyJoinUrl,
  buildMeetingLinkForAppointment,
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

  it('génère un lien Daily déterministe par appointmentId', () => {
    const result = buildDailyMeetingLink('abc123');
    expect(result.visioProvider).toBe('daily');
    expect(result.meetingLink).toBe('https://proday.daily.co/proday-rdv-abc123');
  });

  it('construit le lien visio Daily pour un RDV', () => {
    const startAt = new Date('2026-07-20T14:30:00+02:00');
    const result = buildMeetingLinkForAppointment(
      physioProfile,
      { start_at: startAt, consultation_type: 'visio' },
      'rdv-42'
    );
    expect(result).not.toBeNull();
    expect(result?.visioProvider).toBe('daily');
    expect(result?.meetingLink).toContain('proday-rdv-rdv-42');
  });

  it('ajoute userName et userId au lien Daily', () => {
    const url = buildDailyJoinUrl('https://proday.daily.co/proday-rdv-test', {
      userName: 'Jean Dupont',
      userId: 'uid-1',
      token: 'tok123',
    });
    expect(url).toContain('userName=Jean');
    expect(url).toContain('userId=uid-1');
    expect(url).toContain('t=tok123');
    expect(url).toContain('enablePrejoinUI=false');
  });

  it('génère un lien Cal.com avec date et créneau (secours)', () => {
    const startAt = new Date('2026-07-20T14:30:00+02:00');
    const link = buildCalComMeetingLink('https://cal.com/cabinet-martin-kine', startAt);
    expect(link).toContain('cal.com/cabinet-martin-kine');
    expect(link).toContain('date=2026-07-20');
    expect(link).toContain('slot=');
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
      meeting_link: 'https://proday.daily.co/proday-rdv-test',
      consultation_type: 'visio',
    } as MedicalAppointment;
    expect(canJoinVisioSession(appt)).toBe(true);
  });

  it('masque le bouton visio sans lien ou non confirmé', () => {
    expect(
      canJoinVisioSession({
        status: 'pending',
        meeting_link: 'https://proday.daily.co/test',
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
