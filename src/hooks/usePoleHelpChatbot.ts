import { useCallback, useEffect, useState } from 'react';
import { useTabNavigationOptional } from '../context/TabNavigationContext';
import { useSessionProfile } from './useSessionProfile';
import type { ProductLineId } from '../models/ProductLine';
import {
  getPoleHelpContent,
  resolvePoleHelpUsesBriefcaseIcon,
  type PoleHelpContent,
} from '../content/poleHelpContent';
import {
  dismissPoleHelpBubble,
  isPoleHelpBubbleDismissed,
} from '../services/poleHelpPreferences.service';

export interface PoleHelpChatbotState {
  visible: boolean;
  content: PoleHelpContent;
  usesBriefcaseIcon: boolean;
  showBubble: boolean;
  dismissBubble: () => void;
}

/** Visibilité et contenu du mini chatbot d’aide par pôle. */
export function usePoleHelpChatbot(productLine: ProductLineId): PoleHelpChatbotState {
  const profile = useSessionProfile();
  const nav = useTabNavigationOptional();
  const role = profile?.role ?? null;
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [bubbleReady, setBubbleReady] = useState(false);

  const content = getPoleHelpContent(productLine, role);
  const usesBriefcaseIcon = resolvePoleHelpUsesBriefcaseIcon(productLine, role);

  const visible = Boolean(
    profile &&
      nav &&
      nav.pendingAuthIntent !== 'signup' &&
      !nav.pendingSignupProductLine,
  );

  useEffect(() => {
    let cancelled = false;
    void isPoleHelpBubbleDismissed().then((dismissed) => {
      if (cancelled) return;
      setBubbleDismissed(dismissed);
      setBubbleReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dismissBubble = useCallback(() => {
    setBubbleDismissed(true);
    void dismissPoleHelpBubble();
  }, []);

  const showBubble = visible && bubbleReady && !bubbleDismissed;

  return { visible, content, usesBriefcaseIcon, showBubble, dismissBubble };
}
