import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCalComMeetingLink,
  buildMeetingLinkForPhysio,
  isVisioConsultation,
} from '../lib/visioMeetingLink.js';
import {
  buildDailyJoinUrl,
  buildDailyMeetingLinkFallback,
  dailyRoomName,
} from '../lib/dailyVisio.js';
import { buildAppointmentEmailJsParams } from '../lib/appointmentEmail.js';

test('buildDailyMeetingLinkFallback — URL déterministe', () => {
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

test('buildCalComMeetingLink — date et slot (secours)', () => {
  const startAt = new Date('2026-07-20T14:30:00+02:00');
  const link = buildCalComMeetingLink('https://cal.com/cabinet-test', startAt);
  assert.ok(link);
  assert.match(link, /date=2026-07-20/);
  assert.match(link, /slot=/);
});

test('buildMeetingLinkForPhysio — Cal.com secours', () => {
  const result = buildMeetingLinkForPhysio(
    { cal_com_username: 'cabinet-test' },
    new Date('2026-07-20T14:30:00+02:00')
  );
  assert.ok(result);
  assert.equal(result.visioProvider, 'cal');
  assert.match(result.meetingLink, /cal\.com\/cabinet-test/);
});

test('isVisioConsultation — cabinet exclu', () => {
  assert.equal(isVisioConsultation('cabinet'), false);
  assert.equal(isVisioConsultation('visio'), true);
});

test('buildAppointmentEmailJsParams — bouton visio si meeting_link', () => {
  const params = buildAppointmentEmailJsParams({
    to: 'patient@example.com',
    kind: 'booking_confirmed',
    recipientName: 'Jean',
    counterpartyName: 'Dr Martin',
    startAt: new Date('2026-07-20T14:30:00+02:00'),
    durationMin: 30,
    meetingLink: 'https://proday.daily.co/proday-rdv-abc',
  });

  assert.equal(params.meeting_link, 'https://proday.daily.co/proday-rdv-abc');
  assert.match(params.visio_cta_html, /Rejoindre la visio/);
  assert.match(params.body_action, /téléconsultation/i);
});
