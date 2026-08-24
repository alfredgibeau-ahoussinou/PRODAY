import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';
import { discoverHomeChrome } from './discoverPoleHome';

const TAB_BAR_H = 62;
const CHAPTER_TABS_H = 48;

/**
 * Dimensions adaptées au viewport mobile (rotation, petits écrans, encoches).
 */
export function useDiscoverMetrics() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const compact = height < 780 || width < 390;
    const chrome = discoverHomeChrome(width, height);
    const pad = compact ? spacing.md : spacing.lg;
    const pageWidth = width;
    const logoWidth = chrome.logoSize;
    const bottomInset = Math.max(TAB_BAR_CONTENT_INSET, insets.bottom + TAB_BAR_H);

    const headerTopPad = compact ? spacing.sm : spacing.md;
    const headerBlock = (compact ? 118 : 132) + headerTopPad;
    const tabsBlock = compact ? CHAPTER_TABS_H - 2 : CHAPTER_TABS_H;
    const scrollBottomPad = bottomInset + spacing.md;

    const pagerContentH = Math.max(
      300,
      height - headerBlock - tabsBlock - bottomInset
    );

    const introCardH = pagerContentH;
    const introHeroHeight = Math.round(introCardH * (compact ? 0.3 : 0.34));
    const cardWidth = pageWidth - pad * 2;
    const cardSnap = cardWidth + spacing.md;

    return {
      compact,
      pad,
      headerTopPad,
      pageWidth,
      logoWidth,
      homeChrome: chrome,
      bottomInset,
      contentAreaH: pagerContentH,
      pagerContentH,
      introPagerHeight: pagerContentH,
      introCardH,
      introHeroHeight,
      cardWidth,
      cardSnap,
      introTitleSize: compact ? 24 : 28,
      introTitleLine: compact ? 28 : 32,
      introBodySize: compact ? 14 : 15,
      introBodyLine: compact ? 20 : 22,
      introBodyPad: compact ? spacing.md : spacing.lg,
      scrollBottomPad,
      chapterTabsH: tabsBlock,
    };
  }, [width, height, insets.top, insets.bottom]);
}
