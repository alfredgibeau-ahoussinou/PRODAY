import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FOUNDERS, FOUNDERS_LETTER } from '../../content/founders';
import { FadeInView } from './FadeInView';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';

export const FoundersSection: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <FadeInView delay={400} style={styles.wrap}>
      <View style={[styles.card, shadows.card]}>
        <Text style={styles.kicker}>NOTRE HISTOIRE</Text>
        <Text style={styles.title}>{FOUNDERS_LETTER.title}</Text>
        <Text style={styles.intro}>{FOUNDERS_LETTER.intro}</Text>

        <View style={styles.avatars}>
          {FOUNDERS.map((f) => (
            <View key={f.id} style={styles.founderCol}>
              <View style={[styles.avatar, { backgroundColor: f.accent }]}>
                <Text style={styles.avatarText}>{f.initial}</Text>
              </View>
              <Text style={styles.founderName}>{f.name}</Text>
              <Text style={styles.founderRole}>{f.role}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => setExpanded((e) => !e)}
          activeOpacity={0.8}
        >
          <Text style={styles.expandText}>
            {expanded ? 'Réduire le message' : 'Lire le message complet'}
          </Text>
        </TouchableOpacity>

        {expanded && (
          <FadeInView delay={0} duration={350}>
            <Text style={styles.body}>{FOUNDERS_LETTER.body}</Text>
            <Text style={styles.signature}>{FOUNDERS_LETTER.signature}</Text>
            <Text style={styles.signNames}>
              {FOUNDERS.map((f) => f.name).join(' · ')}
            </Text>
          </FadeInView>
        )}
      </View>
    </FadeInView>
  );
};

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.brand,
    marginBottom: spacing.xs,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  intro: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  avatars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  founderCol: { flex: 1, alignItems: 'center', maxWidth: 72 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  avatarText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  founderName: { fontSize: 11, fontWeight: '700', color: colors.text, textAlign: 'center' },
  founderRole: { fontSize: 9, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  expandBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.pill,
  },
  expandText: { color: colors.brand, fontWeight: '700', fontSize: 13 },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  signature: {
    marginTop: spacing.lg,
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.text,
  },
  signNames: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: '700',
    color: colors.brand,
  },
});
