import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  SEASON_PRIORITY_OPTIONS,
  type SeasonPriorityOption,
} from '../../../content/seasonPriority';
import { spacing } from '../../../theme/designTokens';

type Props = {
  onSelect: (option: SeasonPriorityOption) => void;
};

/**
 * Première question d’onboarding : oriente vers le bon pôle
 * avant le carousel (évite que l’utilisateur se perde).
 */
export const SeasonPriorityStep: React.FC<Props> = ({ onSelect }) => {
  return (
    <View style={styles.root} accessibilityViewIsModal>
      <LinearGradient
        colors={['#05060a', '#0a1a3a', '#05060a']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <View style={styles.content}>
        <Text style={styles.kicker}>Bienvenue sur ProDay</Text>
        <Text style={styles.title}>Quelle est votre priorité cette saison ?</Text>
        <Text style={styles.sub}>
          Une réponse suffit : on vous emmène tout de suite vers l’espace qui vous
          concerne.
        </Text>
        <View style={styles.list}>
          {SEASON_PRIORITY_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => onSelect(option)}
              accessibilityRole="button"
              accessibilityLabel={option.label}
            >
              <Text style={styles.cardTitle}>{option.label}</Text>
              <Text style={styles.cardHint}>{option.hint}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1001,
    elevation: 1001,
    backgroundColor: '#05060a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  kicker: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  sub: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  list: {
    gap: 10,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardPressed: {
    backgroundColor: 'rgba(0,84,240,0.28)',
    borderColor: 'rgba(0,84,240,0.55)',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cardHint: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    lineHeight: 18,
  },
});
