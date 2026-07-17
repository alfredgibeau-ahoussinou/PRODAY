import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCalComMeetingLink,
  buildMeetingLinkForPhysio,
  isVisioConsultation,
  parseCalComEventProfile,
  isCalVideoMeetingLink,
  buildCalVideoJoinUrl,
} from '../lib/visioMeetingLink.js';
import {
  buildDailyJoinUrl,
  buildDailyMeetingLinkFallback,
  dailyRoomName,
} from '../lib/dailyVisio.js';
import { buildAppointmentEmailJsParams } from '../lib/appointmentEmail.js';

test('parseCalComEventProfile — extrait username et slug depuis booking_url', () => {
  const profile = parseCalComEventProfile({
    booking_url: 'https://cal.com/cabinet-test/teleconsultation',
  });
  assert.ok(profile);
  assert.equal(profile.username, 'cabinet-test');
  assert.equal(profile.eventTypeSlug, 'teleconsultation');
});

test('buildDailyMeetingLinkFallback — URL déterministe (secours)', () => {
  const result = buildDailyMeetingLinkFallback('abc123', 'proday');
  assert.equal(result.visioProvider, 'daily');
  assert.equal(result.meetingLink, 'https://proday.daily.co/proday-rdv-abc123');
  assert.equal(result.roomName, dailyRoomName('abc123'));
});

test('buildDailyJoinUrl — params sans formulaire', () => {
  const url = buildDailyJoinUrl('https://proday.daily.co/proday-rdv-test', {
    userName: 'Dr Martin',
    userId: 'uid-host',
    token: 'abc',
  });
  assert.match(url, /userName=Dr/);
  assert.match(url, /userId=uid-host/);
  assert.match(url, /t=abc/);
  assert.match(url, /enablePrejoinUI=false/);
});

test('buildCalComMeetingLink — date, slot et Cal Video', () => {
  const startAt = new Date('2026-07-20T14:30:00+02:00');
  const link = buildCalComMeetingLink('https://cal.com/cabinet-test', startAt);
  assert.ok(link);
  assert.match(link, /date=2026-07-20/);
  assert.match(link, /slot=/);
  assert.match(link, /integrations/);
});

test('buildMeetingLinkForPhysio — Cal.com principal', () => {
  const result = buildMeetingLinkForPhysio(
    { cal_com_username: 'cabinet-test' },
    new Date('2026-07-20T14:30:00+02:00')
  );
  assert.ok(result);
  assert.equal(result.visioProvider, 'cal');
  assert.match(result.meetingLink, /cal\.com\/cabinet-test/);
});

test('isCalVideoMeetingLink — détecte app.cal.com/video', () => {
  assert.equal(isCalVideoMeetingLink('https://app.cal.com/video/abc'), true);
  assert.equal(isCalVideoMeetingLink('https://cal.com/cabinet'), false);
});

test('buildCalVideoJoinUrl — nom et email', () => {
  const url = buildCalVideoJoinUrl('https://app.cal.com/video/abc', {
    userName: 'Jean',
    email: 'jean@test.com',
  });
  assert.match(url, /name=Jean/);
  assert.match(url, /email=jean/);
});

test('isVisioConsultation — cabinet exclu', () => {
  assert.equal(isVisioConsultation('cabinet'), false);
  assert.equal(isVisioConsultation('visio'), true);
});

test('buildAppointmentEmailJsParams — bouton visio si meeting_link Cal Video', () => {
  const params = buildAppointmentEmailJsParams({
    to: 'patient@example.com',
    kind: 'booking_confirmed',
    recipientName: 'Jean',
    counterpartyName: 'Dr Martin',
    startAt: new Date('2026-07-20T14:30:00+02:00'),
    durationMin: 30,
    meetingLink: 'https://app.cal.com/video/abc123',
  });

  assert.equal(params.meeting_link, 'https://app.cal.com/video/abc123');
  assert.match(params.visio_cta_html, /Rejoindre la visio/);
  assert.match(params.body_action, /téléconsultation/i);
});
