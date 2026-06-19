import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LocaleContext';
import { sponsorsService } from '../services/sponsors.service';
import { usersService } from '../services/users.service';
import type { SponsorOffer } from '../models/SponsorOffer';
import type { User } from '../models/User';
import { getOfferTypeLabel } from '../content/sponsorContent';
import { openContactConversation } from '../utils/openContactConversation';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { spacing, radius, shadows } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';

interface SponsorPublicProfileScreenProps {
  sponsorUid: string;
  initialOfferId?: string;
  onBack: () => void;
  guestMode?: boolean;
  onLoginRequired?: () => void;
  onOpenChat?: (threadId: string) => void;
}

export const SponsorPublicProfileScreen: React.FC<SponsorPublicProfileScreenProps> = ({
  sponsorUid,
  initialOfferId,
  onBack,
  guestMode = false,
  onLoginRequired,
  onOpenChat,
}) => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const [sponsor, setSponsor] = useState<User | null>(null);
  const [offers, setOffers] = useState<SponsorOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const companyName = useMemo(() => {
    if (offers[0]?.company_name) return offers[0].company_name;
    return sponsor?.display_name ?? t('sponsorPublic.title');
  }, [offers, sponsor, t]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [user, activeOffers] = await Promise.all([
        usersService.getPublicById(sponsorUid),
        sponsorsService.listActiveOffersBySponsor(sponsorUid),
      ]);
      setSponsor(user);
      setOffers(activeOffers);
    } finally {
      setLoading(false);
    }
  }, [sponsorUid]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void sponsorsService.trackSponsorProfileView(sponsorUid);
  }, [sponsorUid]);

  const handleContact = (offer: SponsorOffer) => {
    void sponsorsService.trackOfferClick(offer.id);
    void sponsorsService.trackOfferLead(offer.id);

    if (guestMode || !profile) {
      Alert.alert(t('sponsorPublic.contact'), t('sponsorPublic.contactGuest'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('auth.login'), onPress: () => onLoginRequired?.() },
      ]);
      return;
    }

    if (!onOpenChat) {
      Alert.alert(t('sponsorPublic.contact'), t('sponsorPublic.contactUnavailable'));
      return;
    }

    void (async () => {
      const sponsor = await usersService.getPublicById(sponsorUid);
      if (!sponsor) {
        Alert.alert(t('sponsorPublic.contact'), t('sponsorPublic.contactUnavailable'));
        return;
      }
      await openContactConversation(
        profile,
        sponsor,
        offer.company_name || sponsor.display_name,
        onOpenChat,
      );
    })();
  };

  const handleOfferPress = (offer: SponsorOffer) => {
    void sponsorsService.trackOfferClick(offer.id);
  };

  return (
    <View style={[styles.root, rootStyle]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title={companyName} subtitle={t('sponsorPublic.title')} onBack={onBack} />

        {loading ? (
          <ActivityIndicator color={c.brand} style={styles.loader} />
        ) : (
          <>
            <View style={[styles.hero, shadows.card]}>
              <View style={styles.heroIcon}>
                <Icon name="business" size={28} color={c.brand} />
              </View>
              <Text style={styles.heroTitle}>{companyName}</Text>
              {sponsor?.city ? <Text style={styles.heroCity}>{sponsor.city}</Text> : null}
              {sponsor?.profile.bio ? (
                <Text style={styles.heroBio}>{sponsor.profile.bio}</Text>
              ) : null}
            </View>

            <Text style={styles.sectionLabel}>{t('sponsorPublic.activeOffers')}</Text>
            {offers.length === 0 ? (
              <Text style={styles.empty}>{t('sponsorPublic.noOffers')}</Text>
            ) : (
              offers.map((offer) => {
                const highlighted = offer.id === initialOfferId;
                return (
                  <TouchableOpacity
                    key={offer.id}
                    style={[styles.offerCard, highlighted && styles.offerCardHighlighted]}
                    activeOpacity={0.9}
                    onPress={() => handleOfferPress(offer)}
                  >
                    <View style={styles.offerHeader}>
                      <Text style={styles.offerType}>{getOfferTypeLabel(offer.offer_type)}</Text>
                      {offer.value ? <Text style={styles.offerValue}>{offer.value}</Text> : null}
                    </View>
                    <Text style={styles.offerDesc}>{offer.description}</Text>
                    {offer.city ? <Text style={styles.offerCity}>{offer.city}</Text> : null}
                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => handleContact(offer)}
                    >
                      <Text style={styles.contactBtnText}>{t('sponsorPublic.contact')}</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl },
    loader: { marginVertical: spacing.xl },
    hero: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: c.brand,
    },
    heroIcon: {
      width: 52,
      height: 52,
      borderRadius: radius.md,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    heroTitle: { fontSize: 22, fontWeight: '900', color: c.text },
    heroCity: { fontSize: 13, color: c.textMuted, marginTop: 4, fontWeight: '600' },
    heroBio: {
      fontSize: 14,
      color: c.textSecondary,
      marginTop: spacing.sm,
      lineHeight: 20,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: c.brand,
      letterSpacing: 1,
      marginBottom: spacing.md,
    },
    empty: { color: c.textMuted, fontSize: 14, marginBottom: spacing.lg },
    offerCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    offerCardHighlighted: { borderColor: c.brand, borderWidth: 2 },
    offerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    offerType: { fontSize: 10, fontWeight: '800', color: c.brand, letterSpacing: 0.5 },
    offerValue: { fontSize: 12, fontWeight: '800', color: c.brand },
    offerDesc: { color: c.textSecondary, marginTop: spacing.sm, fontSize: 13, lineHeight: 18 },
    offerCity: { color: c.textMuted, marginTop: 4, fontSize: 11 },
    contactBtn: {
      marginTop: spacing.md,
      alignSelf: 'flex-start',
      backgroundColor: c.brand,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    contactBtnText: { color: c.brandInverse, fontWeight: '800', fontSize: 12 },
  });
}
