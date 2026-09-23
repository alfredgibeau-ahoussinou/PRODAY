import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../../theme/designTokens';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profile.service';
import type { Membership } from '../../models/Membership';

interface MultiClubSelectorScreenProps {
  memberships: Membership[];
  /** Rafraîchit l'état d'adhésion après le choix (l'adhésion passe alors en club actif). */
  onClubChosen: (clubId: string) => Promise<void> | void;
}

/**
 * Sélecteur d'espace multi-clubs — destination `multi_club` du routeur d'adhésion.
 * Affiché quand un utilisateur réel a plusieurs adhésions actives et aucun choix
 * enregistré : il choisit explicitement son espace (jamais de retombée silencieuse
 * sur le premier club).
 */
export function MultiClubSelectorScreen({
  memberships,
  onClubChosen,
}: MultiClubSelectorScreenProps) {
  const [submitting, setSubmitting] = React.useState<string | null>(null);

  const handleSelect = async (clubId: string) => {
    if (submitting) return;
    setSubmitting(clubId);
    try {
      await onClubChosen(clubId);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Ionicons name="business" size={26} color={colors.accent} />
          </View>
          <Text style={styles.title}>Choisissez votre club</Text>
          <Text style={styles.subtitle}>
            Vous êtes membre de plusieurs clubs. Sélectionnez l'espace à ouvrir —
            vous pourrez changer à tout moment.
          </Text>
        </View>

        <View style={styles.list}>
          {memberships.map((m) => {
            const isBusy = submitting === m.club_id;
            return (
              <TouchableOpacity
                key={m.id}
                style={styles.clubCard}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Ouvrir l'espace ${m.club_name ?? 'du club'}`}
                disabled={Boolean(submitting)}
                onPress={() => handleSelect(m.club_id)}
              >
                <View style={styles.clubIcon}>
                  <Ionicons
                    name="shield"
                    size={22}
                    color={isBusy ? colors.brandLight : colors.accent}
                  />
                </View>
                <View style={styles.clubInfo}>
                  <Text style={styles.clubName} numberOfLines={1}>
                    {m.club_name ?? 'Club ProDay'}
                  </Text>
                  <Text style={styles.clubRole}>
                    {roleLabel(m.role)} · Adhésion validée
                  </Text>
                </View>
                {isBusy ? (
                  <View style={styles.arrowPlaceholder} />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.footnote}>
          Votre choix est conservé pour vos prochaines sessions.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function roleLabel(role?: string): string {
  switch (role) {
    case 'player':
      return 'Joueur';
    case 'coach':
      return 'Coach';
    case 'club':
      return 'Dirigeant';
    default:
      return 'Membre';
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: colors.text,
    textAlign: 'center',
    fontFamily: typography.fontFamily,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 420,
    fontFamily: typography.fontFamily,
  },
  list: {
    gap: spacing.md,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clubIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubInfo: {
    flex: 1,
    gap: 2,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontFamily: typography.fontFamily,
  },
  clubRole: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
  },
  arrowPlaceholder: {
    width: 20,
    height: 20,
  },
  footnote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: typography.fontFamily,
  },
});
