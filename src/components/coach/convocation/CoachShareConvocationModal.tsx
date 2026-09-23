import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Clipboard,
  Dimensions,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TeamEvent } from '../../../models/TeamEvent';
import { getPendingInviteeUids } from '../../../models/TeamEvent';
import type { User } from '../../../models/User';
import { usersService } from '../../../services/users.service';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import { prodayHaptics } from '../../../utils/prodayHaptics';
import {
  formatConvocationMessage,
  generatePendingPlayersReminderMessage,
} from '../../../utils/coachConvocationFormatter';
import { CoachText } from '../coachPortalUi';
import { PressableSpring } from '../../motion';
import { radius, spacing } from '../../../theme/designTokens';
import { playerDisciplinaryService } from '../../../services/playerDisciplinary.service';
import type { PlayerEligibilityResult } from '../../../models/PlayerDisciplinary';

export interface CoachShareConvocationModalProps {
  visible: boolean;
  onClose: () => void;
  event: TeamEvent | null;
  members?: User[];
}

type CopyStatus = 'idle' | 'convocation' | 'reminder';

export const CoachShareConvocationModal: React.FC<CoachShareConvocationModalProps> = ({
  visible,
  onClose,
  event,
  members: propMembers,
}) => {
  const { tokens } = useCoachTheme();
  const [loadedMembers, setLoadedMembers] = useState<User[]>(propMembers || []);
  const [customNote, setCustomNote] = useState('');
  const [includeLocationLink, setIncludeLocationLink] = useState(true);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const [suspendedMembers, setSuspendedMembers] = useState<PlayerEligibilityResult[]>([]);

  // Évaluation des suspensions pour les joueurs convoqués
  useEffect(() => {
    if (!event || loadedMembers.length === 0) {
      setSuspendedMembers([]);
      return;
    }
    const isOfficial = event.event_type === 'competition' || !event.friendly_match_id;
    if (!isOfficial) {
      setSuspendedMembers([]);
      return;
    }

    const clubId = event.club_id || 'club_default';
    const matchCtx = {
      match_id: event.id,
      event_type: event.event_type,
      match_date: event.starts_at || new Date(),
      is_official: true,
    };

    let isMounted = true;
    void (async () => {
      const suspended: PlayerEligibilityResult[] = [];
      for (const m of loadedMembers) {
        const res = await playerDisciplinaryService.evaluatePlayerEligibility(
          {
            uid: m.uid,
            license_number: m.profile?.license_number,
            display_name: m.display_name,
          },
          matchCtx,
          clubId
        );
        if (res.status === 'suspended') {
          suspended.push(res);
        }
      }
      if (isMounted) {
        setSuspendedMembers(suspended);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [event, loadedMembers]);

  // Charge les membres si non fournis en props
  useEffect(() => {
    if (propMembers && propMembers.length > 0) {
      setLoadedMembers(propMembers);
      return;
    }

    if (!event || (event.invitee_uids || []).length === 0) {
      setLoadedMembers([]);
      return;
    }

    let isMounted = true;
    void (async () => {
      try {
        const users: User[] = [];
        for (const uid of event.invitee_uids) {
          const u = await usersService.getPublicById(uid);
          if (u) {
            users.push(u);
          }
        }
        if (isMounted) {
          setLoadedMembers(users);
        }
      } catch {
        // En cas d'erreur de chargement réseau, on garde les UIDs
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [event, propMembers]);

  // Réinitialisation de la note à l'ouverture
  useEffect(() => {
    if (visible) {
      setCopyStatus('idle');
    }
  }, [visible]);

  // Message formaté en direct
  const formattedMessage = useMemo(() => {
    if (!event) return '';
    return formatConvocationMessage(event, loadedMembers, {
      includeLocationLink,
      customNote: customNote.trim() ? customNote : undefined,
    });
  }, [event, loadedMembers, includeLocationLink, customNote]);

  // Message de rappel en attente
  const reminderMessage = useMemo(() => {
    if (!event) return '';
    return generatePendingPlayersReminderMessage(event, loadedMembers);
  }, [event, loadedMembers]);

  const pendingCount = event ? getPendingInviteeUids(event).length : 0;

  // Action : Copier le message
  const handleCopyMessage = useCallback(() => {
    if (!formattedMessage) return;
    Clipboard.setString(formattedMessage);
    prodayHaptics.confirm();
    setCopyStatus('convocation');
    setTimeout(() => {
      setCopyStatus((prev) => (prev === 'convocation' ? 'idle' : prev));
    }, 2500);
  }, [formattedMessage]);

  // Action : Ouvrir dans WhatsApp avec repli propre
  const handleOpenWhatsApp = useCallback(async () => {
    if (!formattedMessage || !event) return;
    const encodedText = encodeURIComponent(formattedMessage);
    const whatsappUrl = `whatsapp://send?text=${encodedText}`;

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Repli propre vers le partage système
        await Share.share({
          message: formattedMessage,
          title: event.title,
        });
      }
    } catch {
      try {
        await Share.share({
          message: formattedMessage,
          title: event.title,
        });
      } catch {
        Alert.alert('Erreur', 'Impossible d’ouvrir WhatsApp ou le partage.');
      }
    }
  }, [formattedMessage, event]);

  // Action : Relancer les retardataires
  const handleRemindPending = useCallback(async () => {
    if (!reminderMessage || !event) return;
    Clipboard.setString(reminderMessage);
    prodayHaptics.confirm();
    setCopyStatus('reminder');
    setTimeout(() => {
      setCopyStatus((prev) => (prev === 'reminder' ? 'idle' : prev));
    }, 2500);

    // Propose également d'ouvrir directement WhatsApp si disponible
    Alert.alert(
      'Message de relance copié !',
      'Le message de rappel a été copié dans votre presse-papier. Souhaitez-vous également l’ouvrir dans WhatsApp ?',
      [
        { text: 'Presse-papier uniquement', style: 'cancel' },
        {
          text: 'Ouvrir WhatsApp',
          onPress: async () => {
            const url = `whatsapp://send?text=${encodeURIComponent(reminderMessage)}`;
            try {
              const supported = await Linking.canOpenURL(url);
              if (supported) {
                await Linking.openURL(url);
              } else {
                await Share.share({ message: reminderMessage, title: `Relance ${event.title}` });
              }
            } catch {
              // fallback
            }
          },
        },
      ]
    );
  }, [reminderMessage, event]);

  if (!event) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleCol}>
              <View style={styles.badgeRow}>
                <View style={[styles.tag, { backgroundColor: tokens.accent + '25' }]}>
                  <Ionicons name="flash" size={12} color={tokens.accent} />
                  <CoachText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
                    EXPRESS
                  </CoachText>
                </View>
                <CoachText variant="caption" muted>
                  WhatsApp · SMS · Presse-papier
                </CoachText>
              </View>
              <CoachText variant="section" style={styles.titleText}>
                Partager la Convocation
              </CoachText>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: tokens.elevated }]}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={tokens.foreground} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Alerte disciplinaire officielle */}
            {suspendedMembers.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                  borderWidth: 1,
                  borderRadius: radius.md,
                  padding: spacing.md,
                  marginBottom: spacing.md,
                  gap: 8,
                }}
              >
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <View style={{ flex: 1 }}>
                  <CoachText variant="caption" style={{ color: '#EF4444', fontWeight: '700' }}>
                    Joueur(s) sous le coup d'une suspension FFF :
                  </CoachText>
                  <CoachText variant="caption" style={{ color: '#EF4444', marginTop: 2 }}>
                    {suspendedMembers.map((s) => s.player_name).join(', ')}
                  </CoachText>
                </View>
              </View>
            )}

            {/* Note personnalisée du coach */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionLabelRow}>
                <Ionicons name="create-outline" size={16} color={tokens.accent} />
                <CoachText variant="caption" style={{ color: tokens.foreground, fontWeight: '600' }}>
                  Consigne personnalisée du coach (optionnel)
                </CoachText>
              </View>
              <TextInput
                value={customNote}
                onChangeText={setCustomNote}
                placeholder="Ex: Maillot d'échauffement noir exigé, rdv vestiaire 3..."
                placeholderTextColor={tokens.muted}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: tokens.bg,
                    borderColor: tokens.border,
                    color: tokens.foreground,
                  },
                ]}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Options rapides (Lien Maps) */}
            <View style={styles.optionRow}>
              <View style={styles.optionTextCol}>
                <CoachText variant="body" style={{ fontWeight: '500' }}>
                  Inclure le lien Google Maps
                </CoachText>
                <CoachText variant="caption" muted>
                  Ajoute l'itinéraire direct pour les joueurs et parents
                </CoachText>
              </View>
              <Switch
                value={includeLocationLink}
                onValueChange={setIncludeLocationLink}
                trackColor={{ false: tokens.border, true: tokens.accent }}
                thumbColor={Platform.OS === 'android' ? tokens.foreground : undefined}
              />
            </View>

            {/* Aperçu en direct */}
            <View style={styles.previewSection}>
              <View style={styles.previewHeaderRow}>
                <View style={styles.previewHeaderLeft}>
                  <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                  <CoachText variant="caption" style={{ color: '#25D366', fontWeight: '700' }}>
                    APERÇU EN DIRECT DU MESSAGE
                  </CoachText>
                </View>
                <CoachText variant="caption" muted>
                  {event.invitee_uids?.length || 0} joueur{(event.invitee_uids?.length || 0) > 1 ? 's' : ''}
                </CoachText>
              </View>

              <View style={[styles.previewBubble, { backgroundColor: tokens.bg, borderColor: tokens.border }]}>
                <ScrollView
                  nestedScrollEnabled
                  style={styles.innerPreviewScroll}
                  contentContainerStyle={styles.innerPreviewContent}
                >
                  <CoachText variant="caption" style={[styles.previewText, { color: tokens.foreground }]}>
                    {formattedMessage}
                  </CoachText>
                </ScrollView>
              </View>
            </View>

            {/* Alerte si retardataires */}
            {pendingCount > 0 && (
              <View style={[styles.pendingAlertBox, { backgroundColor: '#F59E0B1A', borderColor: '#F59E0B40' }]}>
                <Ionicons name="time-outline" size={18} color="#F59E0B" />
                <View style={styles.pendingAlertTextCol}>
                  <CoachText variant="caption" style={{ color: '#F59E0B', fontWeight: '700' }}>
                    {pendingCount} joueur{pendingCount > 1 ? 's' : ''} n'ont pas encore répondu
                  </CoachText>
                  <CoachText variant="caption" style={{ color: '#F59E0B' }}>
                    Utilisez le bouton relance ci-dessous pour envoyer un rappel ciblé.
                  </CoachText>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Actions Bottom Bar */}
          <View style={[styles.actionsBar, { borderTopColor: tokens.border }]}>
            <View style={styles.primaryButtonsRow}>
              {/* Copier le message */}
              <PressableSpring
                onPress={handleCopyMessage}
                style={[
                  styles.actionButton,
                  styles.copyButton,
                  copyStatus === 'convocation' && styles.successButton,
                ]}
              >
                <Ionicons
                  name={copyStatus === 'convocation' ? 'checkmark-circle' : 'copy-outline'}
                  size={18}
                  color="#FFFFFF"
                />
                <CoachText variant="body" style={styles.actionButtonText}>
                  {copyStatus === 'convocation' ? 'Copié !' : 'Copier le message'}
                </CoachText>
              </PressableSpring>

              {/* Ouvrir dans WhatsApp */}
              <PressableSpring
                onPress={handleOpenWhatsApp}
                style={[styles.actionButton, styles.whatsappButton]}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <CoachText variant="body" style={styles.actionButtonText}>
                  WhatsApp
                </CoachText>
              </PressableSpring>
            </View>

            {/* Relancer les retardataires */}
            {pendingCount > 0 && (
              <PressableSpring
                onPress={handleRemindPending}
                style={[
                  styles.reminderButton,
                  { backgroundColor: tokens.elevated, borderColor: tokens.border },
                  copyStatus === 'reminder' && styles.successReminderButton,
                ]}
              >
                <Ionicons
                  name={copyStatus === 'reminder' ? 'checkmark' : 'megaphone-outline'}
                  size={16}
                  color={copyStatus === 'reminder' ? '#10B981' : tokens.accent}
                />
                <CoachText
                  variant="caption"
                  style={{
                    color: copyStatus === 'reminder' ? '#10B981' : tokens.accent,
                    fontWeight: '700',
                  }}
                >
                  {copyStatus === 'reminder'
                    ? 'Relance des retardataires copiée !'
                    : `Relancer les retardataires (${pendingCount})`}
                </CoachText>
              </PressableSpring>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    maxHeight: SCREEN_HEIGHT * 0.9,
    minHeight: SCREEN_HEIGHT * 0.65,
    display: 'flex',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitleCol: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    gap: 4,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  sectionBlock: {
    gap: 6,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    minHeight: 52,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  optionTextCol: {
    flex: 1,
    marginRight: spacing.md,
  },
  previewSection: {
    gap: 8,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewBubble: {
    borderWidth: 1,
    borderRadius: radius.md,
    height: 220,
    overflow: 'hidden',
  },
  innerPreviewScroll: {
    flex: 1,
  },
  innerPreviewContent: {
    padding: spacing.md,
  },
  previewText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  pendingAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  pendingAlertTextCol: {
    flex: 1,
    gap: 2,
  },
  actionsBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  primaryButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  copyButton: {
    backgroundColor: '#3B82F6',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  reminderButton: {
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  successReminderButton: {
    borderColor: '#10B981',
    backgroundColor: '#10B9811A',
  },
});
