import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import type { UnifiedMatch } from '../../../services/supporterFootball';
import { SUPPORTER_SPACE, SUPPORTER_SPACE_COPY } from '../theme/supporterSpaceTheme';
import { DateStrip } from './DateStrip';
import { LiveMatchCard } from './LiveMatchCard';
import { MatchCard } from './MatchCard';

type Props = {
  greetingName?: string | null;
  selectedDateKey: string;
  onSelectDate: (key: string) => void;
  heroMatch: UnifiedMatch | null;
  onOpenMatch: (match: UnifiedMatch) => void;
  onSearch: () => void;
  onNotif?: () => void;
};

export const SpaceHero: React.FC<Props> = ({
  greetingName,
  selectedDateKey,
  onSelectDate,
  heroMatch,
  onOpenMatch,
  onSearch,
  onNotif,
}) => {
  const name = (greetingName || '').trim() || 'Supporter';

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <ProDayText variant="caption" style={styles.avatarText}>
            {name.slice(0, 1).toUpperCase()}
          </ProDayText>
        </View>
        <View style={{ flex: 1 }}>
          <ProDayText variant="caption" style={styles.hello}>
            {name},
          </ProDayText>
          <ProDayText variant="title" style={styles.welcome}>
            {SUPPORTER_SPACE_COPY.welcomeBack}
          </ProDayText>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={onSearch} style={styles.iconBtn} accessibilityLabel="Recherche">
            <Icon name="search" size={18} color={SUPPORTER_SPACE.accent} />
          </Pressable>
          <Pressable
            onPress={onNotif}
            style={styles.iconBtn}
            accessibilityLabel={SUPPORTER_SPACE_COPY.notifStub}
          >
            <Icon name="notifications" size={18} color={SUPPORTER_SPACE.muted} />
          </Pressable>
        </View>
      </View>

      <DateStrip selectedKey={selectedDateKey} onSelect={onSelectDate} />

      <View style={styles.heroSlot}>
        {heroMatch ? (
          heroMatch.status === 'live' || heroMatch.status === 'halftime' ? (
            <LiveMatchCard match={heroMatch} onPress={() => onOpenMatch(heroMatch)} />
          ) : (
            <MatchCard match={heroMatch} onPress={() => onOpenMatch(heroMatch)} />
          )
        ) : (
          <View style={styles.emptyHero}>
            <ProDayText variant="body" style={styles.emptyText}>
              {SUPPORTER_SPACE_COPY.emptyLive}
            </ProDayText>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 18, gap: 14 },
  topRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SUPPORTER_SPACE.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: SUPPORTER_SPACE.onBlue, fontWeight: '700', fontSize: 16 },
  hello: { color: SUPPORTER_SPACE.muted, fontSize: 13 },
  welcome: { color: SUPPORTER_SPACE.foreground, fontSize: 20, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SUPPORTER_SPACE.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
  },
  heroSlot: { marginTop: 4 },
  emptyHero: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: SUPPORTER_SPACE.accent,
  },
  emptyText: { color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
});
