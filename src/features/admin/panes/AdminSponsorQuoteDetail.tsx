import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminField,
  AdminFilterChip,
  AdminSheetHeader,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';
import { confirmAdminAction } from '../utils/confirmAdminAction';
import { adminAuditService } from '../../../services/adminAudit.service';
import {
  buildDefaultQuoteHtmlPreview,
  buildDefaultQuoteSubject,
} from '../../../utils/sponsorQuoteCopy';
import { sponsorQuoteService } from '../../../services/sponsorQuote.service';
import { downloadRemoteFile } from '../../../utils/downloadRemoteFile';
import {
  SPONSOR_QUOTE_DOC_TYPE_OPTIONS,
  SPONSOR_QUOTE_PACKAGE_AMOUNTS,
  SPONSOR_QUOTE_PACKAGE_LABELS,
  SPONSOR_QUOTE_STATUS_LABELS,
  type SponsorQuoteDocumentRequest,
  type SponsorQuoteEvent,
  type SponsorQuoteRequest,
  type SponsorQuoteThreadMessage,
} from '../../../models/SponsorQuoteRequest';
import { getCallableErrorMessage } from '../../../lib/firebaseFunctions';

type TabId = 'resume' | 'devis' | 'messages' | 'docs' | 'historique';

const TABS: { id: TabId; label: string }[] = [
  { id: 'resume', label: 'Résumé' },
  { id: 'devis', label: 'Devis' },
  { id: 'messages', label: 'Messages' },
  { id: 'docs', label: 'Documents' },
  { id: 'historique', label: 'Historique' },
];

const DOC_STATUS_LABELS: Record<string, string> = {
  requested: 'En attente',
  uploaded: 'Reçu',
  waived: 'Dispensé',
};

type Props = {
  quote: SponsorQuoteRequest;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  actorUid: string;
  actorEmail?: string;
  /** Ouvre directement l’onglet Documents (ex. file « Docs reçus »). */
  initialTab?: TabId;
};

function formatDate(d?: Date): string {
  if (!d) return '—';
  try {
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return d.toISOString();
  }
}

function statusTone(status: SponsorQuoteRequest['status']): 'warn' | 'success' | 'danger' | 'info' {
  if (status === 'pending') return 'warn';
  if (status === 'sent') return 'success';
  if (status === 'rejected') return 'danger';
  return 'info';
}

function docTone(status: SponsorQuoteDocumentRequest['status']): 'warn' | 'success' | 'info' {
  if (status === 'uploaded') return 'success';
  if (status === 'requested') return 'warn';
  return 'info';
}

export function AdminSponsorQuoteDetail({
  quote,
  busy,
  setBusy,
  onClose,
  onRefresh,
  actorUid,
  actorEmail,
  initialTab,
}: Props) {
  const t = ADMIN_TOKENS;
  const [tab, setTab] = useState<TabId>(
    initialTab ?? (quote.has_uploaded_docs ? 'docs' : 'resume'),
  );
  const [deskLoading, setDeskLoading] = useState(true);
  const [thread, setThread] = useState<SponsorQuoteThreadMessage[]>([]);
  const [documents, setDocuments] = useState<SponsorQuoteDocumentRequest[]>([]);
  const [events, setEvents] = useState<SponsorQuoteEvent[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [subject, setSubject] = useState(buildDefaultQuoteSubject(quote.company_name));
  const [htmlBody, setHtmlBody] = useState(buildDefaultQuoteHtmlPreview(quote));
  const [messageBody, setMessageBody] = useState('');
  const [messageSubject, setMessageSubject] = useState(
    `ProDay Partenaires — ${quote.company_name}`,
  );
  const [sendEmail, setSendEmail] = useState(true);
  const [selectedDocs, setSelectedDocs] = useState<string[]>(['kbis', 'logo']);
  const [customDoc, setCustomDoc] = useState('');
  const [docsNote, setDocsNote] = useState('');

  const loadDesk = useCallback(async () => {
    setDeskLoading(true);
    try {
      const desk = await sponsorQuoteService.getDesk(quote.id);
      setThread(desk.thread);
      setDocuments(desk.documents);
      setEvents(desk.events);
    } catch (e) {
      Alert.alert('Desk', getCallableErrorMessage(e));
    } finally {
      setDeskLoading(false);
    }
  }, [quote.id]);

  useEffect(() => {
    void loadDesk();
  }, [loadDesk]);

  useEffect(() => {
    setSubject(buildDefaultQuoteSubject(quote.company_name));
    setHtmlBody(buildDefaultQuoteHtmlPreview(quote));
    setMessageSubject(`ProDay Partenaires — ${quote.company_name}`);
  }, [quote]);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab, quote.id]);

  const pendingDocs = useMemo(
    () => documents.filter((d) => d.status === 'requested').length,
    [documents],
  );
  const receivedDocs = useMemo(
    () => documents.filter((d) => d.status === 'uploaded' && Boolean(d.file_url)),
    [documents],
  );
  const waitingDocs = useMemo(
    () => documents.filter((d) => d.status === 'requested'),
    [documents],
  );

  const toggleDoc = (id: string) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const downloadDoc = async (d: SponsorQuoteDocumentRequest) => {
    if (!d.file_url) {
      Alert.alert('Télécharger', 'Aucun fichier disponible pour ce document.');
      return;
    }
    const inferredExt = (() => {
      const fromName = d.file_name?.match(/\.(pdf|png|jpe?g|webp)$/i)?.[0];
      if (fromName) return fromName.toLowerCase();
      if (/\.pdf(\?|$)/i.test(d.file_url) || /application%2Fpdf/i.test(d.file_url)) return '.pdf';
      if (/\.png(\?|$)/i.test(d.file_url)) return '.png';
      if (/\.jpe?g(\?|$)/i.test(d.file_url)) return '.jpg';
      if (/\.webp(\?|$)/i.test(d.file_url)) return '.webp';
      return '.pdf';
    })();
    const fileName =
      d.file_name?.trim() ||
      `${(d.label || 'document').replace(/\s+/g, '_')}${inferredExt}`;
    setDownloadingId(d.id);
    try {
      const res = await downloadRemoteFile(d.file_url, fileName);
      if (!res.ok) {
        Alert.alert('Télécharger', res.error);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const runSendQuote = () => {
    confirmAdminAction(
      quote.status === 'sent' ? 'Renvoyer le devis ?' : 'Envoyer le devis ?',
      `E-mail réel à ${quote.contact_email}`,
      async () => {
        setBusy(true);
        try {
          const res = await sponsorQuoteService.sendQuote({
            requestId: quote.id,
            subject: subject.trim(),
            htmlBody: htmlBody.trim(),
            textBody: htmlBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
            allowResend: quote.status === 'sent',
          });
          if (!res.success || !res.emailSent) {
            Alert.alert('Envoi échoué', res.emailError ?? 'E-mail non envoyé');
            return;
          }
          await adminAuditService.log({
            action: 'sponsor_quote_sent',
            actor_uid: actorUid,
            actor_email: actorEmail,
            target_type: 'sponsor_quote',
            target_id: quote.id,
            summary: `Devis sponsor envoyé · ${quote.company_name}`,
          });
          await onRefresh();
          await loadDesk();
          Alert.alert('Envoyé', 'Le devis a été envoyé par e-mail.');
        } catch (e) {
          Alert.alert('Erreur', getCallableErrorMessage(e));
        } finally {
          setBusy(false);
        }
      },
    );
  };

  const runSendMessage = () => {
    const body = messageBody.trim();
    if (!body) {
      Alert.alert('Message', 'Saisissez un message.');
      return;
    }
    confirmAdminAction(
      sendEmail ? 'Envoyer l’e-mail ?' : 'Enregistrer la note ?',
      sendEmail ? `À ${quote.contact_email}` : 'Note interne visible dans le thread',
      async () => {
        setBusy(true);
        try {
          const res = await sponsorQuoteService.sendMessage({
            requestId: quote.id,
            body,
            subject: messageSubject.trim() || undefined,
            sendEmail,
          });
          if (!res.success) {
            Alert.alert('Échec', res.emailError ?? 'Message non enregistré');
            return;
          }
          await adminAuditService.log({
            action: sendEmail ? 'sponsor_quote_email' : 'sponsor_quote_note',
            actor_uid: actorUid,
            actor_email: actorEmail,
            target_type: 'sponsor_quote',
            target_id: quote.id,
            summary: sendEmail
              ? `E-mail sponsor · ${quote.company_name}`
              : `Note devis · ${quote.company_name}`,
          });
          setMessageBody('');
          await onRefresh();
          await loadDesk();
          Alert.alert(
            'OK',
            sendEmail
              ? res.emailSent
                ? 'E-mail envoyé et thread mis à jour.'
                : `Thread OK — e-mail : ${res.emailError ?? 'non envoyé'}`
              : 'Note enregistrée.',
          );
        } catch (e) {
          Alert.alert('Erreur', getCallableErrorMessage(e));
        } finally {
          setBusy(false);
        }
      },
    );
  };

  const runRequestDocs = () => {
    const customs = customDoc
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (selectedDocs.length === 0 && customs.length === 0) {
      Alert.alert('Documents', 'Sélectionnez au moins un type.');
      return;
    }
    confirmAdminAction(
      'Demander ces documents ?',
      'Notification + e-mail au sponsor (si activé).',
      async () => {
        setBusy(true);
        try {
          const res = await sponsorQuoteService.requestDocuments({
            requestId: quote.id,
            docTypes: selectedDocs,
            customLabels: customs,
            message: docsNote.trim() || undefined,
            sendEmail: true,
          });
          if (!res.success) {
            Alert.alert('Échec', res.emailError ?? 'Demande non enregistrée');
            return;
          }
          await adminAuditService.log({
            action: 'sponsor_quote_docs_requested',
            actor_uid: actorUid,
            actor_email: actorEmail,
            target_type: 'sponsor_quote',
            target_id: quote.id,
            summary: `Docs demandés · ${quote.company_name}`,
          });
          setCustomDoc('');
          setDocsNote('');
          await onRefresh();
          await loadDesk();
          Alert.alert(
            'Demandé',
            res.emailSent
              ? `${res.requestedIds.length} document(s) — e-mail envoyé.`
              : `${res.requestedIds.length} document(s) — ${res.emailError ?? 'e-mail non envoyé'}`,
          );
        } catch (e) {
          Alert.alert('Erreur', getCallableErrorMessage(e));
        } finally {
          setBusy(false);
        }
      },
    );
  };

  const runReject = () => {
    confirmAdminAction(
      'Refuser cette demande ?',
      quote.company_name,
      async () => {
        setBusy(true);
        try {
          await sponsorQuoteService.rejectQuote(quote.id, 'Refus admin');
          await adminAuditService.log({
            action: 'sponsor_quote_rejected',
            actor_uid: actorUid,
            actor_email: actorEmail,
            target_type: 'sponsor_quote',
            target_id: quote.id,
            summary: `Devis sponsor refusé · ${quote.company_name}`,
          });
          await onRefresh();
          onClose();
        } catch (e) {
          Alert.alert('Erreur', getCallableErrorMessage(e));
        } finally {
          setBusy(false);
        }
      },
      true,
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <AdminSheetHeader
        title={quote.company_name || 'Devis sponsor'}
        subtitle={`${quote.contact_name} · ${quote.contact_email}`}
        onClose={onClose}
        right={
          <AdminBadge
            label={SPONSOR_QUOTE_STATUS_LABELS[quote.status].toUpperCase()}
            tone={statusTone(quote.status)}
          />
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {TABS.map((item) => (
          <AdminFilterChip
            key={item.id}
            label={
              item.id === 'docs'
                ? receivedDocs.length > 0
                  ? `Documents (${receivedDocs.length} reçus)`
                  : pendingDocs > 0
                    ? `Documents (${pendingDocs})`
                    : item.label
                : item.label
            }
            active={tab === item.id}
            onPress={() => setTab(item.id)}
          />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {tab === 'resume' ? (
          <View style={styles.stack}>
            <AdminCard>
              <AdminText variant="h2">Demande</AdminText>
              <AdminText muted>
                Formule · {SPONSOR_QUOTE_PACKAGE_LABELS[quote.package_tier]} (
                {SPONSOR_QUOTE_PACKAGE_AMOUNTS[quote.package_tier]})
              </AdminText>
              <AdminText muted>Budget · {quote.budget || '—'}</AdminText>
              <AdminText muted>Source · {quote.source}</AdminText>
              <AdminText muted>Créée · {formatDate(quote.created_at)}</AdminText>
              <AdminText muted>Dernier contact · {formatDate(quote.last_contact_at)}</AdminText>
              {quote.phone ? <AdminText muted>Tél · {quote.phone}</AdminText> : null}
              {quote.goals?.length ? (
                <AdminText muted>Objectifs · {quote.goals.join(', ')}</AdminText>
              ) : null}
              {quote.regions?.length ? (
                <AdminText muted>Zones · {quote.regions.join(', ')}</AdminText>
              ) : null}
              {quote.message ? (
                <AdminText style={{ marginTop: 8 }}>{quote.message}</AdminText>
              ) : null}
            </AdminCard>
            <View style={styles.row}>
              <AdminButton
                label="Écrire"
                variant="soft"
                compact
                disabled={busy}
                onPress={() => setTab('messages')}
              />
              <AdminButton
                label="Demander docs"
                variant="ghost"
                compact
                disabled={busy}
                onPress={() => setTab('docs')}
              />
              {quote.status !== 'rejected' ? (
                <AdminButton
                  label="Refuser"
                  variant="danger"
                  compact
                  disabled={busy}
                  onPress={runReject}
                />
              ) : null}
            </View>
          </View>
        ) : null}

        {tab === 'devis' ? (
          <View style={styles.stack}>
            <AdminText variant="label" muted>
              Objet
            </AdminText>
            <AdminField value={subject} onChangeText={setSubject} placeholder="Objet e-mail" />
            <AdminText variant="label" muted>
              Corps HTML
            </AdminText>
            <AdminField
              value={htmlBody}
              onChangeText={setHtmlBody}
              placeholder="Contenu HTML du devis"
              multiline
              style={{ minHeight: 180 }}
            />
            <AdminButton
              label={
                busy
                  ? 'Envoi…'
                  : quote.status === 'sent'
                    ? 'Renvoyer le devis'
                    : 'Envoyer le devis par e-mail'
              }
              disabled={busy || quote.status === 'rejected'}
              onPress={runSendQuote}
            />
          </View>
        ) : null}

        {tab === 'messages' ? (
          <View style={styles.stack}>
            {deskLoading ? (
              <AdminText muted>Chargement du thread…</AdminText>
            ) : thread.length === 0 ? (
              <AdminText muted>Aucun message pour l’instant.</AdminText>
            ) : (
              thread.map((m) => (
                <AdminCard key={m.id}>
                  <View style={styles.rowBetween}>
                    <AdminBadge
                      label={m.author_role.toUpperCase()}
                      tone={m.author_role === 'admin' ? 'accent' : 'info'}
                    />
                    <AdminBadge
                      label={m.channel === 'email' ? 'E-MAIL' : 'INTERNE'}
                      tone={m.channel === 'email' ? 'success' : 'info'}
                    />
                  </View>
                  {m.subject ? (
                    <AdminText variant="caption" champagne>
                      {m.subject}
                    </AdminText>
                  ) : null}
                  <AdminText>{m.body}</AdminText>
                  <AdminText variant="caption" muted>
                    {formatDate(m.created_at)}
                    {m.email_error ? ` · ${m.email_error}` : ''}
                  </AdminText>
                </AdminCard>
              ))
            )}
            <AdminText variant="label" muted>
              Objet (si e-mail)
            </AdminText>
            <AdminField value={messageSubject} onChangeText={setMessageSubject} />
            <AdminText variant="label" muted>
              Message
            </AdminText>
            <AdminField
              value={messageBody}
              onChangeText={setMessageBody}
              placeholder="Écrire au sponsor…"
              multiline
              style={{ minHeight: 120 }}
            />
            <View style={styles.switchRow}>
              <AdminText>Envoyer aussi par e-mail</AdminText>
              <Switch value={sendEmail} onValueChange={setSendEmail} />
            </View>
            <AdminButton
              label={busy ? 'Envoi…' : sendEmail ? 'Envoyer e-mail + thread' : 'Note interne'}
              disabled={busy}
              onPress={runSendMessage}
            />
          </View>
        ) : null}

        {tab === 'docs' ? (
          <View style={styles.stack}>
            {deskLoading ? (
              <AdminText muted>Chargement…</AdminText>
            ) : documents.length === 0 ? (
              <AdminText muted>Aucune demande de document.</AdminText>
            ) : (
              <>
                {receivedDocs.length > 0 ? (
                  <View style={styles.stack}>
                    <AdminText variant="h2">Reçus — à télécharger</AdminText>
                    {receivedDocs.map((d) => (
                      <AdminCard key={d.id}>
                        <View style={styles.rowBetween}>
                          <AdminText variant="h3">{d.label}</AdminText>
                          <AdminBadge
                            label={(DOC_STATUS_LABELS[d.status] ?? d.status).toUpperCase()}
                            tone={docTone(d.status)}
                          />
                        </View>
                        <AdminText variant="caption" muted>
                          Fichier · {d.file_name || 'Sans nom'}
                        </AdminText>
                        <AdminText variant="caption" muted>
                          Reçu · {formatDate(d.uploaded_at)}
                        </AdminText>
                        <AdminText variant="caption" muted>
                          Demandé · {formatDate(d.requested_at)}
                        </AdminText>
                        <View style={[styles.row, { marginTop: 8 }]}>
                          <AdminButton
                            label={
                              downloadingId === d.id ? 'Téléchargement…' : 'Télécharger'
                            }
                            compact
                            disabled={downloadingId === d.id || !d.file_url}
                            onPress={() => void downloadDoc(d)}
                          />
                        </View>
                      </AdminCard>
                    ))}
                  </View>
                ) : null}

                {waitingDocs.length > 0 ? (
                  <View style={styles.stack}>
                    <AdminText variant="h2">En attente côté sponsor</AdminText>
                    {waitingDocs.map((d) => (
                      <AdminCard key={d.id}>
                        <View style={styles.rowBetween}>
                          <AdminText variant="h3">{d.label}</AdminText>
                          <AdminBadge
                            label={(DOC_STATUS_LABELS[d.status] ?? d.status).toUpperCase()}
                            tone={docTone(d.status)}
                          />
                        </View>
                        <AdminText variant="caption" muted>
                          Demandé · {formatDate(d.requested_at)}
                        </AdminText>
                      </AdminCard>
                    ))}
                  </View>
                ) : null}

                {documents
                  .filter((d) => d.status !== 'uploaded' && d.status !== 'requested')
                  .map((d) => (
                    <AdminCard key={d.id}>
                      <View style={styles.rowBetween}>
                        <AdminText variant="h3">{d.label}</AdminText>
                        <AdminBadge
                          label={(DOC_STATUS_LABELS[d.status] ?? d.status).toUpperCase()}
                          tone={docTone(d.status)}
                        />
                      </View>
                    </AdminCard>
                  ))}
              </>
            )}
            <AdminText variant="h2">Nouvelle demande</AdminText>
            <View style={styles.chipsWrap}>
              {SPONSOR_QUOTE_DOC_TYPE_OPTIONS.map((opt) => (
                <AdminFilterChip
                  key={opt.id}
                  label={opt.label}
                  active={selectedDocs.includes(opt.id)}
                  onPress={() => toggleDoc(opt.id)}
                />
              ))}
            </View>
            <AdminField
              value={customDoc}
              onChangeText={setCustomDoc}
              placeholder="Autres docs (séparés par virgule)"
            />
            <AdminField
              value={docsNote}
              onChangeText={setDocsNote}
              placeholder="Message accompagnant la demande"
              multiline
            />
            <AdminButton
              label={busy ? 'Envoi…' : 'Demander + e-mail'}
              disabled={busy || quote.status === 'rejected'}
              onPress={runRequestDocs}
            />
          </View>
        ) : null}

        {tab === 'historique' ? (
          <View style={styles.stack}>
            {deskLoading ? (
              <AdminText muted>Chargement…</AdminText>
            ) : events.length === 0 ? (
              <AdminText muted>Pas encore d’événements.</AdminText>
            ) : (
              events.map((ev) => (
                <AdminCard key={ev.id}>
                  <AdminText variant="caption" champagne>
                    {ev.type}
                  </AdminText>
                  <AdminText>{ev.summary}</AdminText>
                  <AdminText variant="caption" muted>
                    {formatDate(ev.created_at)} · {ev.actor_role}
                  </AdminText>
                </AdminCard>
              ))
            )}
            <AdminButton
              label="Actualiser"
              variant="ghost"
              disabled={deskLoading}
              onPress={() => void loadDesk()}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabs: {
    paddingHorizontal: adminSpace.md,
    paddingVertical: adminSpace.sm,
    gap: 8,
  },
  body: {
    padding: adminSpace.md,
    paddingBottom: 40,
    gap: adminSpace.md,
  },
  stack: { gap: adminSpace.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
