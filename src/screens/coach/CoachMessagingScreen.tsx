import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type MessagingChannel = 'staff' | 'broadcast' | 'match_talk';

interface StaffMessage {
  id: string;
  senderName: string;
  senderRole: 'Coach Principal' | 'Adjoint Tactique' | 'Préparateur Physique' | 'Kiné Référent';
  roleColor: string;
  timestamp: string;
  tag: 'Tactique' | 'Médical' | 'Logistique';
  content: string;
  pinned?: boolean;
}

interface BroadcastAnnouncement {
  id: string;
  title: string;
  date: string;
  content: string;
  isUrgent: boolean;
  readCount: number;
  totalRecipients: number;
}

interface MatchDirective {
  id: string;
  phase: 'Avant-Match' | 'Mi-Temps' | 'Post-Match Débrief';
  time: string;
  title: string;
  instructions: string[];
  audioVoiceNoteUrl?: string;
}

const DEFAULT_STAFF_MESSAGES: StaffMessage[] = [
  {
    id: 'm1',
    senderName: 'Dr. Marc V.',
    senderRole: 'Kiné Référent',
    roleColor: '#FF453A',
    timestamp: '14:22',
    tag: 'Médical',
    content: 'Point Lucas M. : ischios testés ce matin, validation médicale pour 60 minutes de jeu max dimanche. Éviter les sprints prolongés à froid.',
    pinned: true,
  },
  {
    id: 'm2',
    senderName: 'Thierry D.',
    senderRole: 'Adjoint Tactique',
    roleColor: '#0A84FF',
    timestamp: '15:05',
    tag: 'Tactique',
    content: 'J’ai revu les 3 derniers matchs de RC France : leur latéral droit monte constamment. Si on met Yanis B. sur l’aile gauche en faux-pied, on aura un boulevard en contre.',
  },
  {
    id: 'm3',
    senderName: 'Julien P.',
    senderRole: 'Préparateur Physique',
    roleColor: '#30D158',
    timestamp: '16:10',
    tag: 'Logistique',
    content: 'Matériel GPS rechargé et calibré pour la séance de demain soir. Données de charge ACWR prêtes pour le débrief.',
  },
];

const DEFAULT_BROADCASTS: BroadcastAnnouncement[] = [
  {
    id: 'b1',
    title: 'Convocation Officielle J17 vs RC France',
    date: 'Aujourd’hui · 12:30',
    content: 'Les 16 joueurs retenus sont convoqués dimanche à 13h30 au vestiaire principal. Tenue de match officielle obligatoire.',
    isUrgent: true,
    readCount: 16,
    totalRecipients: 18,
  },
  {
    id: 'b2',
    title: 'Planning de la Semaine & Météo',
    date: 'Hier · 18:00',
    content: 'Séance de jeudi décalée sur le synthétique couvert en raison des prévisions de pluie battante. Même horaire (19h30).',
    isUrgent: false,
    readCount: 18,
    totalRecipients: 18,
  },
];

const DEFAULT_MATCH_DIRECTIVES: MatchDirective[] = [
  {
    id: 'md1',
    phase: 'Avant-Match',
    time: 'Dimanche 14:15 · Vestiaire',
    title: 'Consignes Clés & Animation Tactique (Système 4-3-3)',
    instructions: [
      'Garder le bloc médian très compact pendant le premier quart d’heure.',
      'Orientation immédiate sur les transitions : chercher Yanis dans la profondeur.',
      'CPA Défensifs : marquage mixte strict, présence physique au 1er poteau.',
    ],
  },
  {
    id: 'md2',
    phase: 'Mi-Temps',
    time: 'Dimanche 15:50 · Vestiaire',
    title: 'Ajustements Rapides 2e Période',
    instructions: [
      'Accélérer la circulation axiale à 2 touches maximum.',
      'Soutien constant des relayeurs sur le porteur.',
    ],
  },
  {
    id: 'md3',
    phase: 'Post-Match Débrief',
    time: 'Dimanche 17:15 · Foyer',
    title: 'Débrief Collectif & Récupération Immédiate',
    instructions: [
      'Boissons de récupération et étirements légers guidés par Julien.',
      'Reprise mardi 19h30 pour l’analyse vidéo du match.',
    ],
  },
];

export const CoachMessagingScreen: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState<MessagingChannel>('staff');

  // Staff chat state
  const [staffMessages, setStaffMessages] = useState<StaffMessage[]>(DEFAULT_STAFF_MESSAGES);
  const [staffInput, setStaffInput] = useState('');
  const [selectedTag, setSelectedTag] = useState<'Tactique' | 'Médical' | 'Logistique'>('Tactique');

  // Broadcast state
  const [broadcasts, setBroadcasts] = useState<BroadcastAnnouncement[]>(DEFAULT_BROADCASTS);
  const [showBroadcastComposer, setShowBroadcastComposer] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [sendPushNotification, setSendPushNotification] = useState(true);

  // Match Talk state
  const [directives, setDirectives] = useState<MatchDirective[]>(DEFAULT_MATCH_DIRECTIVES);
  const [voiceNoteRecorded, setVoiceNoteRecorded] = useState(false);

  const triggerHaptic = () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
  };

  const handleSendStaffMessage = () => {
    if (!staffInput.trim()) return;
    triggerHaptic();
    const newMsg: StaffMessage = {
      id: Date.now().toString(),
      senderName: 'Coach (Vous)',
      senderRole: 'Coach Principal',
      roleColor: '#C5A059',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tag: selectedTag,
      content: staffInput.trim(),
    };
    setStaffMessages((prev) => [...prev, newMsg]);
    setStaffInput('');
  };

  const handleCreateBroadcast = () => {
    if (!broadcastTitle.trim() || !broadcastContent.trim()) {
      Alert.alert('Champs Incomplets', 'Veuillez renseigner un titre et un message pour la diffusion.');
      return;
    }
    triggerHaptic();
    const newBroadcast: BroadcastAnnouncement = {
      id: Date.now().toString(),
      title: broadcastTitle.trim(),
      date: 'À l’instant',
      content: broadcastContent.trim(),
      isUrgent: sendPushNotification,
      readCount: 1,
      totalRecipients: 18,
    };
    setBroadcasts((prev) => [newBroadcast, ...prev]);
    setBroadcastTitle('');
    setBroadcastContent('');
    setShowBroadcastComposer(false);

    Alert.alert(
      'Annonce Diffusée',
      sendPushNotification
        ? 'L’annonce a été transmise à l’ensemble des 18 joueurs avec notification push prioritaire.'
        : 'L’annonce a été publiée dans le flux de l’équipe.'
    );
  };

  const sendQuickBroadcast = (title: string, content: string) => {
    triggerHaptic();
    const newBroadcast: BroadcastAnnouncement = {
      id: Date.now().toString(),
      title,
      date: 'À l’instant',
      content,
      isUrgent: true,
      readCount: 1,
      totalRecipients: 18,
    };
    setBroadcasts((prev) => [newBroadcast, ...prev]);
    Alert.alert('Diffusion Rapide Envoyée', `Notification push transmise aux 18 joueurs : "${title}"`);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* 1. Header & Active Staff Strip */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="chat-processing" size={24} color="#C5A059" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>CANAL OFFICIEL STAFF & ÉQUIPE</Text>
            </View>
            <Text style={styles.headerTitle}>Communication Cloisonnée</Text>
            <Text style={styles.headerSubtitle}>Échanges confidentiels staff, annonces descendantes & causerie</Text>
          </View>
        </View>

        {/* Live Staff Badges */}
        <View style={styles.staffStrip}>
          <View style={styles.staffMemberBadge}>
            <View style={[styles.onlineDot, { backgroundColor: '#30D158' }]} />
            <Text style={styles.staffMemberText}>Coach (Vous)</Text>
          </View>
          <View style={styles.staffMemberBadge}>
            <View style={[styles.onlineDot, { backgroundColor: '#30D158' }]} />
            <Text style={styles.staffMemberText}>Thierry (Adjoint)</Text>
          </View>
          <View style={styles.staffMemberBadge}>
            <View style={[styles.onlineDot, { backgroundColor: '#30D158' }]} />
            <Text style={styles.staffMemberText}>Dr. Marc (Kiné)</Text>
          </View>
          <View style={styles.staffMemberBadge}>
            <View style={[styles.onlineDot, { backgroundColor: '#8E8E93' }]} />
            <Text style={styles.staffMemberText}>Julien (Prépa)</Text>
          </View>
        </View>
      </View>

      {/* 2. Apple Segmented Control */}
      <View style={styles.segmentBar}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeChannel === 'staff' && styles.segmentBtnActive]}
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic();
            setActiveChannel('staff');
          }}
        >
          <MaterialCommunityIcons
            name="shield-account"
            size={16}
            color={activeChannel === 'staff' ? '#FFFFFF' : '#8E8E93'}
          />
          <Text style={[styles.segmentBtnText, activeChannel === 'staff' && styles.segmentBtnTextActive]}>
            Staff Confidentiel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeChannel === 'broadcast' && styles.segmentBtnActive]}
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic();
            setActiveChannel('broadcast');
          }}
        >
          <MaterialCommunityIcons
            name="bullhorn"
            size={16}
            color={activeChannel === 'broadcast' ? '#FFFFFF' : '#8E8E93'}
          />
          <Text style={[styles.segmentBtnText, activeChannel === 'broadcast' && styles.segmentBtnTextActive]}>
            Diffusion Équipe
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeChannel === 'match_talk' && styles.segmentBtnActive]}
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic();
            setActiveChannel('match_talk');
          }}
        >
          <MaterialCommunityIcons
            name="whistle"
            size={16}
            color={activeChannel === 'match_talk' ? '#FFFFFF' : '#8E8E93'}
          />
          <Text style={[styles.segmentBtnText, activeChannel === 'match_talk' && styles.segmentBtnTextActive]}>
            Causerie Match
          </Text>
        </TouchableOpacity>
      </View>

      {/* CHANNEL 1: STAFF TECHNIQUE CONFIDENTIEL */}
      {activeChannel === 'staff' && (
        <View style={styles.channelContainer}>
          <View style={styles.channelBanner}>
            <Ionicons name="lock-closed" size={14} color="#C5A059" />
            <Text style={styles.channelBannerText}>
              Canal chiffré réservé exclusivement au staff technique et médical.
            </Text>
          </View>

          {/* Message Thread */}
          <View style={styles.messagesList}>
            {staffMessages.map((msg) => (
              <View key={msg.id} style={[styles.messageCard, msg.pinned && styles.messageCardPinned]}>
                <View style={styles.messageHeaderRow}>
                  <View style={styles.authorBadgeRow}>
                    <Text style={styles.authorName}>{msg.senderName}</Text>
                    <View style={[styles.roleTag, { borderColor: msg.roleColor }]}>
                      <Text style={[styles.roleTagText, { color: msg.roleColor }]}>{msg.senderRole}</Text>
                    </View>
                  </View>
                  <View style={styles.timeTagRow}>
                    <View style={styles.topicBadge}>
                      <Text style={styles.topicBadgeText}>{msg.tag}</Text>
                    </View>
                    <Text style={styles.messageTime}>{msg.timestamp}</Text>
                  </View>
                </View>
                <Text style={styles.messageBody}>{msg.content}</Text>
              </View>
            ))}
          </View>

          {/* Tag Selector */}
          <View style={styles.tagSelectorRow}>
            {(['Tactique', 'Médical', 'Logistique'] as const).map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.selectorChip, selectedTag === tag && styles.selectorChipActive]}
                activeOpacity={0.8}
                onPress={() => {
                  triggerHaptic();
                  setSelectedTag(tag);
                }}
              >
                <Text style={[styles.selectorChipText, selectedTag === tag && styles.selectorChipTextActive]}>
                  #{tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Staff Input Composer */}
          <View style={styles.composerCard}>
            <TextInput
              style={styles.textInput}
              placeholder="Rédiger une note confidentielle pour le staff..."
              placeholderTextColor="#636366"
              value={staffInput}
              onChangeText={setStaffInput}
              multiline
            />
            <View style={styles.composerActions}>
              <TouchableOpacity
                style={styles.voiceBtn}
                activeOpacity={0.8}
                onPress={() => {
                  triggerHaptic();
                  Alert.alert('Dictée Vocale Staff', 'Enregistrement audio sécurisé activé pour le rapport staff.');
                }}
              >
                <Ionicons name="mic" size={18} color="#C5A059" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sendBtn, !staffInput.trim() && styles.sendBtnDisabled]}
                activeOpacity={0.8}
                onPress={handleSendStaffMessage}
                disabled={!staffInput.trim()}
              >
                <Ionicons name="send" size={16} color={staffInput.trim() ? '#000000' : '#8E8E93'} />
                <Text style={[styles.sendBtnText, !staffInput.trim() && { color: '#8E8E93' }]}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* CHANNEL 2: DIFFUSION ÉQUIPE BROADCAST */}
      {activeChannel === 'broadcast' && (
        <View style={styles.channelContainer}>
          {/* Summary & Fast 1-Tap Presets */}
          <View style={styles.broadcastOverviewCard}>
            <View style={styles.overviewHeader}>
              <View style={styles.overviewBadge}>
                <Ionicons name="megaphone" size={14} color="#30D158" />
                <Text style={styles.overviewBadgeText}>Canal Descendant Équipe</Text>
              </View>
              <Text style={styles.overviewAudience}>18 Joueurs abonnés · Push actif</Text>
            </View>
            <Text style={styles.overviewTitle}>Annonces & Directives Collectives</Text>
            <Text style={styles.overviewSubtitle}>
              Les joueurs reçoivent ces messages en notification instantanée sans pouvoir spammer le canal.
            </Text>

            {/* Fast 1-Tap Presets */}
            <Text style={styles.presetsLabel}>MODÈLES DE DIFFUSION RAPIDE (1 TAP) :</Text>
            <View style={styles.presetButtonsRow}>
              <TouchableOpacity
                style={styles.presetChip}
                activeOpacity={0.8}
                onPress={() =>
                  sendQuickBroadcast(
                    'Rappel Convocations Match',
                    'N’oubliez pas de confirmer votre présence sur l’app avant ce soir 20h00.'
                  )
                }
              >
                <Ionicons name="clipboard-outline" size={14} color="#C5A059" />
                <Text style={styles.presetChipText}>Rappel Convocs</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetChip}
                activeOpacity={0.8}
                onPress={() =>
                  sendQuickBroadcast(
                    'Point Covoiturage & Départ',
                    'Rendez-vous au foyer du club à 13h15 tapantes. Départ des minibus à 13h30.'
                  )
                }
              >
                <Ionicons name="car-outline" size={14} color="#0A84FF" />
                <Text style={styles.presetChipText}>Rdv Covoiturage</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetChip}
                activeOpacity={0.8}
                onPress={() =>
                  sendQuickBroadcast(
                    'Tenue & Équipement Match',
                    'Prévoir les protège-tibias et crampons pour terrain synthétique arrosé.'
                  )
                }
              >
                <Ionicons name="shirt-outline" size={14} color="#30D158" />
                <Text style={styles.presetChipText}>Tenue de Match</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* New Custom Broadcast Trigger */}
          <TouchableOpacity
            style={styles.newBroadcastBtn}
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic();
              setShowBroadcastComposer(!showBroadcastComposer);
            }}
          >
            <Ionicons name={showBroadcastComposer ? 'close-circle' : 'add-circle'} size={18} color="#C5A059" />
            <Text style={styles.newBroadcastBtnText}>
              {showBroadcastComposer ? 'Fermer le Rédacteur' : 'Rédiger une Nouvelle Annonce'}
            </Text>
          </TouchableOpacity>

          {/* Composer Modal/Drawer */}
          {showBroadcastComposer && (
            <View style={styles.broadcastComposerCard}>
              <Text style={styles.composerTitle}>Nouvelle Diffusion Push</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Titre de l'annonce (ex : Modification d'horaire)"
                placeholderTextColor="#636366"
                value={broadcastTitle}
                onChangeText={setBroadcastTitle}
              />
              <TextInput
                style={[styles.textInput, { height: 90 }]}
                placeholder="Détails du message diffusé aux joueurs..."
                placeholderTextColor="#636366"
                value={broadcastContent}
                onChangeText={setBroadcastContent}
                multiline
              />

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Alerte Push Prioritaire</Text>
                  <Text style={styles.switchSubtitle}>Fait sonner les téléphones même en mode silencieux</Text>
                </View>
                <Switch
                  value={sendPushNotification}
                  onValueChange={(val) => {
                    triggerHaptic();
                    setSendPushNotification(val);
                  }}
                  trackColor={{ false: '#3A3A3C', true: '#30D158' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <TouchableOpacity
                style={styles.publishBroadcastBtn}
                activeOpacity={0.8}
                onPress={handleCreateBroadcast}
              >
                <Ionicons name="paper-plane" size={16} color="#000000" />
                <Text style={styles.publishBroadcastBtnText}>Diffuser Immédiatement</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Broadcasts List */}
          <View style={styles.broadcastList}>
            {broadcasts.map((item) => (
              <View key={item.id} style={styles.broadcastCard}>
                <View style={styles.broadcastTopRow}>
                  <View style={styles.broadcastTitleBlock}>
                    {item.isUrgent && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentBadgeText}>URGENT · PUSH</Text>
                      </View>
                    )}
                    <Text style={styles.broadcastItemTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.broadcastDate}>{item.date}</Text>
                </View>

                <Text style={styles.broadcastBody}>{item.content}</Text>

                <View style={styles.readReceiptRow}>
                  <Ionicons name="checkmark-done" size={14} color="#30D158" />
                  <Text style={styles.readReceiptText}>
                    Lu par {item.readCount} / {item.totalRecipients} joueurs ({Math.round((item.readCount / item.totalRecipients) * 100)}%)
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* CHANNEL 3: CAUSERIE & DÉBRIEF MATCH */}
      {activeChannel === 'match_talk' && (
        <View style={styles.channelContainer}>
          {/* Locker Live Status Banner */}
          <View style={styles.lockerSyncCard}>
            <View style={styles.lockerSyncHeader}>
              <View style={styles.pulseDot} />
              <Text style={styles.lockerSyncTitle}>Sync Locker Causerie Board™ Connecté</Text>
            </View>
            <Text style={styles.lockerSyncDesc}>
              Les schémas tactiques et consignes ci-dessous sont synchronisés en direct avec les téléphones des joueurs au vestiaire.
            </Text>
            <TouchableOpacity
              style={styles.voiceBroadcastAction}
              activeOpacity={0.8}
              onPress={() => {
                triggerHaptic();
                setVoiceNoteRecorded(!voiceNoteRecorded);
                Alert.alert(
                  voiceNoteRecorded ? 'Note Vocale Désactivée' : 'Note Vocale Diffusée',
                  voiceNoteRecorded
                    ? 'Le flux audio a été retiré.'
                    : 'Votre consigne vocale est maintenant disponible à l’écoute pour le groupe au vestiaire.'
                );
              }}
            >
              <Ionicons
                name={voiceNoteRecorded ? 'stop-circle' : 'mic-circle'}
                size={20}
                color={voiceNoteRecorded ? '#FF453A' : '#C5A059'}
              />
              <Text style={[styles.voiceBroadcastText, voiceNoteRecorded && { color: '#FF453A' }]}>
                {voiceNoteRecorded ? 'Arrêter la Consigne Vocale' : 'Enregistrer une Consigne Vocale (20s)'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Directives by match phase */}
          <View style={styles.directivesList}>
            {directives.map((dir) => (
              <View key={dir.id} style={styles.directiveCard}>
                <View style={styles.directivePhaseHeader}>
                  <View style={styles.phaseBadge}>
                    <Text style={styles.phaseBadgeText}>{dir.phase.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.directiveTime}>{dir.time}</Text>
                </View>

                <Text style={styles.directiveTitle}>{dir.title}</Text>

                <View style={styles.instructionPoints}>
                  {dir.instructions.map((ins, idx) => (
                    <View key={idx} style={styles.instructionPointRow}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.instructionText}>{ins}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.reactionRow}>
                  <TouchableOpacity
                    style={styles.reactionBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      triggerHaptic();
                      Alert.alert('Accusé de réception', 'Consignes validées par les capitaines.');
                    }}
                  >
                    <Ionicons name="thumbs-up" size={14} color="#C5A059" />
                    <Text style={styles.reactionText}>Reçu par l’équipe</Text>
                  </TouchableOpacity>
                  <View style={styles.playerAckSummary}>
                    <Text style={styles.playerAckText}>16 joueurs prêts</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#141418',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadge: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  headerBadgeText: {
    color: '#C5A059',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: '-apple-system',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  headerSubtitle: {
    color: '#8E8E93',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginTop: 2,
    lineHeight: 15,
  },
  staffStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  staffMemberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1C1C22',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  staffMemberText: {
    color: '#E5E5EA',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: '#141418',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#1C1C22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  segmentBtnText: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  channelContainer: {
    gap: 12,
  },
  channelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.2)',
  },
  channelBannerText: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
    flex: 1,
  },
  messagesList: {
    gap: 10,
  },
  messageCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
  },
  messageCardPinned: {
    borderColor: 'rgba(197, 160, 89, 0.4)',
    backgroundColor: '#17171C',
  },
  messageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  roleTag: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  timeTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topicBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  topicBadgeText: {
    color: '#8E8E93',
    fontSize: 9,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  messageTime: {
    color: '#636366',
    fontSize: 10,
    fontFamily: '-apple-system',
  },
  messageBody: {
    color: '#D1D1D6',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: '-apple-system',
  },
  tagSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  selectorChip: {
    backgroundColor: '#141418',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  selectorChipActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderColor: '#C5A059',
  },
  selectorChipText: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  selectorChipTextActive: {
    color: '#C5A059',
    fontWeight: '700',
  },
  composerCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: '-apple-system',
    minHeight: 48,
    textAlignVertical: 'top',
  },
  composerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  voiceBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#C5A059',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  sendBtnDisabled: {
    backgroundColor: '#1C1C22',
  },
  sendBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  broadcastOverviewCard: {
    backgroundColor: '#141418',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.25)',
    padding: 16,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  overviewBadgeText: {
    color: '#30D158',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  overviewAudience: {
    color: '#8E8E93',
    fontSize: 10,
    fontFamily: '-apple-system',
  },
  overviewTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: '-apple-system',
    marginBottom: 4,
  },
  overviewSubtitle: {
    color: '#8E8E93',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: '-apple-system',
    marginBottom: 12,
  },
  presetsLabel: {
    color: '#636366',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    fontFamily: '-apple-system',
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1C1C22',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetChipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  newBroadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#141418',
    borderWidth: 1,
    borderColor: '#C5A059',
    borderRadius: 12,
    paddingVertical: 12,
  },
  newBroadcastBtnText: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  broadcastComposerCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
    padding: 14,
    gap: 10,
  },
  composerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  titleInput: {
    backgroundColor: '#1C1C22',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: '-apple-system',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C22',
    borderRadius: 8,
    padding: 10,
  },
  switchTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  switchSubtitle: {
    color: '#8E8E93',
    fontSize: 9,
    fontFamily: '-apple-system',
  },
  publishBroadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C5A059',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
  },
  publishBroadcastBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  broadcastList: {
    gap: 10,
  },
  broadcastCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
  },
  broadcastTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  broadcastTitleBlock: {
    flex: 1,
    gap: 4,
  },
  urgentBadge: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  urgentBadgeText: {
    color: '#FF453A',
    fontSize: 8,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  broadcastItemTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  broadcastDate: {
    color: '#636366',
    fontSize: 10,
    fontFamily: '-apple-system',
  },
  broadcastBody: {
    color: '#D1D1D6',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: '-apple-system',
    marginBottom: 10,
  },
  readReceiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  readReceiptText: {
    color: '#30D158',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  lockerSyncCard: {
    backgroundColor: '#141418',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
    padding: 16,
    marginBottom: 6,
  },
  lockerSyncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#30D158',
  },
  lockerSyncTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  lockerSyncDesc: {
    color: '#8E8E93',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: '-apple-system',
    marginBottom: 12,
  },
  voiceBroadcastAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1C1C22',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.4)',
    borderRadius: 10,
    paddingVertical: 10,
  },
  voiceBroadcastText: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  directivesList: {
    gap: 12,
  },
  directiveCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
  },
  directivePhaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  phaseBadge: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  phaseBadgeText: {
    color: '#0A84FF',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  directiveTime: {
    color: '#636366',
    fontSize: 10,
    fontFamily: '-apple-system',
  },
  directiveTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginBottom: 10,
  },
  instructionPoints: {
    gap: 8,
    marginBottom: 12,
  },
  instructionPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#C5A059',
    marginTop: 6,
  },
  instructionText: {
    color: '#D1D1D6',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: '-apple-system',
    flex: 1,
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reactionText: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  playerAckSummary: {
    backgroundColor: '#1C1C22',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  playerAckText: {
    color: '#8E8E93',
    fontSize: 10,
    fontFamily: '-apple-system',
  },
});
