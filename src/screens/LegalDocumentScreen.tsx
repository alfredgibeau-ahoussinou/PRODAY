import React from 'react';
import { ScrollView, Text, StyleSheet, Linking, TouchableOpacity, View } from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import {
  getLegalDocument,
  LEGAL_CONTACT_EMAIL,
  type LegalDocumentId,
} from '../content/legalDocuments';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { colors, spacing, radius } from '../theme/designTokens';

interface LegalDocumentScreenProps {
  documentId: LegalDocumentId;
  onBack: () => void;
}

export const LegalDocumentScreen: React.FC<LegalDocumentScreenProps> = ({
  documentId,
  onBack,
}) => {
  const doc = getLegalDocument(documentId);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title={doc.title} onBack={onBack} centered />
      <Text style={styles.updated}>Mise à jour : {doc.updatedAt}</Text>

      {doc.sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.paragraphs.map((p, i) => (
            <Text key={`${section.title}-${i}`} style={styles.paragraph}>
              {p}
            </Text>
          ))}
        </View>
      ))}

      <View style={styles.contactBox}>
        <Text style={styles.contactLabel}>Question juridique ou données personnelles</Text>
        <TouchableOpacity onPress={() => void Linking.openURL(`mailto:${LEGAL_CONTACT_EMAIL}`)}>
          <Text style={styles.contactEmail}>{LEGAL_CONTACT_EMAIL}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Version complète disponible dans docs/legal/ du dépôt ProDay (publication store).
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
  },
  updated: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  contactBox: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  contactEmail: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.accent,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  footer: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 16,
  },
});
