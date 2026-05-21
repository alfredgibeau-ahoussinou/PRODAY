import { useCallback, useEffect, useState } from 'react';
import { messagesService } from '../services/messages.service';

export function useUnreadMessageCount(enabled = true) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setCount(0);
      return;
    }
    const threads = await messagesService.listThreads();
    setCount(threads.filter((t) => t.unread).length);
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { count, refresh };
}
