import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { PressableSpring } from '../../components/motion';
import { NextText } from './NextText';
import { NextCard } from './NextCard';
import { nextSpacing, nextRadius } from '../design-system/tokens';
import type { NearbyEntity } from '../../features/v3/models';

type GeoRadarProps = {
  items: NearbyEntity[];
  onItemPress?: (item: NearbyEntity) => void;
  onRequestLocation?: () => void;
};

/** Radar géolocalisé — joueurs, matchs, événements proches. */
export const GeoRadar: React.FC<GeoRadarProps> = ({
  items,
  onItemPress,
  onRequestLocation,
}) => (
  <View style={styles.wrap}>
    <View style={styles.head}>
      <NextText variant="section">Radar local</NextText>
      {onRequestLocation ? (
        <PressableSpring onPress={onRequestLocation} scaleTo={0.96} haptic>
          <NextText variant="micro" accent>
            Actualiser GPS
          </NextText>
        </PressableSpring>
      ) : null}
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
      {items.length === 0 ? (
        <NextCard variant="glass" style={styles.empty}>
          <NextText variant="caption" muted>
            Activez la géoloc pour découvrir matchs et joueurs proches.
          </NextText>
        </NextCard>
      ) : (
        items.map((item) => (
          <PressableSpring
            key={item.id}
            onPress={() => onItemPress?.(item)}
            scaleTo={0.97}
            haptic
          >
            <NextCard variant="raised" style={styles.chip}>
              <NextText variant="micro" accent>
                {item.kind}
              </NextText>
              <NextText variant="section" numberOfLines={2}>
                {item.title}
              </NextText>
              <NextText variant="caption" muted numberOfLines={1}>
                {item.subtitle}
              </NextText>
              {item.distanceKm != null ? (
                <NextText variant="micro" accent>
                  {item.distanceKm < 1
                    ? `${Math.round(item.distanceKm * 1000)} m`
                    : `${item.distanceKm.toFixed(1)} km`}
                </NextText>
              ) : null}
            </NextCard>
          </PressableSpring>
        ))
      )}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  wrap: { gap: nextSpacing.sm },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rail: { gap: nextSpacing.sm, paddingRight: nextSpacing.lg },
  chip: {
    width: 160,
    minHeight: 110,
    gap: 4,
  },
  empty: { width: 260, padding: nextSpacing.md },
});
