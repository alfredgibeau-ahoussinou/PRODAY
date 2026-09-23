/**
 * État Veo **réel** de l'écran : ce que le serveur a vérifié, rien d'autre.
 *
 * Le hook ne décide jamais qu'un compte est connecté : il rapporte `connected` tel que
 * la Cloud Function le renvoie. Il porte aussi **l'enregistrement des identifiants
 * d'application Veo depuis l'application** (`veoSetApiClient`) : c'est ce qui permet à un
 * club de se connecter sans variable d'environnement ni commande de déploiement, le
 * secret restant côté serveur. Enfin, il charge la bibliothèque Veo autorisée, uniquement
 * lorsque la connexion est vérifiée — sinon l'écran montrerait une liste vide trompeuse.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearVeoApiClient,
  connectVeoAccount,
  disconnectVeoAccount,
  fetchVeoAccountStatus,
  listVeoAccountVideos,
  setVeoApiClient,
  type VeoAccountState,
  type VeoAccountVideo,
  type VeoApiClientDraft,
} from '../services/veo/veoAccount.service';

export type VeoAccountAction = 'idle' | 'connecting' | 'disconnecting' | 'saving' | 'clearing';

export type UseVeoAccountResult = {
  state: VeoAccountState;
  loading: boolean;
  action: VeoAccountAction;
  /** Message du dernier essai (succès comme échec) — jamais un succès supposé. */
  lastActionMessage: string | null;
  refresh: () => Promise<void>;
  connect: (email: string, password: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  saveApiClient: (draft: VeoApiClientDraft) => Promise<boolean>;
  clearApiClient: () => Promise<boolean>;
};

const UNVERIFIED: VeoAccountState = {
  kind: 'disconnected',
  configured: false,
  connected: false,
  expiresAt: null,
  accountEmail: null,
  message: 'Connexion Veo non vérifiée pour le moment.',
  clientSource: null,
  clientIdMasked: null,
  clubClientStored: false,
};

export function useVeoAccount(clubId: string | null | undefined): UseVeoAccountResult {
  const [state, setState] = useState<VeoAccountState>(UNVERIFIED);
  const [loading, setLoading] = useState(Boolean(clubId));
  const [action, setAction] = useState<VeoAccountAction>('idle');
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!clubId) {
      setState(UNVERIFIED);
      setLoading(false);
      return;
    }
    setLoading(true);
    const next = await fetchVeoAccountStatus(clubId);
    if (!mounted.current) return;
    setState(next);
    setLoading(false);
  }, [clubId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connect = useCallback(
    async (email: string, password: string) => {
      if (!clubId) return false;
      setAction('connecting');
      const next = await connectVeoAccount(clubId, email, password);
      if (!mounted.current) return false;
      setState(next);
      setAction('idle');
      setLastActionMessage(next.message);
      return next.connected;
    },
    [clubId],
  );

  const disconnect = useCallback(async () => {
    setAction('disconnecting');
    const next = await disconnectVeoAccount();
    if (!mounted.current) return;
    setState(next);
    setAction('idle');
    setLastActionMessage('Session Veo fermée dans ProDay.');
  }, []);

  const saveApiClient = useCallback(
    async (draft: VeoApiClientDraft) => {
      if (!clubId) return false;
      setAction('saving');
      const next = await setVeoApiClient(clubId, draft);
      if (!mounted.current) return false;
      setState(next);
      setAction('idle');
      setLastActionMessage(next.message);
      return next.configured;
    },
    [clubId],
  );

  const clearApiClient = useCallback(async () => {
    if (!clubId) return false;
    setAction('clearing');
    const next = await clearVeoApiClient(clubId);
    if (!mounted.current) return false;
    setState(next);
    setAction('idle');
    setLastActionMessage('Identifiants Veo du club retirés côté serveur.');
    return true;
  }, [clubId]);

  return {
    state,
    loading,
    action,
    lastActionMessage,
    refresh,
    connect,
    disconnect,
    saveApiClient,
    clearApiClient,
  };
}

export type UseVeoLibraryResult = {
  videos: VeoAccountVideo[];
  loading: boolean;
  /** Message d'échec explicite ; `null` quand la liste est chargée ou non demandée. */
  error: string | null;
  reload: () => void;
};

/**
 * Bibliothèque Veo du compte connecté. Sans connexion vérifiée, aucune requête n'est
 * lancée : la section affiche l'état de connexion, pas une liste vide ambiguë.
 */
export function useVeoLibrary(enabled: boolean): UseVeoLibraryResult {
  const [videos, setVideos] = useState<VeoAccountVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setVideos([]);
      setError(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    void listVeoAccountVideos().then((result) => {
      if (!active || !mounted.current) return;
      if (result.ok) {
        setVideos(result.videos);
        setError(null);
      } else {
        setVideos([]);
        setError(result.state.message);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [enabled, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { videos, loading, error, reload };
}
