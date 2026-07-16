import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import {
  SPONSOR_QUOTE_PACKAGE_LABELS,
  SPONSOR_QUOTE_STATUS_LABELS,
  type SponsorQuoteRequest,
  type SponsorQuoteRequestStatus,
} from '../../models/SponsorQuoteRequest';
import {
  buildDefaultQuoteHtmlPreview,
  buildDefaultQuoteSubject,
  sponsorQuoteService,
} from '../../services/sponsorQuote.service';
import { adminAuditService } from '../../services/adminAudit.service';
import { useAuth } from '../../context/AuthContext';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { AdminSectionHeader } from './AdminSectionHeader';
import { AdminEmptyState } from './AdminEmptyState';
import { AdminFilterChips } from './AdminFilterChips';
import { AdminEntityCard } from './AdminEntityCard';
import { AdminKpiStrip } from './AdminKpiStrip';
import { getCallableErrorMessage } from '../../lib/firebaseFunctions';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { useAdminStyles } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

type QuoteFilter = SponsorQuoteRequestStatus | 'all';

const QUOTE_FILTERS: { id: QuoteFilter; label: string }[] = [
  { id: 'pending', label: 'En attente' },
  { id: 'sent', label: 'Envoyés' },
  { id: 'rejected', label: 'Refusés' },
  { id: 'all', label: 'Tous' },
];

export const AdminSponsorQuotePanel: React.FC = () => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const { profile, firebaseUser } = useAuth();
  const [filter, setFilter] = useState<QuoteFilter>('pending');
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<SponsorQuoteRequest[]>([]);
  const [selected, setSelected] = useState<SponsorQuoteRequest | null>(null);
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await sponsorQuoteService.listForAdmin(filter, 50);
      setQuotes(items);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      pending: quotes.filter((q) => q.status === 'pending').length,
      sent: quotes.filter((q) => q.status === 'sent').length,
      rejected: quotes.filter((q) => q.status === 'rejected').length,
    }),
    [quotes],
  );

  const openComposer = (quote: SponsorQuoteRequest) => {
    setSelected(quote);
    setSubject(quote.quote_subject ?? buildDefaultQuoteSubject(quote.company_name));
    setHtmlBody(buildDefaultQuoteHtmlPreview(quote));
    setPreviewMode(false);
  };

  const closeComposer = () => {
    setSelected(null);
    setPreviewMode(false);
  };

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    try {
      const result = await sponsorQuoteService.sendQuote({
        requestId: selected.id,
        subject: subject.trim(),
        htmlBody: htmlBody.trim(),
      });
      await adminAuditService.log({
        action: 'sponsor_quote_sent',
        actor_uid: profile?.uid ?? '',
        actor_email: firebaseUser?.email ?? profile?.email,
        target_type: 'sponsor_quote_requests',
        target_id: selected.id,
        summary: `Devis envoyé — ${selected.company_name} (${selected.contact_email})`,
      });
      if (result.emailSent) {
        Alert.alert('Devis sponsor', `Devis envoyé à ${selected.contact_email}.`);
        closeComposer();
        await load();
      } else {
        Alert.alert(
          'Devis sponsor',
          result.emailError ?? 'Envoi email impossible.',
        );
      }
    } catch (e) {
      Alert.alert('Devis sponsor', getCallableErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const handleReject = (quote: SponsorQuoteRequest) => {
    Alert.alert(
      'Refuser la demande',
      `Marquer la demande de ${quote.company_name} comme refusée ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await sponsorQuoteService.rejectQuote(quote.id);
                await load();
              } catch (e) {
                Alert.alert('Devis sponsor', getCallableErrorMessage(e));
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <>
      <AdminKpiStrip
        items={[
          {
            key: 'pending',
            label: 'Devis en attente',
            value: filter === 'pending' ? quotes.length : counts.pending,
            icon: 'mail',
            alert: counts.pending > 0,
          },
          {
            key: 'sent',
            label: 'Devis envoyés',
            value: counts.sent,
            icon: 'document',
          },
        ]}
      />

      <AdminFilterChips options={QUOTE_FILTERS} value={filter} onChange={setFilter} />

      <AdminSectionHeader title="Devis Sponsor" count={quotes.length} />

      {loading ? (
        <ActivityIndicator color={c.brand} style={{ marginVertical: spacing.lg }} />
      ) : quotes.length === 0 ? (
        <AdminEmptyState
          icon="mail"
          title="Aucune demande de devis"
          subtitle="Les demandes depuis le site /sponsor et l'app apparaissent ici."
        />
      ) : (
        quotes.map((quote) => (
          <AdminEntityCard
            key={quote.id}
            icon="mail"
            title={quote.company_name}
            subtitle={`${quote.contact_name} · ${quote.contact_email}`}
            meta={`${SPONSOR_QUOTE_PACKAGE_LABELS[quote.package_tier]} · ${SPONSOR_QUOTE_STATUS_LABELS[quote.status]} · ${formatCalendarDate(quote.created_at)}`}
            primaryLabel={quote.status === 'pending' ? 'Envoyer le devis' : undefined}
            onPrimary={quote.status === 'pending' ? () => openComposer(quote) : undefined}
            secondaryLabel={quote.status === 'pending' ? 'Refuser' : undefined}
            onSecondary={
              quote.status === 'pending'
                ? () => handleReject(quote)
                : undefined
            }
          />
        ))
      )}

      <AnimatedModalShell visible={selected !== null} onClose={closeComposer} closeLabel="Fermer">
        {selected ? (
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Envoyer le devis</Text>
            <Text style={styles.modalSubtitle}>
              {selected.company_name} · {selected.contact_email}
            </Text>

            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, !previewMode && styles.toggleBtnActive]}
                onPress={() => setPreviewMode(false)}
              >
                <Text style={[styles.toggleText, !previewMode && styles.toggleTextActive]}>
                  Édition
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, previewMode && styles.toggleBtnActive]}
                onPress={() => setPreviewMode(true)}
              >
                <Text style={[styles.toggleText, previewMode && styles.toggleTextActive]}>
                  Aperçu
                </Text>
              </TouchableOpacity>
            </View>

            {!previewMode ? (
              <>
                <Text style={styles.fieldLabel}>Objet</Text>
                <TextInput
                  style={styles.input}
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Objet de l'email"
                  placeholderTextColor={c.textMuted}
                />
                <Text style={styles.fieldLabel}>Corps HTML</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={htmlBody}
                  onChangeText={setHtmlBody}
                  multiline
                  textAlignVertical="top"
                  placeholder="Contenu du devis (HTML)"
                  placeholderTextColor={c.textMuted}
                />
              </>
            ) : (
              <View style={styles.previewBox}>
                <Text style={styles.previewSubject}>{subject}</Text>
                <Text style={styles.previewBody}>{htmlBody.replace(/<[^>]+>/g, ' ')}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.sendBtn, sending && styles.btnDisabled]}
              onPress={() => void handleSend()}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendBtnText}>Envoyer le devis</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        ) : null}
      </AnimatedModalShell>
    </>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    modalScroll: {
      padding: spacing.lg,
      maxHeight: '85%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
      marginBottom: spacing.xs,
    },
    modalSubtitle: {
      fontSize: 14,
      color: c.textMuted,
      marginBottom: spacing.md,
    },
    toggleRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    toggleBtnActive: {
      backgroundColor: c.brandMuted,
      borderColor: c.brand,
    },
    toggleText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textMuted,
    },
    toggleTextActive: {
      color: c.brand,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textMuted,
      marginBottom: spacing.xs,
      marginTop: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: c.text,
      fontSize: 15,
      backgroundColor: c.surface,
    },
    textArea: {
      minHeight: 180,
    },
    previewBox: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      padding: spacing.md,
      backgroundColor: c.surface,
      minHeight: 200,
    },
    previewSubject: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      marginBottom: spacing.sm,
    },
    previewBody: {
      fontSize: 14,
      lineHeight: 20,
      color: c.textMuted,
    },
    sendBtn: {
      marginTop: spacing.lg,
      marginBottom: spacing.xl,
      backgroundColor: c.brand,
      borderRadius: radius.full,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    sendBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
    },
    btnDisabled: {
      opacity: 0.6,
    },
  });
}
