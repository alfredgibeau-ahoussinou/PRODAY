/**
 * Interface conversationnelle partagée du Copilote — un seul composant pour tous les pôles.
 *
 * Ce qu'il ne fait **pas**, volontairement :
 *   - il n'invente jamais de réponse : un message vide n'est jamais rendu, un échec affiche le
 *     motif réel du service et propose de réessayer ;
 *   - il n'anime pas une fausse frappe : `onCall` ne diffuse pas de jetons, donc l'état affiché
 *     est « génération en cours », pas un texte qui se remplit tout seul ;
 *   - il n'annonce jamais « envoyé / enregistré » : une action à effet de bord passe par
 *     `onConfirmAction`, qui n'écrit la confirmation qu'après le retour du service.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Clipboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { Icon } from '../../components/ui/Icon';
import { CopilotBlocks } from './CopilotBlocks';
import type { CopilotController } from './useCopilot';
import {
  COPILOT_RATE_LIMIT_COOLDOWN_MS,
  conversationExcerpt,
  conversationTurnCount,
  filterConversations,
  groupConversationsByDay,
  type CopilotMessage,
} from './copilotCore';
import type { CopilotTokens } from './copilotTokens';

const WIDE_LAYOUT = 900;

export type CopilotChatProps = {
  tokens: CopilotTokens;
  controller: CopilotController;
  /** Titre du pôle, ex. « Copilote Club ». */
  roleLabel: string;
  /** Contexte actif, affiché en permanence : « FC ProDay · U15 · Saison 2026-2027 ». */
  contextLabel: string;
  /** Précision honnête sur ce que fait le service (une phrase, pas un slogan). */
  serviceNote: string;
  suggestions: string[];
  placeholder: string;
  /** Hauteur réservée sous le composer : zone sûre + barre de navigation du pôle. */
  bottomInset: number;
  onClose?: () => void;
  /**
   * Appelé quand l'utilisateur envoie un tour, **avant** l'appel au modèle. Sert au pôle Club
   * pour proposer puis confirmer une action à effet de bord (envoi de rappels, etc.) : la
   * confirmation reste ainsi rattachée à l'intention exprimée, jamais à la réponse du modèle.
   */
  onUserTurn?: (text: string) => void;
};

export function CopilotChat({
  tokens,
  controller,
  roleLabel,
  contextLabel,
  serviceNote,
  suggestions,
  placeholder,
  bottomInset,
  onClose,
  onUserTurn,
}: CopilotChatProps) {
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_LAYOUT;
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [historyQuery, setHistoryQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const { active, generating, conversations } = controller;
  const messages = active?.messages ?? [];
  const hasContent = messages.length > 0;

  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  }, []);

  const onSend = useCallback(async () => {
    const text = input.trim();
    if (!text || generating) return;
    setInput('');
    scrollToEnd();
    onUserTurn?.(text);
    await controller.send(text);
    scrollToEnd();
  }, [controller, generating, input, onUserTurn, scrollToEnd]);

  const onRetry = useCallback(
    async (messageId: string) => {
      await controller.retry(messageId);
      scrollToEnd();
    },
    [controller, scrollToEnd],
  );

  /**
   * Libellé du « Réessayer » d'un échec : pendant le délai d'une limite de
   * débit, le bouton **affiche l'attente** au lieu de la promettre puis de
   * refuser le clic — le refus silencieux après un 429 faisait croire à un
   * bouton cassé.
   */
  const retryLabel = useCallback(
    (message: CopilotMessage): string => {
      const remaining =
        typeof controller.retryDelayMs === 'number' && message.status === 'failed'
          ? controller.retryDelayMs
          : 0;
      const seconds = Math.ceil(remaining / 1000);
      return remaining > 0 && seconds <= COPILOT_RATE_LIMIT_COOLDOWN_MS / 1000
        ? `Réessayer dans ${seconds} s`
        : 'Réessayer';
    },
    [controller.retryDelayMs],
  );

  const onCopy = useCallback((message: CopilotMessage) => {
    Clipboard.setString(message.content);
    setCopiedId(message.id);
    setTimeout(() => setCopiedId(null), 1800);
  }, []);

  const styles = useMemo(() => createStyles(tokens), [tokens]);
  /**
   * Historique filtré puis regroupé par jour. Le filtre s'applique **avant** le regroupement,
   * donc une section vide ne s'affiche jamais, et l'état vide dit explicitement que la
   * recherche ne correspond à rien — plutôt que de laisser croire à un historique vide.
   */
  const historyGroups = useMemo(
    () => groupConversationsByDay(filterConversations(conversations, historyQuery)),
    [conversations, historyQuery],
  );

  const historyPanel = (
    <View style={[wide ? styles.historySide : styles.historySheet, { borderColor: tokens.border }]}>
      <View style={styles.historyHeader}>
        <ProDayText variant="section" style={[styles.historyTitle, { color: tokens.foreground }]}>
          Historique
        </ProDayText>
        <Pressable
          onPress={() => setShowHistory(false)}
          accessibilityLabel="Fermer l’historique"
          hitSlop={8}
        >
          <Icon name="close" size={16} color={tokens.muted} />
        </Pressable>
      </View>
      {conversations.length > 0 ? (
        <View style={[styles.historySearch, { backgroundColor: tokens.elevated }]}>
          <Icon name="search" size={14} color={tokens.muted} />
          <TextInput
            value={historyQuery}
            onChangeText={setHistoryQuery}
            placeholder="Rechercher une conversation…"
            placeholderTextColor={tokens.muted}
            accessibilityLabel="Rechercher dans l’historique"
            style={[styles.historySearchInput, { color: tokens.foreground }]}
          />
          {historyQuery ? (
            <Pressable
              onPress={() => setHistoryQuery('')}
              accessibilityLabel="Effacer la recherche"
              hitSlop={8}
            >
              <Icon name="close" size={14} color={tokens.muted} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {conversations.length === 0 ? (
        <ProDayText variant="caption" style={{ color: tokens.muted, padding: 12 }}>
          Aucune conversation enregistrée pour ce compte et ce club.
        </ProDayText>
      ) : historyGroups.length === 0 ? (
        <ProDayText variant="caption" style={{ color: tokens.muted, padding: 12 }}>
          Aucune conversation ne correspond à « {historyQuery.trim()} ».
        </ProDayText>
      ) : (
        <ScrollView style={styles.historyList} keyboardShouldPersistTaps="handled">
          {historyGroups.map((group) => (
            <View key={group.label}>
              <ProDayText
                variant="caption"
                style={[styles.historyGroupLabel, { color: tokens.muted }]}
              >
                {group.label}
              </ProDayText>
              {group.conversations.map((c) => {
                const isActive = c.id === active?.id;
                const excerpt = conversationExcerpt(c);
                const turns = conversationTurnCount(c);
                return (
                  <View
                    key={c.id}
                    style={[
                      styles.historyRow,
                      { borderColor: tokens.border },
                      isActive ? { backgroundColor: tokens.accentSoft } : null,
                    ]}
                  >
                    <Pressable
                      style={styles.historyPress}
                      accessibilityLabel={`Ouvrir ${c.title}`}
                      onPress={() => {
                        controller.selectConversation(c.id);
                        if (!wide) setShowHistory(false);
                      }}
                    >
                      <ProDayText
                        variant="body"
                        numberOfLines={1}
                        style={{ color: isActive ? tokens.accent : tokens.foreground, fontSize: 14 }}
                      >
                        {c.title}
                      </ProDayText>
                      {excerpt ? (
                        <ProDayText
                          variant="caption"
                          numberOfLines={1}
                          style={{ color: tokens.muted }}
                        >
                          {excerpt}
                        </ProDayText>
                      ) : null}
                      <ProDayText variant="caption" style={{ color: tokens.muted }}>
                        {turns} question{turns > 1 ? 's' : ''}
                      </ProDayText>
                    </Pressable>
                    <Pressable
                      onPress={() => controller.deleteConversation(c.id)}
                      accessibilityLabel={`Supprimer ${c.title}`}
                      hitSlop={8}
                    >
                      <Icon name="trash" size={15} color={tokens.muted} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: tokens.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={[styles.header, { borderBottomColor: tokens.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.orb, { backgroundColor: tokens.accentSoft, borderColor: tokens.accent }]}>
              <Icon name="sparkles" size={16} color={tokens.accent} />
            </View>
            <View style={styles.headerTexts}>
              <ProDayText variant="section" style={[styles.headerTitle, { color: tokens.foreground }]}>
                {roleLabel}
              </ProDayText>
              <ProDayText variant="caption" numberOfLines={1} style={{ color: tokens.muted }}>
                {contextLabel}
              </ProDayText>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setShowHistory((v) => !v)}
              style={[styles.iconBtn, { borderColor: tokens.border, backgroundColor: tokens.surface }]}
              accessibilityLabel="Historique des conversations"
            >
              <Icon name="chatbubbles" size={17} color={tokens.foreground} />
            </Pressable>
            <Pressable
              onPress={() => {
                controller.newConversation();
                setShowHistory(false);
              }}
              style={[styles.iconBtn, { borderColor: tokens.border, backgroundColor: tokens.surface }]}
              accessibilityLabel="Nouvelle conversation"
            >
              <Icon name="add" size={18} color={tokens.foreground} />
            </Pressable>
            {onClose ? (
              <Pressable
                onPress={onClose}
                style={[styles.iconBtn, { borderColor: tokens.border, backgroundColor: tokens.surface }]}
                accessibilityLabel="Fermer le copilote"
              >
                <Icon name="close" size={17} color={tokens.foreground} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <ProDayText variant="caption" style={[styles.serviceNote, { color: tokens.muted }]}>
          {serviceNote}
        </ProDayText>

        {controller.storageWarning ? (
          <View style={[styles.warning, { borderColor: tokens.warning, backgroundColor: tokens.elevated }]}>
            <Icon name="warning" size={14} color={tokens.warning} />
            <ProDayText variant="caption" style={[styles.warningText, { color: tokens.foreground }]}>
              {controller.storageWarning}
            </ProDayText>
          </View>
        ) : null}

        <View style={styles.body}>
          {wide && showHistory ? historyPanel : null}

          <ScrollView
            ref={scrollRef}
            style={styles.thread}
            contentContainerStyle={styles.threadInner}
            onContentSizeChange={scrollToEnd}
            keyboardShouldPersistTaps="handled"
          >
            {!hasContent ? (
              <View style={styles.empty}>
                <ProDayText variant="section" style={[styles.emptyTitle, { color: tokens.foreground }]}>
                  Que veux-tu préparer ?
                </ProDayText>
                <ProDayText variant="caption" style={[styles.emptySub, { color: tokens.muted }]}>
                  {serviceNote}
                </ProDayText>
                <View style={styles.suggestions}>
                  {suggestions.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => {
                        setInput('');
                        onUserTurn?.(s);
                        void controller.send(s).then(scrollToEnd);
                      }}
                      style={[
                        styles.suggestion,
                        { borderColor: tokens.border, backgroundColor: tokens.surface },
                      ]}
                    >
                      <ProDayText variant="body" style={{ color: tokens.foreground, fontSize: 14 }}>
                        {s}
                      </ProDayText>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.turn,
                      isUser ? styles.turnUser : styles.turnAssistant,
                    ]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        isUser
                          ? { backgroundColor: tokens.accent, borderColor: tokens.accent }
                          : { backgroundColor: tokens.surface, borderColor: tokens.border },
                      ]}
                    >
                      {isUser ? (
                        <ProDayText
                          variant="body"
                          style={[styles.userText, { color: tokens.onAccent }]}
                        >
                          {m.content}
                        </ProDayText>
                      ) : m.status === 'pending' ? (
                        <View style={styles.stateRow}>
                          <ActivityIndicator size="small" color={tokens.accent} />
                          <ProDayText variant="caption" style={{ color: tokens.muted }}>
                            Génération en cours…
                          </ProDayText>
                        </View>
                      ) : m.status === 'stopped' ? (
                        <View style={styles.stateBlock}>
                          <ProDayText variant="caption" style={{ color: tokens.muted }}>
                            Réponse interrompue. Aucun texte partiel n’est conservé, le service ne
                            diffusant pas sa sortie au fil de l’eau.
                          </ProDayText>
                          <Pressable
                            onPress={() => void onRetry(m.id)}
                            style={[styles.linkBtn, { borderColor: tokens.border }]}
                            accessibilityLabel="Relancer la demande"
                          >
                            <Icon name="refresh" size={13} color={tokens.accent} />
                            <ProDayText variant="caption" style={{ color: tokens.accent }}>
                              Relancer
                            </ProDayText>
                          </Pressable>
                        </View>
                      ) : m.status === 'failed' ? (
                        <View style={styles.stateBlock}>
                          <View style={styles.stateRow}>
                            <Icon name="warning" size={14} color={tokens.danger} />
                            <ProDayText variant="caption" style={{ color: tokens.danger }}>
                              Aucune réponse générée
                            </ProDayText>
                          </View>
                          <ProDayText variant="caption" style={{ color: tokens.foreground }}>
                            {m.error ?? 'Le service n’a pas renvoyé de réponse.'}
                          </ProDayText>
                          <Pressable
                            onPress={() => void onRetry(m.id)}
                            disabled={controller.retryDelayMs > 0}
                            style={[
                              styles.linkBtn,
                              { borderColor: tokens.border },
                              controller.retryDelayMs > 0 ? { opacity: 0.55 } : null,
                            ]}
                            accessibilityLabel={retryLabel(m)}
                          >
                            <Icon name="refresh" size={13} color={tokens.accent} />
                            <ProDayText variant="caption" style={{ color: tokens.accent }}>
                              {retryLabel(m)}
                            </ProDayText>
                          </Pressable>
                        </View>
                      ) : (
                        <CopilotBlocks content={m.content} tokens={tokens} />
                      )}
                    </View>

                    {!isUser && m.status === 'complete' ? (
                      <View style={styles.turnActions}>
                        <Pressable
                          onPress={() => onCopy(m)}
                          style={styles.turnAction}
                          accessibilityLabel="Copier la réponse"
                        >
                          <Icon name="document" size={13} color={tokens.muted} />
                          <ProDayText variant="caption" style={{ color: tokens.muted }}>
                            {copiedId === m.id ? 'Copié' : 'Copier'}
                          </ProDayText>
                        </Pressable>
                        <Pressable
                          onPress={() => void onRetry(m.id)}
                          style={styles.turnAction}
                          accessibilityLabel="Regénérer la réponse"
                        >
                          <Icon name="refresh" size={13} color={tokens.muted} />
                          <ProDayText variant="caption" style={{ color: tokens.muted }}>
                            Regénérer
                          </ProDayText>
                        </Pressable>
                        {m.model ? (
                          <ProDayText variant="caption" style={[styles.modelTag, { color: tokens.muted }]}>
                            {m.model}
                          </ProDayText>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </ScrollView>

          {!wide && showHistory ? (
            <View style={styles.historyOverlay}>{historyPanel}</View>
          ) : null}
        </View>

        <View
          style={[
            styles.composer,
            {
              borderTopColor: tokens.border,
              backgroundColor: tokens.bg,
              paddingBottom: bottomInset + 10,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              { backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.foreground },
            ]}
            placeholder={placeholder}
            placeholderTextColor={tokens.muted}
            value={input}
            onChangeText={setInput}
            multiline
            editable={!generating}
            accessibilityLabel="Message au copilote"
          />
          {generating ? (
            <Pressable
              onPress={controller.stop}
              style={[styles.actionBtn, { backgroundColor: tokens.danger }]}
              accessibilityLabel="Arrêter la génération"
            >
              <ProDayText variant="body" style={[styles.actionGlyph, { color: '#FFFFFF' }]}>
                ■
              </ProDayText>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => void onSend()}
              disabled={!input.trim()}
              style={[
                styles.actionBtn,
                { backgroundColor: tokens.accent, opacity: input.trim() ? 1 : 0.45 },
              ]}
              accessibilityLabel="Envoyer"
            >
              <ProDayText variant="body" style={[styles.actionGlyph, { color: tokens.onAccent }]}>
                ↑
              </ProDayText>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (tokens: CopilotTokens) =>
  StyleSheet.create({
    root: { flex: 1 },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    orb: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTexts: { flex: 1 },
    headerTitle: { fontSize: 15, fontWeight: '700' },
    headerActions: { flexDirection: 'row', gap: 8 },
    iconBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    serviceNote: { paddingHorizontal: 16, paddingTop: 8, fontSize: 11, lineHeight: 16 },
    warning: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginTop: 8,
      borderWidth: 1,
      borderRadius: 10,
      padding: 10,
    },
    warningText: { flex: 1, fontSize: 11, lineHeight: 16 },
    body: { flex: 1, flexDirection: 'row' },
    thread: { flex: 1 },
    threadInner: { padding: 16, gap: 14, paddingBottom: 24 },
    empty: { paddingTop: 24, gap: 8 },
    emptyTitle: { fontSize: 17, fontWeight: '700' },
    emptySub: { fontSize: 12, lineHeight: 18 },
    suggestions: { gap: 8, marginTop: 12 },
    suggestion: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
    turn: { maxWidth: '100%' },
    turnUser: { alignSelf: 'flex-end', maxWidth: '85%' },
    turnAssistant: { alignSelf: 'stretch' },
    bubble: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
    userText: { fontSize: 15, lineHeight: 21 },
    stateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    stateBlock: { gap: 8 },
    linkBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    turnActions: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6, paddingLeft: 4 },
    turnAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    modelTag: { fontSize: 10, marginLeft: 'auto' },
    historySide: {
      width: 280,
      borderRightWidth: 1,
      marginRight: 0,
    },
    historySheet: { borderWidth: 1, borderRadius: 14, maxHeight: 320 },
    historyOverlay: {
      position: 'absolute',
      top: 8,
      left: 12,
      right: 12,
      backgroundColor: tokens.bg,
      zIndex: 20,
    },
    historyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
    },
    historyTitle: { fontSize: 14, fontWeight: '700' },
    historyList: { paddingHorizontal: 8, paddingBottom: 8 },
    historySearch: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 8,
      marginBottom: 8,
      paddingHorizontal: 10,
      height: 38,
      borderRadius: 10,
    },
    historySearchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },
    historyGroupLabel: {
      paddingHorizontal: 8,
      paddingTop: 10,
      paddingBottom: 4,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      borderTopWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 10,
    },
    historyPress: { flex: 1 },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 10,
      borderTopWidth: 1,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 132,
      borderWidth: 1,
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      fontSize: 15,
      lineHeight: 21,
    },
    actionBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionGlyph: { fontSize: 18, fontWeight: '800' },
  });
