import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import type { UnifiedMatch } from '../../../services/supporterFootball';
import { SUPPORTER_SPACE, SUPPORTER_SPACE_COPY } from '../theme/supporterSpaceTheme';
import { LiveMatchCard } from './LiveMatchCard';
import { MatchCard } from './MatchCard';

type Props = {
  heroMatch: UnifiedMatch | null;
  onOpenMatch: (match: UnifiedMatch) => void;
  onSearch: () => void;
  onNotif?: () => void;
};

export const SpaceHero: React.FC<Props> = ({ heroMatch, onOpenMatch, onSearch, onNotif }) => (
  <View style={styles.wrap}>
    <View style={styles.topRow}>
      <View style={{ flex: 1 }}>
        <ProDayText variant="brand" style={styles.brand}>
          PRODAY
        </ProDayText>
        <ProDayText variant="title" style={styles.title}>
          {SUPPORTER_SPACE_COPY.heroTitle}
        </ProDayText>
        <ProDayText variant="body" style={styles.sub}>
          {SUPPORTER_SPACE_COPY.heroSubtitle}
        </ProDayText>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onSearch} style={styles.iconBtn} accessibilityLabel="Recherche">
          <Icon name="search" size={20} color={SUPPORTER_SPACE.foreground} />
        </Pressable>
        <Pressable
          onPress={onNotif}
          style={styles.iconBtn}
          accessibilityLabel={SUPPORTER_SPACE_COPY.notifStub}
        >
          <Icon name="notifications" size={20} color={SUPPORTER_SPACE.muted} />
        </Pressable>
      </View>
    </View>
    {heroMatch ? (
      heroMatch.status === 'live' || heroMatch.status === 'halftime' ? (
        <LiveMatchCard match={heroMatch} onPress={() => onOpenMatch(heroMatch)} />
      ) : (
        <MatchCard match={heroMatch} onPress={() => onOpenMatch(heroMatch)} />
      )
    ) : (
      <View style={styles.emptyHero}>
        <ProDayText variant="body" style={styles.sub}>
          {SUPPORTER_SPACE_COPY.emptyLive}
        </ProDayText>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUPPORTER_SPACE.border,
  },
  topRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  brand: { color: SUPPORTER_SPACE.bright, fontSize: 13, letterSpacing: 1.2, marginBottom: 4 },
  title: { color: SUPPORTER_SPACE.foreground, fontSize: 22, marginBottom: 4 },
  sub: { color: SUPPORTER_SPACE.muted, fontSize: 13 },
  actions: { gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: SUPPORTER_SPACE.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
  },
  emptyHero: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: SUPPORTER_SPACE.surface,
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
  },
});
