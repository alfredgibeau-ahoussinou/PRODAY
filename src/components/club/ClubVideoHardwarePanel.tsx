import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { ProDaySurface } from '../ui/ProDaySurface';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import {
  VIDEO_OFFERS,
  VIDEO_VENDORS,
} from '../../content/videoOffers';
import { ClubCamerasPanel } from './ClubCamerasPanel';
import { radius, spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import type { User } from '../../models/User';

type Props = {
  clubId: string;
  profile: User;
  onRequestQuote: () => void;
};

/** Offres vidéo / Pro + Veo + config caméras — aligné `VideoHardwareOffers` du site. */
export function ClubVideoHardwarePanel({ clubId, profile, onRequestQuote }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const offer = VIDEO_OFFERS.proday_pro_camera;

  return (
    <View style={styles.wrap}>
      <ProDayText variant="eyebrow" accent>
        Caméras & vidéo
      </ProDayText>
      <ProDayText variant="section" style={styles.title}>
        Vous avez une caméra ? Connectez-la. Sinon, on peut fournir.
      </ProDayText>
      <ProDayText variant="caption" muted>
        La caméra n’est jamais obligatoire. Smartphone, tablette, Veo, XbotGo ou import :
        le club choisit. Les connecteurs fabricants s’activent au fur et à mesure — pas de
        faux highlights « live ».
      </ProDayText>

      <View style={styles.vendors}>
        {VIDEO_VENDORS.map((v) => (
          <View
            key={v.id}
            style={[styles.vendorChip, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
          >
            <ProDayText variant="caption">{v.label}</ProDayText>
          </View>
        ))}
      </View>

      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="section">{offer.label}</ProDayText>
        <ProDayText variant="caption" muted>
          {offer.tagline}
        </ProDayText>
        {offer.includes.slice(0, 5).map((line) => (
          <ProDayText key={line} variant="caption" muted>
            · {line}
          </ProDayText>
        ))}
        <PressableSpring
          onPress={onRequestQuote}
          scaleTo={0.97}
          haptic
          style={[styles.cta, { backgroundColor: colors.accent }]}
        >
          <ProDayText variant="caption" style={styles.ctaInverse}>
            Parler offres Club / vidéo
          </ProDayText>
        </PressableSpring>
      </ProDaySurface>

      <ClubCamerasPanel clubId={clubId} profile={profile} />
    </View>
  );
}

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    wrap: { gap: spacing.sm },
    title: { fontWeight: '800', letterSpacing: -0.3 },
    vendors: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    vendorChip: {
      borderWidth: 1,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
    cta: {
      marginTop: spacing.sm,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      alignSelf: 'flex-start',
    },
    ctaInverse: { color: '#fff', fontWeight: '800' },
  });
}
