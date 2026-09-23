import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useAdminData } from '../data/AdminDataContext';
import {
  AdminAvatarMark,
  AdminBadge,
  AdminCard,
  AdminEmptyState,
  AdminEntityRow,
  AdminFilterChip,
  AdminLoading,
  AdminPaneHeader,
  AdminSearchField,
  AdminText,
} from '../ui/adminUi';
import { useAdminTokens, ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';
import { AdminModalSheet } from '../motion';
import { useAuth } from '../../../context/AuthContext';
import {
  SPONSOR_QUOTE_PACKAGE_AMOUNTS,
  SPONSOR_QUOTE_PACKAGE_LABELS,
  SPONSOR_QUOTE_STATUS_LABELS,
  type SponsorQuoteRequest,
  type SponsorQuoteRequestStatus,
} from '../../../models/SponsorQuoteRequest';
import { AdminSponsorQuoteDetail } from './AdminSponsorQuoteDetail';

type StatusFilter = 'all' | SponsorQuoteRequestStatus | 'docs_ready';

function statusTone(
  status: SponsorQuoteRequestStatus,
): 'warn' | 'success' | 'danger' | 'info' {
  if (status === 'pending') return 'warn';
  if (status === 'sent') return 'success';
  if (status === 'rejected') return 'danger';
  return 'info';
}

function formatShortDate(d: Date): string {
  try {
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
}

export function AdminSponsorQuotesPane({ focusId }: { focusId?: string }) {
  const data = useAdminData();
  const { firebaseUser, profile } = useAuth();
  const t = useAdminTokens();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<SponsorQuoteRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [detailTab, setDetailTab] = useState<'docs' | undefined>(undefined);

  useEffect(() => {
    if (!focusId) return;
    const hit = data.sponsorQuoteRequests.find((r) => r.id === focusId);
    if (hit) {
      setSelected(hit);
      if (hit.has_uploaded_docs) setDetailTab('docs');
    }
  }, [focusId, data.sponsorQuoteRequests]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return data.sponsorQuoteRequests.filter((r) => {
      if (status === 'docs_ready') {
        if (!r.has_uploaded_docs) return false;
      } else if (status !== 'all' && r.status !== status) {
        return false;
      }
      if (!query) return true;
      return (
        r.company_name.toLowerCase().includes(query) ||
        r.contact_email.toLowerCase().includes(query) ||
        r.contact_name.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query) ||
        (r.budget?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [data.sponsorQuoteRequests, q, status]);

  const counts = useMemo(() => {
    const all = data.sponsorQuoteRequests;
    return {
      all: all.length,
      pending: all.filter((r) => r.status === 'pending').length,
      sent: all.filter((r) => r.status === 'sent').length,
      rejected: all.filter((r) => r.status === 'rejected').length,
      docs: all.filter((r) => r.docs_pending).length,
      docsReady: all.filter((r) => r.has_uploaded_docs).length,
    };
  }, [data.sponsorQuoteRequests]);

  if (data.loading) return <AdminLoading label="Chargement devis sponsors…" />;

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <View style={styles.header}>
        <AdminPaneHeader
          title="Devis sponsors"
          subtitle={`${counts.pending} en attente · ${counts.docsReady} docs reçus · ${counts.docs} demandes ouvertes · ${counts.all} total`}
        />
        <AdminSearchField
          value={q}
          onChangeText={setQ}
          placeholder="Entreprise, contact, e-mail…"
        />
        <View style={styles.chips}>
          {(
            [
              { id: 'all' as const, label: `Tous (${counts.all})` },
              { id: 'pending' as const, label: `Attente (${counts.pending})` },
              { id: 'docs_ready' as const, label: `Docs reçus (${counts.docsReady})` },
              { id: 'sent' as const, label: `Envoyés (${counts.sent})` },
              { id: 'rejected' as const, label: `Refusés (${counts.rejected})` },
            ] as const
          ).map((chip) => (
            <AdminFilterChip
              key={chip.id}
              label={chip.label}
              active={status === chip.id}
              onPress={() => setStatus(chip.id)}
            />
          ))}
        </View>
        <AdminText variant="caption" muted>
          Communication réelle · e-mails Brevo · documents Storage · téléchargement admin
        </AdminText>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={data.loading} onRefresh={() => void data.refresh()} />
        }
        ListEmptyComponent={
          <AdminEmptyState
            title="Aucune demande sponsor"
            body="Les devis issus du site et de l’app apparaissent ici pour traitement ops."
            icon="briefcase"
          />
        }
        renderItem={({ item }) => (
          <AdminEntityRow
            title={item.company_name || 'Sans nom'}
            subtitle={`${item.contact_name} · ${item.contact_email}`}
            meta={`${SPONSOR_QUOTE_PACKAGE_LABELS[item.package_tier]} · ${SPONSOR_QUOTE_PACKAGE_AMOUNTS[item.package_tier]}${item.budget ? ` · ${item.budget}` : ''} · ${formatShortDate(item.created_at)}${item.has_uploaded_docs ? ' · docs reçus' : item.docs_pending ? ' · docs demandés' : ''}`}
            badge={SPONSOR_QUOTE_STATUS_LABELS[item.status].toUpperCase()}
            badgeTone={statusTone(item.status)}
            leading={<AdminAvatarMark label={item.company_name} tone="accent" />}
            onPress={() => {
              setDetailTab(item.has_uploaded_docs ? 'docs' : undefined);
              setSelected(item);
            }}
          />
        )}
      />

      <AdminModalSheet
        visible={!!selected}
        onClose={() => {
          setSelected(null);
          setDetailTab(undefined);
        }}
        variant="full"
      >
        {selected ? (
          <AdminSponsorQuoteDetail
            quote={selected}
            busy={busy}
            setBusy={setBusy}
            onClose={() => {
              setSelected(null);
              setDetailTab(undefined);
            }}
            onRefresh={async () => {
              await data.refresh();
            }}
            actorUid={firebaseUser?.uid ?? 'admin'}
            actorEmail={profile?.email ?? undefined}
            initialTab={detailTab}
          />
        ) : null}
      </AdminModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: adminSpace.md,
    paddingTop: adminSpace.sm,
    gap: adminSpace.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  list: {
    padding: adminSpace.md,
    paddingBottom: 48,
    gap: 4,
  },
});
