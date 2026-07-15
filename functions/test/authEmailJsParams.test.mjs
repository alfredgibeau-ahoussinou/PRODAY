import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAuthEmailJsTemplateParams } from '../lib/authEmailJsParams.js';

test('buildAuthEmailJsTemplateParams — vérification', () => {
  const params = buildAuthEmailJsTemplateParams(
    {
      to: 'user@example.com',
      subject: 'Confirmez votre adresse e-mail ProDay',
      text: 'Lien de vérification',
    },
    'https://proday75.fr/verify?oobCode=abc',
    { displayName: 'Jean', kind: 'verification' }
  );

  assert.equal(params.subject, 'Confirmez votre adresse e-mail ProDay');
  assert.equal(params.headline, 'Confirmez votre e-mail');
  assert.equal(params.app_name, 'ProDay');
  assert.equal(params.cta_label, 'Valider mon e-mail');
  assert.equal(params.email, 'user@example.com');
  assert.equal(params.action_link, 'https://proday75.fr/verify?oobCode=abc');
  assert.equal(params.display_name_greeting, ' Jean');
  assert.equal(params.email_kind, 'verification');
});

test('buildAuthEmailJsTemplateParams — reset mot de passe', () => {
  const params = buildAuthEmailJsTemplateParams(
    {
      to: 'user@example.com',
      subject: 'Réinitialisez votre mot de passe ProDay',
      text: 'Lien de reset',
    },
    'https://proday75.fr/reset?oobCode=xyz',
    { kind: 'password-reset' }
  );

  assert.equal(params.subject, 'Réinitialisez votre mot de passe ProDay');
  assert.equal(params.headline, 'Réinitialisez votre mot de passe');
  assert.equal(params.cta_label, 'Réinitialiser mon mot de passe');
  assert.equal(params.email_kind, 'password-reset');
  assert.match(params.body_intro, /réinitialiser votre mot de passe ProDay/i);
});
