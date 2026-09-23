import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useTranslation } from '../../context/LocaleContext';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { reelsTheme } from './reelsTheme';
import {
  addReelComment,
  loadReelComments,
  type ReelComment,
} from '../../utils/reelComments';

interface ReelCommentsSheetProps {
  visible: boolean;
  bookmarkKey?: string;
  authorName?: string;
  currentUserName?: string;
  currentUserUid?: string;
  onClose: () => void;
  onCountChange?: (bookmarkKey: string, count: number) => void;
}

function relativeTime(iso: string, t: (key: string) => string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('reels.comments.now');
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} j`;
}

export const ReelCommentsSheet: React.FC<ReelCommentsSheetProps> = ({
  visible,
  bookmarkKey,
  authorName,
  currentUserName,
  currentUserUid,
  onClose,
  onCountChange,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(insets.bottom), [insets.bottom]);

  const [comments, setComments] = useState<ReelComment[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible || !bookmarkKey) return;
    let alive = true;
    setLoading(true);
    void (async () => {
      const list = await loadReelComments(bookmarkKey);
      if (alive) {
        setComments(list);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [visible, bookmarkKey]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !bookmarkKey || sending) return;
    setSending(true);
    void (async () => {
      const list = await addReelComment(bookmarkKey, {
        text,
        authorName: currentUserName || t('reels.comments.you'),
        authorUid: currentUserUid,
      });
      setComments(list);
      setDraft('');
      onCountChange?.(bookmarkKey, list.length);
      prodayHaptics.confirm();
      setSending(false);
    })();
  };

  const canSend = draft.trim().length > 0 && !sending;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <ProDayText variant="title" style={styles.title}>
                  {t('reels.comments.title')}
                </ProDayText>
                <ProDayText variant="caption" style={styles.subtitle} numberOfLines={1}>
                  {comments.length > 0
                    ? t('reels.comments.count', { n: comments.length })
                    : authorName
                      ? t('reels.comments.forAuthor', { author: authorName })
                      : ''}
                </ProDayText>
              </View>
              <Pressable onPress={onClose} hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Fermer">
                <Icon name="close" size={22} color={reelsTheme.color.textDim} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.loader}>
                  <ActivityIndicator color={reelsTheme.color.amber} size="small" />
                </View>
              ) : comments.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyGlyph}>
                    <Icon name="chat" size={26} color={reelsTheme.color.amber} />
                  </View>
                  <ProDayText variant="section" style={styles.emptyTitle}>
                    {t('reels.comments.emptyTitle')}
                  </ProDayText>
                  <ProDayText variant="body" style={styles.emptyBody}>
                    {t('reels.comments.emptyBody')}
                  </ProDayText>
                </View>
              ) : (
                comments.map((c) => (
                  <View key={c.id} style={styles.commentRow}>
                    <View style={styles.commentAvatar}>
                      <ProDayText style={styles.commentAvatarLetter}>
                        {c.authorName.charAt(0).toUpperCase()}
                      </ProDayText>
                    </View>
                    <View style={styles.commentBody}>
                      <View style={styles.commentMeta}>
                        <ProDayText style={styles.commentName} numberOfLines={1}>
                          {c.authorName}
                        </ProDayText>
                        <ProDayText style={styles.commentTime}>
                          {relativeTime(c.at, t)}
                        </ProDayText>
                      </View>
                      <ProDayText style={styles.commentText}>{c.text}</ProDayText>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.composer}>
              <View style={styles.composerAvatar}>
                <ProDayText style={styles.composerAvatarLetter}>
                  {(currentUserName || 'T').charAt(0).toUpperCase()}
                </ProDayText>
              </View>
              <TextInput
                ref={inputRef}
                value={draft}
                onChangeText={setDraft}
                placeholder={t('reels.comments.placeholder')}
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.input}
                multiline
                maxLength={280}
                onSubmitEditing={handleSend}
              />
              <PressableSpring
                onPress={handleSend}
                disabled={!canSend}
                scaleTo={0.88}
                haptic
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: canSend
                      ? reelsTheme.color.amber
                      : 'rgba(245,240,230,0.08)',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('reels.comments.send')}
              >
                <Icon
                  name="chevron-up"
                  size={22}
                  color={canSend ? reelsTheme.color.onAmber : reelsTheme.color.textFaint}
                />
              </PressableSpring>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

function createStyles(bottomInset: number) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: reelsTheme.color.backdrop,
    },
    kav: { justifyContent: 'flex-end' },
    sheet: {
      height: '74%',
      backgroundColor: reelsTheme.color.surface,
      borderTopLeftRadius: reelsTheme.radius.lg,
      borderTopRightRadius: reelsTheme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: reelsTheme.color.hairline,
      paddingHorizontal: reelsTheme.space.lg,
      paddingTop: reelsTheme.space.sm,
      paddingBottom: Math.max(bottomInset, reelsTheme.space.md),
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: reelsTheme.color.hairlineStrong,
      marginBottom: reelsTheme.space.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: reelsTheme.space.md,
    },
    headerText: { flex: 1, gap: 2 },
    title: { color: reelsTheme.color.text },
    subtitle: { color: reelsTheme.color.textDim },
    list: { flex: 1 },
    listContent: { paddingBottom: reelsTheme.space.lg, gap: reelsTheme.space.lg },
    loader: { paddingVertical: reelsTheme.space.xxl, alignItems: 'center' },
    emptyWrap: {
      alignItems: 'center',
      gap: reelsTheme.space.sm,
      paddingVertical: reelsTheme.space.xxl,
    },
    emptyGlyph: {
      width: 58,
      height: 58,
      borderRadius: reelsTheme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: reelsTheme.color.amberLine,
      backgroundColor: reelsTheme.color.amberSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: reelsTheme.space.xs,
    },
    emptyTitle: { color: reelsTheme.color.text },
    emptyBody: {
      color: reelsTheme.color.textDim,
      textAlign: 'center',
      maxWidth: 280,
    },
    commentRow: {
      flexDirection: 'row',
      gap: reelsTheme.space.md,
      alignItems: 'flex-start',
    },
    commentAvatar: {
      width: 38,
      height: 38,
      borderRadius: reelsTheme.radius.sm,
      backgroundColor: reelsTheme.color.amberSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: reelsTheme.color.amberLine,
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentAvatarLetter: {
      color: reelsTheme.color.amber,
      fontFamily: reelsTheme.type.name.fontFamily,
      fontSize: 15,
    },
    commentBody: { flex: 1, gap: 3 },
    commentMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: reelsTheme.space.sm,
    },
    commentName: {
      color: reelsTheme.color.text,
      fontFamily: reelsTheme.type.name.fontFamily,
      fontSize: 14,
      letterSpacing: -0.2,
      flexShrink: 1,
    },
    commentTime: {
      color: reelsTheme.color.textFaint,
      fontFamily: reelsTheme.type.kicker.fontFamily,
      fontSize: 11,
      letterSpacing: 0.4,
    },
    commentText: {
      color: reelsTheme.color.text,
      fontFamily: reelsTheme.type.caption.fontFamily,
      fontSize: 15,
      lineHeight: 21,
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: reelsTheme.space.sm,
      paddingTop: reelsTheme.space.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: reelsTheme.color.hairline,
    },
    composerAvatar: {
      width: 34,
      height: 34,
      borderRadius: reelsTheme.radius.sm,
      backgroundColor: 'rgba(245,240,230,0.10)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 3,
    },
    composerAvatarLetter: {
      color: reelsTheme.color.text,
      fontFamily: reelsTheme.type.name.fontFamily,
      fontSize: 13,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 110,
      borderRadius: reelsTheme.radius.md,
      paddingHorizontal: reelsTheme.space.md,
      paddingTop: 10,
      paddingBottom: 10,
      fontFamily: reelsTheme.type.caption.fontFamily,
      fontSize: 15,
      color: reelsTheme.color.text,
      backgroundColor: 'rgba(245,240,230,0.06)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: reelsTheme.color.hairline,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: reelsTheme.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 1,
    },
  });
}
