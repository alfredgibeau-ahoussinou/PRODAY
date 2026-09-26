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
import { playerFeedbackService } from '../../services/playerFeedback.service';
import { usersService } from '../../services/users.service';
import type { User } from '../../models/User';
import type { FeedbackRequestKind } from '../../models/PlayerFeedback';

interface Props {
  visible: boolean;
  onClose: () => void;
  playerUid: string;
  playerName: string;
  clubId?: string;
  teamId?: string;
  // Pré-remplissage éventuel
  initialKind?: FeedbackRequestKind;
  initialEventId?: string;
  initialEventTitle?: string;
  initialEventDate?: Date;
  initialSkillTopic?: string;
  onSuccess?: () => void;
  accent?: string;
}

const COMMON_SKILLS = [
  'Pied faible (passes & frappes)',
  'Prise de balle orientée',
  'Positionnement & repli défensif',
  'Jeu de tête offensif / défensif',
  'Vision du jeu & transition rapide',
  'Gestion du rythme & démarquage',
];

export const PlayerFeedbackModal: React.FC<Props> = ({
  visible,
  onClose,
  playerUid,
  playerName,
  clubId,
  teamId,
  initialKind = 'event_feedback',
  initialEventId,
  initialEventTitle,
  initialEventDate,
  initialSkillTopic,
  onSuccess,
  accent = PLAYER_DARK.accent,
}) => {
  const [kind, setKind] = useState<FeedbackRequestKind>(initialKind);
  const [coaches, setCoaches] = useState<User[]>([]);
  const [selectedCoachUid, setSelectedCoachUid] = useState<string>('');
  const [selectedCoachName, setSelectedCoachName] = useState<string>('');
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  const [question, setQuestion] = useState('');
  const [skillTopic, setSkillTopic] = useState(initialSkillTopic ?? COMMON_SKILLS[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialKind) setKind(initialKind);
    if (initialSkillTopic) setSkillTopic(initialSkillTopic);
  }, [initialKind, initialSkillTopic]);

  useEffect(() => {
    if (!visible || !clubId) return;
    let alive = true;
    setLoadingCoaches(true);
    usersService
      .listStaff('coach')
      .then((coachesList) => {
        if (!alive) return;
        const filtered = clubId ? coachesList.filter((c) => c.profile?.club_id === clubId) : coachesList;
        const listToUse = filtered.length > 0 ? filtered : coachesList;
        setCoaches(listToUse);
        if (listToUse.length > 0 && !selectedCoachUid) {
          setSelectedCoachUid(listToUse[0].uid);
          setSelectedCoachName(listToUse[0].display_name);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoadingCoaches(false);
      });
    return () => {
      alive = false;
    };
  }, [visible, clubId]);

  const handleSubmit = async () => {
    if (!question.trim()) {
      Alert.alert('Question requise', 'Merci de formuler précisément votre question ou votre besoin.');
      return;
    }
    if (!selectedCoachUid) {
      Alert.alert('Coach requis', 'Veuillez sélectionner un coach de votre club.');
      return;
    }

    setSubmitting(true);
    try {
      // Clé d'idempotence pour éviter les doublons sur double-clic
      const idempotencyKey = `req_${playerUid}_${Date.now()}`;
      await playerFeedbackService.createRequest({
        kind,
        player_uid: playerUid,
        player_name: playerName,
        coach_uid: selectedCoachUid,
        coach_name: selectedCoachName || 'Coach',
        club_id: clubId,
        team_id: teamId,
        event_id: kind === 'event_feedback' ? initialEventId : undefined,
        event_title: kind === 'event_feedback' ? initialEventTitle : undefined,
        event_date: kind === 'event_feedback' ? initialEventDate : undefined,
        skill_topic: kind === 'specific_skill' ? skillTopic : undefined,
        question: question.trim(),
        idempotency_key: idempotencyKey,
      });

      prodayHaptics.confirm();
      Alert.alert(
        'Demande transmise',
        'Votre message et votre demande ont été transmis au coach. Vous retrouverez l’échange dans votre messagerie.',
        [{ text: 'OK', onPress: () => {
          onClose();
          onSuccess?.();
        }}],
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible d’envoyer votre demande.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons
                name={kind === 'event_feedback' ? 'chatbubble-ellipses' : 'fitness'}
                size={20}
                color={accent}
              />
              <ProDayText style={styles.title}>
                {kind === 'event_feedback' ? 'Demander un feedback au coach' : 'Demander un travail spécifique'}
              </ProDayText>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={PLAYER_DARK.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Contexte de l'événement s'il existe */}
            {kind === 'event_feedback' && initialEventTitle ? (
              <View style={styles.eventContextCard}>
                <Ionicons name="calendar-outline" size={16} color={accent} />
                <View style={styles.eventContextText}>
                  <ProDayText style={styles.eventContextTitle}>{initialEventTitle}</ProDayText>
                  {initialEventDate ? (
                    <ProDayText style={styles.eventContextSub}>
                      {initialEventDate.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </ProDayText>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* Sélecteur de compétence si entraînement spécifique */}
            {kind === 'specific_skill' && (
              <View style={styles.section}>
                <ProDayText style={styles.sectionLabel}>Thématique de travail :</ProDayText>
                <View style={styles.skillChipsWrap}>
                  {COMMON_SKILLS.map((sk) => {
                    const isSelected = skillTopic === sk;
                    return (
                      <TouchableOpacity
                        key={sk}
                        style={[
                          styles.skillChip,
                          isSelected && { backgroundColor: `${accent}25`, borderColor: accent },
                        ]}
                        onPress={() => {
                          prodayHaptics.selection();
                          setSkillTopic(sk);
                        }}
                      >
                        <ProDayText
                          style={[styles.skillChipText, isSelected && { color: accent, fontWeight: '700' }]}
                        >
                          {sk}
                        </ProDayText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Choix du coach */}
            <View style={styles.section}>
              <ProDayText style={styles.sectionLabel}>Destinataire (Coach) :</ProDayText>
              {loadingCoaches ? (
                <ActivityIndicator size="small" color={accent} style={{ marginVertical: 8 }} />
              ) : coaches.length > 0 ? (
                <View style={styles.coachesRow}>
                  {coaches.map((c) => {
                    const isSelected = selectedCoachUid === c.uid;
                    return (
                      <TouchableOpacity
                        key={c.uid}
                        style={[
                          styles.coachCard,
                          isSelected && { borderColor: accent, backgroundColor: `${accent}15` },
                        ]}
                        onPress={() => {
                          prodayHaptics.selection();
                          setSelectedCoachUid(c.uid);
                          setSelectedCoachName(c.display_name);
                        }}
                      >
                        <Ionicons
                          name="person-circle"
                          size={24}
                          color={isSelected ? accent : PLAYER_DARK.textMuted}
                        />
                        <ProDayText
                          style={[styles.coachName, isSelected && { color: accent, fontWeight: '700' }]}
                        >
                          {c.display_name}
                        </ProDayText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <ProDayText style={styles.noCoachText}>
                  {clubId ? 'Aucun coach répertorié dans votre effectif.' : 'Rattachez-vous à votre club pour contacter un coach.'}
                </ProDayText>
              )}
            </View>

            {/* Zone de question */}
            <View style={styles.section}>
              <ProDayText style={styles.sectionLabel}>Votre question ou besoin :</ProDayText>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder={
                  kind === 'event_feedback'
                    ? 'Ex: Coach, sur mon repli en seconde mi-temps, aurais-je dû coulisser plus tôt vers l’axe ?'
                    : 'Ex: J’aimerais travailler ma relance du pied gauche sous pression lors des séances.'
                }
                placeholderTextColor={PLAYER_DARK.textMuted}
                value={question}
                onChangeText={setQuestion}
              />
            </View>

            <ProDayText style={styles.minorDisclaimer}>
              L’échange est privé et respecte les règles de communication avec les mineurs. Il sera consultable dans la messagerie.
            </ProDayText>
          </ScrollView>

          {/* Boutons d'action */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <ProDayText style={styles.cancelText}>Annuler</ProDayText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: accent }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <ProDayText style={styles.submitText}>Envoyer la demande</ProDayText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F121C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: PLAYER_DARK.text,
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  eventContextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  eventContextText: {
    flex: 1,
  },
  eventContextTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventContextSub: {
    fontSize: 11,
    color: PLAYER_DARK.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PLAYER_DARK.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  skillChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  skillChipText: {
    fontSize: 12,
    color: PLAYER_DARK.text,
  },
  coachesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  coachName: {
    fontSize: 12,
    color: PLAYER_DARK.text,
  },
  noCoachText: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
    fontStyle: 'italic',
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 13,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  minorDisclaimer: {
    fontSize: 11,
    color: PLAYER_DARK.textMuted,
    fontStyle: 'italic',
    lineHeight: 15,
    marginVertical: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelText: {
    fontSize: 13,
    color: PLAYER_DARK.textMuted,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  submitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
