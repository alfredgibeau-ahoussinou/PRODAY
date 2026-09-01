import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput } from 'react-native';
import { Icon } from '../../../components/ui/Icon';
import { PressableSpring, AnimatedEntrance } from '../../../components/motion';
import { colors, radius, spacing } from '../../../theme/designTokens';

export interface EncouragementMessage {
  id: string;
  authorName: string;
  authorRole?: string;
  clubOrTeam: string;
  text: string;
  claps: number;
  createdAt: string;
  hasClapped?: boolean;
}

const INITIAL_ENCOURAGEMENTS: EncouragementMessage[] = [
  {
    id: 'enc-1',
    authorName: 'Alexandre M.',
    authorRole: 'Supporter fidèle',
    clubOrTeam: 'Seniors 1 · FC Grand Ouest',
    text: 'Allez les gars ! Tout le club est derrière vous pour le match de coupe ce week-end ! 💪🔴🔵',
    claps: 24,
    createdAt: 'Il y a 10 min',
  },
  {
    id: 'enc-2',
    authorName: 'Sophie & Famille',
    authorRole: 'Parent U15',
    clubOrTeam: 'U15 A',
    text: 'Bravo pour la combativité aux entraînements cette semaine. Faites-vous plaisir sur le terrain ! ⚽🔥',
    claps: 18,
    createdAt: 'Il y a 45 min',
  },
  {
    id: 'enc-3',
    authorName: 'Kop Tribune Nord',
    authorRole: 'Groupe supporters',
    clubOrTeam: 'Club omnisports',
    text: '90 minutes pour tout donner, fierté et passion ! Allez le club ! 📣🙌',
    claps: 42,
    createdAt: 'Il y a 2 h',
  },
];

export function SupporterEncouragementFeed() {
  const [messages, setMessages] = useState<EncouragementMessage[]>(INITIAL_ENCOURAGEMENTS);
  const [draft, setDraft] = useState('');
  const [selectedTeam] = useState('Équipe Première');

  const handleSend = () => {
    if (!draft.trim()) return;
    const newMsg: EncouragementMessage = {
      id: `enc-${Date.now()}`,
      authorName: 'Moi (Supporter)',
      authorRole: 'Supporter',
      clubOrTeam: selectedTeam,
      text: draft.trim(),
      claps: 1,
      createdAt: 'À l’instant',
      hasClapped: true,
    };
    setMessages([newMsg, ...messages]);
    setDraft('');
  };

  const handleClap = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === id) {
          const nextClapped = !msg.hasClapped;
          return {
            ...msg,
            hasClapped: nextClapped,
            claps: msg.claps + (nextClapped ? 1 : -1),
          };
        }
        return msg;
      }),
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconBadge}>
            <Icon name="heart" size={16} color={colors.brand} />
          </View>
          <View>
            <Text style={styles.title}>Mur d'encouragements</Text>
            <Text style={styles.subtitle}>Soutenez vos équipes et joueurs favoris</Text>
          </View>
        </View>
      </View>

      {/* Draft Box */}
      <View style={styles.composerCard}>
        <TextInput
          style={styles.input}
          placeholder="Envoyez vos encouragements aux joueurs…"
          placeholderTextColor={colors.textMuted}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <View style={styles.composerBottom}>
          <View style={styles.teamTag}>
            <Icon name="football" size={12} color={colors.brand} />
            <Text style={styles.teamTagLabel}>{selectedTeam}</Text>
          </View>
          <PressableSpring
            onPress={handleSend}
            disabled={!draft.trim()}
            scaleTo={0.96}
            haptic
            style={[styles.sendBtn, !draft.trim() && styles.sendBtnDisabled]}
          >
            <Icon name="share" size={13} color="#000" />
            <Text style={styles.sendBtnLabel}>Publier</Text>
          </PressableSpring>
        </View>
      </View>

      {/* Feed List */}
      <View style={styles.feedList}>
        {messages.map((item, index) => (
          <AnimatedEntrance key={item.id} kind="fadeUp" index={index} delayStep={24}>
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.authorAvatar}>
                  <Text style={styles.avatarLetter}>{item.authorName.charAt(0)}</Text>
                </View>
                <View style={styles.authorMeta}>
                  <Text style={styles.authorName}>{item.authorName}</Text>
                  <Text style={styles.cardContext}>
                    {item.clubOrTeam} · {item.createdAt}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardBody}>{item.text}</Text>

              <View style={styles.cardBottom}>
                <PressableSpring
                  onPress={() => handleClap(item.id)}
                  scaleTo={0.94}
                  haptic
                  style={[styles.clapBtn, item.hasClapped && styles.clapBtnActive]}
                >
                  <Icon
                    name={item.hasClapped ? 'heart' : 'heart-outline'}
                    size={14}
                    color={item.hasClapped ? colors.brand : colors.textMuted}
                  />
                  <Text
                    style={[styles.clapCount, item.hasClapped && styles.clapCountActive]}
                  >
                    {item.claps}
                  </Text>
                </PressableSpring>
              </View>
            </View>
          </AnimatedEntrance>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
  composerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    gap: spacing.sm,
  },
  input: {
    color: colors.text,
    fontSize: 14,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  composerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  teamTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  teamTagLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brand,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnLabel: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  feedList: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarLetter: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: '800',
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  cardContext: {
    color: colors.textMuted,
    fontSize: 11,
  },
  cardBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginVertical: 2,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  clapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  clapBtnActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  clapCount: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  clapCountActive: {
    color: colors.brand,
  },
});
