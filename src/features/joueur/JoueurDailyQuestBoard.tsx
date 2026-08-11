import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import {
  JoueurHudCorners,
  JoueurSectionCard,
} from '../../components/player/joueurPortalUi';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import {
  JOUEUR_DAILY_QUESTS,
  type JoueurDailyQuestDef,
} from './constants';
import { spacing } from '../../theme/designTokens';
import { joueurGamePress } from './joueurSfx';

type Props = {
  accent: string;
  completedIds: string[];
  onClaim: (quest: JoueurDailyQuestDef) => void;
  onHintTab?: (tab: NonNullable<JoueurDailyQuestDef['tabHint']>) => void;
  title?: string;
  quests?: JoueurDailyQuestDef[];
};

/** Board de quêtes daily — catalogue injectable par âge. */
export function JoueurDailyQuestBoard({
  accent,
  completedIds,
  onClaim,
  onHintTab,
  title = 'QUÊTES DU JOUR',
  quests = JOUEUR_DAILY_QUESTS,
}: Props) {
  const done = useMemo(() => new Set(completedIds), [completedIds]);
  const remaining = quests.filter((q) => !done.has(q.id)).length;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <ProDayText variant="caption" style={[styles.kicker, { color: accent }]}>
          {title}
        </ProDayText>
        <ProDayText variant="caption" style={styles.count}>
          {quests.length - remaining}/{quests.length}
        </ProDayText>
      </View>

      {quests.map((quest) => {
        const claimed = done.has(quest.id);
        return (
          <PressableSpring
            key={quest.id}
            disabled={claimed}
            onPress={() => {
              if (claimed) return;
              joueurGamePress();
              if (quest.id === 'daily-login' || quest.id === 'daily-train') {
                onClaim(quest);
                return;
              }
              if (quest.tabHint && onHintTab) {
                onHintTab(quest.tabHint);
                onClaim(quest);
                return;
              }
              onClaim(quest);
            }}
            scaleTo={0.98}
            style={[
              styles.row,
              {
                borderColor: claimed ? `${accent}33` : JOUEUR_SITE.border,
                backgroundColor: claimed ? 'rgba(255,255,255,0.03)' : JOUEUR_SITE.surface,
                opacity: claimed ? 0.55 : 1,
              },
            ]}
          >
            <JoueurHudCorners color={claimed ? JOUEUR_SITE.dim : accent} size={8} thickness={1.5} />
            <View style={styles.copy}>
              <ProDayText variant="section" style={styles.title}>
                {quest.title}
              </ProDayText>
              <ProDayText variant="caption" style={styles.body}>
                {quest.body}
              </ProDayText>
            </View>
            <View style={styles.reward}>
              <ProDayText variant="caption" style={[styles.xp, { color: accent }]}>
                {claimed ? 'OK' : `+${quest.xp} XP`}
              </ProDayText>
              {!claimed && quest.stars > 0 ? (
                <ProDayText variant="caption" style={styles.stars}>
                  +{quest.stars}★
                </ProDayText>
              ) : null}
            </View>
          </PressableSpring>
        );
      })}
    </View>
  );
}

/** Version compacte pour embeds. */
export function JoueurDailyQuestCard({
  accent,
  completedIds,
  onClaim,
  onHintTab,
}: Omit<Props, 'title'>) {
  return (
    <JoueurSectionCard title="Quêtes du jour" quest>
      <JoueurDailyQuestBoard
        accent={accent}
        completedIds={completedIds}
        onClaim={onClaim}
        onHintTab={onHintTab}
        title="OBJECTIFS"
      />
    </JoueurSectionCard>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  count: {
    color: JOUEUR_SITE.muted,
    fontWeight: '800',
    fontSize: 11,
  },
  row: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  copy: { flex: 1, gap: 2, minWidth: 0 },
  title: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '800',
    fontSize: 14,
  },
  body: {
    color: JOUEUR_SITE.muted,
    fontSize: 12,
  },
  reward: { alignItems: 'flex-end', gap: 2 },
  xp: { fontWeight: '900', fontSize: 11 },
  stars: { color: JOUEUR_SITE.xp, fontWeight: '800', fontSize: 10 },
});
