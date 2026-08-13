import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildBetaConfirmationEmail,
  buildBetaRejectEmail,
  buildBetaWelcomeEmail,
} from '../lib/betaWaitlistEmail.js';

test('buildBetaConfirmationEmail — demande reçue', () => {
  const { subject, html, text } = buildBetaConfirmationEmail({
    email: 'player@example.com',
  });

  assert.equal(subject, 'ProDay — demande bêta bien reçue');
  assert.match(text, /Merci pour votre intérêt pour ProDay/);
  assert.match(text, /bien reçu votre demande/);
  assert.match(text, /15 août 2026/);
  assert.match(text, /L’équipe ProDay|L'équipe ProDay/);
  assert.match(html, /player@example\.com/);
  assert.match(html, /Demande bêta bien reçue/);
});

test('buildBetaRejectEmail — mise à jour demande', () => {
  const { subject, html, text } = buildBetaRejectEmail({
    email: 'coach@example.com',
    roleLabel: 'Coach',
    siteUrl: 'https://proday75.fr',
  });

  assert.equal(subject, 'ProDay — mise à jour sur votre demande bêta');
  assert.match(text, /ne pouvons malheureusement pas/);
  assert.match(text, /nouvelles places/);
  assert.match(text, /proday75\.fr/);
  assert.match(html, /coach@example\.com/);
  assert.match(html, /ne pouvons malheureusement pas/);
});

test('buildBetaWelcomeEmail — approuvé avec lien d’accès', () => {
  const { subject, html, text } = buildBetaWelcomeEmail({
    email: 'player@example.com',
    roleLabel: 'Joueur',
    accessToken: 'tok_test',
    siteUrl: 'https://proday75.fr',
  });
  assert.equal(subject, 'Bienvenue dans la bêta ProDay');
  assert.match(text, /Félicitations/);
  assert.match(text, /accès bêta est approuvé/);
  assert.match(text, /TestFlight/);
  assert.match(text, /15 août 2026/);
  assert.match(text, /tok_test/);
  assert.match(html, /beta\/programme\?token=tok_test/);
  assert.match(html, /Espace bêta/);
});
