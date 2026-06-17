import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../ui/Icon';
import type { GeoMarker } from '../../core/types/geo';
import { markerTint } from '../../utils/mapRegion';

type PinKind = GeoMarker['kind'] | 'user';

interface GeoMapPinProps {
  kind: PinKind;
  accent: string;
  selected?: boolean;
}

/** Marqueur carte — pastille ProDay avec icône. */
export const GeoMapPin: React.FC<GeoMapPinProps> = ({ kind, accent, selected = false }) => {
  const tint = markerTint(kind, accent);
  const icon =
    kind === 'event' ? 'calendar' : kind === 'field' ? 'location' : kind === 'user' ? 'person' : 'football';

  return (
    <View style={[styles.wrap, selected && styles.wrapSelected]}>
      <View style={[styles.bubble, { backgroundColor: tint, borderColor: '#fff' }]}>
        <Icon name={icon} size={kind === 'user' ? 11 : 10} color="#fff" />
      </View>
      <View style={[styles.stem, { backgroundColor: tint }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  wrapSelected: {
    transform: [{ scale: 1.08 }],
  },
  bubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 4,
  },
  stem: {
    width: 3,
    height: 8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginTop: -1,
  },
});
