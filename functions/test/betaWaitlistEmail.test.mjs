import assert from 'node:assert/strict';
import test from 'node:test';
import { buildBetaRejectEmail, buildBetaWelcomeEmail } from '../lib/betaWaitlistEmail.js';

test('buildBetaRejectEmail — sujet et contenu refus', () => {
  const { subject, html, text } = buildBetaRejectEmail({
    email: 'coach@example.com',
    roleLabel: 'Coach',
    siteUrl: 'https://proday75.fr',
  });

  assert.match(subject, /bêta ProDay/i);
  assert.match(text, /Coach/);
  assert.match(text, /proday75\.fr/);
  assert.match(html, /coach@example\.com/);
  assert.match(html, /ne pouvons pas vous ouvrir l&apos;accès/);
});

test('buildBetaWelcomeEmail — toujours intact', () => {
  const { subject, html } = buildBetaWelcomeEmail({
    email: 'player@example.com',
    roleLabel: 'Joueur',
    accessToken: 'tok_test',
  });
  assert.match(subject, /Bienvenue/);
  assert.match(html, /tok_test/);
});
