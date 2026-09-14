import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  veoLiveStreamService,
  type VeoMatchStream,
  type VeoClubConfig,
  type VeoStreamKind,
} from '../../services/veo/veoLiveStream.service';
import { ProDayVideoPlayer } from '../../components/video/ProDayVideoPlayer';
import { useSessionProfile } from '../../hooks/useSessionProfile';

interface VeoVideoHubScreenProps {
  onBack?: () => void;
  initialMatchId?: string;
}

export const VeoVideoHubScreen: React.FC<VeoVideoHubScreenProps> = ({
  onBack,
  initialMatchId,
}) => {
  const insets = useSafeAreaInsets();
  const profile = useSessionProfile();
  const clubId = profile?.profile?.club_id || 'club-proday-1';
  const isStaff = profile?.role === 'coach' || profile?.role === 'club';

  const [loading, setLoading] = useState(true);
  const [streams, setStreams] = useState<VeoMatchStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<VeoMatchStream | null>(null);
  const [filter, setFilter] = useState<'all' | 'live' | 'replay' | 'imported'>('all');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [clubConfig, setClubConfig] = useState<VeoClubConfig | null>(null);

  // Formulaire configuration VEO
  const [modelInput, setModelInput] = useState<string>('veo_cam_3_5g');
  const [serialInput, setSerialInput] = useState<string>('');
  const [streamUrlInput, setStreamUrlInput] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allStreams, config] = await Promise.all([
        veoLiveStreamService.listMatchStreams(clubId),
        veoLiveStreamService.getClubVeoConfig(clubId),
      ]);
      setStreams(allStreams);
      setClubConfig(config);
      setModelInput(config.model);
      setSerialInput(config.camera_serial || '');
      setStreamUrlInput(config.default_stream_url || '');

      if (initialMatchId) {
        const found = allStreams.find((s) => s.match_id === initialMatchId);
        if (found) setSelectedStream(found);
      } else if (!selectedStream && allStreams.length > 0) {
        // Sélectionne en priorité un direct s'il y en a un
        const live = allStreams.find((s) => s.is_live);
        setSelectedStream(live || allStreams[0]);
      }
    } finally {
      setLoading(false);
    }
  }, [clubId, initialMatchId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSaveConfig = async () => {
    try {
      const updated = await veoLiveStreamService.saveClubVeoConfig(clubId, {
        model: modelInput as VeoClubConfig['model'],
        camera_serial: serialInput,
        default_stream_url: streamUrlInput,
        connection_status: 'connected',
      });
      setClubConfig(updated);
      setShowSettingsModal(false);
      Alert.alert('Connexion VEO', 'La caméra VEO a été mise à jour avec succès.');
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder la configuration VEO.');
    }
  };

  const filteredStreams = useMemo(() => {
    if (filter === 'live') return streams.filter((s) => s.stream_kind === 'live');
    if (filter === 'replay') return streams.filter((s) => s.stream_kind === 'replay');
    if (filter === 'imported') return streams.filter((s) => s.stream_kind === 'imported');
    return streams;
  }, [streams, filter]);

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* En-tête ProDay */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack ? (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              accessibilityLabel="Retour"
            >
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
            </TouchableOpacity>
          ) : null}
          <View>
            <Text style={styles.headerTitle}>Vidéo VEO</Text>
            <Text style={styles.headerSubtitle}>
              Diffusion directe & replays du club
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={loadData}
            accessibilityLabel="Actualiser"
          >
            <Ionicons name="refresh" size={18} color="#0F172A" />
          </TouchableOpacity>

          {isStaff ? (
            <TouchableOpacity
              style={styles.settingsPill}
              onPress={() => setShowSettingsModal(true)}
              accessibilityLabel="Réglages VEO"
            >
              <Ionicons name="videocam" size={14} color="#0F172A" />
              <Text style={styles.settingsPillText}>Caméra VEO</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Lecteur Vidéo Principal Intégré */}
        <View style={styles.playerContainer}>
          <ProDayVideoPlayer
            stream={selectedStream}
            onRefresh={loadData}
            title={selectedStream?.title}
          />
        </View>

        {/* Détails du flux actif */}
        {selectedStream ? (
          <View style={styles.streamInfoCard}>
            <View style={styles.streamInfoTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.streamCardTitle}>
                  {selectedStream.title}
                </Text>
                <Text style={styles.streamCardMeta}>
                  {selectedStream.team_label || 'Équipe'} · Opposé à {selectedStream.opponent || 'Adversaire'}
                </Text>
              </View>
              {selectedStream.is_live ? (
                <View style={styles.liveTag}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveTagText}>DIRECT ACTIF</Text>
                </View>
              ) : (
                <View style={styles.replayTag}>
                  <Text style={styles.replayTagText}>REPLAY DISPONIBLE</Text>
                </View>
              )}
            </View>
          </View>
        ) : null}

        {/* Filtres de catégorie */}
        <View style={styles.filterRow}>
          {[
            { id: 'all', label: 'Toutes les vidéos' },
            { id: 'live', label: '🔴 En direct' },
            { id: 'replay', label: '⏱️ Replays' },
            { id: 'imported', label: '📁 Importées' },
          ].map((f) => {
            const active = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id as typeof filter)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Liste des flux du club */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Diffusions autorisées ({filteredStreams.length})</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#0F172A" style={{ marginVertical: 20 }} />
        ) : filteredStreams.length === 0 ? (
          <View style={styles.emptyListWrap}>
            <Ionicons name="film-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyListText}>Aucune diffusion trouvée pour ce filtre</Text>
          </View>
        ) : (
          filteredStreams.map((s) => {
            const isPlaying = selectedStream?.id === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.streamCard, isPlaying && styles.streamCardSelected]}
                onPress={() => setSelectedStream(s)}
                activeOpacity={0.8}
              >
                <View style={styles.cardThumbnail}>
                  <Ionicons
                    name={s.is_live ? 'videocam' : 'play-circle'}
                    size={28}
                    color={s.is_live ? '#EF4444' : '#0F172A'}
                  />
                  {s.is_live ? (
                    <View style={styles.thumbLivePill}>
                      <Text style={styles.thumbLiveText}>LIVE</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.cardDetails}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {s.title}
                  </Text>
                  <Text style={styles.cardSub}>
                    {s.team_label} vs {s.opponent}
                  </Text>
                  <Text style={styles.cardDate}>
                    {s.is_live
                      ? 'Diffusion en cours maintenant'
                      : s.started_at
                        ? new Date(s.started_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Date inconnue'}
                  </Text>
                </View>

                <View style={styles.cardAction}>
                  <View
                    style={[
                      styles.playActionBtn,
                      isPlaying && { backgroundColor: '#00F59B' },
                    ]}
                  >
                    <Ionicons
                      name={isPlaying ? 'volume-high' : 'play'}
                      size={14}
                      color="#000000"
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Modal Paramètres Connexion VEO (Staff uniquement) */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Connexion Caméra VEO</Text>
                <Text style={styles.modalSubtitle}>
                  Associez votre matériel Veo au club ProDay
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSettingsModal(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Modèle de Veo</Text>
              <View style={styles.modelChips}>
                {[
                  { id: 'veo_cam_3_5g', label: 'Veo Cam 3 (5G/Live)' },
                  { id: 'veo_cam_2', label: 'Veo Cam 2' },
                  { id: 'veo_cam_1', label: 'Veo Cam 1' },
                ].map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => setModelInput(m.id)}
                    style={[
                      styles.modelChip,
                      modelInput === m.id && styles.modelChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modelChipText,
                        modelInput === m.id && styles.modelChipTextActive,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Numéro de série / ID Caméra</Text>
              <TextInput
                style={styles.input}
                value={serialInput}
                onChangeText={setSerialInput}
                placeholder="Ex: VEO3-7729-FR"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Flux Live direct HLS (.m3u8) ou Embed URL</Text>
              <TextInput
                style={styles.input}
                value={streamUrlInput}
                onChangeText={setStreamUrlInput}
                placeholder="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
              />
              <Text style={styles.hint}>
                ProDay lira ce flux en direct dans l’application sans redirection externe.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveConfig}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={18} color="#000000" />
              <Text style={styles.saveBtnText}>Valider la connexion VEO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 5,
  },
  settingsPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  playerContainer: {
    marginBottom: 12,
  },
  streamInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  streamInfoTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  streamCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  streamCardMeta: {
    fontSize: 13,
    color: '#64748B',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
  },
  replayTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  replayTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyListWrap: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    marginTop: 8,
    fontSize: 13,
    color: '#94A3B8',
  },
  streamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 12,
  },
  streamCardSelected: {
    borderColor: '#00F59B',
    backgroundColor: '#F0FDF4',
  },
  cardThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumbLivePill: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  thumbLiveText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  cardDetails: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  cardAction: {
    justifyContent: 'center',
  },
  playActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  modelChips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  modelChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modelChipActive: {
    borderColor: '#00F59B',
    backgroundColor: '#DCFCE7',
  },
  modelChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  modelChipTextActive: {
    color: '#15803D',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  hint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00F59B',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
});
