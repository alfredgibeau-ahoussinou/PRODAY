import type { AdminWorkItem } from '../utils/adminInsights';
import {
  canAdminWorkInlineAction,
  adminWorkItemNeedsOpenToTreat,
  executeAdminWorkApprove,
  executeAdminWorkReject,
} from '../utils/adminWorkQueueActions';
import { adminService } from '../services/admin.service';
import { recruitmentService } from '../services/recruitment.service';
import { sponsorQuoteService } from '../services/sponsorQuote.service';

jest.mock('../services/admin.service', () => ({
  adminService: {
    validateProfile: jest.fn(),
    updateCommunityReelStatus: jest.fn(),
    updatePaymentStatus: jest.fn(),
    deletePaymentRequest: jest.fn(),
    deleteReelReport: jest.fn(),
    updateRecruitmentPost: jest.fn(),
  },
}));

jest.mock('../services/recruitment.service', () => ({
  recruitmentService: {
    updateApplicationStatus: jest.fn(),
  },
}));

jest.mock('../services/sponsorQuote.service', () => ({
  sponsorQuoteService: {
    rejectQuote: jest.fn(),
  },
}));

function item(kind: AdminWorkItem['kind'], id: string, entityId?: string): AdminWorkItem {
  return {
    id,
    kind,
    priority: 'medium',
    title: 'Test',
    subtitle: 'Sub',
    targetTab: 'users',
    entityId,
  };
}

describe('adminWorkQueueActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('canAdminWorkInlineAction', () => {
    it('autorise approve pour verification, reel, application, payment, report', () => {
      for (const kind of ['verification', 'reel', 'application', 'payment', 'report'] as const) {
        expect(canAdminWorkInlineAction(item(kind, `${kind}-1`), 'approve')).toBe(true);
      }
    });

    it('refuse approve pour quote et post', () => {
      expect(canAdminWorkInlineAction(item('quote', 'quote-1'), 'approve')).toBe(false);
      expect(canAdminWorkInlineAction(item('post', 'post-1'), 'approve')).toBe(false);
    });

    it('autorise reject pour tous les kinds actionnables', () => {
      const kinds: AdminWorkItem['kind'][] = [
        'verification',
        'reel',
        'report',
        'payment',
        'application',
        'quote',
        'post',
      ];
      for (const kind of kinds) {
        expect(canAdminWorkInlineAction(item(kind, `${kind}-1`), 'reject')).toBe(true);
      }
    });
  });

  describe('adminWorkItemNeedsOpenToTreat', () => {
    it('signale quote comme nécessitant ouverture', () => {
      expect(adminWorkItemNeedsOpenToTreat(item('quote', 'quote-1'))).toBe(true);
    });

    it('ne signale pas reel comme nécessitant ouverture', () => {
      expect(adminWorkItemNeedsOpenToTreat(item('reel', 'reel-1'))).toBe(false);
    });
  });

  describe('executeAdminWorkApprove', () => {
    it('approuve une vérification profil', async () => {
      await executeAdminWorkApprove(item('verification', 'verify-u1', 'u1'));
      expect(adminService.validateProfile).toHaveBeenCalledWith('u1', 'approve');
    });

    it('marque un paiement comme payé', async () => {
      await executeAdminWorkApprove(item('payment', 'pay-p1'));
      expect(adminService.updatePaymentStatus).toHaveBeenCalledWith('p1', 'paid');
    });

    it('valide un signalement en rejetant la publication', async () => {
      await executeAdminWorkApprove(
        item('report', 'report-r1', 'proday-reel42'),
      );
      expect(adminService.updateCommunityReelStatus).toHaveBeenCalledWith('reel42', 'rejected');
      expect(adminService.deleteReelReport).toHaveBeenCalledWith('r1');
    });

    it('refuse quote en approve inline', async () => {
      await expect(executeAdminWorkApprove(item('quote', 'quote-1'))).rejects.toThrow(
        'Action non supportée',
      );
    });
  });

  describe('executeAdminWorkReject', () => {
    it('refuse une candidature', async () => {
      await executeAdminWorkReject(item('application', 'app-a1'));
      expect(recruitmentService.updateApplicationStatus).toHaveBeenCalledWith('a1', 'REJECTED');
    });

    it('supprime un paiement en attente', async () => {
      await executeAdminWorkReject(item('payment', 'pay-p2'));
      expect(adminService.deletePaymentRequest).toHaveBeenCalledWith('p2');
    });

    it('classe un devis sponsor comme refusé', async () => {
      await executeAdminWorkReject(item('quote', 'quote-q1'));
      expect(sponsorQuoteService.rejectQuote).toHaveBeenCalledWith('q1');
    });

    it('ferme une annonce recrutement', async () => {
      await executeAdminWorkReject(item('post', 'post-p1'));
      expect(adminService.updateRecruitmentPost).toHaveBeenCalledWith('p1', 'CLOSED');
    });

    it('ignore le reel lors du rejet d un signalement', async () => {
      await executeAdminWorkReject(item('report', 'report-r2', 'proday-x'));
      expect(adminService.updateCommunityReelStatus).not.toHaveBeenCalled();
      expect(adminService.deleteReelReport).toHaveBeenCalledWith('r2');
    });
  });
});
