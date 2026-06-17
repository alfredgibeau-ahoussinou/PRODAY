#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MESSAGES = join(ROOT, 'src/i18n/messages');

function esc(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function parseCatalog(source) {
  const entries = {};
  const re = /'([^']+)':\s*'((?:\\.|[^'\\])*)'/gs;
  let match;
  while ((match = re.exec(source))) {
    entries[match[1]] = match[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  }
  const multilineRe = /'([^']+)':\s*\n\s*'((?:\\.|[^'\\])*)'/gs;
  while ((match = multilineRe.exec(source))) {
    entries[match[1]] = match[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  }
  return entries;
}

function protectParams(text) {
  const slots = [];
  const template = text.replace(/\{\{(\w+)\}\}/g, (_, name) => {
    slots.push(name);
    return `__PD${slots.length - 1}__`;
  });
  return { template, slots };
}

function restoreParams(text, slots) {
  return text.replace(/__PD(\d+)__/g, (_, index) => {
    const slot = slots[Number(index)];
    return slot ? `{{${slot}}}` : '';
  });
}

async function translateLine(text, target) {
  const { template, slots } = protectParams(text);
  if (!template.trim()) return text;
  const url =
    'https://translate.googleapis.com/translate_a/single' +
    `?client=gtx&sl=en&tl=${encodeURIComponent(target)}&dt=t` +
    `&q=${encodeURIComponent(template)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`translate_http_${res.status}`);
  const data = await res.json();
  const translated = data[0]?.map((row) => row[0]).join('') ?? template;
  return restoreParams(translated, slots);
}

const FR_OVERRIDES = {
  'signup.form.cityPlaceholder': 'Ex. Paris, Lyon…',
  'signup.form.cityPractice': 'Ville d’exercice *',
  'signup.form.cityPracticePlaceholder': 'Ex. Paris, Strasbourg…',
  'signup.form.deptPlaceholderShort': 'Ex. 67, 75…',
  'signup.form.deptPlaceholderLong': 'Ex. 75, 69, 2A, 971…',
  'signup.form.stats.matches': 'Matchs',
  'signup.form.stats.goals': 'Buts',
  'signup.form.stats.assists': 'Passes d.',
  'signup.staff.hint': 'Documents vérifiés après confirmation de l’email.',
  'signup.verification.camera.title': 'Vérification par caméra',
  'signup.verification.camera.subtitleU13':
    'Photographiez la pièce d’identité du responsable — analyse IA instantanée, rien n’est stocké.',
  'signup.verification.camera.subtitle':
    'CNI ou passeport obligatoire · licence club recommandée · prise de vue directe.',
  'signup.verification.camera.continueEmail': 'Continuer vers l’email',
  'signup.verification.camera.tip':
    'Cadrez le recto de la carte ou la page photo du passeport, sans reflet.',
  'signup.verification.camera.analyzing': 'Analyse IA…',
  'signup.verification.camera.validated': 'Validé — non stocké',
  'signup.verification.camera.retake': 'Reprendre la photo',
  'signup.verification.camera.openCamera': 'Ouvrir la caméra',
  'signup.verification.camera.photograph': 'Photographier avec la caméra',
  'signup.verification.camera.hint':
    'Utilisez la caméra pour photographier vos documents. L’IA Mistral analyse la photo en mémoire — aucune copie n’est enregistrée sur nos serveurs.',
  'signup.verification.alert.identity.title': 'Identité requise',
  'signup.verification.alert.identity.body':
    'Photographiez votre CNI ou passeport avec la caméra avant de continuer.',
  'signup.verification.alert.license.title': 'Licence club',
  'signup.verification.alert.license.body':
    'Sans licence validée, votre profil restera partiel. Continuer ?',
  'signup.verification.alert.license.retake': 'Photographier la licence',
  'signup.verification.docRejected': 'Document refusé. Reprenez la photo avec la caméra.',
  'signup.verification.aiFailed': 'Analyse IA impossible',
  'signup.welcome.journey': 'Votre parcours',
  'signup.welcome.ctaWoman': 'Commencer mon inscription Woman',
  'signup.welcome.ctaSante': 'Continuer sur Pro Day Santé',
  'signup.welcome.ctaPro': 'Continuer sur Pro Day Pro',
  'signup.welcome.ctaMan': 'Commencer sur {{brand}}',
  'signup.welcome.playerWoman.title': 'Profil joueuse',
  'signup.welcome.playerWoman.subtitle':
    'Mercato filtré foot féminin, stats et visibilité auprès des clubs F.',
  'signup.welcome.playerMan.title': 'Profil joueur',
  'signup.welcome.playerMan.subtitle': 'CV en ligne, Mercato M, matchs et visibilité auprès des clubs.',
  'signup.welcome.practitioner.title': 'Profil praticien',
  'signup.welcome.practitioner.subtitle':
    'Agenda RDV, messagerie patients et visibilité auprès des clubs et joueurs.',
  'carpool.login.title': 'Connectez-vous',
  'carpool.login.cta': 'Se connecter',
  'carpool.propose.title': 'Proposer un trajet',
  'carpool.propose.freeTrips': 'Trajets libres',
  'carpool.propose.onConvocations': 'Sur vos convocations',
  'carpool.propose.noConvocation': 'Aucune convocation',
  'carpool.propose.bookedElsewhere':
    'Vous avez déjà réservé une place sur {{n}} événement(s) — vous pouvez tout de même proposer votre véhicule sur un autre match.',
  'carpool.propose.publishedTrips': 'Mes trajets publiés ({{n}})',
  'carpool.balance.noDriver': 'Aucun conducteur',
  'carpool.balance.topDriver': 'Conducteur le plus actif',
  'carpool.balance.rowTrip': '{{n}} trajet',
  'carpool.balance.rowTrips': '{{n}} trajets',
  'carpool.balance.lastTrip': ' · dernier {{date}}',
  'carpool.standalone.clubOnly': 'Club uniquement',
  'carpool.standalone.departure': ' · départ {{time}}',
  'carpool.standalone.meeting': 'RDV : {{place}}',
  'carpool.standalone.openMeetingMaps': 'Ouvrir le RDV dans Plans / Maps',
  'carpool.standalone.openDestinationMaps': 'Ouvrir la destination dans Plans / Maps',
  'carpool.standalone.requestSeat': 'Demander une place',
  'carpool.standalone.passengersConfirmed': '{{n}} passager(s) confirmé(s)',
  'carpool.standalone.passengersPendingSuffix': ' · {{n}} en attente',
  'carpool.standalone.accept': 'Accepter',
  'carpool.standalone.decline': 'Refuser',
  'carpool.minor.title': 'Compte mineur',
  'carpool.propose.seatsRequired': 'Places',
  'carpool.propose.seatsRequiredBody': 'Indiquez le nombre de places disponibles dans votre véhicule.',
  'carpool.propose.meetingRequired': 'Indiquez où vous récupérez vos coéquipiers.',
  'carpool.propose.updated': 'Trajet mis à jour',
  'carpool.propose.published': 'Trajet publié',
  'carpool.propose.assignedTitle': 'Trajet assigné',
  'carpool.propose.activeTrip': 'Trajet actif — {{n}} place(s)',
  'carpool.propose.destination': 'Destination : {{dest}}',
  'carpool.propose.seatsPlaceholder': 'Nombre de places (ex. 3)',
  'carpool.propose.meetingPlaceholder': 'Point de rendez-vous (ex. parking du club)',
  'carpool.propose.viewMeetingMap': 'Voir le RDV actuel sur la carte',
  'carpool.propose.withdraw': 'Retirer ma proposition',
  'carpool.propose.viewEvent': 'Voir l’événement et les réservations →',
  'carpool.propose.remove.cta': 'Retirer',
  'carpool.propose.remove.failed': 'Retrait impossible.',
  'carpool.standalone.form.destinationPlaceholder': 'Destination (ex. Stade municipal, Lyon)',
  'carpool.standalone.form.datePlaceholder': 'Date JJ/MM/AAAA',
  'carpool.standalone.form.timePlaceholder': 'Heure 14:30',
  'carpool.location.gpsLabel': 'Position GPS du point de rendez-vous',
  'carpool.location.title': 'Localisation',
  'carpool.location.failed': 'Impossible d’obtenir votre position.',
  'carpool.location.currentPosition': 'Ma position actuelle',
  'carpool.location.addressPlaceholder': 'Adresse ou repère (ex. parking club, domicile…)',
  'carpool.location.useCurrent': 'Utiliser ma position',
  'carpool.location.map': 'Carte',
  'signup.document.aiFailed': 'Analyse IA impossible.',
  'signup.security.password': 'Mot de passe',
  'signup.security.passwordPlaceholder': '{{min}} caractères, maj., chiffre, spécial',
  'signup.security.passwordStrength': 'Sécurité : {{label}}',
  'signup.security.passwordRules': 'Majuscule, minuscule, chiffre et caractère spécial requis.',
  'signup.security.confirmPassword': 'Confirmer le mot de passe',
  'signup.document.title': 'Justificatif pro',
  'signup.document.subtitle':
    'Photographiez votre document avec la caméra — analyse IA instantanée, rien n’est stocké.',
  'signup.document.openCamera': 'Ouvrir la caméra',
  'signup.document.rejected': 'Document refusé par l’analyse IA. Reprenez la photo avec la caméra.',
  'carpool.event.title': 'Événement',
  'common.yes': 'Oui',
  'common.no': 'Non',
};

async function main() {
  const enSource = readFileSync(join(MESSAGES, 'tertiary.en.ts'), 'utf8');
  const en = parseCatalog(enSource);
  const enKeys = Object.keys(en);

  for (const locale of ['fr', 'es', 'de', 'ko']) {
    const path = join(MESSAGES, `tertiary.${locale}.ts`);
    const existing = parseCatalog(readFileSync(path, 'utf8'));
    const missing = enKeys.filter((k) => !existing[k]);
    if (missing.length === 0) {
      console.log(`✓ tertiary.${locale}.ts — rien à ajouter`);
      continue;
    }
    console.log(`→ tertiary.${locale}.ts — ${missing.length} clé(s)`);
    for (const key of missing) {
      if (locale === 'fr' && FR_OVERRIDES[key]) {
        existing[key] = FR_OVERRIDES[key];
        continue;
      }
      const source = locale === 'fr' ? en[key] : en[key];
      try {
        existing[key] =
          locale === 'fr'
            ? FR_OVERRIDES[key] ?? source
            : await translateLine(source, locale === 'ko' ? 'ko' : locale);
      } catch {
        existing[key] = source;
      }
    }
    const constName = `TERTIARY_${locale.toUpperCase()}`;
    const label = { fr: 'fr', es: 'espagnol', de: 'allemand', ko: 'coréen' }[locale];
    const lines = Object.entries(existing)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `  '${esc(key)}': '${esc(value)}',`);
    const body = `import type { MessageCatalog } from '../types';

/** Tertiary screens — ${label}. */
export const ${constName}: MessageCatalog = {
${lines.join('\n')}
};
`;
    writeFileSync(path, body, 'utf8');
  }
  console.log('✓ Sync tertiary terminé');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
