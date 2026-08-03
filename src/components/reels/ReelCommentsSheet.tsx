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
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { fontFamily } from '../../theme/typography';
import { spacing, radius } from '../../theme/designTokens';
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
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, insets.bottom), [colors, insets.bottom]);

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
              <Pressable onPress={onClose} hitSlop={12}>
                <Icon name="close" size={22} color="rgba(255,255,255,0.7)" />
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
                  <ActivityIndicator color={colors.accent} size="small" />
                </View>
              ) : comments.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <View style={[styles.emptyGlyph, { borderColor: colors.accent }]}>
                    <Icon name="chat" size={26} color={colors.accent} />
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
                  { backgroundColor: canSend ? colors.accent : 'rgba(255,255,255,0.08)' },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('reels.comments.send')}
              >
                <Icon
                  name="chevron-up"
                  size={22}
                  color={canSend ? '#04110F' : 'rgba(255,255,255,0.4)'}
                />
              </PressableSpring>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

function createStyles(colors: ReturnType<typeof useAppTheme>['colors'], bottomInset: number) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    kav: { justifyContent: 'flex-end' },
    sheet: {
      height: '74%',
      backgroundColor: '#0B0D10',
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: Math.max(bottomInset, spacing.md),
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: 'rgba(255,255,255,0.18)',
      marginBottom: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    headerText: { flex: 1, gap: 2 },
    title: { color: '#FFFFFF' },
    subtitle: { color: 'rgba(255,255,255,0.5)' },
    list: { flex: 1 },
    listContent: { paddingBottom: spacing.lg, gap: spacing.lg },
    loader: { paddingVertical: spacing.xxl, alignItems: 'center' },
    emptyWrap: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xxl,
    },
    emptyGlyph: {
      width: 58,
      height: 58,
      borderRadius: 29,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    emptyTitle: { color: '#FFFFFF' },
    emptyBody: {
      color: 'rgba(255,255,255,0.55)',
      textAlign: 'center',
      maxWidth: 280,
    },
    commentRow: {
      flexDirection: 'row',
      gap: spacing.md,
      alignItems: 'flex-start',
    },
    commentAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(34,211,238,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(34,211,238,0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentAvatarLetter: {
      color: colors.accent,
      fontFamily: fontFamily.extrabold,
      fontSize: 15,
    },
    commentBody: { flex: 1, gap: 3 },
    commentMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    commentName: {
      color: '#FFFFFF',
      fontFamily: fontFamily.bold,
      fontSize: 14,
      flexShrink: 1,
    },
    commentTime: {
      color: 'rgba(255,255,255,0.4)',
      fontFamily: fontFamily.semibold,
      fontSize: 12,
    },
    commentText: {
      color: 'rgba(255,255,255,0.82)',
      fontFamily: fontFamily.regular,
      fontSize: 15,
      lineHeight: 21,
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.08)',
    },
    composerAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(255,255,255,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 3,
    },
    composerAvatarLetter: {
      color: '#FFFFFF',
      fontFamily: fontFamily.bold,
      fontSize: 13,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 110,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingTop: 10,
      paddingBottom: 10,
      fontFamily: fontFamily.regular,
      fontSize: 15,
      color: '#FFFFFF',
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 1,
    },
  });
}
