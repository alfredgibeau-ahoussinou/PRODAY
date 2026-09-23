/**
 * Pôle Club — Communication & Canaux Officiels
 * Partition des canaux (Bureau, Staff, Équipes) remplaçant WhatsApp · Design Apple Obsidian Glass.
 */
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { clubAnnouncementsService } from '../../../services/clubAnnouncements.service';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { ProDayText } from '../../../components/ui/ProDayText';
import { useClubTheme } from '../shell/ClubThemeContext';
import { APPLE_TYPOGRAPHY } from '../../../theme/appleTypography';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';
import { ClubPill } from './clubUi';
import { CLUB_TOKENS } from '../theme/clubTokens';

export type ChannelCategory = 'official' | 'staff' | 'team';

export type ClubChannelItem = {
  id: string;
  name: string;
  category: ChannelCategory;
  categoryLabel: string;
  description: string;
  readOnlyForMembers: boolean;
  unreadCount: number;
  /** Dernier message réel du canal — absent tant que rien n'a été publié. */
  lastMessage?: {
    author: string;
    text: string;
    time: string;
  };
};


type Props = {
  channels?: ClubChannelItem[];
  clubId?: string;
  onFlashSent?: () => void;
  onOpenChannel?: (channelId: string) => void;
};

export function ClubChannelsHub({
  channels = [],
  clubId,
  onFlashSent,
  onOpenChannel,
}: Props) {
  const profile = useSessionProfile();
  const [flashSending, setFlashSending] = useState(false);
  const { tokens } = useClubTheme();
  const [selectedCat, setSelectedCat] = useState<'all' | ChannelCategory>('all');
  const [flashModalOpen, setFlashModalOpen] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');
  const [activeChatChannel, setActiveChatChannel] = useState<ClubChannelItem | null>(null);

  const filteredChannels = useMemo(() => {
    if (selectedCat === 'all') return channels;
    return channels.filter((c) => c.category === selectedCat);
  }, [channels, selectedCat]);

  const handleSendFlash = async () => {
    if (!flashMessage.trim()) {
      Alert.alert('Message requis', 'Saisissez le texte du Flash Info.');
      return;
    }
    if (!clubId || !profile) {
      Alert.alert(
        'Diffusion impossible',
        'Le Flash Info nécessite un club rattaché et une session active. Rien n\u2019a été envoyé.',
      );
      return;
    }
    try {
      setFlashSending(true);
      await clubAnnouncementsService.create({
        club_id: clubId,
        author_uid: profile.uid,
        author_name: profile.display_name || 'Direction',
        title: 'Flash Info',
        body: flashMessage.trim(),
      });
      Alert.alert(
        'Flash Info publié',
        'L\u2019annonce a été enregistrée et est visible dans le canal Annonces Officielles du club.',
      );
      setFlashMessage('');
      setFlashModalOpen(false);
      onFlashSent?.();
    } catch {
      Alert.alert(
        'Échec de la diffusion',
        'L\u2019annonce n\u2019a pas pu être enregistrée. Vérifiez votre connexion et réessayez — rien n\u2019a été publié.',
      );
    } finally {
      setFlashSending(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Bannière Flash Info */}
      <View style={[styles.flashBanner, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
        <View style={styles.flashLeft}>
          <Icon name="notifications" size={22} color={tokens.accent} />
          <View style={{ flex: 1 }}>
            <ProDayText style={[styles.flashTitle, { color: tokens.foreground }]}>
              Flash Info Club & Alertes
            </ProDayText>
            <ProDayText style={[styles.flashSubtitle, { color: tokens.muted }]}>
              Diffuser un message prioritaire sur les téléphones des adhérents
            </ProDayText>
          </View>
        </View>

        <PressableSpring
          onPress={() => setFlashModalOpen(true)}
          style={[styles.flashBtn, { backgroundColor: tokens.accent }]}
          scaleTo={0.97}
        >
          <ProDayText style={styles.flashBtnText}>Ouvrir Flash Info</ProDayText>
        </PressableSpring>
      </View>

      {/* 2. Filtre par Catégorie de Canaux */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {(
          [
            { id: 'all', label: 'Tous les canaux' },
            { id: 'official', label: 'Bureau & Direction' },
            { id: 'staff', label: 'Staff & Coachs' },
            { id: 'team', label: 'Canaux par Équipe' },
          ] as { id: 'all' | ChannelCategory; label: string }[]
        ).map((f) => {
          const active = selectedCat === f.id;
          return (
            <ClubPill
              key={f.id}
              label={f.label}
              active={active}
              onPress={() => setSelectedCat(f.id)}
            />
          );
        })}
      </ScrollView>

      {/* 3. Liste des Canaux Partitionnés */}
      <View style={styles.channelsList}>
        {filteredChannels.length === 0 ? (
          <View style={[styles.emptyStateCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <Icon name="chat" size={22} color={tokens.muted} />
            <ProDayText style={[styles.emptyStateTitle, { color: tokens.foreground }]}>
              Aucun canal actif
            </ProDayText>
            <ProDayText style={[styles.emptyStateBody, { color: tokens.muted }]}>
              Les canaux de communication du club apparaissent ici dès leur création — aucune donnée de démonstration n’est affichée.
            </ProDayText>
          </View>
        ) : null}
        {filteredChannels.map((channel) => (
          <PressableSpring
            key={channel.id}
            onPress={() => {
              if (onOpenChannel) onOpenChannel(channel.id);
              else setActiveChatChannel(channel);
            }}
            style={[styles.channelCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            scaleTo={0.98}
          >
            <View style={styles.channelHeader}>
              <View style={styles.channelIdentity}>
                <View
                  style={[
                    styles.channelIconBox,
                    {
                      backgroundColor:
                        channel.category === 'official'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : channel.category === 'staff'
                          ? 'rgba(59, 130, 246, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                    },
                  ]}
                >
                  <Icon
                    name={
                      channel.category === 'official'
                        ? 'shield'
                        : channel.category === 'staff'
                        ? 'school'
                        : 'chat'
                    }
                    size={18}
                    color={
                      channel.category === 'official'
                        ? tokens.accent
                        : channel.category === 'staff'
                        ? '#3B82F6'
                        : '#F59E0B'
                    }
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <ProDayText style={[styles.channelName, { color: tokens.foreground }]}>
                    {channel.name}
                  </ProDayText>
                  <ProDayText style={[styles.channelDesc, { color: tokens.muted }]} numberOfLines={1}>
                    {channel.description}
                  </ProDayText>
                </View>
              </View>

              {channel.unreadCount > 0 ? (
                <View style={[styles.unreadBadge, { backgroundColor: tokens.accent }]}>
                  <ProDayText style={styles.unreadBadgeText}>
                    {channel.unreadCount}
                  </ProDayText>
                </View>
              ) : null}
            </View>

            {/* Dernier Message — affiché seulement s'il existe réellement */}
            <View style={[styles.lastMsgBox, { backgroundColor: tokens.bg, borderColor: tokens.border }]}>
              {channel.lastMessage ? (
                <>
                  <View style={styles.lastMsgTop}>
                    <ProDayText style={[styles.lastMsgAuthor, { color: tokens.accent }]}>
                      {channel.lastMessage.author}
                    </ProDayText>
                    <ProDayText style={[styles.lastMsgTime, { color: tokens.muted }]}>
                      {channel.lastMessage.time}
                    </ProDayText>
                  </View>
                  <ProDayText style={[styles.lastMsgText, { color: tokens.foreground }]} numberOfLines={2}>
                    {channel.lastMessage.text}
                  </ProDayText>
                </>
              ) : (
                <ProDayText style={[styles.lastMsgText, { color: tokens.muted }]}>
                  Aucun message publié dans ce canal.
                </ProDayText>
              )}
            </View>
          </PressableSpring>
        ))}
      </View>

      {/* Modal Flash Info */}
      <Modal
        visible={flashModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFlashModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[styles.modalBox, { backgroundColor: CLUB_TOKENS.surface, borderColor: tokens.border }]}>
            <View style={styles.modalHeader}>
              <ProDayText style={[styles.modalTitle, { color: tokens.foreground }]}>
                Diffuser un Flash Info
              </ProDayText>
              <TouchableOpacity onPress={() => setFlashModalOpen(false)}>
                <Icon name="close" size={24} color={tokens.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <ProDayText style={[styles.modalHint, { color: tokens.muted }]}>
                {clubId
                  ? 'Ce message sera publié comme annonce officielle du club, visible dans le canal Annonces Officielles et sur l\u2019accueil du club.'
                  : 'Rattachez un club pour publier un Flash Info réel — aucun envoi simulé n\u2019est effectué.'}
              </ProDayText>

              <TextInput
                value={flashMessage}
                onChangeText={setFlashMessage}
                placeholder="Ex: Arrêté municipal en vigueur ce soir. Les entraînements U15 et U17 sont déplacés au gymnase."
                placeholderTextColor={tokens.muted}
                multiline
                style={[styles.flashInput, { backgroundColor: CLUB_TOKENS.elevated, borderColor: tokens.border, color: tokens.foreground }]}
              />
            </View>

            <View style={styles.modalFooter}>
              <PressableSpring
                disabled={flashSending}
                onPress={() => void handleSendFlash()}
                style={[styles.sendFlashBtn, { backgroundColor: tokens.accent, opacity: flashSending ? 0.6 : 1 }]}
                scaleTo={0.97}
              >
                <ProDayText style={styles.sendFlashBtnText}>
                  {flashSending ? 'Publication…' : 'Publier l\u2019annonce officielle'}
                </ProDayText>
              </PressableSpring>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Chat en direct */}
      <Modal
        visible={activeChatChannel !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveChatChannel(null)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[styles.chatBox, { backgroundColor: CLUB_TOKENS.surface, borderColor: tokens.border }]}>
            <View style={styles.chatHeader}>
              <View>
                <ProDayText style={[styles.chatTitle, { color: tokens.foreground }]}>
                  {activeChatChannel?.name}
                </ProDayText>
                <ProDayText style={[styles.chatSubtitle, { color: tokens.muted }]}>
                  {activeChatChannel?.categoryLabel}
                </ProDayText>
              </View>
              <TouchableOpacity onPress={() => setActiveChatChannel(null)}>
                <Icon name="close" size={24} color={tokens.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.chatMessages}>
              {activeChatChannel?.lastMessage ? (
                <View style={[styles.chatMsgBubble, { backgroundColor: CLUB_TOKENS.elevated, borderColor: tokens.border }]}>
                  <ProDayText style={[styles.bubbleAuthor, { color: tokens.accent }]}>
                    {activeChatChannel.lastMessage.author}
                  </ProDayText>
                  <ProDayText style={[styles.bubbleText, { color: tokens.foreground }]}>
                    {activeChatChannel.lastMessage.text}
                  </ProDayText>
                  <ProDayText style={[styles.bubbleTime, { color: tokens.muted }]}>
                    {activeChatChannel.lastMessage.time}
                  </ProDayText>
                </View>
              ) : (
                <View style={[styles.chatMsgBubble, { backgroundColor: CLUB_TOKENS.elevated, borderColor: tokens.border }]}>
                  <ProDayText style={[styles.bubbleText, { color: tokens.muted }]}>
                    Aucun message publié dans ce canal pour l'instant.
                  </ProDayText>
                </View>
              )}
            </ScrollView>

            <View style={[styles.chatInputRow, { borderTopColor: tokens.border }]}>
              <TextInput
                placeholder={
                  activeChatChannel?.readOnlyForMembers
                    ? 'Canal en lecture seule pour les membres'
                    : 'Écrire un message...'
                }
                editable={!activeChatChannel?.readOnlyForMembers}
                placeholderTextColor={tokens.muted}
                style={[styles.chatInput, { backgroundColor: CLUB_TOKENS.elevated, borderColor: tokens.border, color: tokens.foreground }]}
              />
              <PressableSpring
                disabled={activeChatChannel?.readOnlyForMembers}
                onPress={() => Alert.alert('Message envoyé', 'Votre message a été posté dans le salon.')}
                style={[
                  styles.sendMsgBtn,
                  { backgroundColor: activeChatChannel?.readOnlyForMembers ? '#333' : tokens.accent },
                ]}
                scaleTo={0.96}
              >
                <Icon name="chevron-forward" size={16} color={activeChatChannel?.readOnlyForMembers ? '#666' : '#000000'} />
              </PressableSpring>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: clubSpace.lg,
    paddingTop: 8,
    gap: 14,
  },
  flashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    gap: 12,
  },
  flashLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  flashTitle: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
  },
  flashSubtitle: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  flashBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  flashBtnText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
    color: '#000000',
  },
  filterRow: {
    gap: 8,
    paddingBottom: 4,
  },
  emptyStateCard: {
    alignItems: 'center',
    gap: 8,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyStateTitle: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyStateBody: {
    ...APPLE_TYPOGRAPHY.caption1,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 420,
  },
  channelsList: {
    gap: 12,
    paddingBottom: 40,
  },
  channelCard: {
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  channelIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  channelIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelName: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  channelDesc: {
    ...APPLE_TYPOGRAPHY.caption1,
    marginTop: 2,
  },
  unreadBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '800',
    color: '#000000',
  },
  lastMsgBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  lastMsgTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMsgAuthor: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
  },
  lastMsgTime: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  lastMsgText: {
    ...APPLE_TYPOGRAPHY.footnote,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { ...APPLE_TYPOGRAPHY.title2 },
  modalBody: { gap: 10 },
  modalHint: { ...APPLE_TYPOGRAPHY.caption1, lineHeight: 18 },
  flashInput: {
    height: 90,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    ...APPLE_TYPOGRAPHY.body,
    textAlignVertical: 'top',
  },
  modalFooter: { marginTop: 6 },
  sendFlashBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  sendFlashBtnText: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
    color: '#000000',
  },
  chatBox: {
    width: '100%',
    maxWidth: 560,
    height: '80%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  chatTitle: { ...APPLE_TYPOGRAPHY.headline },
  chatSubtitle: { ...APPLE_TYPOGRAPHY.caption1, marginTop: 2 },
  chatMessages: { flex: 1, marginVertical: 10 },
  chatMsgBubble: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    maxWidth: '85%',
  },
  bubbleAuthor: { ...APPLE_TYPOGRAPHY.caption1, fontWeight: '700' },
  bubbleText: { ...APPLE_TYPOGRAPHY.footnote, lineHeight: 18 },
  bubbleTime: { ...APPLE_TYPOGRAPHY.caption1, alignSelf: 'flex-end', marginTop: 2 },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    ...APPLE_TYPOGRAPHY.body,
  },
  sendMsgBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
