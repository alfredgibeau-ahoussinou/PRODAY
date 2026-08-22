import React from 'react';
import { Text } from 'react-native';
import { sanitizeHostChildren } from '../motion/sanitizeHostChildren';

describe('sanitizeHostChildren', () => {
  it('ignore null, boolean et whitespace', () => {
    expect(sanitizeHostChildren(null)).toBeNull();
    expect(sanitizeHostChildren(undefined)).toBeNull();
    expect(sanitizeHostChildren(false)).toBeNull();
    expect(sanitizeHostChildren(true)).toBeNull();
    expect(sanitizeHostChildren('')).toBeNull();
    expect(sanitizeHostChildren('   \n\t  ')).toBeNull();
  });

  it('enveloppe string / number non vides dans Text', () => {
    const fromString = sanitizeHostChildren('Club');
    expect(React.isValidElement(fromString)).toBe(true);
    expect((fromString as React.ReactElement).type).toBe(Text);
    expect((fromString as React.ReactElement).props.children).toBe('Club');

    const fromNumber = sanitizeHostChildren(42);
    expect(React.isValidElement(fromNumber)).toBe(true);
    expect((fromNumber as React.ReactElement).type).toBe(Text);
    expect((fromNumber as React.ReactElement).props.children).toBe('42');
  });

  it('conserve les éléments React et nettoie les tableaux mixtes', () => {
    const el = React.createElement(Text, null, 'ok');
    expect(sanitizeHostChildren(el)).toBe(el);

    const mixed = sanitizeHostChildren(['  ', el, false, 'label', null]);
    expect(Array.isArray(mixed)).toBe(true);
    const arr = mixed as React.ReactElement[];
    expect(arr).toHaveLength(2);
    expect(arr[0].type).toBe(Text);
    expect(arr[0].props.children).toBe('ok');
    expect(arr[1].type).toBe(Text);
    expect(arr[1].props.children).toBe('label');
  });
});
