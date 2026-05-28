import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { DISCOVER_FEATURES } from '../../content/founders';
import { Icon, type IconName } from '../ui/Icon';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';

const CARD_WIDTH = Dimensions.get('window').width - spacing.lg * 2 - spacing.md;

export const FeatureCarousel: React.FC = () => {
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / (CARD_WIDTH + spacing.md));
    if (i !== index && i >= 0 && i < DISCOVER_FEATURES.length) setIndex(i);
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={CARD_WIDTH + spacing.md}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {DISCOVER_FEATURES.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.card, shadows.card, { width: CARD_WIDTH }]}
            activeOpacity={0.92}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${f.color}18` }]}>
              <Icon name={f.icon as IconName} size={28} color={f.color} variant="filled" />
            </View>
            <Text style={styles.title}>{f.title}</Text>
            <Text style={styles.desc}>{f.description}</Text>
            <View style={[styles.accentBar, { backgroundColor: f.color }]} />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {DISCOVER_FEATURES.map((f, i) => (
          <TouchableOpacity
            key={f.id}
            onPress={() =>
              scrollRef.current?.scrollTo({
                x: i * (CARD_WIDTH + spacing.md),
                animated: true,
              })
            }
          >
            <View style={[styles.dot, i === index && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 168,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  desc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  accentBar: {
    position: 'absolute',
    bottom: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: 3,
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceMuted,
  },
  dotActive: { width: 24, backgroundColor: colors.brand },
});
