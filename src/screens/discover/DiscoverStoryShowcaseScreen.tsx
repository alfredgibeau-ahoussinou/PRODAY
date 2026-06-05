import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { ShowcaseImageBackground } from '../../components/ui/ShowcaseImageBackground';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Icon } from '../../components/ui/Icon';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { useShowcaseImages } from '../../hooks/useShowcaseImages';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import type { AppColors } from '../../theme/universeTheme';

const { height: H, width: W } = Dimensions.get('window');

interface DiscoverStoryShowcaseScreenProps {
  onBack: () => void;
}

type StoryCard = {
  key: string;
  title: string;
  subtitle: string;
  image: number;
  icon: Parameters<typeof Icon>[0]['name'];
};

export const DiscoverStoryShowcaseScreen: React.FC<DiscoverStoryShowcaseScreenProps> = ({
  onBack,
}) => {
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const showcase = useShowcaseImages();
  const y = useSharedValue(0);
  const cardH = Math.min(520, H - 190);
  const snap = cardH + spacing.lg;

  const cards: StoryCard[] = useMemo(
    () => [
      {
        key: 'discover',
        title: 'Tout commence ici',
        subtitle: 'Découvre la saison, les chiffres réels et l’énergie ProDay.',
        image: showcase.expDiscover,
        icon: 'home',
      },
      {
        key: 'team',
        title: 'Une équipe, un planning',
        subtitle: 'Convocations, détections et rituels de match — au même endroit.',
        image: showcase.expTeam,
        icon: 'calendar',
      },
      {
        key: 'profile',
        title: 'Ton profil, ta vitrine',
        subtitle: 'CV, photos, progression — prêt à convaincre.',
        image: showcase.expProfile,
        icon: 'person',
      },
      {
        key: 'messages',
        title: 'Messagerie fluide',
        subtitle: 'Reste en contact : coachs, clubs, recruteurs, sponsors.',
        image: showcase.expMessages,
        icon: 'chat',
      },
    ],
    [showcase]
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      y.value = e.contentOffset.y;
    },
  });

  return (
    <View style={rootStyle}>
      <ScreenHeader title="Expérience" subtitle="Stories interactives" onBack={onBack} />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        snapToInterval={snap}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {cards.map((card, i) => (
          <StoryCardView
            key={card.key}
            card={card}
            index={i}
            y={y}
            cardH={cardH}
            snap={snap}
            styles={styles}
            brandInverse={c.brandInverse}
          />
        ))}
        <View style={{ height: spacing.xl }} />
      </Animated.ScrollView>
    </View>
  );
};

const StoryCardView: React.FC<{
  card: StoryCard;
  index: number;
  y: SharedValue<number>;
  cardH: number;
  snap: number;
  styles: ReturnType<typeof createStyles>;
  brandInverse: string;
}> = ({ card, index, y, cardH, snap, styles, brandInverse }) => {
  const offset = index * snap;

  const wrapStyle = useAnimatedStyle(() => {
    const d = y.value - offset;
    return {
      transform: [
        { translateY: interpolate(d, [-snap, 0, snap], [10, 0, -10], Extrapolation.CLAMP) },
        { scale: interpolate(d, [-snap, 0, snap], [0.94, 1, 0.94], Extrapolation.CLAMP) },
      ],
      opacity: interpolate(d, [-snap, -snap * 0.2, 0, snap * 0.7], [0.2, 0.85, 1, 0.2], Extrapolation.CLAMP),
    };
  });

  const imageStyle = useAnimatedStyle(() => {
    const d = y.value - offset;
    return {
      transform: [
        { translateY: interpolate(d, [-snap, 0, snap], [-24, 0, 24], Extrapolation.CLAMP) },
        { scale: interpolate(d, [-snap, 0, snap], [1.12, 1, 1.12], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.card, shadows.card, wrapStyle, { height: cardH }]}>
      <ShowcaseImageBackground source={card.image} variant="hero" style={styles.hero} imageStyle={styles.heroImg}>
        <Animated.View style={[styles.heroMotion, imageStyle]} />
        <View style={styles.overlay} />
        <View style={styles.headerRow}>
          <View style={styles.iconPill}>
            <Icon name={card.icon} size={16} color={brandInverse} />
          </View>
          <Text style={styles.kicker}>PRODAY EXPERIENCE</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{card.title}</Text>
          <Text style={styles.subtitle}>{card.subtitle}</Text>
        </View>
      </ShowcaseImageBackground>
    </Animated.View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.lg,
    },
    hero: { flex: 1, justifyContent: 'space-between' },
    heroImg: { opacity: 0.9 },
    heroMotion: { ...StyleSheet.absoluteFillObject },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.34)' },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
    },
    iconPill: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    kicker: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.86)', letterSpacing: 2 },
    copy: { padding: spacing.lg },
    title: { fontSize: 24, fontWeight: '900', color: c.brandInverse, letterSpacing: -0.5, maxWidth: W - 64 },
    subtitle: { marginTop: spacing.sm, fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.84)', fontWeight: '600' },
  });
}
