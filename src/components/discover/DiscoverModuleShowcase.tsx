import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ShowcaseImageBackground } from '../ui/ShowcaseImageBackground';
import { PRODAY_MODULES, type ProDayModuleId } from '../../content/prodayModules';
import { useShowcaseImages } from '../../hooks/useShowcaseImages';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';

const GRID_IDS: ProDayModuleId[] = ['matchs', 'arena', 'sponsors'];
const FEATURED_ID: ProDayModuleId = 'recrutement';
const WIDE_ID: ProDayModuleId = 'gestion';

interface DiscoverModuleShowcaseProps {
  onModulePress: (id: ProDayModuleId) => void;
  liveRecruitment?: boolean;
}

const ModuleCard: React.FC<{
  id: ProDayModuleId;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  variant: 'featured' | 'tile' | 'wide';
  live?: boolean;
  onPress: () => void;
  image: number;
}> = ({ id, title, subtitle, icon, variant, live, onPress, image }) => {
  const isFeatured = variant === 'featured';
  const isWide = variant === 'wide';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isFeatured && styles.cardFeatured,
        isWide && styles.cardWide,
        pressed && styles.cardPressed,
      ]}
    >
      <ShowcaseImageBackground
        source={image}
        variant={isWide ? 'wide' : 'card'}
        style={[styles.image, isFeatured && styles.imageFeatured, isWide && styles.imageWide]}
        imageStyle={styles.imageInner}
      >
        <View style={styles.imageOverlay} />
        <View style={[styles.iconBadge, isWide && styles.iconBadgeWide]}>
          <Icon name={icon} size={isFeatured ? 20 : 18} color={colors.brandInverse} variant="filled" />
        </View>
      </ShowcaseImageBackground>
      <View style={styles.body}>
        <View style={styles.bodyTop}>
          <Text style={[styles.title, isWide && styles.titleWide]} numberOfLines={1}>
            {title}
          </Text>
          {live ? (
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>Live</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.sub} numberOfLines={2}>
          {subtitle}
        </Text>
        <View style={styles.chevronRow}>
          <Text style={styles.chevronLabel}>Ouvrir</Text>
          <Icon name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      </View>
    </Pressable>
  );
};

export const DiscoverModuleShowcase: React.FC<DiscoverModuleShowcaseProps> = ({
  onModulePress,
  liveRecruitment,
}) => {
  const showcase = useShowcaseImages();
  const moduleImages = useMemo(
    (): Record<ProDayModuleId, number> => ({
      recrutement: showcase.mercatoDetection,
      matchs: showcase.friendlyMatch,
      gestion: showcase.expTeam,
      arena: showcase.arenaTournament,
      sponsors: showcase.coachFounder,
    }),
    [showcase]
  );
  const byId = Object.fromEntries(PRODAY_MODULES.map((m) => [m.id, m])) as Record<
    ProDayModuleId,
    (typeof PRODAY_MODULES)[0]
  >;
  const featured = byId[FEATURED_ID];
  const wide = byId[WIDE_ID];

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>Modules</Text>
      <Text style={styles.sectionTitle}>Tout votre club, un seul endroit</Text>

      <ModuleCard
        id={featured.id}
        title={featured.title}
        subtitle={featured.subtitle}
        icon={featured.icon}
        variant="featured"
        live={liveRecruitment}
        image={moduleImages[featured.id]}
        onPress={() => onModulePress(featured.id)}
      />

      <View style={styles.grid}>
        {GRID_IDS.map((id) => {
          const mod = byId[id];
          return (
            <View key={id} style={styles.gridCell}>
              <ModuleCard
                id={mod.id}
                title={mod.title}
                subtitle={mod.subtitle}
                icon={mod.icon}
                variant="tile"
                image={moduleImages[mod.id]}
                onPress={() => onModulePress(mod.id)}
              />
            </View>
          );
        })}
      </View>

      <ModuleCard
        id={wide.id}
        title={wide.title}
        subtitle={wide.subtitle}
        icon={wide.icon}
        variant="wide"
        image={moduleImages[wide.id]}
        onPress={() => onModulePress(wide.id)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    marginTop: -spacing.sm,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardFeatured: {},
  cardWide: {},
  cardPressed: { opacity: 0.92 },
  image: {
    height: 100,
    justifyContent: 'flex-end',
  },
  imageFeatured: { height: 128 },
  imageWide: { height: 72 },
  imageInner: { opacity: 0.92 },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.38)',
  },
  iconBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeWide: {
    width: 36,
    height: 36,
  },
  body: {
    padding: spacing.md,
    gap: 4,
  },
  bodyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  titleWide: { fontSize: 15 },
  sub: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  liveBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 0.3,
  },
  chevronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.xs,
  },
  chevronLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridCell: {
    width: '48.5%',
    flexGrow: 1,
  },
});
