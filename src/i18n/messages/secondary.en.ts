import type { MessageCatalog } from '../types';

/** Secondary screens — English source. */
export const SECONDARY_EN: MessageCatalog = {
  'auth.teaser.homme.0': 'Player signup only',
  'auth.teaser.homme.1': 'Man space, sports profile and stats',
  'auth.teaser.homme.2': 'Confirmed email then access to Mercato M',
  'auth.teaser.woman.0': 'Player signup only',
  'auth.teaser.woman.1': 'Women\'s category, profile and stats',
  'auth.teaser.woman.2': 'Confirmed email then access to Mercato F',
  'auth.teaser.pro.0': 'Coach, club, agent, organizer or partner',
  'auth.teaser.pro.1': 'Career path tailored to your role',
  'auth.teaser.pro.2': 'Pro validation then access to the ecosystem',
  'auth.teaser.sponsor.0': 'Brand / sponsor signup only',
  'auth.teaser.sponsor.1': 'Geo campaigns, ROI and verified club showcase',
  'auth.teaser.sponsor.2': 'Validated profile — access your Sponsor space',
  'auth.teaser.sante.0': 'Physios, doctors and sports practitioners',
  'auth.teaser.sante.1': 'Agenda, messaging and patient visibility',
  'auth.teaser.sante.2': 'Pro validation then access to the Health hub',

  'verification.title.player': 'Player verification',
  'verification.title.player.woman': 'Player verification',
  'verification.progress': 'Progress {{label}} — image or PDF · identity required for messaging.',
  'verification.check.identity.title': 'ID document',
  'verification.check.identity.u13Subtitle': 'Guardian ID or family record — photograph with camera',
  'verification.check.identity.subtitle': 'National ID or passport',
  'signup.launch.staff.email.body': 'Confirm your email to unlock your personalized space.',
  'verification.check.license.title': 'Club licence / card',
  'verification.check.license.subtitle': 'FFF proof',
  'verification.status.verified': 'Verified',
  'verification.status.pending': 'Under review',
  'verification.status.rejected': 'Rejected — resubmit',
  'verification.status.todo': 'To submit',
  'verification.alert.sent.title': 'Document sent',
  'verification.alert.sent.body': 'Review in progress — you will be notified of the result.',
  'verification.upload.image': 'Image',
  'verification.upload.pdf': 'PDF',
  'verification.upload.sending': 'Sending…',
  'verification.upload.failed': 'Upload failed',

  'onboarding.title': 'Verification',
  'onboarding.camera': 'Camera',
  'onboarding.gallery': 'Gallery',
  'onboarding.staff.subtitle': 'Diploma, pro card or certificate · JPG, PNG or PDF',
  'onboarding.alert.sent.title': 'Document sent',
  'onboarding.alert.sent.body':
    'Your file is under review. Messaging will open after validation.',
  'onboarding.error.send': 'Upload failed. Try again.',

  'joinClub.title': 'Join a club',
  'joinClub.hint': 'Search your club to access call-ups and attendance.',
  'joinClub.search': 'Name or city…',
  'joinClub.empty': 'No club found. Create yours from your profile.',
  'joinClub.confirm.title': 'Join club',
  'joinClub.confirm.body': 'Link your profile to {{name}}?',
  'joinClub.confirm.join': 'Join',
  'joinClub.success.title': 'Club joined',
  'joinClub.success.body': 'You are now a member of {{name}}.',
  'joinClub.pending.title': 'Request sent',
  'joinClub.pending.body':
    'Your request to join {{name}} is pending validation by club staff.',
  'joinClub.pending.current':
    'Pending request: {{name}}. You can request another club after staff decision.',
  'joinClub.active.current':
    'You are already linked to {{name}}. Manage your roster from your club space.',
  'joinClub.error.join': 'Could not join this club.',

  'messages.verifyDiploma': 'Validate your diploma or licence to send messages.',
  'messages.unavailable': 'Messaging unavailable.',
  'messages.favoritesError': 'Could not update favorites.',

  'signup.defaultLabel': 'Sign up',
  'signup.page.welcome': 'Welcome',
  'signup.page.space': 'Space',
  'signup.page.sport': 'Sport',
  'signup.page.location': 'City',
  'signup.page.stats': 'Stats',
  'signup.page.staff': 'Pro profile',
  'signup.page.coach_pro': 'Coach',
  'signup.page.club_pro': 'Club',
  'signup.page.agent_pro': 'Agent',
  'signup.page.recruiter_pro': 'Recruiter',
  'signup.page.organizer_pro': 'Organizer',
  'signup.page.medical_specialty': 'Specialty',
  'signup.page.medical_practice': 'Practice',
  'signup.page.sponsor_pro': 'Sponsor',
  'signup.page.family': 'Family',
  'signup.page.account': 'Identity',
  'signup.page.security': 'Security',
  'signup.page.launch': 'Launch',
  'signup.phase.vous': 'You',
  'signup.phase.acces': 'Access',
  'signup.phase.launch': 'Go',
  'signup.phase.profile': 'Profile',
  'signup.phase.account': 'Account',

  'signup.staff.coach':
    'Where you work — proof reviewed by AI before email confirmation.',
  'signup.staff.agent': 'Geographic area — pro licence verified by AI before email.',
  'signup.staff.recruiter':
    'Territory and recruiting specialty — mandate verified by AI before email.',
  'signup.staff.organizer':
    'City and structure — proof + AI review before email.',
  'signup.staff.club': 'Structure and location — mandate verified by AI before email.',
  'signup.staff.physio': 'Medical specialty and area for athletes.',
  'signup.staff.default': 'A few details to personalize your experience.',

  'signup.access.oauth.title': 'Finalize access',
  'signup.access.oauth.subtitle': 'Confirm your ProDay identity to enter the app.',
  'signup.access.sponsor.title': 'Sponsor credentials',
  'signup.access.sponsor.subtitle': 'Email, password and area — sponsor space access.',
  'signup.access.default.title': 'Secure your account',
  'signup.access.default.subtitle': 'Strong email and password — then email confirmation.',

  'signup.age.u13.incompatible': 'Age incompatible with under-13 space (must be under 13).',
  'signup.age.min': 'Minimum age: 5 years.',
  'signup.age.youth.range': 'For U13–U19, enter an age between 13 and 19.',
  'signup.age.senior.min': 'For senior space, minimum age is 16.',

  'signup.launch.emailValidated.title': 'Documents validated',
  'signup.launch.emailValidated.body':
    'AI processed your files. Confirm your email — the link is in your inbox.',
  'signup.launch.emailValidated.finish': 'Got it',
  'signup.launch.verification.title': 'Account created',
  'signup.launch.verification.body':
    'Next step after email: access your dedicated space. Your documents go through AI review.',
  'signup.launch.verification.finish': 'Continue',

  'signup.man.welcome.title': 'Welcome to {{brand}}',
  'signup.man.welcome.subtitle':
    'Player signup — online CV, Mercato M, matches and visibility with clubs.',
  'signup.man.step.space.title': 'Your space',
  'signup.man.step.space.subtitle':
    'Boys, U13, senior M — the whole path fits your profile.',
  'signup.man.step.sport.title': 'Your player profile',
  'signup.man.step.sport.subtitle':
    'Position, category, level and age — profile visible on Mercato M.',
  'signup.man.step.location.title': 'Where you play',
  'signup.man.step.location.subtitle':
    'City and department for clubs and trials near you.',
  'signup.man.step.stats.title': 'Your stats',
  'signup.man.step.stats.subtitle': 'Matches, goals, assists — boost your football CV.',
  'signup.man.step.family.title': 'Legal guardian',
  'signup.man.step.family.subtitle':
    'Required for minors — Pro Day Man compliance and safety.',
  'signup.man.step.account.title': 'Your identity',
  'signup.man.step.account.subtitle':
    'Display name and email — your Man space will be linked to this account.',
  'signup.man.step.security.title': 'Secure your account',
  'signup.man.step.security.subtitle': 'Strong password, then email confirmation.',
  'signup.man.step.launch.title': 'Welcome to Man',
  'signup.man.step.launch.subtitle': 'Your account is ready.',
  'signup.man.launch.email.title': 'Almost ready',
  'signup.man.launch.email.body':
    'Confirm your email to access Mercato M, matches and messaging.',
  'signup.man.launch.email.finish': 'Enter Pro Day Man',
  'signup.man.launch.done.title': 'Pro Day Man account created',
  'signup.man.launch.done.body':
    'From your profile, send your ID to unlock navigation and messaging.',
  'signup.man.launch.done.finish': 'Go to my profile',

  'signup.woman.welcome.title': 'Welcome to {{brand}}',
  'signup.woman.welcome.subtitle':
    'Player signup — online CV, Mercato F, matches, carpool, health hub and club visibility.',
  'signup.woman.step.space.title': 'Your category',
  'signup.woman.step.space.subtitle':
    'Girls F, under-13, senior F — the whole path fits your profile.',
  'signup.woman.step.sport.title': 'Your player profile',
  'signup.woman.step.sport.subtitle':
    'Position, women\'s category, level and age — visible on Mercato Woman.',
  'signup.woman.step.location.title': 'Where you play',
  'signup.woman.step.location.subtitle':
    'City and department for clubs and trials near you.',
  'signup.woman.step.stats.title': 'Your stats',
  'signup.woman.step.stats.subtitle': 'Matches, goals, assists — showcase your player profile.',
  'signup.woman.step.family.title': 'Legal guardian',
  'signup.woman.step.family.subtitle':
    'Required for minors — ProDay Woman compliance and safety.',
  'signup.woman.step.account.title': 'Your identity',
  'signup.woman.step.account.subtitle':
    'Display name and email — your Woman space will be linked to this account.',
  'signup.woman.step.security.title': 'Secure your account',
  'signup.woman.step.security.subtitle': 'Strong password, then email confirmation.',
  'signup.woman.step.launch.title': 'Welcome to Woman',
  'signup.woman.step.launch.subtitle': 'Your account is ready.',
  'signup.woman.launch.email.title': 'Almost ready',
  'signup.woman.launch.email.body':
    'Confirm your email to access Mercato Woman, matches and messaging.',
  'signup.woman.launch.email.finish': 'Enter ProDay Woman',
  'signup.woman.launch.done.title': 'ProDay Woman account created',
  'signup.woman.launch.done.body':
    'Explore women\'s Mercato, your matches and player profile now.',
  'signup.woman.launch.done.finish': 'Enter ProDay Woman',

  'profile.verify.title': 'Verification',
  'profile.verify.documentsRequired': 'Documents required',
  'profile.verify.sendDocuments': 'Send your documents',
  'profile.verify.staffSubtitle': 'Documents and trust badge',
  'profile.verify.playerReminderTitle': 'Verification ({{label}})',
  'profile.verify.playerReminderBody':
    'ID for messaging. Club licence for the full badge.',
  'profile.verify.identityHint':
    'ID document for messaging. Club licence for the full badge.',
  'profile.verify.player.body':
    'Image (JPG, PNG) or PDF. Explore the app — messaging opens after upload.',
  'profile.verify.complete': 'Complete',
  'profile.verify.staff.title': 'Verification required',
  'profile.verify.staff.body': 'Send your diploma or licence to unlock messaging.',
  'profile.verify.track': 'Verification status',
};
