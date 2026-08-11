import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { ProDaySurface } from '../ui/ProDaySurface';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import {
  CLUB_OFFERS,
  formatClubOfferPrice,
  type ClubOfferId,
} from '../../content/clubOffers';
import { radius, spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

const ORDER: ClubOfferId[] = [
  'club_amateur',
  'club_essentiel',
  'club_premium',
  'club_video_pro',
];

type Props = {
  onRequestQuote: (offerId: ClubOfferId) => void;
  onOpenSubscription?: () => void;
};

/** Comparateur 4 formules Club — aligné `ClubOffersInteractive` du site. */
export function ClubOffersComparePanel({ onRequestQuote, onOpenSubscription }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selected, setSelected] = useState<ClubOfferId>('club_premium');
  const offer = CLUB_OFFERS[selected];

  const priceLabel = formatClubOfferPrice(offer);

  return (
    <View style={styles.wrap}>
      <ProDayText variant="eyebrow" accent>
        Offres Club
      </ProDayText>
      <ProDayText variant="section" style={styles.title}>
        Quatre formules. Le matériel reste un choix.
      </ProDayText>
      <ProDayText variant="caption" muted>
        Amateur · Essentiel · Tout inclus · Pro + Veo. Analyse de forme incluse. Caméra jamais
        obligatoire.
      </ProDayText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {ORDER.map((id) => {
          const col = CLUB_OFFERS[id];
          const on = selected === id;
          const price = formatClubOfferPrice(col);
          return (
            <PressableSpring
              key={id}
              onPress={() => setSelected(id)}
              scaleTo={0.97}
              style={[
                styles.col,
                {
                  borderColor: on ? colors.accent : colors.border,
                  backgroundColor: on ? colors.accentSoft : colors.surface,
                },
              ]}
            >
              <ProDayText variant="caption" accent={on} style={styles.colLabel}>
                {col.shortLabel}
              </ProDayText>
              <ProDayText variant="section" numberOfLines={2} style={{ fontSize: 15 }}>
                {col.billing === 'quote' ? 'Sur devis' : price}
              </ProDayText>
              {col.billing === 'quote' ? (
                <ProDayText variant="caption" muted numberOfLines={2}>
                  À partir de 3 € / adhérent
                </ProDayText>
              ) : (
                <ProDayText variant="caption" muted>
                  / mois
                </ProDayText>
              )}
              <ProDayText variant="caption" muted numberOfLines={2}>
                {col.tagline}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </ScrollView>

      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="section">{offer.label}</ProDayText>
        {offer.billing === 'quote' ? (
          <>
            <ProDayText variant="section">Sur devis</ProDayText>
            <ProDayText variant="caption" muted>
              À partir de 3 € / adhérent — tarif adapté selon la taille du club
            </ProDayText>
          </>
        ) : offer.priceHint ? (
          <ProDayText variant="caption" muted>
            {offer.priceHint}
          </ProDayText>
        ) : (
          <ProDayText variant="caption" muted>
            {priceLabel}
            {offer.billing === 'monthly' ? ' / mois' : ''} · {offer.audience}
          </ProDayText>
        )}
        {offer.includes.map((line) => (
          <ProDayText key={line} variant="caption" muted>
            · {line}
          </ProDayText>
        ))}
        <View style={styles.ctaRow}>
          {offer.billing === 'quote' ? (
            <PressableSpring
              onPress={() => onRequestQuote(offer.id)}
              scaleTo={0.97}
              haptic
              style={[styles.ctaPrimary, { backgroundColor: colors.accent }]}
            >
              <ProDayText variant="caption" style={styles.ctaInverse}>
                {offer.ctaLabel ?? 'Demander un devis'}
              </ProDayText>
            </PressableSpring>
          ) : (
            <PressableSpring
              onPress={() => onOpenSubscription?.() ?? onRequestQuote(offer.id)}
              scaleTo={0.97}
              haptic
              style={[styles.ctaPrimary, { backgroundColor: colors.accent }]}
            >
              <ProDayText variant="caption" style={styles.ctaInverse}>
                Commencer
              </ProDayText>
            </PressableSpring>
          )}
          {offer.id !== 'club_video_pro' ? (
            <PressableSpring onPress={() => onRequestQuote('club_video_pro')} scaleTo={0.97}>
              <ProDayText variant="caption" accent style={styles.link}>
                Voir Pro + Veo
              </ProDayText>
            </PressableSpring>
          ) : null}
        </View>
      </ProDaySurface>
    </View>
  );
}

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    wrap: { gap: spacing.sm },
    title: { fontWeight: '800', letterSpacing: -0.3 },
    row: { gap: spacing.sm, paddingVertical: spacing.xs },
    col: {
      width: 132,
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: 2,
    },
    colLabel: { fontWeight: '800', textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.8 },
    card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
    ctaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
    ctaPrimary: {
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    ctaInverse: { color: '#fff', fontWeight: '800' },
    link: { fontWeight: '800' },
  });
}
