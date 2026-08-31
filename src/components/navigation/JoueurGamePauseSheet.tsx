import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/Icon';
import { formatTabBadge } from './tabBarShared';
import type { MainTabId } from '../../navigation/mainTabConfig';
import type { JoueurAgeGroup } from '../../utils/joueurExperienceTheme';
import { getJoueurGameTabLabel } from '../../content/joueurGameMenu';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { spacing } from '../../theme/designTokens';

const ICONS: Partial<Record<MainTabId, IconName>> = {
  messages: 'chat',
  covoiturage: 'car',
  sante: 'heart',
  shop: 'bag',
  reels: 'videocam',
  recrutement: 'people',
  feed: 'star-four-points',
  progression: 'stats-chart',
  famille: 'shield',
};

type Props = {
  visible: boolean;
  onClose: () => void;
  tabs: MainTabId[];
  activeTab: MainTabId;
  unreadCount?: number;
  accent: string;
  accentBright: string;
  ageGroup?: JoueurAgeGroup;
  onSelect: (tab: MainTabId) => void;
};

/** Menu secondaire — tiles glass, look companion FUT. */
export function JoueurGamePauseSheet({
  visible,
  onClose,
  tabs,
  activeTab,
  unreadCount = 0,
  accent,
  accentBright,
  ageGroup,
  onSelect,
}: Props) {
  return (
    <AnimatedModalShell visible={visible} onClose={onClose} variant="compact" handleOnly>
      <View style={styles.sheet}>
        <LinearGradient
          colors={['#0c1424', JOUEUR_SITE.bg]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.kicker, { color: accent }]}>PLUS</Text>
        <Text style={styles.title}>Plus d’actions</Text>
        <Text style={styles.sub}>Chat, boutique, covoit, santé…</Text>

        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {tabs.map((tab) => {
            const active = tab === activeTab;
            const label = getJoueurGameTabLabel(tab, ageGroup);
            const badge = tab === 'messages' ? unreadCount : 0;
            return (
              <PressableSpring
                key={tab}
                style={[
                  styles.tile,
                  {
                    borderColor: active ? accent : JOUEUR_SITE.border,
                    backgroundColor: active ? `${accent}22` : JOUEUR_SITE.surface,
                  },
                ]}
                onPress={() => onSelect(tab)}
                scaleTo={0.97}
                haptic
              >
                <Icon
                  name={ICONS[tab] ?? 'star'}
                  size={24}
                  color={active ? accentBright : JOUEUR_SITE.foreground}
                  variant={active ? 'filled' : 'outline'}
                />
                <Text
                  style={[
                    styles.tileLabel,
                    { color: active ? accentBright : JOUEUR_SITE.foreground },
                  ]}
                >
                  {label}
                </Text>
                {badge > 0 ? (
                  <View style={[styles.badge, { backgroundColor: JOUEUR_SITE.live }]}>
                    <Text style={styles.badgeText}>{formatTabBadge(badge)}</Text>
                  </View>
                ) : null}
              </PressableSpring>
            );
          })}
        </ScrollView>

        <PressableSpring
          onPress={onClose}
          scaleTo={0.97}
          style={[styles.resume, { backgroundColor: accent }]}
        >
          <Text style={styles.resumeText}>Retour</Text>
        </PressableSpring>
      </View>
    </AnimatedModalShell>
  );
}

const styles = StyleSheet.create({
  sheet: {
    padding: spacing.lg,
    gap: spacing.md,
    minHeight: 300,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  title: {
    color: JOUEUR_SITE.foreground,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: -6,
  },
  sub: { color: JOUEUR_SITE.muted, fontSize: 13, marginTop: -8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 4,
  },
  tile: {
    width: '47%',
    minHeight: 88,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
    gap: 8,
    justifyContent: 'flex-end',
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  resume: {
    marginTop: spacing.sm,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
  },
  resumeText: {
    color: '#070b14',
    fontWeight: '800',
    letterSpacing: 0.4,
    fontSize: 14,
  },
});
