import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { Club } from '../../../models/Club';
import {
  CLUB_LIVE_PACK_ORDER,
  formatClubInvoiceStatus,
  getClubLivePack,
  isClubLivePackId,
  normalizeClubCommercialAmountEur,
  type ClubLivePackId,
} from '../../../content/clubLivePacks';
import {
  clubCommercialBillingService,
  type ClubBillingInvoice,
} from '../../../services/clubCommercialBilling.service';
import { confirmAdminAction } from '../utils/confirmAdminAction';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { AdminBadge, AdminButton, AdminCard, AdminText } from '../ui/adminUi';
import { useAdminData } from '../data/AdminDataContext';

type Props = {
  club: Club;
  busy: boolean;
  setBusy: (v: boolean) => void;
  actorUid: string;
  actorEmail?: string;
  onRefresh: () => Promise<void>;
  suggestedAmountEur?: number | null;
  suggestedOfferId?: ClubLivePackId | null;
};

/**
 * Montant commercial + envoi facture Stripe (forfait 2 lives / Veo / all-inclusive).
 * Backend partagé : callable `adminClubBilling` (europe-west1).
 */
export function AdminClubCommercialBillingCard({
  club,
  busy,
  setBusy,
  actorUid,
  actorEmail,
  onRefresh,
  suggestedAmountEur,
  suggestedOfferId,
}: Props) {
  const t = ADMIN_TOKENS;
  const data = useAdminData();
  const owner = data.users.find((u) => u.uid === club.owner_uid);
  const [amount, setAmount] = useState(
    String(
      club.commercial_amount_eur ??
        suggestedAmountEur ??
        club.stripe_invoice_amount_eur ??
        '',
    ),
  );
  const [offerId, setOfferId] = useState<ClubLivePackId>(
    club.commercial_offer_id && isClubLivePackId(club.commercial_offer_id)
      ? club.commercial_offer_id
      : suggestedOfferId ?? 'veo_lives_2',
  );
  const [note, setNote] = useState(club.commercial_amount_note ?? '');
  const [billingEmail, setBillingEmail] = useState(
    club.billing_email ?? owner?.email ?? '',
  );
  const [latestInvoice, setLatestInvoice] = useState<ClubBillingInvoice | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);

  const hydrate = useCallback(async () => {
    setLoadingBilling(true);
    try {
      const [prices, invoices] = await Promise.all([
        clubCommercialBillingService.listPrices(club.id),
        clubCommercialBillingService.listInvoices(club.id),
      ]);
      const preferred =
        prices.find((p) => p.offer_id === offerId) ??
        prices[0] ??
        null;
      if (preferred) {
        setAmount(String(preferred.amount_cents / 100));
        if (isClubLivePackId(preferred.offer_id)) {
          setOfferId(preferred.offer_id);
        }
        if (preferred.notes) setNote(preferred.notes);
      }
      const inv = invoices[0] ?? null;
      setLatestInvoice(inv);
    } catch {
      /* Functions pas encore déployées : on garde les champs miroir club */
    } finally {
      setLoadingBilling(false);
    }
  }, [club.id, offerId]);

  useEffect(() => {
    setAmount(
      String(
        club.commercial_amount_eur ??
          suggestedAmountEur ??
          club.stripe_invoice_amount_eur ??
          '',
      ),
    );
    setOfferId(
      club.commercial_offer_id && isClubLivePackId(club.commercial_offer_id)
        ? club.commercial_offer_id
        : suggestedOfferId ?? 'veo_lives_2',
    );
    setNote(club.commercial_amount_note ?? '');
    setBillingEmail(club.billing_email ?? owner?.email ?? '');
  }, [club, suggestedAmountEur, suggestedOfferId, owner?.email]);

  useEffect(() => {
    void hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate on club change only
  }, [club.id]);

  const saveAmount = () => {
    const parsed = normalizeClubCommercialAmountEur(amount);
    if (parsed == null) {
      Alert.alert('Montant invalide', 'Saisissez un montant entre 0,01 € et 500 000 €.');
      return;
    }
    confirmAdminAction(
      'Enregistrer le montant ?',
      `${parsed} € · ${getClubLivePack(offerId).label}. Action auditée (Stripe price store).`,
      async () => {
        setBusy(true);
        try {
          await clubCommercialBillingService.setAmount({
            clubId: club.id,
            amountEur: parsed,
            offerId,
            note: note.trim() || undefined,
            adminUid: actorUid,
            adminEmail: actorEmail,
          });
          await onRefresh();
          await hydrate();
          Alert.alert('Montant enregistré', `${parsed} € · ${getClubLivePack(offerId).shortLabel}`);
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setBusy(false);
        }
      },
    );
  };

  const sendInvoice = () => {
    const parsed = normalizeClubCommercialAmountEur(amount);
    if (parsed == null && club.commercial_amount_eur == null) {
      Alert.alert('Montant requis', 'Fixez d’abord le montant commercial.');
      return;
    }
    const eur = parsed ?? club.commercial_amount_eur!;
    const email = billingEmail.trim();
    if (!email.includes('@')) {
      Alert.alert('E-mail requis', 'Indiquez l’e-mail Stripe du club (owner ou billing).');
      return;
    }
    confirmAdminAction(
      'Créer et envoyer la facture Stripe ?',
      `${eur} € · ${getClubLivePack(offerId).label} → ${email}. Facture réelle (pas de mock).`,
      async () => {
        setBusy(true);
        try {
          const { invoice } = await clubCommercialBillingService.createAndSendInvoice({
            clubId: club.id,
            amountEur: eur,
            offerId,
            customerEmail: email,
            clubName: club.name,
            send: true,
            adminUid: actorUid,
            adminEmail: actorEmail,
          });
          setLatestInvoice(invoice);
          await onRefresh();
          await hydrate();
          Alert.alert(
            'Facture Stripe',
            `Statut ${invoice.status} · ${(invoice.amount_due_cents / 100).toFixed(2)} €${
              invoice.hosted_invoice_url ? '\nLien hébergé disponible.' : ''
            }`,
          );
        } catch (e) {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        } finally {
          setBusy(false);
        }
      },
      true,
    );
  };

  const openUrl = (url?: string | null) => {
    if (!url) return;
    void Linking.openURL(url).catch(() => {
      Alert.alert('Lien indisponible', url);
    });
  };

  const status =
    latestInvoice?.status ?? club.stripe_invoice_status ?? undefined;
  const amountShown =
    latestInvoice != null
      ? latestInvoice.amount_due_cents / 100
      : club.stripe_invoice_amount_eur;
  const hosted = latestInvoice?.hosted_invoice_url ?? club.stripe_invoice_hosted_url;
  const pdf = latestInvoice?.invoice_pdf ?? club.stripe_invoice_pdf;
  const invoiceId = latestInvoice?.stripe_invoice_id ?? club.stripe_invoice_id;

  return (
    <AdminCard>
      <AdminText variant="h2">Facturation live / Veo</AdminText>
      <AdminText variant="caption" color={t.muted}>
        Forfaits sur devis (Tout inclus, Pro + Veo, 2 lives). Prix admin → facture Stripe via
        adminClubBilling (même API que le site).
        {loadingBilling ? ' · sync…' : ''}
      </AdminText>

      <AdminText variant="label" color={t.faint}>
        Offre
      </AdminText>
      <View style={styles.chips}>
        {CLUB_LIVE_PACK_ORDER.map((id) => {
          const pack = getClubLivePack(id);
          const active = offerId === id;
          return (
            <Pressable
              key={id}
              onPress={() => setOfferId(id)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? t.accentSoft : t.surfaceRaised,
                  borderColor: active ? t.borderStrong : t.border,
                },
              ]}
            >
              <AdminText variant="caption" color={active ? t.champagneBright : t.muted}>
                {pack.shortLabel}
              </AdminText>
            </Pressable>
          );
        })}
      </View>
      <AdminText variant="caption" color={t.faint}>
        {getClubLivePack(offerId).hint}
      </AdminText>

      <Field label="Montant (€)" value={amount} onChange={setAmount} />
      <Field label="Note montant" value={note} onChange={setNote} multiline />
      <Field
        label="E-mail facture"
        value={billingEmail}
        onChange={setBillingEmail}
      />

      <View style={styles.actions}>
        <AdminButton
          label={busy ? '…' : 'Enregistrer montant'}
          disabled={busy}
          onPress={saveAmount}
        />
        <AdminButton
          label={busy ? '…' : 'Créer & envoyer facture Stripe'}
          variant="soft"
          disabled={busy}
          onPress={sendInvoice}
        />
      </View>

      <View style={styles.statusBlock}>
        <AdminBadge
          label={`Facture · ${formatClubInvoiceStatus(status)}`}
          tone={
            status === 'paid' ? 'success' : status === 'open' ? 'warn' : 'info'
          }
        />
        {amountShown != null ? (
          <AdminText variant="caption" color={t.muted}>
            Dernière facture : {amountShown} €
            {invoiceId ? ` · ${invoiceId}` : ''}
          </AdminText>
        ) : (
          <AdminText variant="caption" color={t.faint}>
            Aucune facture Stripe enregistrée.
          </AdminText>
        )}
        {club.commercial_amount_eur != null ? (
          <AdminText variant="caption" color={t.muted}>
            Montant admin actuel : {club.commercial_amount_eur} €
            {club.commercial_offer_id && isClubLivePackId(club.commercial_offer_id)
              ? ` · ${getClubLivePack(club.commercial_offer_id).shortLabel}`
              : ''}
          </AdminText>
        ) : null}
        <View style={styles.actions}>
          {hosted ? (
            <AdminButton
              label="Ouvrir facture"
              variant="ghost"
              onPress={() => openUrl(hosted)}
            />
          ) : null}
          {pdf ? (
            <AdminButton label="PDF Stripe" variant="ghost" onPress={() => openUrl(pdf)} />
          ) : null}
        </View>
      </View>
    </AdminCard>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const t = ADMIN_TOKENS;
  return (
    <View style={{ gap: 4 }}>
      <AdminText variant="label" color={t.faint}>
        {label}
      </AdminText>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={label.includes('Montant') ? 'decimal-pad' : 'default'}
        autoCapitalize={label.includes('E-mail') ? 'none' : 'sentences'}
        placeholderTextColor={t.faint}
        style={[
          styles.input,
          {
            color: t.foreground,
            borderColor: t.border,
            backgroundColor: t.surfaceRaised,
            minHeight: multiline ? 64 : undefined,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  statusBlock: { gap: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});
