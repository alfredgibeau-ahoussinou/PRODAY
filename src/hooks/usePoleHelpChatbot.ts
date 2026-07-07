import { useTabNavigationOptional } from '../context/TabNavigationContext';
import { useSessionProfile } from './useSessionProfile';
import type { ProductLineId } from '../models/ProductLine';
import {
  getPoleHelpContent,
  resolvePoleHelpUsesBriefcaseIcon,
  type PoleHelpContent,
} from '../content/poleHelpContent';

export interface PoleHelpChatbotState {
  visible: boolean;
  content: PoleHelpContent;
  usesBriefcaseIcon: boolean;
}

/** Visibilité et contenu du mini chatbot d’aide par pôle. */
export function usePoleHelpChatbot(productLine: ProductLineId): PoleHelpChatbotState {
  const profile = useSessionProfile();
  const nav = useTabNavigationOptional();
  const role = profile?.role ?? null;

  const content = getPoleHelpContent(productLine, role);
  const usesBriefcaseIcon = resolvePoleHelpUsesBriefcaseIcon(productLine, role);

  const visible = Boolean(
    profile &&
      nav &&
      nav.pendingAuthIntent !== 'signup' &&
      !nav.pendingSignupProductLine,
  );

  return { visible, content, usesBriefcaseIcon };
}
