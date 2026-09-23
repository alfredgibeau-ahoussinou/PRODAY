import {
  CLUB_FEE_DUE_SOON_DAYS,
  buildClubFeeRows,
  clubFeeAging,
  clubFeeOutstandingDefinition,
  clubFeePaidEur,
  clubFeeUnallocatedNote,
  resolveClubFeeSummaryLabel,
  summarizeClubFees,
} from '../features/club/ui/clubFeeModel';
import { CLUB_FEE_DEFAULT_CATEGORY, clubFeeDocId, clubFeeNetDueEur } from '../models/ClubFee';
import type { ClubFee } from '../models/ClubFee';
import type { ClubFinanceEntry } from '../models/ClubFinanceEntry';

function fee(partial: Partial<ClubFee> & Pick<ClubFee, 'id' | 'amount_due_eur' | 'due_date'>): ClubFee {
  return {
    club_id: 'club-1',
    season: '2026-2027',
    label: '',
    category: CLUB_FEE_DEFAULT_CATEGORY,
    discount_eur: 0,
    member_uid: 'u-1',
    member_name: 'Léo',
    team_id: null,
    status: 'active',
    created_by_uid: 'club-1',
    created_at: new Date('2026-08-01T09:00:00'),
    updated_at: new Date('2026-08-01T09:00:00'),
    deleted_at: null,
    ...partial,
  };
}

function payment(
  partial: Partial<ClubFinanceEntry> &
    Pick<ClubFinanceEntry, 'id' | 'amount_eur'>,
): ClubFinanceEntry {
  return {
    club_id: 'club-1',
    type: 'cotisation',
    label: 'Cotisation',
    category: 'Licence',
    entry_date: new Date('2026-09-10T10:00:00'),
    created_by_uid: 'club-1',
    status: 'active',
    payment_method: null,
    payment_provenance: 'manual',
    fee_id: null,
    receipt: null,
    created_at: new Date('2026-09-10T10:00:00'),
    updated_at: new Date('2026-09-10T10:00:00'),
    deleted_at: null,
    ...partial,
  };
}

const NOW = new Date('2026-06-15T12:00:00');

describe('clubFeeNetDueEur', () => {
  it('déduit la remise du montant dû', () => {
    expect(clubFeeNetDueEur({ amount_due_eur: 200, discount_eur: 50 })).toBe(150);
  });

  it('ne produit jamais un net négatif', () => {
    // Une remise supérieure au dû est refusée à la saisie ; si une donnée ancienne en
    // contient une, le plancher à zéro évite qu'elle réduise le total des impayés.
    expect(clubFeeNetDueEur({ amount_due_eur: 100, discount_eur: 180 })).toBe(0);
  });
});

describe('clubFeeAging', () => {
  it('une échéance du jour n’est pas en retard', () => {
    const aging = clubFeeAging(
      { amount_due_eur: 100, discount_eur: 0, due_date: new Date('2026-06-15T00:00:00') },
      0,
      NOW,
    );
    expect(aging).toBe('due_soon');
  });

  it('devient en retard le lendemain de l’échéance', () => {
    const aging = clubFeeAging(
      { amount_due_eur: 100, discount_eur: 0, due_date: new Date('2026-06-14T00:00:00') },
      0,
      NOW,
    );
    expect(aging).toBe('overdue');
  });

  it('signale une échéance proche dans la fenêtre définie', () => {
    const inWindow = new Date(NOW.getTime() + (CLUB_FEE_DUE_SOON_DAYS - 1) * 24 * 3600 * 1000);
    const outWindow = new Date(NOW.getTime() + (CLUB_FEE_DUE_SOON_DAYS + 10) * 24 * 3600 * 1000);
    const base = { amount_due_eur: 100, discount_eur: 0 };
    expect(clubFeeAging({ ...base, due_date: inWindow }, 0, NOW)).toBe('due_soon');
    expect(clubFeeAging({ ...base, due_date: outWindow }, 0, NOW)).toBe('upcoming');
  });

  it('reste « Réglée » même après l’échéance', () => {
    // Sinon une cotisation payée avant terme apparaîtrait « en retard » — un faux positif
    // qui déclencherait une relance injustifiée.
    const aging = clubFeeAging(
      { amount_due_eur: 100, discount_eur: 0, due_date: new Date('2026-01-10T00:00:00') },
      100,
      NOW,
    );
    expect(aging).toBe('settled');
  });

  it('un règlement partiel laisse l’échéance en retard', () => {
    const aging = clubFeeAging(
      { amount_due_eur: 100, discount_eur: 0, due_date: new Date('2026-06-01T00:00:00') },
      40,
      NOW,
    );
    expect(aging).toBe('overdue');
  });

  it('prend la remise en compte dans le solde', () => {
    const aging = clubFeeAging(
      { amount_due_eur: 100, discount_eur: 30, due_date: new Date('2026-05-01T00:00:00') },
      70,
      NOW,
    );
    expect(aging).toBe('settled');
  });
});

describe('rattachement des encaissements', () => {
  it('ne compte que les écritures qui désignent l’échéance', () => {
    const entries = [
      payment({ id: 'p1', amount_eur: 40, fee_id: 'f-1' }),
      payment({ id: 'p2', amount_eur: 200, fee_id: 'f-2' }),
      payment({ id: 'p3', amount_eur: 50, fee_id: null }),
    ];
    expect(clubFeePaidEur('f-1', entries)).toBe(40);
  });

  it('ignore une écriture annulée ou supprimée', () => {
    const entries = [
      payment({ id: 'p1', amount_eur: 40, fee_id: 'f-1' }),
      payment({ id: 'p2', amount_eur: 60, fee_id: 'f-1', status: 'cancelled' }),
      payment({ id: 'p3', amount_eur: 60, fee_id: 'f-1', deleted_at: new Date('2026-09-11') }),
    ];
    expect(clubFeePaidEur('f-1', entries)).toBe(40);
  });

  it('ne répartit jamais un encaissement non rattaché', () => {
    const rows = buildClubFeeRows({
      fees: [fee({ id: 'f-1', amount_due_eur: 100, due_date: new Date('2026-06-01') })],
      entries: [payment({ id: 'p1', amount_eur: 100, fee_id: null })],
      now: NOW,
    });
    // Le paiement existe en caisse mais ne désigne aucune échéance : le reste dû ne bouge pas.
    expect(rows[0].paidEur).toBe(0);
    expect(rows[0].outstandingEur).toBe(100);
    expect(rows[0].aging).toBe('overdue');
  });
});

describe('buildClubFeeRows', () => {
  it('filtre sur la saison de l’échéance, pas sur la date d’encaissement', () => {
    const rows = buildClubFeeRows({
      fees: [
        fee({ id: 'f-1', amount_due_eur: 100, due_date: new Date('2026-09-30') }),
        fee({ id: 'f-2', amount_due_eur: 100, due_date: new Date('2025-09-30'), season: '2025-2026' }),
      ],
      entries: [],
      season: '2026-2027',
      now: NOW,
    });
    expect(rows.map((r) => r.feeId)).toEqual(['f-1']);
  });

  it('écarte les échéances annulées', () => {
    const rows = buildClubFeeRows({
      fees: [
        fee({ id: 'f-1', amount_due_eur: 100, due_date: new Date('2026-09-30'), status: 'cancelled' }),
        fee({ id: 'f-2', amount_due_eur: 100, due_date: new Date('2026-09-30'), deleted_at: new Date('2026-09-01') }),
      ],
      entries: [],
      now: NOW,
    });
    expect(rows).toHaveLength(0);
  });

  it('nomme l’adhérent plutôt que d’afficher une ligne anonyme', () => {
    const rows = buildClubFeeRows({
      fees: [
        fee({ id: 'f-1', amount_due_eur: 100, due_date: new Date('2026-09-30'), member_name: 'Léo U17' }),
      ],
      entries: [],
      now: NOW,
    });
    expect(rows[0].memberName).toBe('Léo U17');
    expect(rows[0].label).toBe('Léo U17');
  });
});

describe('summarizeClubFees', () => {
  it('sépare le reste dû des encaissements non rattachés', () => {
    const entries = [
      payment({ id: 'p1', amount_eur: 40, fee_id: 'f-1' }),
      payment({ id: 'p2', amount_eur: 250, fee_id: null }),
    ];
    const rows = buildClubFeeRows({
      fees: [fee({ id: 'f-1', amount_due_eur: 100, due_date: new Date('2026-06-01') })],
      entries,
      now: NOW,
    });
    const summary = summarizeClubFees(rows, entries);

    expect(summary.outstandingEur).toBe(60);
    expect(summary.overdueEur).toBe(60);
    expect(summary.overdueCount).toBe(1);
    // Le non rattaché n'est PAS soustrait : il est exposé à part, avec son compte.
    expect(summary.unallocatedEur).toBe(250);
    expect(summary.unallocatedCount).toBe(1);
    expect(clubFeeUnallocatedNote(summary)).toContain('250');
  });

  it('ne compte pas une dépense ou une recette comme un encaissement non rattaché', () => {
    const entries = [
      payment({ id: 'p1', amount_eur: 90, fee_id: null, type: 'depense' }),
      payment({ id: 'p2', amount_eur: 30, fee_id: null, type: 'recette' }),
    ];
    const summary = summarizeClubFees([], entries);
    expect(summary.unallocatedEur).toBe(0);
    expect(clubFeeUnallocatedNote(summary)).toContain('Tous les encaissements');
  });

  it('dit explicitement qu’aucun impayé n’est calculable sans échéance', () => {
    const summary = summarizeClubFees([], [payment({ id: 'p', amount_eur: 500, fee_id: null })]);
    expect(summary.feesCount).toBe(0);
    expect(resolveClubFeeSummaryLabel(summary)).toContain('aucun impayé n’est calculable');
  });

  it('résume le reste dû et le retard', () => {
    const rows = buildClubFeeRows({
      fees: [
        fee({ id: 'f-1', amount_due_eur: 100, due_date: new Date('2026-06-01') }),
        fee({ id: 'f-2', amount_due_eur: 80, due_date: new Date('2026-09-01'), member_uid: 'u-2', member_name: 'Ana' }),
      ],
      entries: [],
      now: NOW,
    });
    const summary = summarizeClubFees(rows, []);
    expect(summary.netDueEur).toBe(180);
    expect(summary.outstandingEur).toBe(180);
    expect(summary.overdueCount).toBe(1);
    expect(summary.overdueEur).toBe(100);
  });
});

describe('clubFeeDocId', () => {
  it('est stable pour la même échéance — rejouer une affectation ne double pas', () => {
    const a = clubFeeDocId({ club_id: 'club-1', season: '2026-2027', member_uid: 'u-1', category: 'Licence' });
    const b = clubFeeDocId({ club_id: 'club-1', season: '2026-2027', member_uid: 'u-1', category: 'Licence' });
    expect(a).toBe(b);
  });

  it('normalise accents et casse de la catégorie', () => {
    const withAccent = clubFeeDocId({ club_id: 'c', season: '2026-2027', member_uid: 'u', category: 'Équipement' });
    const plain = clubFeeDocId({ club_id: 'c', season: '2026-2027', member_uid: 'u', category: 'equipement' });
    expect(withAccent).toBe(plain);
    expect(withAccent.endsWith('__equipement')).toBe(true);
  });

  it('distingue deux adhérents de même nom et deux catégories', () => {
    const base = { club_id: 'c', season: '2026-2027' };
    const leoUid = clubFeeDocId({ ...base, member_uid: 'u-1', category: 'Licence' });
    const leoUid2 = clubFeeDocId({ ...base, member_uid: 'u-2', category: 'Licence' });
    const leoEquip = clubFeeDocId({ ...base, member_uid: 'u-1', category: 'Équipement' });
    expect(new Set([leoUid, leoUid2, leoEquip]).size).toBe(3);
  });

  it('porte le club en préfixe — la règle Firestore s’y appuie', () => {
    const id = clubFeeDocId({ club_id: 'club-1', season: '2026-2027', member_uid: 'u-1', category: 'Licence' });
    const segments = id.split('__');
    expect(segments[0]).toBe('club-1');
    expect(segments[1]).toBe('2026-2027');
  });
});

describe('clubFeeOutstandingDefinition', () => {
  it('écrit la définition du retard au lieu de la laisser implicite', () => {
    const text = clubFeeOutstandingDefinition();
    expect(text).toContain('date d’échéance');
    expect(text).toContain('inférieur');
  });
});
