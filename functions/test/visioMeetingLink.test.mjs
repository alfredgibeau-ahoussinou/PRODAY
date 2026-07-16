import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCalComMeetingLink,
  buildMeetingLinkForPhysio,
  isVisioConsultation,
} from '../lib/visioMeetingLink.js';
import { buildAppointmentEmailJsParams } from '../lib/appointmentEmail.js';

test('buildCalComMeetingLink — date et slot', () => {
  const startAt = new Date('2026-07-20T14:30:00+02:00');
  const link = buildCalComMeetingLink('https://cal.com/cabinet-test', startAt);
  assert.ok(link);
  assert.match(link, /date=2026-07-20/);
  assert.match(link, /slot=/);
});

test('buildMeetingLinkForPhysio — username Cal.com', () => {
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
    meetingLink: 'https://cal.com/dr-martin?date=2026-07-20',
  });

  assert.equal(params.meeting_link, 'https://cal.com/dr-martin?date=2026-07-20');
  assert.match(params.visio_cta_html, /Rejoindre la visio/);
  assert.match(params.body_action, /téléconsultation/i);
});
