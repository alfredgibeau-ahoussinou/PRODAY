import { humanizeClubFinanceWriteError } from '../features/club/ui/clubFeeModel';
import { mapClubBudgetLine, mapClubFee } from '../utils/clubFees';
import { normalizeClubFinancePaymentMethod } from '../utils/clubFinance';
import { clubFinancePaymentMethodLabel } from '../models/ClubFinanceEntry';

describe('humanizeClubFinanceWriteError', () => {
  it('attribue un refus de permission aux règles non déployées', () => {
    // C'est le cas réel tant que `firebase deploy --only firestore:rules` n'est pas passé :
    // l'écran doit orienter vers la cause au lieu d'afficher un message Firestore brut.
    const text = humanizeClubFinanceWriteError(
      new Error('FirebaseError: Missing or insufficient permissions.'),
    );
    expect(text).toContain('règles Firestore');
    expect(text).toContain('Aucune donnée n’a été enregistrée');
    expect(text).toContain('firestore:rules');
  });

  it('distingue réseau, session et délai', () => {
    expect(humanizeClubFinanceWriteError(new Error('unavailable'))).toContain('Réseau');
    expect(humanizeClubFinanceWriteError(new Error('auth/invalid-token'))).toContain('Session');
    expect(humanizeClubFinanceWriteError(new Error('deadline exceeded'))).toContain('à temps');
  });

  it('dit toujours qu’aucune donnée n’a été enregistrée dans les cas connus', () => {
    for (const raw of [
      'Missing or insufficient permissions.',
      'unavailable',
      'unauthenticated',
      'deadline exceeded',
    ]) {
      expect(humanizeClubFinanceWriteError(new Error(raw)).toLowerCase()).toMatch(
        /rien n’a été enregistré|aucune donnée n’a été enregistrée/,
      );
    }
  });

  it('laisse passer un message métier explicite', () => {
    expect(humanizeClubFinanceWriteError(new Error('La remise ne peut pas dépasser le montant dû.'))).toBe(
      'La remise ne peut pas dépasser le montant dû.',
    );
  });

  it('ne laisse pas un cas inconnu produire un message vide', () => {
    expect(humanizeClubFinanceWriteError(undefined)).toContain('rien n’a été enregistré');
  });
});

describe('mapClubFee', () => {
  it('lit les champs Firestore et normalise les montants', () => {
    const fee = mapClubFee('club-1__2026-2027__u-1__cotisation', {
      club_id: 'club-1',
      season: '2026-2027',
      label: 'Cotisation 2026-2027 — Léo',
      category: 'Cotisation',
      amount_due_eur: 120.005,
      discount_eur: 20,
      due_date: new Date('2026-10-01T00:00:00'),
      member_uid: 'u-1',
      member_name: 'Léo',
      status: 'active',
      created_by_uid: 'club-1',
    });
    expect(fee.amount_due_eur).toBe(120.01);
    expect(fee.discount_eur).toBe(20);
    expect(fee.member_uid).toBe('u-1');
  });

  it('ne fabrique ni montant ni date quand ils manquent', () => {
    const fee = mapClubFee('x', { club_id: 'club-1' });
    expect(fee.amount_due_eur).toBe(0);
    expect(fee.discount_eur).toBe(0);
    expect(fee.category).toBe('Cotisation');
    expect(fee.member_uid).toBeNull();
    // Date d'époque : une échéance absente ne devient pas « aujourd'hui ».
    expect(fee.due_date.getTime()).toBe(0);
  });

  it('normalise un statut inconnu sur actif plutôt que de masquer l’échéance', () => {
    expect(mapClubFee('x', { club_id: 'c', status: 'weird' }).status).toBe('active');
    expect(mapClubFee('x', { club_id: 'c', status: 'cancelled' }).status).toBe('cancelled');
  });
});

describe('mapClubBudgetLine', () => {
  it('lit les prévisions et borne les négatifs à zéro', () => {
    const line = mapClubBudgetLine('club-1__2026-2027__licence', {
      club_id: 'club-1',
      season: '2026-2027',
      category: 'Licence',
      planned_income_eur: 12000,
      planned_expense_eur: -50,
      created_by_uid: 'club-1',
    });
    expect(line.planned_income_eur).toBe(12000);
    expect(line.planned_expense_eur).toBe(0);
  });
});

describe('moyen de paiement', () => {
  it('accepte les valeurs encaissables au club', () => {
    expect(normalizeClubFinancePaymentMethod('cash')).toBe('cash');
    expect(normalizeClubFinancePaymentMethod('transfer')).toBe('transfer');
  });

  it('ramène une valeur inconnue à « non renseigné », jamais à « autre »', () => {
    // Ranger une valeur illisible sous « Autre » transformerait une donnée manquante en
    // réponse déclarée, et fausserait toute lecture par moyen de paiement.
    expect(normalizeClubFinancePaymentMethod('crypto')).toBeNull();
    expect(normalizeClubFinancePaymentMethod(undefined)).toBeNull();
    expect(clubFinancePaymentMethodLabel(null)).toBe('Moyen non renseigné');
    expect(clubFinancePaymentMethodLabel('cheque')).toBe('Chèque');
  });
});
