import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { useSubscriptionOptional } from '../../context/SubscriptionContext';
import {
  SPONSOR_MESSAGE_WARNING_THRESHOLD,
  sponsorActiveOfferLimit,
  sponsorHasUnlimitedMessaging,
  sponsorMessageLimit,
} from '../../utils/sponsorPlanLimits';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';

type SponsorQuotaBannerProps = {
  profile: User;
  activeOffers: number;
};

export const SponsorQuotaBanner: React.FC<SponsorQuotaBannerProps> = ({
  profile,
  activeOffers,
}) => {
  const subscription = useSubscriptionOptional();
  const warnedRef = useRef(false);

  const messageLimit = sponsorMessageLimit(profile);
  const offerLimit = sponsorActiveOfferLimit(profile);
  const unlimitedMessages = sponsorHasUnlimitedMessaging(profile);
  const usedMessages = subscription?.usage?.sponsor_club_messages ?? 0;

  const messageLine = useMemo(() => {
    if (unlimitedMessages) return null;
    const left = Math.max(0, messageLimit - usedMessages);
    return `${usedMessages} / ${messageLimit} messages clubs ce mois · ${left} restant${left !== 1 ? 's' : ''}`;
  }, [unlimitedMessages, messageLimit, usedMessages]);

  const offerLine = useMemo(() => {
    if (!Number.isFinite(offerLimit)) return null;
    const left = Math.max(0, offerLimit - activeOffers);
    return `${activeOffers} / ${offerLimit} offre${offerLimit !== 1 ? 's' : ''} active${offerLimit !== 1 ? 's' : ''} · ${left} disponible${left !== 1 ? 's' : ''}`;
  }, [offerLimit, activeOffers]);

  useEffect(() => {
    if (unlimitedMessages || warnedRef.current) return;
    if (usedMessages >= SPONSOR_MESSAGE_WARNING_THRESHOLD && usedMessages < messageLimit) {
      warnedRef.current = true;
    }
  }, [unlimitedMessages, usedMessages, messageLimit]);

  if (!messageLine && !offerLine) return null;

  const nearMessageLimit =
    !unlimitedMessages && usedMessages >= SPONSOR_MESSAGE_WARNING_THRESHOLD;

  return (
    <View
      style={[
        styles.root,
        nearMessageLimit ? styles.rootWarn : null,
      ]}
    >
      {messageLine ? (
        <Text style={[styles.line, nearMessageLimit ? styles.lineWarn : null]}>
          {messageLine}
          {nearMessageLimit ? ' — formule Découverte' : ''}
        </Text>
      ) : null}
      {offerLine ? <Text style={styles.line}>{offerLine}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: SPONSOR_THEME.surfaceMuted,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    gap: spacing.xs,
  },
  rootWarn: {
    borderColor: 'rgba(251, 191, 36, 0.45)',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  line: {
    color: SPONSOR_THEME.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  lineWarn: {
    color: '#fcd34d',
    fontWeight: '600',
  },
});

/** Alerte douce une fois par session quand le seuil 8/10 est atteint. */
export function shouldWarnSponsorMessageQuota(
  profile: User,
  used: number,
  alreadyWarned: boolean,
): boolean {
  if (alreadyWarned) return false;
  if (profile.role !== 'sponsor' || sponsorHasUnlimitedMessaging(profile)) return false;
  const limit = sponsorMessageLimit(profile);
  return used >= SPONSOR_MESSAGE_WARNING_THRESHOLD && used < limit;
}

export function sponsorMessageQuotaWarningText(used: number, limit: number): string {
  const left = Math.max(0, limit - used);
  return `Formule Découverte : il vous reste ${left} message${left !== 1 ? 's' : ''} clubs ce mois (sur ${limit}).`;
}
