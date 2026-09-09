import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { PressableSpring } from '../motion';
import { useAuth } from '../../context/AuthContext';
import { sponsorQuoteService } from '../../services/sponsorQuote.service';
import { storageService } from '../../services/storage.service';
import { getCallableErrorMessage } from '../../lib/firebaseFunctions';
import type {
  SponsorQuoteDocumentRequest,
  SponsorQuoteRequest,
} from '../../models/SponsorQuoteRequest';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';

/**
 * Documents demandés par l’admin sur un devis sponsor — upload réel Storage + callable.
 */
export function SponsorQuoteDocsPanel() {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<SponsorQuoteRequest[]>([]);
  const [docsByQuote, setDocsByQuote] = useState<Record<string, SponsorQuoteDocumentRequest[]>>({});

  const refresh = useCallback(async () => {
    if (!uid) {
      setQuotes([]);
      setDocsByQuote({});
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await sponsorQuoteService.listForSponsor(uid, 10);
      const pending = list.filter((q) => q.docs_pending || q.status !== 'rejected');
      setQuotes(pending);
      const map: Record<string, SponsorQuoteDocumentRequest[]> = {};
      await Promise.all(
        pending.map(async (q) => {
          try {
            const desk = await sponsorQuoteService.getDesk(q.id);
            map[q.id] = desk.documents.filter((d) => d.status === 'requested');
          } catch {
            map[q.id] = [];
          }
        }),
      );
      setDocsByQuote(map);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const uploadDoc = async (quoteId: string, doc: SponsorQuoteDocumentRequest) => {
    if (!uid) return;
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    setBusyId(doc.id);
    try {
      const url = await storageService.uploadSponsorQuoteDocument(uid, quoteId, doc.id, {
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'application/pdf',
      });
      await sponsorQuoteService.fulfillDocument({
        requestId: quoteId,
        documentRequestId: doc.id,
        fileUrl: url,
        fileName: asset.name,
      });
      Alert.alert('Déposé', `${doc.label} a été transmis à ProDay.`);
      await refresh();
    } catch (e) {
      Alert.alert('Upload', getCallableErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const openRequests = quotes.flatMap((q) =>
    (docsByQuote[q.id] ?? []).map((d) => ({ quote: q, doc: d })),
  );

  if (!uid) return null;
  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={SPONSOR_THEME.primary} />
      </View>
    );
  }
  if (openRequests.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Dossier commercial</Text>
      <Text style={styles.title}>Documents demandés</Text>
      <Text style={styles.body}>
        L’équipe ProDay Partenaires attend ces pièces pour finaliser votre devis.
      </Text>
      {openRequests.map(({ quote, doc }) => (
        <View key={doc.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.docLabel}>{doc.label}</Text>
            <Text style={styles.docMeta}>{quote.company_name}</Text>
          </View>
          <PressableSpring
            style={styles.cta}
            scaleTo={0.97}
            disabled={busyId === doc.id}
            onPress={() => void uploadDoc(quote.id, doc)}
          >
            <Text style={styles.ctaText}>{busyId === doc.id ? '…' : 'Déposer'}</Text>
          </PressableSpring>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: SPONSOR_THEME.surface,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.border,
    gap: spacing.sm,
  },
  eyebrow: {
    color: SPONSOR_THEME.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: SPONSOR_THEME.text,
    fontSize: 18,
    fontWeight: '800',
  },
  body: {
    color: SPONSOR_THEME.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SPONSOR_THEME.border,
  },
  docLabel: { color: SPONSOR_THEME.text, fontWeight: '700', fontSize: 14 },
  docMeta: { color: SPONSOR_THEME.textMuted, fontSize: 12, marginTop: 2 },
  cta: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: SPONSOR_THEME.primary,
  },
  ctaText: { color: SPONSOR_THEME.onPrimary, fontWeight: '800', fontSize: 12 },
});
