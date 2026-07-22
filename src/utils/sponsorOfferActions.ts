import type { User } from '../models/User';
import type { SponsorOffer } from '../models/SponsorOffer';
import {
  subscriptionService,
  SubscriptionLimitError,
} from '../services/subscription.service';

export async function assertCanPublishActiveSponsorOffer(user: User): Promise<void> {
  await subscriptionService.assertSponsorCanAddActiveOffer(user);
}

export async function assertCanActivateSponsorOffer(
  user: User,
  offer: SponsorOffer,
  activeOffersCount: number,
): Promise<void> {
  if (offer.active) return;
  await subscriptionService.assertFeature(user, 'sponsor_active_offer', undefined, {
    activeSponsorOffers: activeOffersCount,
  });
}

export function isSubscriptionLimitError(error: unknown): error is SubscriptionLimitError {
  return error instanceof SubscriptionLimitError;
}
