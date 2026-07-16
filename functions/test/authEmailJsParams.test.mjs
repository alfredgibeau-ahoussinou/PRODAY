import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAuthEmailJsTemplateParams } from '../lib/authEmailJsParams.js';

test('buildAuthEmailJsTemplateParams — vérification (templates séparés)', () => {
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
  assert.equal(params.app_name, 'ProDay');
  assert.equal(params.email, 'user@example.com');
  assert.equal(params.action_link, 'https://proday75.fr/verify?oobCode=abc');
  assert.equal(params.display_name_greeting, ' Jean');
  assert.equal(params.message_text, 'Lien de vérification');
  assert.equal(params.headline, undefined);
  assert.equal(params.body_intro, undefined);
});

test('buildAuthEmailJsTemplateParams — reset mot de passe (templates séparés)', () => {
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
  assert.equal(params.email, 'user@example.com');
  assert.equal(params.action_link, 'https://proday75.fr/reset?oobCode=xyz');
  assert.equal(params.display_name_greeting, '');
  assert.equal(params.headline, undefined);
});

test('buildAuthEmailJsTemplateParams — template unifié legacy', () => {
  const params = buildAuthEmailJsTemplateParams(
    {
      to: 'user@example.com',
      subject: 'Confirmez votre adresse e-mail ProDay',
      text: 'Lien de vérification',
    },
    'https://proday75.fr/verify?oobCode=abc',
    { kind: 'verification', legacyUnifiedTemplate: true }
  );

  assert.equal(params.headline, 'Confirmez votre e-mail');
  assert.equal(params.cta_label, 'Valider mon e-mail');
  assert.equal(params.email_kind, 'verification');
  assert.match(params.body_intro, /validez l'adresse suivante/i);
  assert.equal(
    params.body_action,
    'Cliquez sur le bouton ci-dessous pour finaliser votre inscription.'
  );
});

test('buildAuthEmailJsTemplateParams — template unifié legacy reset', () => {
  const params = buildAuthEmailJsTemplateParams(
    {
      to: 'user@example.com',
      subject: 'Réinitialisez votre mot de passe ProDay',
      text: 'Lien de reset',
    },
    'https://proday75.fr/reset?oobCode=xyz',
    { kind: 'password-reset', legacyUnifiedTemplate: true }
  );

  assert.equal(params.headline, 'Réinitialisez votre mot de passe');
  assert.equal(params.cta_label, 'Réinitialiser mon mot de passe');
  assert.equal(params.email_kind, 'password-reset');
  assert.match(params.footer_note, /mot de passe actuel reste inchangé/i);
});
