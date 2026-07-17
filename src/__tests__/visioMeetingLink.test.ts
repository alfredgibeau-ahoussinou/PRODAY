import {
  buildCalComMeetingLink,
  buildCalVideoJoinUrl,
  buildDailyMeetingLink,
  buildDailyJoinUrl,
  buildMeetingLinkForAppointment,
  canJoinVisioSession,
  isCalVideoMeetingLink,
  isVisioConsultation,
} from '../utils/visioMeetingLink';
import type { MedicalAppointment } from '../models/MedicalAppointment';

describe('visioMeetingLink', () => {
  const physioProfile = {
    profile: {
      cal_com_username: 'cabinet-martin-kine',
    },
  };

  it('génère un lien Cal.com pour un RDV visio', () => {
    const startAt = new Date('2026-07-20T14:30:00+02:00');
    const result = buildMeetingLinkForAppointment(
      physioProfile,
      { start_at: startAt, consultation_type: 'visio' },
      'rdv-42'
    );
    expect(result).not.toBeNull();
    expect(result?.visioProvider).toBe('cal');
    expect(result?.meetingLink).toContain('cal.com/cabinet-martin-kine');
  });

  it('génère un lien Daily déterministe (secours)', () => {
    const result = buildDailyMeetingLink('abc123');
    expect(result.visioProvider).toBe('daily');
    expect(result.meetingLink).toBe('https://proday.daily.co/proday-rdv-abc123');
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

  it('génère un lien Cal.com avec date, slot et Cal Video', () => {
    const startAt = new Date('2026-07-20T14:30:00+02:00');
    const link = buildCalComMeetingLink('https://cal.com/cabinet-martin-kine', startAt, {
      name: 'Jean',
      email: 'jean@example.com',
    });
    expect(link).toContain('cal.com/cabinet-martin-kine');
    expect(link).toContain('date=2026-07-20');
    expect(link).toContain('slot=');
    expect(link).toContain('integrations%3Adaily');
    expect(link).toContain('name=Jean');
  });

  it('détecte les liens Cal Video', () => {
    expect(isCalVideoMeetingLink('https://app.cal.com/video/abc123')).toBe(true);
    expect(isCalVideoMeetingLink('https://proday.daily.co/room')).toBe(false);
  });

  it('enrichit le lien Cal Video avec nom/email', () => {
    const url = buildCalVideoJoinUrl('https://app.cal.com/video/abc', {
      userName: 'Dr Martin',
      email: 'dr@example.com',
    });
    expect(url).toContain('name=Dr');
    expect(url).toContain('email=dr');
  });

  it('détecte les consultations visio', () => {
    expect(isVisioConsultation('visio')).toBe(true);
    expect(isVisioConsultation('both')).toBe(true);
    expect(isVisioConsultation(undefined)).toBe(true);
    expect(isVisioConsultation('cabinet')).toBe(false);
  });

  it('autorise le bouton visio pour un RDV confirmé avec lien Cal Video', () => {
    const appt = {
      status: 'confirmed',
      meeting_link: 'https://app.cal.com/video/abc123',
      consultation_type: 'visio',
    } as MedicalAppointment;
    expect(canJoinVisioSession(appt)).toBe(true);
  });

  it('autorise le bouton visio avec cal_booking_uid seul', () => {
    const appt = {
      status: 'confirmed',
      cal_booking_uid: 'abc123',
      consultation_type: 'visio',
    } as MedicalAppointment;
    expect(canJoinVisioSession(appt)).toBe(true);
  });

  it('masque le bouton visio sans lien ou non confirmé', () => {
    expect(
      canJoinVisioSession({
        status: 'pending',
        meeting_link: 'https://app.cal.com/video/test',
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
