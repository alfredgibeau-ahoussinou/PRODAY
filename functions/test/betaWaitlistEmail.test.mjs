import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildBetaConfirmationEmail,
  buildBetaRejectEmail,
  buildBetaWelcomeEmail,
} from '../lib/betaWaitlistEmail.js';

test('buildBetaConfirmationEmail — request received', () => {
  const { subject, html, text } = buildBetaConfirmationEmail({
    email: 'player@example.com',
  });

  assert.equal(subject, 'Beta Request Received');
  assert.match(text, /Thank you for your interest in ProDay/);
  assert.match(text, /successfully received your beta access request/);
  assert.match(text, /The ProDay Team/);
  assert.match(html, /player@example\.com/);
  assert.match(html, /Beta Request Received/);
});

test('buildBetaRejectEmail — update regarding request', () => {
  const { subject, html, text } = buildBetaRejectEmail({
    email: 'coach@example.com',
    roleLabel: 'Coach',
    siteUrl: 'https://proday75.fr',
  });

  assert.equal(subject, 'Update Regarding Your Beta Request');
  assert.match(text, /unable to grant beta access/);
  assert.match(text, /new places become available/);
  assert.match(text, /proday75\.fr/);
  assert.match(html, /coach@example\.com/);
  assert.match(html, /unable to grant beta access/);
});

test('buildBetaWelcomeEmail — approved with access link', () => {
  const { subject, html, text } = buildBetaWelcomeEmail({
    email: 'player@example.com',
    roleLabel: 'Joueur',
    accessToken: 'tok_test',
    siteUrl: 'https://proday75.fr',
  });
  assert.equal(subject, 'Welcome to the ProDay Beta');
  assert.match(text, /Congratulations!/);
  assert.match(text, /Your beta access request has been approved/);
  assert.match(text, /Welcome to ProDay!/);
  assert.match(text, /tok_test/);
  assert.match(html, /beta\/programme\?token=tok_test/);
  assert.match(html, /Access your beta space/);
});
