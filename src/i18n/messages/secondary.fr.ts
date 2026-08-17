import type { MessageCatalog } from '../types';

/** Écrans secondaires — français. */
export const SECONDARY_FR: MessageCatalog = {
  'auth.teaser.homme.0': 'Créez votre profil joueur',
  'auth.teaser.homme.1': 'CV en ligne, stats et Mercato M',
  'auth.teaser.homme.2': 'Email confirmé. Accès à votre espace Man',

  'auth.teaser.woman.0': 'Créez votre profil joueuse',
  'auth.teaser.woman.1': 'CV joueuse, stats et Mercato F',
  'auth.teaser.woman.2': 'Email confirmé. Accès à votre espace Woman',

  'auth.teaser.amateur.0': 'Créez votre profil joueur',
  'auth.teaser.amateur.1': 'CV, Mercato local et matchs',
  'auth.teaser.amateur.2': 'Email confirmé. Accès à votre espace Joueur',

  'auth.teaser.supporter.0': 'Rejoignez la communauté',
  'auth.teaser.supporter.1': 'Matchs, réels et fil communautaire',
  'auth.teaser.supporter.2': 'Email confirmé. Bienvenue en tribune',

  'auth.teaser.pro.0': 'Coach, club, agent, orga ou sponsor',
  'auth.teaser.pro.1': 'Parcours métier adapté à votre rôle',
  'auth.teaser.pro.2': 'Profil vérifié. Accès à votre espace Pro',

  'auth.teaser.pro_player.0': 'Joueur professionnel',
  'auth.teaser.pro_player.1': 'Portfolio, opportunités et convocations',
  'auth.teaser.pro_player.2': 'Profil vérifié. Accès à votre espace Pro Joueur',

  'auth.teaser.pro_club.0': 'Club ou structure',
  'auth.teaser.pro_club.1': 'Effectifs, recrutement et suivi des candidatures',
  'auth.teaser.pro_club.2': 'Profil vérifié. Accès à votre espace Pro Club',

  'auth.teaser.pro_staff.0': 'Coach, agent, recruteur ou organisateur',
  'auth.teaser.pro_staff.1': 'Mandats, scouting et réseau pro',
  'auth.teaser.pro_staff.2': 'Profil vérifié. Accès à votre espace Coach',

  'auth.teaser.sponsor.0': 'Marque ou sponsor',
  'auth.teaser.sponsor.1': 'Campagnes géo, ROI et vitrine clubs vérifiée',
  'auth.teaser.sponsor.2': 'Profil validé. Accès à votre espace Sponsor',

  'auth.teaser.parent.0': 'Compte parent / tuteur',
  'auth.teaser.parent.1': 'Messages, agenda, retards et trajets de l’enfant',
  'auth.teaser.parent.2': 'Lien validé. Accès au Pôle Parent',

  'auth.teaser.sante.0': 'Kinés, médecins et praticiens du sport',
  'auth.teaser.sante.1': 'Agenda, messagerie et visibilité patients',
  'auth.teaser.sante.2': 'Diplôme validé. Accès au pôle Santé',

  'verification.title.player': 'Vérification joueur',
  'verification.title.player.woman': 'Vérification joueuse',
  'verification.progress':
    'Progression {{label}}. Image ou PDF · identité obligatoire pour la messagerie.',
  'verification.check.identity.title': 'Pièce d’identité',
  'verification.check.identity.subtitle': 'CNI ou passeport',
  'verification.check.license.title': 'Licence / carte club',
  'verification.check.license.subtitle': 'Justificatif FFF',
  'verification.status.verified': 'Validé',
  'verification.status.pending': 'En analyse',
  'verification.status.rejected': 'Refusé. Renvoyer',
  'verification.status.todo': 'À envoyer',
  'verification.alert.sent.title': 'Document envoyé',
  'verification.alert.sent.body': 'Analyse en cours. Vous serez notifié du résultat.',
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
  'joinClub.pending.title': 'Demande envoyée',
  'joinClub.pending.body':
    'Votre demande pour rejoindre {{name}} est en attente de validation par le staff du club.',
  'joinClub.pending.current':
    'Demande en attente : {{name}}. Vous pourrez rejoindre un autre club après décision du staff.',
  'joinClub.active.current':
    'Vous êtes déjà affilié à {{name}}. Gérez votre effectif depuis votre espace club.',
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
  'signup.phase.launch': 'Lancement',
  'signup.phase.profile': 'Profil',
  'signup.phase.account': 'Compte',

  'signup.staff.coach':
    'Indiquez où vous exercez. Justificatif analysé par IA avant confirmation email.',
  'signup.staff.agent': 'Zone géographique. Licence pro vérifiée par IA avant l’email.',
  'signup.staff.recruiter':
    'Territoire et spécialité recrutement. Mandat vérifié par IA avant l’email.',
  'signup.staff.organizer':
    'Ville et structure. Justificatif + IA Mistral avant l’email.',
  'signup.staff.club': 'Structure et localisation. Mandat vérifié par IA avant l’email.',
  'signup.staff.physio': 'Spécialité médicale et zone d’intervention pour les sportifs.',
  'signup.staff.default': 'Quelques infos pour personnaliser votre expérience.',

  'signup.access.oauth.title': 'Finaliser l’accès',
  'signup.access.oauth.subtitle': 'Validez votre identité ProDay pour entrer dans l’application.',
  'signup.access.sponsor.title': 'Identifiants sponsor',
  'signup.access.sponsor.subtitle': 'Email, mot de passe et zone. Accès à l’espace sponsors.',
  'signup.access.default.title': 'Sécurisez votre compte',
  'signup.access.default.subtitle': 'Email fort, mot de passe robuste. Puis confirmation par mail.',

  'signup.age.u13.incompatible': 'Âge incompatible avec l’espace -13 (moins de 13 ans).',
  'signup.age.min': 'Âge minimum : 5 ans.',
  'signup.age.youth.range': 'Pour U13 à U19, indiquez un âge entre 13 et 19 ans.',
  'signup.age.senior.min': 'Pour l’espace seniors, l’âge minimum est 16 ans.',

  'signup.launch.emailValidated.title': 'Documents validés',
  'signup.launch.emailValidated.body':
    'L’IA a traité vos justificatifs. Confirmez votre email. Le lien vous attend dans votre boîte mail.',
  'signup.launch.emailValidated.finish': 'Compris',
  'signup.launch.verification.title': 'Compte créé',
  'signup.launch.verification.body':
    'Prochaine étape après l’email : accès à votre espace dédié. Vos documents passent par l’analyse IA.',
  'signup.launch.verification.finish': 'Continuer',

  'signup.man.welcome.title': 'Bienvenue sur {{brand}}',
  'signup.man.welcome.subtitle':
    'Inscription joueur. CV en ligne, Mercato M, matchs et visibilité auprès des clubs.',
  'signup.man.step.space.title': 'Ton espace',
  'signup.man.step.space.subtitle':
    'Garçons, U13, seniors M. Tout le parcours est adapté à ton profil.',
  'signup.man.step.sport.title': 'Ta fiche joueur',
  'signup.man.step.sport.subtitle':
    'Poste, catégorie, niveau et âge. Profil visible sur le Mercato M.',
  'signup.man.step.location.title': 'Où tu joues',
  'signup.man.step.location.subtitle':
    'Ville et département pour les clubs et détections autour de chez toi.',
  'signup.man.step.stats.title': 'Tes stats',
  'signup.man.step.stats.subtitle': 'Matchs, buts, passes. Valorise ton CV foot.',
  'signup.man.step.family.title': 'Responsable légal',
  'signup.man.step.family.subtitle':
    'Obligatoire pour les mineurs. Conformité et sécurité Pro Day Man.',
  'signup.man.step.account.title': 'Ton identité',
  'signup.man.step.account.subtitle':
    'Nom affiché et email. Ton espace Man sera lié à ce compte.',
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
    'Inscription joueuse. CV en ligne, Mercato F, matchs, covoiturage, pôle santé et visibilité auprès des clubs.',
  'signup.woman.step.space.title': 'Ta catégorie',
  'signup.woman.step.space.subtitle':
    'Jeunes F, -13 ans, seniors F. Tout le parcours est adapté à ton profil.',
  'signup.woman.step.sport.title': 'Ta fiche joueuse',
  'signup.woman.step.sport.subtitle':
    'Poste, catégorie F, niveau et âge. Profil visible sur le Mercato Woman.',
  'signup.woman.step.location.title': 'Où tu joues',
  'signup.woman.step.location.subtitle':
    'Ville et département pour les clubs et détections autour de chez toi.',
  'signup.woman.step.stats.title': 'Tes stats',
  'signup.woman.step.stats.subtitle': 'Matchs, buts, passes. Valorise ton profil joueuse.',
  'signup.woman.step.family.title': 'Responsable légal',
  'signup.woman.step.family.subtitle':
    'Obligatoire pour les mineures. Conformité et sécurité ProDay Woman.',
  'signup.woman.step.account.title': 'Ton identité',
  'signup.woman.step.account.subtitle':
    'Nom affiché et email. Ton espace Woman sera lié à ce compte.',
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

  'signup.amateur.phase.profile': 'Profil',
  'signup.amateur.welcome.title': 'Bienvenue sur {{brand}}',
  'signup.amateur.welcome.subtitle':
    'Espace joueur. Mercato local, matchs, CV et progression en club.',
  'signup.amateur.step.space.title': 'Votre genre et votre espace foot',
  'signup.amateur.step.space.subtitle':
    'Genre et catégorie d’âge. Mercato Amateur et matchs adaptés à votre profil.',
  'signup.amateur.step.sport.title': 'Votre fiche joueur',
  'signup.amateur.step.sport.subtitle':
    'Poste, catégorie, niveau et âge. Profil visible sur le Mercato Amateur.',
  'signup.amateur.step.location.title': 'Où vous jouez',
  'signup.amateur.step.location.subtitle':
    'Ville et département pour votre club et les détections locales.',
  'signup.amateur.step.stats.title': 'Vos stats',
  'signup.amateur.step.stats.subtitle':
    'Matchs, buts, passes. Initialisation, puis validées par votre coach.',
  'signup.amateur.step.family.title': 'Responsable légal',
  'signup.amateur.step.family.subtitle':
    'Obligatoire pour les mineurs. Conformité et sécurité Pro Day Amateur.',
  'signup.amateur.step.coach.title': 'Profil coach',
  'signup.amateur.step.coach.subtitle':
    'Club, catégorie et zone. Encadrement district et régional.',
  'signup.amateur.step.account.title': 'Votre identité',
  'signup.amateur.step.account.subtitle':
    'Nom affiché et email. Votre espace Pro Day Amateur sera lié à ce compte.',
  'signup.amateur.step.security.title': 'Sécurisez votre compte',
  'signup.amateur.step.security.subtitle': 'Mot de passe robuste, puis confirmation par email.',
  'signup.amateur.launch.verification.title': 'Compte coach créé',
  'signup.amateur.launch.verification.body':
    'Après confirmation email : accès à votre banc technique. Effectif et convocations.',
  'signup.amateur.launch.player.verification.title': 'Compte joueur créé',
  'signup.amateur.launch.player.verification.body':
    'Après confirmation email : accès à votre cockpit joueur. Mercato Amateur et matchs.',
  'signup.amateur.launch.ready.title': 'Bienvenue coach',
  'signup.amateur.launch.ready.body':
    'Votre espace Pro Day Amateur est prêt. Gérez votre effectif et suivez le Mercato local.',
  'signup.amateur.launch.player.ready.title': 'Bienvenue joueur',
  'signup.amateur.launch.player.ready.body':
    'Votre espace Pro Day Amateur est prêt. CV en ligne, Mercato Amateur et convocations.',

  'signup.supporter.phase.profile': 'Profil',
  'signup.supporter.welcome.title': 'Bienvenue sur {{brand}}',
  'signup.supporter.welcome.subtitle':
    'Fans et communauté. Matchs en direct, réels et fil tribune.',
  'signup.supporter.step.account.title': 'Identité supporter',
  'signup.supporter.step.account.subtitle':
    'Nom affiché et email. Espace Pro Day Supporter lié à ce compte.',
  'signup.supporter.step.security.title': 'Sécuriser l’accès',
  'signup.supporter.step.security.subtitle':
    'Mot de passe robuste pour rejoindre la tribune Pro Day Supporter.',
  'signup.supporter.step.launch.title': 'Tribune activée',
  'signup.supporter.step.launch.subtitle': 'Votre espace Pro Day Supporter est prêt.',
  'signup.supporter.launch.email.title': 'Presque prêt',
  'signup.supporter.launch.email.body':
    'Confirmez votre email pour activer votre espace Pro Day Supporter.',
  'signup.supporter.launch.email.finish': 'Entrer dans Pro Day Supporter',
  'signup.supporter.launch.done.title': 'Bienvenue en tribune',
  'signup.supporter.launch.done.body':
    'Votre tribune est prête. Matchs, réels et fil communautaire.',
  'signup.supporter.launch.done.finish': 'Entrer dans Pro Day Supporter',

  'signup.proPlayer.welcome.title': 'Bienvenue sur {{brand}}',
  'signup.proPlayer.welcome.subtitle':
    'Inscription joueur pro. Carrière, portfolio vidéo et opportunités vérifiées.',
  'signup.proPlayer.step.space.title': 'Votre profil',
  'signup.proPlayer.step.space.subtitle':
    'Homme ou femme. Parcours et visibilité adaptés au foot professionnel.',
  'signup.proPlayer.step.sport.title': 'Votre fiche pro',
  'signup.proPlayer.step.sport.subtitle':
    'Poste, niveau (R1 à N3), licence et mobilité. Profil visible des recruteurs.',
  'signup.proPlayer.step.location.title': 'Votre zone',
  'signup.proPlayer.step.location.subtitle':
    'Ville et département. Opportunités géolocalisées.',
  'signup.proPlayer.step.stats.title': 'Votre saison',
  'signup.proPlayer.step.stats.subtitle':
    'Stats validées coach. Crédibilité auprès des clubs.',
  'signup.proPlayer.step.account.title': 'Votre compte',
  'signup.proPlayer.step.account.subtitle':
    'Email et identité. Accès sécurisé à votre espace Pro Joueur.',
  'signup.proPlayer.step.security.title': 'Sécurité',
  'signup.proPlayer.step.security.subtitle':
    'Mot de passe robuste pour protéger votre profil sportif.',
  'signup.proPlayer.step.launch.title': 'C’est parti',
  'signup.proPlayer.step.launch.subtitle':
    'Votre espace Pro Day Pro Joueur est prêt. Bonne saison.',
  'signup.proPlayer.launch.pending.title': 'Profil en validation',
  'signup.proPlayer.launch.pending.body':
    'Votre espace Pro Day Pro Joueur sera actif après vérification de votre profil.',
  'signup.proPlayer.launch.title': 'Bienvenue Pro Joueur',
  'signup.proPlayer.launch.body':
    'Carrière, portfolio et opportunités pro. Votre saison commence maintenant.',

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
    'Image (JPG, PNG) ou fichier PDF. Vous pouvez explorer l’app. La messagerie s’ouvrira après envoi.',
  'profile.verify.complete': 'Compléter',
  'profile.verify.staff.title': 'Vérification requise',
  'profile.verify.staff.body': 'Envoyez votre diplôme ou licence pour débloquer la messagerie.',
  'profile.verify.track': 'Suivi de vérification',

  'football.categoryGroup.poussins': 'Poussins',
  'football.categoryGroup.jeunes': 'Jeunes',
  'football.categoryGroup.adultes': 'Seniors & adultes',
  'football.categoryGroup.district': 'Échelon district',

  'coach.event.create.title': 'Nouvel événement',
  'coach.event.create.typeKicker': 'Format',
  'coach.event.create.typeTitle': 'Type d\'événement',
  'coach.event.create.infoKicker': 'Détails',
  'coach.event.create.infoTitle': 'Informations',
  'coach.event.create.titlePlaceholder': 'Titre',
  'coach.event.create.datePlaceholder': 'Date (JJ/MM/AAAA)',
  'coach.event.create.timePlaceholder': 'Heure (14:00)',
  'coach.event.create.cityPlaceholder': 'Ville',
  'coach.event.create.locationPlaceholder': 'Lieu (stade, adresse…)',
  'coach.event.create.descriptionPlaceholder': 'Description (optionnel)',
  'coach.event.create.categoriesKicker': 'Effectif',
  'coach.event.create.categoriesDetectionTitle': 'Catégories ciblées',
  'coach.event.create.categoriesConvocTitle': 'Catégories convoquées',
  'coach.event.create.categoriesDetectionHint':
    'Sélectionnez les catégories d\'âge et l\'échelon district si besoin.',
  'coach.event.create.categoriesConvocHintMen':
    'Filtre optionnel : seuls les joueurs correspondants seront convoqués.',
  'coach.event.create.categoriesConvocHintWomen':
    'Filtre optionnel : seules les joueuses correspondantes seront convoquées.',
  'coach.event.create.maxPlacesPlaceholder': 'Places max',
  'coach.event.create.convocKicker': 'Convocation',
  'coach.event.create.convocTitle': 'Qui convoquer ?',
  'coach.event.create.inviteClub': 'Convoquer tout le club',
  'coach.event.create.invitedMen': 'Joueurs convoqués',
  'coach.event.create.invitedWomen': 'Joueuses convoquées',
  'coach.event.create.noClubHint':
    'Liez un club à votre profil pour convoquer automatiquement l\'effectif.',
  'coach.event.create.submit': 'Créer et convoquer',
  'coach.event.create.submitting': 'Création…',
  'coach.event.create.today': 'Aujourd\'hui',
  'coach.event.create.trainingTitleDefault': 'Entraînement · {{team}}',
  'coach.event.create.convokedCountMen': '{{count}} joueur(s) convoqué(s)',
  'coach.event.create.convokedCountWomen': '{{count}} joueuse(s) convoquée(s)',
  'coach.event.create.convokedCountEmptyMen': 'Aucun joueur convoqué pour cette sélection',
  'coach.event.create.convokedCountEmptyWomen': 'Aucune joueuse convoquée pour cette sélection',
};
