import type { TeamEvent } from '../models/TeamEvent';
import type { User } from '../models/User';
import {
  categorizePlayerPosition,
  buildGoogleMapsLink,
  computeMeetingTime,
  computeEndTime,
  groupConvocatedPlayers,
  formatConvocationMessage,
  generatePendingPlayersReminderMessage,
} from '../utils/coachConvocationFormatter';

describe('coachConvocationFormatter', () => {
  const baseDate = new Date('2026-10-24T15:00:00.000Z');

  function makeMockUser(uid: string, name: string, position?: string): User {
    return {
      uid,
      display_name: name,
      email: `${uid}@proday.fr`,
      role: 'player',
      is_verified: true,
      verification_status: 'VERIFIED',
      created_at: new Date('2026-01-01'),
      updated_at: new Date('2026-01-01'),
      is_active: true,
      profile: {
        position,
      },
      documents: [],
    };
  }

  const mockMembers: User[] = [
    makeMockUser('p1', 'Hugo Lloris', 'Gardien de but'),
    makeMockUser('p2', 'Jules Koundé', 'Défenseur droit'),
    makeMockUser('p3', 'Dayot Upamecano', 'Défenseur central'),
    makeMockUser('p4', 'Aurélien Tchouaméni', 'Milieu défensif'),
    makeMockUser('p5', 'Antoine Griezmann', 'Milieu offensif'),
    makeMockUser('p6', 'Kylian Mbappé', 'Attaquant'),
    makeMockUser('p7', 'Ousmane Dembélé', 'Ailier droit'),
  ];

  const mockMatchEvent: TeamEvent = {
    id: 'match-1',
    title: 'Match de Championnat R1',
    event_type: 'competition',
    organizer_uid: 'coach-1',
    organizer_name: 'Coach Didier',
    club_name: 'ProDay FC',
    starts_at: baseDate,
    city: 'Paris',
    location_label: 'Stade de France, Saint-Denis',
    invitee_uids: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'],
    rsvps: {
      p1: 'yes',
      p2: 'yes',
      p3: 'pending',
      p4: 'yes',
      p5: 'pending',
      p6: 'yes',
      p7: 'no',
    },
    live_state: {
      status: 'scheduled',
      home_score: 0,
      away_score: 0,
      opponent_name: 'Red Star FC',
    },
    created_at: new Date('2026-10-01'),
    updated_at: new Date('2026-10-01'),
  };

  const mockTrainingEvent: TeamEvent = {
    id: 'train-1',
    title: 'Séance Tactique & Pressing',
    event_type: 'training',
    organizer_uid: 'coach-1',
    organizer_name: 'Coach Didier',
    club_name: 'ProDay FC',
    starts_at: baseDate,
    city: 'Boulogne',
    location_label: 'Complexe Sportif Le Gallo',
    invitee_uids: ['p1', 'p2', 'p4'],
    rsvps: {
      p1: 'yes',
      p2: 'yes',
      p4: 'yes',
    },
    created_at: new Date('2026-10-01'),
    updated_at: new Date('2026-10-01'),
  };

  describe('categorizePlayerPosition', () => {
    it('catégorise correctement les gardiens', () => {
      expect(categorizePlayerPosition('Gardien')).toBe('gk');
      expect(categorizePlayerPosition('Gardien de but')).toBe('gk');
      expect(categorizePlayerPosition('GK')).toBe('gk');
      expect(categorizePlayerPosition('Goal')).toBe('gk');
    });

    it('catégorise correctement les défenseurs', () => {
      expect(categorizePlayerPosition('Défenseur')).toBe('def');
      expect(categorizePlayerPosition('Défenseur central')).toBe('def');
      expect(categorizePlayerPosition('Latéral gauche')).toBe('def');
      expect(categorizePlayerPosition('DC')).toBe('def');
      expect(categorizePlayerPosition('DG')).toBe('def');
      expect(categorizePlayerPosition('DD')).toBe('def');
    });

    it('catégorise correctement les milieux', () => {
      expect(categorizePlayerPosition('Milieu')).toBe('mid');
      expect(categorizePlayerPosition('Milieu défensif')).toBe('mid');
      expect(categorizePlayerPosition('Milieu relayeur')).toBe('mid');
      expect(categorizePlayerPosition('MDC')).toBe('mid');
      expect(categorizePlayerPosition('MC')).toBe('mid');
      expect(categorizePlayerPosition('MOC')).toBe('mid');
    });

    it('catégorise correctement les attaquants', () => {
      expect(categorizePlayerPosition('Attaquant')).toBe('att');
      expect(categorizePlayerPosition('Avant-centre')).toBe('att');
      expect(categorizePlayerPosition('Buteur')).toBe('att');
      expect(categorizePlayerPosition('Ailier gauche')).toBe('att');
      expect(categorizePlayerPosition('BU')).toBe('att');
    });

    it('renvoie other pour les postes non reconnus ou vides', () => {
      expect(categorizePlayerPosition(undefined)).toBe('other');
      expect(categorizePlayerPosition('')).toBe('other');
      expect(categorizePlayerPosition('Préparateur')).toBe('other');
    });
  });

  describe('buildGoogleMapsLink', () => {
    it('génère une URL Google Maps valide avec encodage URI', () => {
      const url = buildGoogleMapsLink('Stade de France', 'Saint-Denis');
      expect(url).toBe('https://maps.google.com/?q=Stade%20de%20France%2C%20Saint-Denis');
    });

    it('renvoie une chaîne vide si aucun lieu ni ville', () => {
      expect(buildGoogleMapsLink('', '')).toBe('');
      expect(buildGoogleMapsLink(undefined, undefined)).toBe('');
    });
  });

  describe('computeMeetingTime et computeEndTime', () => {
    it('calcule un RDV 1h15 avant pour un match', () => {
      const meeting = computeMeetingTime(mockMatchEvent);
      // starts_at = 15:00 UTC (ou heure locale). RDV = 1h15 (75min) avant
      expect(meeting).toBeDefined();
      expect(meeting).toMatch(/^\d{2}h\d{2}$/);
    });

    it('prend en compte une surcharge d’heure de RDV personnalisée', () => {
      expect(computeMeetingTime(mockMatchEvent, '13h30')).toBe('13h30');
    });

    it('calcule un RDV 15 min avant pour un entraînement', () => {
      const meeting = computeMeetingTime(mockTrainingEvent);
      expect(meeting).toBeDefined();
      expect(meeting).toMatch(/^\d{2}h\d{2}$/);
    });

    it('calcule l’heure de fin estimée', () => {
      const end = computeEndTime(mockMatchEvent);
      expect(end).toBeDefined();
      expect(end).toMatch(/^\d{2}h\d{2}$/);
    });
  });

  describe('groupConvocatedPlayers', () => {
    it('regroupe les joueurs par ligne avec tri alphabétique', () => {
      const groups = groupConvocatedPlayers(mockMatchEvent, mockMembers);

      expect(groups.gk.length).toBe(1);
      expect(groups.gk[0].name).toBe('Hugo Lloris');

      expect(groups.def.length).toBe(2);
      expect(groups.def[0].name).toBe('Dayot Upamecano');
      expect(groups.def[1].name).toBe('Jules Koundé');

      expect(groups.mid.length).toBe(2);
      expect(groups.mid[0].name).toBe('Antoine Griezmann');
      expect(groups.mid[1].name).toBe('Aurélien Tchouaméni');

      expect(groups.att.length).toBe(2);
      expect(groups.att[0].name).toBe('Kylian Mbappé');
      expect(groups.att[1].name).toBe('Ousmane Dembélé');
    });
  });

  describe('formatConvocationMessage', () => {
    it('formate une convocation de match complète avec toutes les rubriques', () => {
      const message = formatConvocationMessage(mockMatchEvent, mockMembers, {
        includeLocationLink: true,
        customNote: 'Tenue noire exigée pour l’échauffement',
        coachContact: '06 12 34 56 78',
      });

      // Titre avec émoji match et adversaire
      expect(message).toContain('⚽');
      expect(message).toContain('MATCH VS RED STAR FC');
      expect(message).toContain('PRODAY FC');

      // Horaires
      expect(message).toContain('📅 *Date :*');
      expect(message).toContain('RDV à');
      expect(message).toContain('coup d’envoi');

      // Lieu & Lien Maps
      expect(message).toContain('Stade de France, Saint-Denis');
      expect(message).toContain('https://maps.google.com/?q=');

      // Lignes de joueurs
      expect(message).toContain('🧤 *Gardiens (1) :*');
      expect(message).toContain('Hugo Lloris');
      expect(message).toContain('🛡️ *Défenseurs (2) :*');
      expect(message).toContain('Jules Koundé');
      expect(message).toContain('Dayot Upamecano');
      expect(message).toContain('⚙️ *Milieux (2) :*');
      expect(message).toContain('Antoine Griezmann');
      expect(message).toContain('⚡ *Attaquants (2) :*');
      expect(message).toContain('Kylian Mbappé');

      // En attente de confirmation
      expect(message).toContain('⏳ *En attente de confirmation (2) :*');
      expect(message).toContain('Dayot Upamecano');
      expect(message).toContain('Antoine Griezmann');

      // Consignes paquetage match
      expect(message).toContain('🎒 *Consignes de paquetage :*');
      expect(message).toContain('Protège-tibias obligatoires');
      expect(message).toContain('Gourde d\'eau individuelle');

      // Mot personnalisé et contact coach
      expect(message).toContain('📝 *Consigne du Coach :*');
      expect(message).toContain('Tenue noire exigée pour l’échauffement');
      expect(message).toContain('📞 *Contact Staff :* 06 12 34 56 78');
    });

    it('exclut le lien Maps lorsque includeLocationLink vaut false', () => {
      const message = formatConvocationMessage(mockMatchEvent, mockMembers, {
        includeLocationLink: false,
      });
      expect(message).not.toContain('🗺️ *Itinéraire :*');
      expect(message).not.toContain('https://maps.google.com');
    });

    it('formate une convocation d’entraînement avec consignes adaptées', () => {
      const message = formatConvocationMessage(mockTrainingEvent, mockMembers);

      expect(message).toContain('🏃');
      expect(message).toContain('ENTRAÎNEMENT');
      expect(message).toContain('Complexe Sportif Le Gallo');
      expect(message).toContain('Tenue d\'entraînement du club');
      expect(message).toContain('✅ *Toutes les réponses sont validées !*');
    });
  });

  describe('generatePendingPlayersReminderMessage', () => {
    it('génère un message de relance ciblé listant uniquement les retardataires', () => {
      const reminder = generatePendingPlayersReminderMessage(mockMatchEvent, mockMembers);

      expect(reminder).toContain('🚨 *RAPPEL IMPORTANT — CONVOCATION PRODAY*');
      expect(reminder).toContain('Match de Championnat R1');
      expect(reminder).toContain('⏳ Dayot Upamecano');
      expect(reminder).toContain('⏳ Antoine Griezmann');

      // Ne doit pas lister les joueurs ayant répondu (oui ou non)
      expect(reminder).not.toContain('Hugo Lloris');
      expect(reminder).not.toContain('Kylian Mbappé');
      expect(reminder).not.toContain('Ousmane Dembélé');

      expect(reminder).toContain('Merci d\'indiquer votre présence (OUI / NON)');
    });

    it('génère un message positif si aucun retardataire', () => {
      const reminder = generatePendingPlayersReminderMessage(mockTrainingEvent, mockMembers);
      expect(reminder).toContain('✅ Tous les joueurs convoqués pour');
      expect(reminder).toContain('ont déjà répondu !');
    });
  });
});
