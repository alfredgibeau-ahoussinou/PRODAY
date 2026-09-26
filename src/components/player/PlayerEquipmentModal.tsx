import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProDayText } from '../ui/ProDayText';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { playerEquipmentAllocationService } from '../../services/playerEquipmentAllocation.service';
import type { PlayerAssignedEquipment } from '../../models/PlayerAssignedEquipment';

interface Props {
  visible: boolean;
  onClose: () => void;
  playerUid: string;
  clubId?: string;
  accent?: string;
}

export function PlayerEquipmentModal({
  visible,
  onClose,
  playerUid,
  clubId,
  accent = '#10B981',
}: Props) {
  const [items, setItems] = useState<PlayerAssignedEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Sub-dialogs
  const [exchangeModalItem, setExchangeModalItem] = useState<PlayerAssignedEquipment | null>(null);
  const [requestedSize, setRequestedSize] = useState('');
  const [exchangeReason, setExchangeReason] = useState('');

  const [issueModalItem, setIssueModalItem] = useState<PlayerAssignedEquipment | null>(null);
  const [issueDescription, setIssueDescription] = useState('');

  const [returnModalItem, setReturnModalItem] = useState<PlayerAssignedEquipment | null>(null);
  const [returnReason, setReturnReason] = useState('');

  useEffect(() => {
    if (visible && playerUid) {
      loadAllocations();
    }
  }, [visible, playerUid]);

  const loadAllocations = async () => {
    setLoading(true);
    try {
      const data = await playerEquipmentAllocationService.listForPlayer(playerUid);
      setItems(data);
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async (item: PlayerAssignedEquipment) => {
    Alert.alert(
      'Confirmer la réception',
      `Confirmes-tu avoir bien reçu l’équipement "${item.item_name}" (Taille: ${item.size || 'Unique'}) ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui, reçu',
          onPress: async () => {
            setActionLoadingId(item.id);
            try {
              await playerEquipmentAllocationService.confirmReceipt(item.id, playerUid);
              prodayHaptics.confirm();
              await loadAllocations();
            } catch (err: any) {
              Alert.alert('Erreur', err?.message || 'Impossible de confirmer la réception.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ],
    );
  };

  const handleSendExchangeRequest = async () => {
    if (!exchangeModalItem) return;
    if (!requestedSize.trim()) {
      Alert.alert('Taille requise', 'Précise la nouvelle taille souhaitée (ex: M, L, 42).');
      return;
    }
    setActionLoadingId(exchangeModalItem.id);
    try {
      await playerEquipmentAllocationService.requestSizeExchange(
        exchangeModalItem.id,
        playerUid,
        requestedSize.trim(),
        exchangeReason.trim() || undefined,
      );
      prodayHaptics.confirm();
      Alert.alert(
        'Demande transmise',
        'Ta demande d’échange de taille a été transmise aux intendants du club. Le stock ne sera modifié qu’après leur validation physique.',
      );
      setExchangeModalItem(null);
      setRequestedSize('');
      setExchangeReason('');
      await loadAllocations();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible de transmettre la demande.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendIssueReport = async () => {
    if (!issueModalItem) return;
    if (!issueDescription.trim()) {
      Alert.alert('Description requise', 'Explique le problème rencontré (ex: fermeture éclair cassée, couture déchirée).');
      return;
    }
    setActionLoadingId(issueModalItem.id);
    try {
      await playerEquipmentAllocationService.reportIssue(
        issueModalItem.id,
        playerUid,
        issueDescription.trim(),
      );
      prodayHaptics.confirm();
      Alert.alert('Signalement envoyé', 'Le staff du club a été prévenu.');
      setIssueModalItem(null);
      setIssueDescription('');
      await loadAllocations();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible d’envoyer le signalement.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendReturnRequest = async () => {
    if (!returnModalItem) return;
    setActionLoadingId(returnModalItem.id);
    try {
      await playerEquipmentAllocationService.requestReturn(
        returnModalItem.id,
        playerUid,
      );
      prodayHaptics.confirm();
      Alert.alert(
        'Demande de restitution enregistrée',
        'Rapporte l’équipement au vestiaire ou à l’intendant du club. Le statut passera à "Restitué" une fois réceptionné par le club.',
      );
      setReturnModalItem(null);
      setReturnReason('');
      await loadAllocations();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible d’enregistrer la demande.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderStatusBadge = (status: PlayerAssignedEquipment['status']) => {
    switch (status) {
      case 'allocated':
        return (
          <View style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Ionicons name="time" size={12} color="#F59E0B" />
            <ProDayText variant="caption" style={{ color: '#F59E0B', fontWeight: '700' }}>
              En attente de réception
            </ProDayText>
          </View>
        );
      case 'received':
        return (
          <View style={[styles.badge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Ionicons name="checkmark-circle" size={12} color="#10B981" />
            <ProDayText variant="caption" style={{ color: '#10B981', fontWeight: '700' }}>
              En ma possession
            </ProDayText>
          </View>
        );
      case 'return_pending':
        return (
          <View style={[styles.badge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <Ionicons name="swap-horizontal" size={12} color="#3B82F6" />
            <ProDayText variant="caption" style={{ color: '#3B82F6', fontWeight: '700' }}>
              Retour en attente
            </ProDayText>
          </View>
        );
      case 'returned':
        return (
          <View style={[styles.badge, { backgroundColor: 'rgba(139, 139, 154, 0.15)' }]}>
            <Ionicons name="archive" size={12} color={PLAYER_DARK.textMuted} />
            <ProDayText variant="caption" style={{ color: PLAYER_DARK.textMuted, fontWeight: '700' }}>
              Restitué
            </ProDayText>
          </View>
        );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerIconBadge, { backgroundColor: `${accent}20` }]}>
                <Ionicons name="shirt" size={20} color={accent} />
              </View>
              <View>
                <ProDayText variant="title" style={styles.headerTitle}>
                  Mes Équipements Club
                </ProDayText>
                <ProDayText variant="caption" style={styles.headerSubtitle}>
                  Dotations, maillots & matériels officiels assignés
                </ProDayText>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={22} color={PLAYER_DARK.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Validation note banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={16} color={accent} />
            <ProDayText variant="caption" style={[styles.infoBannerText, { color: accent }]}>
              Les changements de taille et retours demandés doivent être validés physiquement par
              l'intendant ou le responsable équipement du club.
            </ProDayText>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={accent} />
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="shirt-outline" size={44} color={PLAYER_DARK.textMuted} />
              <ProDayText variant="section" style={styles.emptyTitle}>
                Aucun équipement assigné
              </ProDayText>
              <ProDayText variant="body" style={styles.emptySubtitle}>
                Ton club n'a pas encore enregistré de dotation ou d'équipement officiel à ton nom.
              </ProDayText>
            </View>
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {items.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <ProDayText variant="section" style={styles.itemName}>
                        {item.item_name}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.itemCategory}>
                        {item.category.toUpperCase()} • Assigné le{' '}
                        {item.assigned_date.toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </ProDayText>
                    </View>
                    {renderStatusBadge(item.status)}
                  </View>

                  <View style={styles.specsRow}>
                    <View style={styles.specBadge}>
                      <ProDayText variant="caption" style={styles.specLabel}>
                        Taille :
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.specValue}>
                        {item.size || 'N/A'}
                      </ProDayText>
                    </View>

                    {item.barcode_or_ref ? (
                      <View style={styles.specBadge}>
                        <ProDayText variant="caption" style={styles.specLabel}>
                          Réf :
                        </ProDayText>
                        <ProDayText variant="caption" style={styles.specValue}>
                          {item.barcode_or_ref}
                        </ProDayText>
                      </View>
                    ) : null}
                  </View>

                  {/* Active exchange request warning */}
                  {item.exchange_status === 'size_exchange_requested' && item.exchange_requested_size && (
                    <View style={styles.pendingNotice}>
                      <Ionicons name="hourglass-outline" size={14} color="#F59E0B" />
                      <ProDayText variant="caption" style={styles.pendingNoticeText}>
                        Demande d'échange pour taille "{item.exchange_requested_size}" en cours
                        d'examen par le club.
                      </ProDayText>
                    </View>
                  )}

                  {/* Actions */}
                  <View style={styles.actionsRow}>
                    {item.status === 'allocated' && (
                      <TouchableOpacity
                        style={[styles.primaryActionBtn, { backgroundColor: accent }]}
                        onPress={() => handleConfirmReceipt(item)}
                        disabled={actionLoadingId === item.id}
                      >
                        {actionLoadingId === item.id ? (
                          <ActivityIndicator size="small" color="#000" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-done" size={16} color="#000" />
                            <ProDayText variant="caption" style={styles.primaryActionBtnText}>
                              Confirmer réception
                            </ProDayText>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {item.status === 'received' && (
                      <>
                        <TouchableOpacity
                          style={styles.secondaryActionBtn}
                          onPress={() => setExchangeModalItem(item)}
                        >
                          <Ionicons name="swap-horizontal" size={14} color={PLAYER_DARK.text} />
                          <ProDayText variant="caption" style={styles.secondaryActionBtnText}>
                            Changer taille
                          </ProDayText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.secondaryActionBtn}
                          onPress={() => setIssueModalItem(item)}
                        >
                          <Ionicons name="alert-circle-outline" size={14} color="#F59E0B" />
                          <ProDayText variant="caption" style={[styles.secondaryActionBtnText, { color: '#F59E0B' }]}>
                            Signaler
                          </ProDayText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.secondaryActionBtn}
                          onPress={() => setReturnModalItem(item)}
                        >
                          <Ionicons name="arrow-undo-outline" size={14} color={PLAYER_DARK.textMuted} />
                          <ProDayText variant="caption" style={styles.secondaryActionBtnText}>
                            Restituer
                          </ProDayText>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Dialog: Change Size */}
          {exchangeModalItem && (
            <Modal visible transparent animationType="fade">
              <View style={styles.dialogOverlay}>
                <View style={styles.dialogCard}>
                  <ProDayText variant="section" style={styles.dialogTitle}>
                    Échange de taille : {exchangeModalItem.item_name}
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.dialogSubtitle}>
                    Taille actuelle : {exchangeModalItem.size || 'Non définie'}. La mise à jour du
                    stock sera faite dès validation par l'intendant.
                  </ProDayText>

                  <View style={styles.dialogField}>
                    <ProDayText variant="caption" style={styles.dialogLabel}>
                      NOUVELLE TAILLE SOUHAITÉE *
                    </ProDayText>
                    <TextInput
                      style={styles.dialogInput}
                      placeholder="Ex: L, XL, 43"
                      placeholderTextColor={PLAYER_DARK.textMuted}
                      value={requestedSize}
                      onChangeText={setRequestedSize}
                    />
                  </View>

                  <View style={styles.dialogField}>
                    <ProDayText variant="caption" style={styles.dialogLabel}>
                      RAISON (OPTIONNEL)
                    </ProDayText>
                    <TextInput
                      style={styles.dialogInput}
                      placeholder="Ex: Trop serré aux épaules"
                      placeholderTextColor={PLAYER_DARK.textMuted}
                      value={exchangeReason}
                      onChangeText={setExchangeReason}
                    />
                  </View>

                  <View style={styles.dialogBtnRow}>
                    <TouchableOpacity
                      style={styles.dialogCancelBtn}
                      onPress={() => setExchangeModalItem(null)}
                    >
                      <ProDayText variant="caption" style={styles.dialogCancelBtnText}>
                        Annuler
                      </ProDayText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.dialogConfirmBtn, { backgroundColor: accent }]}
                      onPress={handleSendExchangeRequest}
                    >
                      <ProDayText variant="caption" style={styles.dialogConfirmBtnText}>
                        Envoyer
                      </ProDayText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* Dialog: Report Issue */}
          {issueModalItem && (
            <Modal visible transparent animationType="fade">
              <View style={styles.dialogOverlay}>
                <View style={styles.dialogCard}>
                  <ProDayText variant="section" style={styles.dialogTitle}>
                    Signaler un problème
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.dialogSubtitle}>
                    {issueModalItem.item_name} : décris le défaut ou la dégradation constatée.
                  </ProDayText>

                  <View style={styles.dialogField}>
                    <TextInput
                      style={[styles.dialogInput, { minHeight: 80, textAlignVertical: 'top' }]}
                      multiline
                      placeholder="Ex: Coutures déchirées au niveau de la hanche..."
                      placeholderTextColor={PLAYER_DARK.textMuted}
                      value={issueDescription}
                      onChangeText={setIssueDescription}
                    />
                  </View>

                  <View style={styles.dialogBtnRow}>
                    <TouchableOpacity
                      style={styles.dialogCancelBtn}
                      onPress={() => setIssueModalItem(null)}
                    >
                      <ProDayText variant="caption" style={styles.dialogCancelBtnText}>
                        Annuler
                      </ProDayText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.dialogConfirmBtn, { backgroundColor: '#F59E0B' }]}
                      onPress={handleSendIssueReport}
                    >
                      <ProDayText variant="caption" style={[styles.dialogConfirmBtnText, { color: '#000' }]}>
                        Signaler
                      </ProDayText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* Dialog: Request Return */}
          {returnModalItem && (
            <Modal visible transparent animationType="fade">
              <View style={styles.dialogOverlay}>
                <View style={styles.dialogCard}>
                  <ProDayText variant="section" style={styles.dialogTitle}>
                    Demande de restitution
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.dialogSubtitle}>
                    Tu souhaites restituer {returnModalItem.item_name} au club.
                  </ProDayText>

                  <View style={styles.dialogField}>
                    <TextInput
                      style={styles.dialogInput}
                      placeholder="Motif (ex: fin de saison, départ...)"
                      placeholderTextColor={PLAYER_DARK.textMuted}
                      value={returnReason}
                      onChangeText={setReturnReason}
                    />
                  </View>

                  <View style={styles.dialogBtnRow}>
                    <TouchableOpacity
                      style={styles.dialogCancelBtn}
                      onPress={() => setReturnModalItem(null)}
                    >
                      <ProDayText variant="caption" style={styles.dialogCancelBtnText}>
                        Annuler
                      </ProDayText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.dialogConfirmBtn, { backgroundColor: accent }]}
                      onPress={handleSendReturnRequest}
                    >
                      <ProDayText variant="caption" style={styles.dialogConfirmBtnText}>
                        Confirmer
                      </ProDayText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: PLAYER_DARK.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: PLAYER_DARK.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PLAYER_DARK.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
  },
  closeBtn: {
    padding: 6,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyWrap: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    color: PLAYER_DARK.text,
    marginTop: 8,
  },
  emptySubtitle: {
    color: PLAYER_DARK.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: PLAYER_DARK.text,
  },
  itemCategory: {
    color: PLAYER_DARK.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  specsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PLAYER_DARK.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  specLabel: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
  },
  specValue: {
    color: PLAYER_DARK.text,
    fontSize: 11,
    fontWeight: '700',
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 8,
    borderRadius: 6,
  },
  pendingNoticeText: {
    color: '#F59E0B',
    fontSize: 11,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: `${PLAYER_DARK.border}60`,
    paddingTop: 8,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  primaryActionBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 12,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: PLAYER_DARK.surface,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  secondaryActionBtnText: {
    color: PLAYER_DARK.text,
    fontSize: 11,
    fontWeight: '600',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dialogCard: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    gap: 12,
  },
  dialogTitle: {
    color: PLAYER_DARK.text,
    fontSize: 16,
    fontWeight: '800',
  },
  dialogSubtitle: {
    color: PLAYER_DARK.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  dialogField: {
    gap: 6,
  },
  dialogLabel: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  dialogInput: {
    backgroundColor: PLAYER_DARK.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: PLAYER_DARK.text,
    fontSize: 14,
  },
  dialogBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  dialogCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  dialogCancelBtnText: {
    color: PLAYER_DARK.textMuted,
    fontWeight: '700',
  },
  dialogConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  dialogConfirmBtnText: {
    color: '#000',
    fontWeight: '800',
  },
});
