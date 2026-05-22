import { useCallback, useEffect, useState } from 'react';
import { messagesService } from '../services/messages.service';
import { useAuth } from '../context/AuthContext';

export function useUnreadMessageCount() {
  const { profile } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!profile?.uid) {
      setCount(0);
      return;
    }
    const threads = await messagesService.listThreads(profile.uid);
    setCount(threads.filter((t) => t.unread).length);
  }, [profile?.uid]);

  useEffect(() => {
    if (!profile?.uid) {
      setCount(0);
      return;
    }
    const unsub = messagesService.subscribeThreads(profile.uid, (threads) => {
      setCount(threads.filter((t) => t.unread).length);
    });
    if (!unsub) refresh();
    return () => unsub?.();
  }, [profile?.uid, refresh]);

  return { count, refresh };
}
