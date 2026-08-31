import React from 'react';
import { Text } from 'react-native';

/**
 * RN host Views (`View` / `Animated.View`) reject raw text nodes.
 * Drop whitespace / falsey ; wrap non-empty strings & numbers in `<Text>`.
 */
export function sanitizeHostChildren(node: React.ReactNode): React.ReactNode {
  if (node == null || typeof node === 'boolean') return null;

  if (typeof node === 'string') {
    const trimmed = node.trim();
    if (!trimmed) return null;
    return <Text>{trimmed}</Text>;
  }

  if (typeof node === 'number') {
    return <Text>{String(node)}</Text>;
  }

  if (Array.isArray(node)) {
    const cleaned: React.ReactNode[] = [];
    node.forEach((child, index) => {
      const next = sanitizeHostChildren(child);
      if (next == null || typeof next === 'boolean') return;
      if (React.isValidElement(next) && next.key == null) {
        cleaned.push(React.cloneElement(next, { key: `host-${index}` }));
      } else {
        cleaned.push(next);
      }
    });
    if (cleaned.length === 0) return null;
    if (cleaned.length === 1) return cleaned[0];
    return cleaned;
  }

  return node;
}
