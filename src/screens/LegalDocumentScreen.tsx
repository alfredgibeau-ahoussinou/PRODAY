import React, { useMemo } from 'react';
import { ScrollView, Text, StyleSheet, Linking, TouchableOpacity, View } from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import {
  getLegalDocument,
  LEGAL_CONTACT_EMAIL,
  legalWebUrl,
  legalPdfUrl,
  type LegalDocumentId,
} from '../content/legalDocuments';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { isSponsorRole, SPONSOR_THEME } from '../content/sponsorExperience';
import { spacing, radius } from '../theme/designTokens';
import { useAppTheme } from '../context/ProductLineContext';

interface LegalDocumentScreenProps {
  documentId: LegalDocumentId;
  onBack: () => void;
}

export const LegalDocumentScreen: React.FC<LegalDocumentScreenProps> = ({
  documentId,
  onBack,
}) => {
  const profile = useSessionProfile();
  const sponsorDark = isSponsorRole(profile?.role);
  const { colors: themeColors } = useAppTheme();
  const doc = getLegalDocument(documentId);

  const ui = useMemo(
    () =>
      sponsorDark
        ? {
            bg: SPONSOR_THEME.background,
            surface: SPONSOR_THEME.surface,
            border: SPONSOR_THEME.borderSubtle,
            text: SPONSOR_THEME.text,
            textSecondary: SPONSOR_THEME.textSecondary,
            textMuted: SPONSOR_THEME.textMuted,
            accent: SPONSOR_THEME.primary,
          }
        : {
            bg: themeColors.background,
            surface: themeColors.surface,
            border: themeColors.border,
            text: themeColors.text,
            textSecondary: themeColors.textSecondary,
            textMuted: themeColors.textMuted,
            accent: themeColors.accent,
          },
    [sponsorDark, themeColors]
  );

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: ui.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title={doc.title} onBack={onBack} centered sponsorDark={sponsorDark} />
      <Text style={[styles.updated, { color: ui.textMuted }]}>Mise à jour : {doc.updatedAt}</Text>

      {doc.intro ? (
        <View style={[styles.section, { backgroundColor: ui.surface, borderColor: ui.border }]}>
          <Text style={[styles.paragraph, { color: ui.textSecondary }]}>{doc.intro}</Text>
        </View>
      ) : null}

      {doc.sections.map((section) => (
        <View
          key={section.title}
          style={[styles.section, { backgroundColor: ui.surface, borderColor: ui.border }]}
        >
          <Text style={[styles.sectionTitle, { color: ui.text }]}>{section.title}</Text>
          {section.paragraphs.map((p, i) => (
            <Text key={`${section.title}-${i}`} style={[styles.paragraph, { color: ui.textSecondary }]}>
              {p}
            </Text>
          ))}
        </View>
      ))}

      <View style={[styles.contactBox, { backgroundColor: ui.surface, borderColor: ui.border }]}>
        <Text style={[styles.contactLabel, { color: ui.textMuted }]}>
          Question juridique ou données personnelles
        </Text>
        <TouchableOpacity onPress={() => void Linking.openURL(`mailto:${LEGAL_CONTACT_EMAIL}`)}>
          <Text style={[styles.contactEmail, { color: ui.accent }]}>{LEGAL_CONTACT_EMAIL}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => void Linking.openURL(legalWebUrl(documentId))}>
        <Text style={[styles.webLink, { color: ui.accent }]}>
          Version complète sur le web
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => void Linking.openURL(legalPdfUrl(documentId))}>
        <Text style={[styles.webLink, { color: ui.accent, marginTop: spacing.xs }]}>
          Télécharger le PDF
        </Text>
      </TouchableOpacity>

      <Text style={[styles.footer, { color: ui.textMuted }]}>
        {legalWebUrl(documentId)}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
  },
  updated: {
    fontSize: 12,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  contactBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  contactEmail: {
    fontSize: 14,
    fontWeight: '700',
  },
  webLink: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  footer: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});
