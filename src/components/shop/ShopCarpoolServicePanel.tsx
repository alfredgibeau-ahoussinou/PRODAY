import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface ShopCarpoolServicePanelProps {
  onOpenCarpool: () => void;
  onReserveAsPassenger: () => void;
}

const STEPS = [
  { icon: 'calendar' as const, title: 'Choisissez un événement', body: 'Match, entraînement ou détection de votre calendrier.' },
  { icon: 'car' as const, title: 'Trouvez un conducteur', body: 'Consultez les trajets proposés par vos coéquipiers.' },
  { icon: 'checkmark-circle' as const, title: 'Réservez votre place', body: 'Inscription en un clic — le conducteur est notifié.' },
];

export const ShopCarpoolServicePanel: React.FC<ShopCarpoolServicePanelProps> = ({
  onOpenCarpool,
  onReserveAsPassenger,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.lead}>
        <ProDayText variant="section">Covoiturage équipe</ProDayText>
        <ProDayText variant="body" muted>
          Inscrivez-vous comme passager pour vos déplacements club — gratuit entre coéquipiers.
        </ProDayText>
      </View>

      {STEPS.map((step) => (
        <ProDaySurface key={step.title} variant="module" style={[styles.step, { borderColor: colors.border }]}>
          <View style={[styles.stepIcon, { backgroundColor: colors.accentSoft }]}>
            <Icon name={step.icon} size={20} color={colors.accent} variant="filled" />
          </View>
          <View style={styles.stepCopy}>
            <ProDayText variant="section">{step.title}</ProDayText>
            <ProDayText variant="body" muted>
              {step.body}
            </ProDayText>
          </View>
        </ProDaySurface>
      ))}

      <TouchableOpacity onPress={onReserveAsPassenger} activeOpacity={0.9}>
        <ProDayGradient kind="cta" style={styles.primaryCta}>
          <Icon name="car" size={18} color="#FFFFFF" variant="filled" />
          <ProDayText variant="caption" inverse style={styles.ctaText}>
            S&apos;inscrire comme passager
          </ProDayText>
        </ProDayGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryCta, { borderColor: colors.border }]}
        onPress={onOpenCarpool}
      >
        <ProDayText variant="caption" accent style={styles.ctaText}>
          Ouvrir le covoiturage
        </ProDayText>
        <Icon name="chevron-forward" size={16} color={colors.accent} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  lead: { gap: spacing.xs, marginBottom: spacing.xs },
  step: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCopy: { flex: 1, gap: 4 },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  ctaText: { fontWeight: '800' },
});
