import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAppointmentEmailJsParams } from '../lib/appointmentEmail.js';

test('buildAppointmentEmailJsParams — demande praticien', () => {
  const startAt = new Date('2026-07-20T14:30:00+02:00');
  const params = buildAppointmentEmailJsParams({
    to: 'physio@example.com',
    kind: 'booking_request_physio',
    recipientName: 'Dr Martin',
    counterpartyName: 'Jean Dupont',
    startAt,
    durationMin: 45,
    locationLabel: 'Cabinet Paris 15',
    motif: 'Rééducation genou',
    specialty: 'Kinésithérapeute',
  });

  assert.equal(params.email, 'physio@example.com');
  assert.equal(params.email_kind, 'booking_request_physio');
  assert.equal(params.counterparty_name, 'Jean Dupont');
  assert.equal(params.duration_min, '45');
  assert.match(params.body_detail, /Kinésithérapeute/);
  assert.match(params.body_detail, /Rééducation genou/);
  assert.match(params.subject, /Nouvelle demande/);
});

test('buildAppointmentEmailJsParams — confirmé patient', () => {
  const params = buildAppointmentEmailJsParams({
    to: 'patient@example.com',
    kind: 'booking_confirmed',
    recipientName: 'Jean Dupont',
    counterpartyName: 'Dr Martin',
    startAt: new Date('2026-07-20T14:30:00+02:00'),
    durationMin: 30,
  });

  assert.equal(params.status_label, 'Confirmé');
  assert.match(params.subject, /confirmé/i);
});
