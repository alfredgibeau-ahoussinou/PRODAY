import type { MessageCatalog } from '../types';

/** Écrans secondaires — français. */
export const SECONDARY_FR: MessageCatalog = {
  'auth.teaser.homme.0': 'Inscription joueur uniquement',
  'auth.teaser.homme.1': 'Espace M, fiche sportive et stats',
  'auth.teaser.homme.2': 'Email confirmé puis accès au Mercato M',
  'auth.teaser.woman.0': 'Inscription joueuse uniquement',
  'auth.teaser.woman.1': 'Catégorie F, fiche et stats',
  'auth.teaser.woman.2': 'Email confirmé puis accès au Mercato F',
  'auth.teaser.pro.0': 'Coach, club, agent, orga ou sponsor',
  'auth.teaser.pro.1': 'Parcours métier dédié à votre rôle',
  'auth.teaser.pro.2': 'Validation pro puis accès à l’écosystème',
  'auth.teaser.sante.0': 'Kinés, médecins et praticiens du sport',
  'auth.teaser.sante.1': 'Agenda, messagerie et visibilité patients',
  'auth.teaser.sante.2': 'Validation pro puis accès au pôle Santé',

  'verification.title.player': 'Vérification joueur',
  'verification.title.player.woman': 'Vérification joueuse',
  'verification.progress':
    'Progression {{label}} — image ou PDF · identité obligatoire pour la messagerie.',
  'verification.check.identity.title': 'Pièce d’identité',
  'verification.check.identity.subtitle': 'CNI ou passeport',
  'verification.check.license.title': 'Licence / carte club',
  'verification.check.license.subtitle': 'Justificatif FFF',
  'verification.status.verified': 'Validé',
  'verification.status.pending': 'En analyse',
  'verification.status.rejected': 'Refusé — renvoyer',
  'verification.status.todo': 'À envoyer',
  'verification.alert.sent.title': 'Document envoyé',
  'verification.alert.sent.body': 'Analyse en cours — vous serez notifié du résultat.',
  'verification.upload.image': 'Image',
  'verification.upload.pdf': 'PDF',
  'verification.upload.sending': 'Envoi…',
  'verification.upload.failed': 'Envoi impossible',

  'onboarding.title': 'Vérification',
  'onboarding.camera': 'Caméra',
  'onboarding.gallery': 'Galerie',
  'onboarding.staff.subtitle': 'Diplôme, carte pro ou attestation · JPG, PNG ou PDF',
  'onboarding.alert.sent.title': 'Document envoyé',
  'onboarding.alert.sent.body':
    'Votre dossier est en cours d’analyse. La messagerie s’ouvrira après validation.',
  'onboarding.error.send': 'Envoi impossible. Réessayez.',

  'joinClub.title': 'Rejoindre un club',
  'joinClub.hint': 'Recherchez votre structure pour accéder aux convocations et aux présences.',
  'joinClub.search': 'Nom ou ville…',
  'joinClub.empty': 'Aucun club trouvé. Créez le vôtre depuis le profil.',
  'joinClub.confirm.title': 'Rejoindre le club',
  'joinClub.confirm.body': 'Associer votre profil à {{name}} ?',
  'joinClub.confirm.join': 'Rejoindre',
  'joinClub.success.title': 'Club rejoint',
  'joinClub.success.body': 'Vous êtes maintenant membre de {{name}}.',
  'joinClub.error.join': 'Impossible de rejoindre ce club.',

  'messages.verifyDiploma': 'Validez votre diplôme ou licence pour envoyer des messages.',
  'messages.unavailable': 'Messagerie indisponible.',
  'messages.favoritesError': 'Impossible de mettre à jour les favoris.',

  'signup.defaultLabel': 'Inscription',
  'signup.page.welcome': 'Bienvenue',
  'signup.page.space': 'Espace',
  'signup.page.sport': 'Sport',
  'signup.page.location': 'Ville',
  'signup.page.stats': 'Stats',
  'signup.page.staff': 'Profil pro',
  'signup.page.coach_pro': 'Coach',
  'signup.page.club_pro': 'Club',
  'signup.page.agent_pro': 'Agent',
  'signup.page.recruiter_pro': 'Recruteur',
  'signup.page.organizer_pro': 'Orga',
  'signup.page.medical_specialty': 'Spécialité',
  'signup.page.medical_practice': 'Cabinet',
  'signup.page.sponsor_pro': 'Sponsor',
  'signup.page.family': 'Famille',
  'signup.page.account': 'Identité',
  'signup.page.security': 'Sécurité',
  'signup.page.launch': 'Lancement',
  'signup.phase.vous': 'Vous',
  'signup.phase.acces': 'Accès',
  'signup.phase.launch': 'Go',
  'signup.phase.profile': 'Profil',
  'signup.phase.account': 'Compte',

  'signup.staff.coach':
    'Indiquez où vous exercez — justificatif analysé par IA avant confirmation email.',
  'signup.staff.agent': 'Zone géographique — licence pro vérifiée par IA avant l’email.',
  'signup.staff.recruiter':
    'Territoire et spécialité recrutement — mandat vérifié par IA avant l’email.',
  'signup.staff.organizer':
    'Ville et structure — justificatif + IA Mistral avant l’email.',
  'signup.staff.club': 'Structure et localisation — mandat vérifié par IA avant l’email.',
  'signup.staff.physio': 'Spécialité médicale et zone d’intervention pour les sportifs.',
  'signup.staff.default': 'Quelques infos pour personnaliser votre expérience.',

  'signup.access.oauth.title': 'Finaliser l’accès',
  'signup.access.oauth.subtitle': 'Validez votre identité ProDay pour entrer dans l’application.',
  'signup.access.sponsor.title': 'Identifiants sponsor',
  'signup.access.sponsor.subtitle': 'Email, mot de passe et zone — accès à l’espace sponsors.',
  'signup.access.default.title': 'Sécurisez votre compte',
  'signup.access.default.subtitle': 'Email fort, mot de passe robuste — puis confirmation par mail.',

  'signup.age.u13.incompatible': 'Âge incompatible avec l’espace -13 (moins de 13 ans).',
  'signup.age.min': 'Âge minimum : 5 ans.',
  'signup.age.youth.range': 'Pour U13–U19, indiquez un âge entre 13 et 19 ans.',
  'signup.age.senior.min': 'Pour l’espace seniors, l’âge minimum est 16 ans.',

  'signup.launch.emailValidated.title': 'Documents validés',
  'signup.launch.emailValidated.body':
    'L’IA a traité vos justificatifs. Confirmez votre email — le lien vous attend dans votre boîte mail.',
  'signup.launch.emailValidated.finish': 'Compris',
  'signup.launch.verification.title': 'Compte créé',
  'signup.launch.verification.body':
    'Prochaine étape après l’email : accès à votre espace dédié. Vos documents passent par l’analyse IA.',
  'signup.launch.verification.finish': 'Continuer',

  'signup.man.welcome.title': 'Bienvenue sur {{brand}}',
  'signup.man.welcome.subtitle':
    'Inscription joueur — CV en ligne, Mercato M, matchs et visibilité auprès des clubs.',
  'signup.man.step.space.title': 'Ton espace',
  'signup.man.step.space.subtitle':
    'Garçons, U13, seniors M — tout le parcours est adapté à ton profil.',
  'signup.man.step.sport.title': 'Ta fiche joueur',
  'signup.man.step.sport.subtitle':
    'Poste, catégorie, niveau et âge — profil visible sur le Mercato M.',
  'signup.man.step.location.title': 'Où tu joues',
  'signup.man.step.location.subtitle':
    'Ville et département pour les clubs et détections autour de chez toi.',
  'signup.man.step.stats.title': 'Tes stats',
  'signup.man.step.stats.subtitle': 'Matchs, buts, passes — valorise ton CV foot.',
  'signup.man.step.family.title': 'Responsable légal',
  'signup.man.step.family.subtitle':
    'Obligatoire pour les mineurs — conformité et sécurité Pro Day Man.',
  'signup.man.step.account.title': 'Ton identité',
  'signup.man.step.account.subtitle':
    'Nom affiché et email — ton espace Man sera lié à ce compte.',
  'signup.man.step.security.title': 'Sécurise ton compte',
  'signup.man.step.security.subtitle': 'Mot de passe robuste, puis confirmation par email.',
  'signup.man.step.launch.title': 'Bienvenue dans Man',
  'signup.man.step.launch.subtitle': 'Ton compte est prêt.',
  'signup.man.launch.email.title': 'Presque prêt',
  'signup.man.launch.email.body':
    'Confirme ton email pour accéder au Mercato M, aux matchs et à ta messagerie.',
  'signup.man.launch.email.finish': 'Entrer dans Pro Day Man',
  'signup.man.launch.done.title': 'Compte Pro Day Man créé',
  'signup.man.launch.done.body':
    'Depuis ton profil, envoie ta pièce d’identité pour débloquer la navigation et la messagerie.',
  'signup.man.launch.done.finish': 'Aller à mon profil',

  'signup.woman.welcome.title': 'Bienvenue sur {{brand}}',
  'signup.woman.welcome.subtitle':
    'Inscription joueuse — CV en ligne, Mercato F, matchs, covoiturage, pôle santé et visibilité auprès des clubs.',
  'signup.woman.step.space.title': 'Ta catégorie',
  'signup.woman.step.space.subtitle':
    'Jeunes F, -13 ans, seniors F — tout le parcours est adapté à ton profil.',
  'signup.woman.step.sport.title': 'Ta fiche joueuse',
  'signup.woman.step.sport.subtitle':
    'Poste, catégorie F, niveau et âge — profil visible sur le Mercato Woman.',
  'signup.woman.step.location.title': 'Où tu joues',
  'signup.woman.step.location.subtitle':
    'Ville et département pour les clubs et détections autour de chez toi.',
  'signup.woman.step.stats.title': 'Tes stats',
  'signup.woman.step.stats.subtitle': 'Matchs, buts, passes — valorise ton profil joueuse.',
  'signup.woman.step.family.title': 'Responsable légal',
  'signup.woman.step.family.subtitle':
    'Obligatoire pour les mineures — conformité et sécurité ProDay Woman.',
  'signup.woman.step.account.title': 'Ton identité',
  'signup.woman.step.account.subtitle':
    'Nom affiché et email — ton espace Woman sera lié à ce compte.',
  'signup.woman.step.security.title': 'Sécurise ton compte',
  'signup.woman.step.security.subtitle': 'Mot de passe robuste, puis confirmation par email.',
  'signup.woman.step.launch.title': 'Bienvenue dans Woman',
  'signup.woman.step.launch.subtitle': 'Ton compte est prêt.',
  'signup.woman.launch.email.title': 'Presque prête',
  'signup.woman.launch.email.body':
    'Confirme ton email pour accéder au Mercato Woman, aux matchs et à ta messagerie.',
  'signup.woman.launch.email.finish': 'Entrer dans ProDay Woman',
  'signup.woman.launch.done.title': 'Compte ProDay Woman créé',
  'signup.woman.launch.done.body':
    'Explore le Mercato féminin, tes matchs et ton profil joueuse dès maintenant.',
  'signup.woman.launch.done.finish': 'Entrer dans ProDay Woman',

  'profile.verify.title': 'Vérification',
  'profile.verify.documentsRequired': 'Documents requis',
  'profile.verify.sendDocuments': 'Envoyez vos documents',
  'profile.verify.staffSubtitle': 'Documents et badge de confiance',
  'profile.verify.playerReminderTitle': 'Vérification ({{label}})',
  'profile.verify.playerReminderBody':
    'Pièce d\'identité pour la messagerie. Licence club pour le badge complet.',
  'profile.verify.identityHint':
    'Pièce d\'identité pour la messagerie. Licence club pour le badge complet.',
  'profile.verify.player.body':
    'Image (JPG, PNG) ou fichier PDF. Vous pouvez explorer l’app — la messagerie s’ouvrira après envoi.',
  'profile.verify.complete': 'Compléter',
  'profile.verify.staff.title': 'Vérification requise',
  'profile.verify.staff.body': 'Envoyez votre diplôme ou licence pour débloquer la messagerie.',
  'profile.verify.track': 'Suivi de vérification',
};
