/**
 * Garde-fou statique sur le contrat des règles Firestore du module financier.
 *
 * Ces règles ne sont pas exécutées par les tests (aucun émulateur n'est disponible dans le
 * projet). Ce fichier ne prouve donc **pas** qu'elles s'exécutent correctement : il empêche
 * qu'on retire silencieusement une garde en modifiant le fichier. C'est un niveau de preuve
 * « inspection de code », pas « test d'intégration » — et il est nommé comme tel.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const RULES = readFileSync(join(__dirname, '../../firebase/firestore.rules'), 'utf8');
const STORAGE_RULES = readFileSync(join(__dirname, '../../firebase/storage.rules'), 'utf8');

describe('collections financières déclarées', () => {
  it('déclare les échéances de cotisation et le budget', () => {
    expect(RULES).toContain('match /club_fees/{feeId}');
    expect(RULES).toContain('match /club_budgets/{lineId}');
  });

  it('rattache l’identifiant déterministe au club et à la saison', () => {
    // Sans ce contrôle, un identifiant mal formé créerait deux échéances pour la même
    // personne — donc un « dû » compté deux fois.
    expect(RULES).toMatch(/feeId\.split\('__'\)\[0\] == request\.resource\.data\.club_id/);
    expect(RULES).toMatch(/feeId\.split\('__'\)\[1\] == request\.resource\.data\.season/);
    expect(RULES).toMatch(/lineId\.split\('__'\)\[0\] == d\.club_id/);
  });
});

describe('provenance des paiements', () => {
  it('exige la valeur `manual` à la création d’une écriture', () => {
    expect(RULES).toContain("request.resource.data.payment_provenance == 'manual'");
  });

  it('interdit de changer la provenance après création', () => {
    expect(RULES).toContain("request.resource.data.get('payment_provenance', 'manual') == 'manual'");
  });

  it('n’expose aucune valeur « confirmé par un prestataire »', () => {
    expect(RULES).not.toContain('provider_confirmed');
    expect(RULES).not.toContain('bank_confirmed');
  });
});

describe('périmètre financier', () => {
  it('n’accorde pas l’accès financier au rôle coach', () => {
    // Le rôle coach gère les séances, pas les cotisations nominatives des familles.
    const block = RULES.slice(
      RULES.indexOf('function canManageClubFinance'),
      RULES.indexOf('function validClubSeason'),
    );
    expect(block).toContain("== 'club'");
    expect(block).not.toContain("'coach'");
  });

  it('protège les trois collections financières par ce périmètre', () => {
    for (const collection of ['club_finance_entries', 'club_fees', 'club_budgets']) {
      const start = RULES.indexOf(`match /${collection}/`);
      expect(start).toBeGreaterThan(-1);
      const next = RULES.indexOf('match /', start + 10);
      const block = RULES.slice(start, next === -1 ? undefined : next);
      expect(block).toContain('canManageClubFinance');
      expect(block).not.toContain('isClubStaffForClub');
    }
  });
});

describe('RSVP joueur sur team_events', () => {
  it('n’exige jamais un champ absent des documents (missing key = erreur de règle)', () => {
    // Un accès direct `resource.data.X` sur une clé absente lève une erreur dans
    // les règles : la branche invité exigeait `match_report_finalized_at == null`
    // alors que le service ne crée jamais ce champ → tout RSVP joueur était
    // refusé (`Missing or insufficient permissions`). Le pattern `.get(X, null)`
    // est l’écriture sûre.
    const teamEventsBlock = RULES.slice(
      RULES.indexOf('match /team_events/{eventId}'),
      RULES.indexOf('match /carpool_offers/{offerId}'),
    );
    expect(teamEventsBlock).toContain("resource.data.get('match_report_finalized_at', null) == null");
    expect(teamEventsBlock).not.toMatch(/resource\.data\.match_report_finalized_at\s*==/);
  });

  it('autorise l’invité à écrire uniquement RSVP, notes et liste d’invités', () => {
    const teamEventsBlock = RULES.slice(
      RULES.indexOf('match /team_events/{eventId}'),
      RULES.indexOf('match /carpool_offers/{offerId}'),
    );
    expect(teamEventsBlock).toContain("'rsvps', 'rsvp_notes', 'invitee_uids', 'updated_at'");
    expect(teamEventsBlock).toContain("'attendance_marks',");
  });

  it('bloque l’écriture sur les documents figés (rapport finalisé)', () => {
    // La garde reste : seule son écriture change (safe-get), pas sa sémantique.
    const staffFn = RULES.slice(
      RULES.indexOf('function isTeamEventStaffManageUpdate'),
      RULES.indexOf('function guardianEmail'),
    );
    expect(staffFn).toContain("get('match_report_finalized_at', null) == null");
  });
});

describe('cohérence du rattachement', () => {
  it('impose qu’une écriture ne règle qu’une échéance du même club', () => {
    expect(RULES).toContain('function validFinanceFeeLink');
    expect(RULES).toMatch(/fee_id\.split\('__'\)\[0\] == request\.resource\.data\.club_id/);
  });

  it('borne la remise par le montant dû', () => {
    expect(RULES).toContain('d.discount_eur <= d.amount_due_eur');
  });

  it('valide la saison au format AAAA-AAAA', () => {
    expect(RULES).toContain('function validClubSeason');
    expect(RULES).toContain("season.matches('^[0-9]{4}-[0-9]{4}$')");
  });
});

describe('justificatifs Storage', () => {
  it('déclare un chemin de justificatifs financiers protégé par le périmètre financier', () => {
    expect(STORAGE_RULES).toContain('match /club_finance_receipts/{clubId}/{fileName}');
    expect(STORAGE_RULES).toContain('function isClubFinanceManager');
    expect(STORAGE_RULES).toMatch(/isClubFinanceManager\(clubId\)[\s\S]{0,140}contentType/);
  });

  it('n’ouvre pas les justificatifs aux seuls membres du club', () => {
    const start = STORAGE_RULES.indexOf('match /club_finance_receipts/');
    const block = STORAGE_RULES.slice(start, STORAGE_RULES.indexOf('match /team_vault/'));
    expect(block).not.toContain('isClubMemberOrStaff');
  });
});
