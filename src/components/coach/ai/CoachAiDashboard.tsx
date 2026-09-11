import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { CoachText } from '../coachPortalUi';
import { Icon } from '../../ui/Icon';
import type { IconName } from '../../ui/iconNames';
import { PressableSpring } from '../../motion';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import { radius, spacing } from '../../../theme/designTokens';
import { CoachPane } from '../CoachScreenHeader';
import { getCoachPageIdentity } from '../../../content/coachPageIdentity';

export type AiPageId = 'training' | 'opponent' | 'tactics' | 'chat';

interface CoachAiDashboardProps {
  onSelectPage: (page: AiPageId) => void;
}

export function CoachAiDashboard({ onSelectPage }: CoachAiDashboardProps) {
  const { tokens } = useCoachTheme();

  const menuItems: { id: AiPageId; title: string; subtitle: string; icon: IconName }[] = [
    {
      id: 'training',
      title: 'Préparer une séance',
      subtitle: 'Générer des exercices et séances adaptées (Blood Bath, Bloc bas, CPA, etc.).',
      icon: 'football',
    },
    {
      id: 'opponent',
      title: 'Analyse Tactique & Adversaire',
      subtitle: 'Décortiquer le plan de jeu adverse (contrer 4-3-3, 3-5-2, bloc bas).',
      icon: 'shield',
    },
    {
      id: 'tactics',
      title: 'Alignement & Schémas Tactiques IA',
      subtitle: 'Configurer le 11 idéal parmi 24 schémas et l’appliquer directement sur le terrain de l’Équipe.',
      icon: 'grid',
    },
    {
      id: 'chat',
      title: 'Chat Copilote IA',
      subtitle: 'Posez vos questions libres sur la causerie, le management ou la stratégie.',
      icon: 'chatbubbles',
    },
  ];

  return (
    <CoachPane title={getCoachPageIdentity('coach_ia').title}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Icon name="star-four-points" size={32} color={tokens.accent} />
          <CoachText style={[styles.headerTitle, { color: tokens.foreground }]}>
            Copilote IA Entraîneur
          </CoachText>
          <CoachText style={[styles.headerSub, { color: tokens.muted }]}>
            Votre assistant personnel pour optimiser vos performances.
          </CoachText>
        </View>

        <View style={styles.grid}>
          {menuItems.map((item) => (
            <PressableSpring
              key={item.id}
              style={[styles.tile, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
              onPress={() => onSelectPage(item.id)}
            >
              <View style={[styles.iconWrap, { backgroundColor: tokens.accent + '22' }]}>
                <Icon name={item.icon} size={24} color={tokens.accent} />
              </View>
              <CoachText style={[styles.tileTitle, { color: tokens.foreground }]}>{item.title}</CoachText>
              <CoachText style={[styles.tileSub, { color: tokens.muted }]}>{item.subtitle}</CoachText>
            </PressableSpring>
          ))}
        </View>
      </ScrollView>
    </CoachPane>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  headerSub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: spacing.xl,
  },
  grid: {
    gap: spacing.md,
  },
  tile: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tileTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  tileSub: {
    fontSize: 13,
    lineHeight: 18,
  },
});
