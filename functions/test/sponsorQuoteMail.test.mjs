import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDefaultQuoteHtml,
  buildDefaultQuoteSubject,
  buildDefaultQuoteText,
  SPONSOR_QUOTE_PACKAGE_LABELS,
} from '../lib/sponsorQuoteMail.js';

test('buildDefaultQuoteSubject — inclut le nom entreprise', () => {
  assert.equal(buildDefaultQuoteSubject('Acme Sport'), 'Votre devis ProDay Sponsor — Acme Sport');
});

test('buildDefaultQuoteHtml — contient formule et contact', () => {
  const html = buildDefaultQuoteHtml({
    contactName: 'Marie Dupont',
    companyName: 'Acme Sport',
    packageTier: 'territorial',
    budget: '2 000 – 10 000 € / mois',
    goals: ['Notoriété locale'],
    regions: ['Île-de-France'],
  });

  assert.match(html, /Marie Dupont/);
  assert.match(html, /Acme Sport/);
  assert.match(html, /Territorial/);
  assert.match(html, /Notoriété locale/);
  assert.match(html, /Île-de-France/);
});

test('buildDefaultQuoteText — version texte lisible', () => {
  const text = buildDefaultQuoteText({
    contactName: 'Marie',
    companyName: 'Acme',
    packageTier: 'national',
    budget: '500 €',
  });

  assert.ok(text.includes('Marie'));
  assert.ok(text.includes(SPONSOR_QUOTE_PACKAGE_LABELS.national));
  assert.ok(text.includes('500 €'));
});
