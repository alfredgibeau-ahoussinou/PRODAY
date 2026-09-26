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
import { playerJournalService } from '../../services/playerJournal.service';
import { usersService } from '../../services/users.service';
import type { PlayerJournalEntry, JournalMood } from '../../models/PlayerJournal';
import type { User } from '../../models/User';

interface Props {
  visible: boolean;
  onClose: () => void;
  playerUid: string;
  clubId?: string;
  accent?: string;
}

const MOODS: { mood: JournalMood; label: string; icon: string }[] = [
  { mood: 'great', label: 'En feu', icon: 'flame' },
  { mood: 'good', label: 'Bien', icon: 'happy' },
  { mood: 'neutral', label: 'Neutre', icon: 'remove-circle' },
  { mood: 'tired', label: 'Fatigué', icon: 'battery-dead' },
  { mood: 'frustrated', label: 'Frustré', icon: 'thunderstorm' },
];

export function PlayerJournalModal({
  visible,
  onClose,
  playerUid,
  clubId,
  accent = '#10B981',
}: Props) {
  const [entries, setEntries] = useState<PlayerJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit / Create state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<JournalMood>('good');
  const [eventTitle, setEventTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Sharing state
  const [sharingModalEntry, setSharingModalEntry] = useState<PlayerJournalEntry | null>(null);
  const [coaches, setCoaches] = useState<User[]>([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  useEffect(() => {
    if (visible && playerUid) {
      loadEntries();
    }
  }, [visible, playerUid]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await playerJournalService.listPlayerEntries(playerUid);
      setEntries(data);
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    prodayHaptics.selection();
    setEditingId(null);
    setTitle('');
    setContent('');
    setSelectedMood('good');
    setEventTitle('');
    setTags([]);
    setIsEditing(true);
  };

  const handleOpenEdit = (entry: PlayerJournalEntry) => {
    prodayHaptics.selection();
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setSelectedMood(entry.mood || 'good');
    setEventTitle(entry.event_title || '');
    setTags(entry.tags || []);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Champs incomplets', 'Veuillez saisir un titre et vos notes de séance.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await playerJournalService.updateEntry(editingId, playerUid, {
          title: title.trim(),
          content: content.trim(),
          mood: selectedMood,
          tags,
        });
      } else {
        await playerJournalService.createEntry({
          player_uid: playerUid,
          title: title.trim(),
          content: content.trim(),
          mood: selectedMood,
          event_title: eventTitle.trim() || undefined,
          tags,
        });
      }
      prodayHaptics.confirm();
      setIsEditing(false);
      await loadEntries();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible d’enregistrer l’entrée.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (entry: PlayerJournalEntry) => {
    Alert.alert(
      'Supprimer l’entrée',
      'Es-tu sûr de vouloir supprimer cette note de ton journal privé ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await playerJournalService.deleteEntry(entry.id, playerUid);
              prodayHaptics.selection();
              loadEntries();
            } catch (err: any) {
              Alert.alert('Erreur', err?.message || 'Impossible de supprimer.');
            }
          },
        },
      ],
    );
  };

  const openSharePicker = async (entry: PlayerJournalEntry) => {
    setSharingModalEntry(entry);
    setLoadingCoaches(true);
    try {
      const staff = await usersService.listStaff('coach');
      setCoaches(staff.filter((s) => !clubId || s.profile?.club_id === clubId));
    } catch {
      setCoaches([]);
    } finally {
      setLoadingCoaches(false);
    }
  };

  const handleShareWithCoach = async (coach: User) => {
    if (!sharingModalEntry) return;
    try {
      await playerJournalService.shareWithCoach(
        sharingModalEntry.id,
        playerUid,
        coach.uid,
        coach.display_name,
      );
      prodayHaptics.confirm();
      Alert.alert(
        'Partage activé',
        `Cette entrée est maintenant partagée avec ${coach.display_name}. Vous pouvez révoquer le partage à tout moment. Note : cela ne supprime pas ce que le coach a déjà pu lire.`,
      );
      setSharingModalEntry(null);
      loadEntries();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible de partager.');
    }
  };

  const handleWithdrawSharing = (entry: PlayerJournalEntry) => {
    Alert.alert(
      'Révoquer le partage',
      `Retirer l'accès accordé à ${entry.shared_with_coach_name || 'ton coach'} ? Il ne pourra plus consulter les futures modifications de cette note.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Révoquer',
          style: 'destructive',
          onPress: async () => {
            try {
              await playerJournalService.withdrawSharing(entry.id, playerUid);
              prodayHaptics.confirm();
              loadEntries();
            } catch (err: any) {
              Alert.alert('Erreur', err?.message || 'Impossible de retirer le partage.');
            }
          },
        },
      ],
    );
  };

  const filteredEntries = entries.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q) ||
      (e.event_title && e.event_title.toLowerCase().includes(q)) ||
      (e.tags && e.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerIconBadge, { backgroundColor: `${accent}20` }]}>
                <Ionicons name="book" size={20} color={accent} />
              </View>
              <View>
                <ProDayText variant="title" style={styles.headerTitle}>
                  Journal de Bord
                </ProDayText>
                <ProDayText variant="caption" style={styles.headerSubtitle}>
                  100% privé par défaut • Visible uniquement par toi
                </ProDayText>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={22} color={PLAYER_DARK.textMuted} />
            </TouchableOpacity>
          </View>

          {isEditing ? (
            /* Editing form */
            <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
              <ProDayText variant="section" style={styles.formTitle}>
                {editingId ? 'Modifier la note' : 'Nouvelle entrée personnelle'}
              </ProDayText>

              {/* Title */}
              <View style={styles.field}>
                <ProDayText variant="caption" style={styles.label}>
                  TITRE DE L'ENTRÉE *
                </ProDayText>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Ressenti match contre FC Lyon"
                  placeholderTextColor={PLAYER_DARK.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Mood selector */}
              <View style={styles.field}>
                <ProDayText variant="caption" style={styles.label}>
                  ÉTAT DE FORME / HUMEUR
                </ProDayText>
                <View style={styles.moodRow}>
                  {MOODS.map((m) => (
                    <TouchableOpacity
                      key={m.mood}
                      style={[
                        styles.moodChip,
                        selectedMood === m.mood && [styles.moodChipActive, { borderColor: accent }],
                      ]}
                      onPress={() => {
                        prodayHaptics.selection();
                        setSelectedMood(m.mood);
                      }}
                    >
                      <Ionicons
                        name={m.icon as any}
                        size={16}
                        color={selectedMood === m.mood ? accent : PLAYER_DARK.textMuted}
                      />
                      <ProDayText
                        variant="caption"
                        style={[
                          styles.moodChipText,
                          selectedMood === m.mood && { color: accent, fontWeight: '700' },
                        ]}
                      >
                        {m.label}
                      </ProDayText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Linked Event Title */}
              <View style={styles.field}>
                <ProDayText variant="caption" style={styles.label}>
                  ÉVÉNEMENT ASSOCIÉ (OPTIONNEL)
                </ProDayText>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Entraînement tactique du 24/09"
                  placeholderTextColor={PLAYER_DARK.textMuted}
                  value={eventTitle}
                  onChangeText={setEventTitle}
                />
              </View>

              {/* Content */}
              <View style={styles.field}>
                <ProDayText variant="caption" style={styles.label}>
                  RÉFLEXIONS & ENSEIGNEMENTS *
                </ProDayText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  placeholder="Que retiens-tu de ta performance ? Quelles sensations as-tu eues ?"
                  placeholderTextColor={PLAYER_DARK.textMuted}
                  value={content}
                  onChangeText={setContent}
                />
              </View>

              {/* Tags */}
              <View style={styles.field}>
                <ProDayText variant="caption" style={styles.label}>
                  TAGS (APPUI SUR ENTRÉE POUR AJOUTER)
                </ProDayText>
                <View style={styles.tagInputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Ex: Pied gauche, Vitesse..."
                    placeholderTextColor={PLAYER_DARK.textMuted}
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={() => {
                      if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                        setTags([...tags, tagInput.trim()]);
                        setTagInput('');
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={[styles.addTagBtn, { backgroundColor: `${accent}20` }]}
                    onPress={() => {
                      if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                        setTags([...tags, tagInput.trim()]);
                        setTagInput('');
                      }
                    }}
                  >
                    <Ionicons name="add" size={20} color={accent} />
                  </TouchableOpacity>
                </View>
                {tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {tags.map((t) => (
                      <View key={t} style={styles.tagBadge}>
                        <ProDayText variant="caption" style={styles.tagBadgeText}>
                          #{t}
                        </ProDayText>
                        <TouchableOpacity
                          onPress={() => setTags(tags.filter((x) => x !== t))}
                          hitSlop={6}
                        >
                          <Ionicons name="close-circle" size={14} color={PLAYER_DARK.textMuted} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Action buttons */}
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsEditing(false)}
                >
                  <ProDayText variant="caption" style={styles.cancelBtnText}>
                    Annuler
                  </ProDayText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: accent }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ProDayText variant="caption" style={styles.saveBtnText}>
                      Enregistrer
                    </ProDayText>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            /* Entries List */
            <>
              <View style={styles.listHeaderActions}>
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={16} color={PLAYER_DARK.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher une note..."
                    placeholderTextColor={PLAYER_DARK.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={16} color={PLAYER_DARK.textMuted} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={[styles.newBtn, { backgroundColor: accent }]}
                  onPress={handleOpenCreate}
                >
                  <Ionicons name="add" size={18} color="#000" />
                  <ProDayText variant="caption" style={styles.newBtnText}>
                    Écrire
                  </ProDayText>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator color={accent} />
                </View>
              ) : filteredEntries.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Ionicons name="book-outline" size={44} color={PLAYER_DARK.textMuted} />
                  <ProDayText variant="section" style={styles.emptyTitle}>
                    Aucune entrée de journal
                  </ProDayText>
                  <ProDayText variant="body" style={styles.emptySubtitle}>
                    Note tes ressentis, tes axes d'amélioration et tes réussites après chaque match.
                    Ton journal est strictement confidentiel.
                  </ProDayText>
                </View>
              ) : (
                <ScrollView style={styles.entriesList} contentContainerStyle={styles.entriesContent}>
                  {filteredEntries.map((item) => (
                    <View key={item.id} style={styles.entryCard}>
                      <View style={styles.entryTop}>
                        <View style={styles.entryTitleCol}>
                          <ProDayText variant="section" style={styles.entryTitle}>
                            {item.title}
                          </ProDayText>
                          {item.event_title && (
                            <View style={styles.linkedEventRow}>
                              <Ionicons name="football-outline" size={12} color={accent} />
                              <ProDayText variant="caption" style={[styles.linkedEventText, { color: accent }]}>
                                {item.event_title}
                              </ProDayText>
                            </View>
                          )}
                        </View>
                        <ProDayText variant="caption" style={styles.entryDate}>
                          {item.created_at.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </ProDayText>
                      </View>

                      <ProDayText variant="body" style={styles.entryNotes} numberOfLines={4}>
                        {item.content}
                      </ProDayText>

                      {item.tags && item.tags.length > 0 && (
                        <View style={styles.cardTagsRow}>
                          {item.tags.map((t) => (
                            <View key={t} style={styles.cardTag}>
                              <ProDayText variant="caption" style={styles.cardTagText}>
                                #{t}
                              </ProDayText>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Sharing status badge */}
                      <View style={styles.shareStatusRow}>
                        {item.shared_with_coach_uid ? (
                          <View style={styles.sharedBadge}>
                            <Ionicons name="eye" size={12} color="#10B981" />
                            <ProDayText variant="caption" style={styles.sharedBadgeText}>
                              Partagé avec {item.shared_with_coach_name || 'Coach'}
                            </ProDayText>
                            <TouchableOpacity
                              onPress={() => handleWithdrawSharing(item)}
                              style={styles.withdrawBtn}
                            >
                              <ProDayText variant="caption" style={styles.withdrawBtnText}>
                                Révoquer
                              </ProDayText>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.privateBadge}>
                            <Ionicons name="lock-closed" size={12} color={PLAYER_DARK.textMuted} />
                            <ProDayText variant="caption" style={styles.privateBadgeText}>
                              Privé
                            </ProDayText>
                          </View>
                        )}

                        <View style={styles.cardActionBtns}>
                          {!item.shared_with_coach_uid && (
                            <TouchableOpacity
                              style={styles.iconBtn}
                              onPress={() => openSharePicker(item)}
                              hitSlop={8}
                            >
                              <Ionicons name="share-social-outline" size={16} color={accent} />
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={() => handleOpenEdit(item)}
                            hitSlop={8}
                          >
                            <Ionicons name="pencil" size={16} color={PLAYER_DARK.textMuted} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={() => handleDelete(item)}
                            hitSlop={8}
                          >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </>
          )}

          {/* Coach picker modal */}
          {sharingModalEntry && (
            <Modal visible transparent animationType="fade">
              <View style={styles.pickerOverlay}>
                <View style={styles.pickerCard}>
                  <ProDayText variant="section" style={styles.pickerTitle}>
                    Partager avec un coach
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.pickerSubtitle}>
                    Sélectionne un coach autorisé pour lui donner accès à cette note :
                  </ProDayText>

                  {loadingCoaches ? (
                    <ActivityIndicator style={{ marginVertical: 20 }} color={accent} />
                  ) : coaches.length === 0 ? (
                    <ProDayText variant="caption" style={styles.noCoaches}>
                      Aucun coach trouvé pour ton club.
                    </ProDayText>
                  ) : (
                    <ScrollView style={{ maxHeight: 200, marginVertical: 10 }}>
                      {coaches.map((c) => (
                        <TouchableOpacity
                          key={c.uid}
                          style={styles.coachItem}
                          onPress={() => handleShareWithCoach(c)}
                        >
                          <Ionicons name="person-circle" size={24} color={accent} />
                          <ProDayText variant="body" style={styles.coachName}>
                            {c.display_name}
                          </ProDayText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}

                  <TouchableOpacity
                    style={styles.cancelPickerBtn}
                    onPress={() => setSharingModalEntry(null)}
                  >
                    <ProDayText variant="caption" style={styles.cancelBtnText}>
                      Fermer
                    </ProDayText>
                  </TouchableOpacity>
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
  listHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PLAYER_DARK.surface,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  searchInput: {
    flex: 1,
    color: PLAYER_DARK.text,
    fontSize: 13,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 10,
    gap: 4,
  },
  newBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
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
  entriesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  entriesContent: {
    gap: 12,
    paddingBottom: 24,
  },
  entryCard: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    gap: 8,
  },
  entryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entryTitleCol: {
    flex: 1,
    paddingRight: 8,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PLAYER_DARK.text,
  },
  linkedEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  linkedEventText: {
    fontSize: 11,
    fontWeight: '600',
  },
  entryDate: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
  },
  entryNotes: {
    color: PLAYER_DARK.text,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
  cardTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  cardTag: {
    backgroundColor: PLAYER_DARK.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardTagText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 10,
  },
  shareStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: `${PLAYER_DARK.border}60`,
    marginTop: 4,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sharedBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  withdrawBtn: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 4,
  },
  withdrawBtnText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  privateBadgeText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
  },
  cardActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 2,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    gap: 14,
  },
  formTitle: {
    color: PLAYER_DARK.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  field: {
    gap: 6,
  },
  label: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: PLAYER_DARK.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: PLAYER_DARK.text,
    fontSize: 14,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  moodRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: PLAYER_DARK.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  moodChipActive: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
  },
  moodChipText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 12,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addTagBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tagBadge: {
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
  tagBadgeText: {
    color: PLAYER_DARK.text,
    fontSize: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  cancelBtnText: {
    color: PLAYER_DARK.textMuted,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '800',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  pickerCard: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  pickerTitle: {
    color: PLAYER_DARK.text,
    fontSize: 16,
    fontWeight: '800',
  },
  pickerSubtitle: {
    color: PLAYER_DARK.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  noCoaches: {
    color: PLAYER_DARK.textMuted,
    textAlign: 'center',
    paddingVertical: 14,
  },
  coachItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: PLAYER_DARK.border,
  },
  coachName: {
    color: PLAYER_DARK.text,
    fontWeight: '600',
  },
  cancelPickerBtn: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
});
