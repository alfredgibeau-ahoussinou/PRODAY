import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from 'react-native';
import type { StandaloneCarpoolOffer } from '../../models/StandaloneCarpoolOffer';
import type { User } from '../../models/User';
import { StandaloneCarpoolRideCard } from './StandaloneCarpoolRideCard';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';

const CARD_WIDTH = Dimensions.get('window').width - spacing.lg * 2;

interface CarpoolDiscoverDeckProps {
  offers: StandaloneCarpoolOffer[];
  profile: User;
  driverHistory?: StandaloneCarpoolOffer[];
  onUpdated: () => void;
}

/** Deck horizontal interactif des trajets à réserver. */
export const CarpoolDiscoverDeck: React.FC<CarpoolDiscoverDeckProps> = ({
  offers,
  profile,
  driverHistory = [],
  onUpdated,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index != null) setIndex(first.index);
    },
  ).current;

  if (offers.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
        <ProDayText variant="section">{t('carpool.reserve.empty.title')}</ProDayText>
        <ProDayText variant="body" muted style={{ textAlign: 'center' }}>
          {t('carpool.reserve.empty.subtitle')}
        </ProDayText>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <ProDayText variant="section">{t('carpool.hub.discoverTitle')}</ProDayText>
        <ProDayText variant="caption" muted>
          {t('carpool.hub.discoverCount', { n: offers.length, i: index + 1 })}
        </ProDayText>
      </View>
      <FlatList
        data={offers}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + spacing.sm}
        contentContainerStyle={styles.list}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        renderItem={({ item }) => (
          <View style={[styles.card, { width: CARD_WIDTH }]}>
            <StandaloneCarpoolRideCard
              offer={item}
              profile={profile}
              driverHistory={driverHistory}
              onUpdated={onUpdated}
            />
          </View>
        )}
      />
      <View style={styles.dots}>
        {offers.slice(0, 8).map((o, i) => (
          <View
            key={o.id}
            style={[
              styles.dot,
              {
                backgroundColor: i === index ? colors.accent : colors.border,
                width: i === index ? 16 : 6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  card: {},
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  dot: { height: 6, borderRadius: 3 },
  empty: {
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
});
