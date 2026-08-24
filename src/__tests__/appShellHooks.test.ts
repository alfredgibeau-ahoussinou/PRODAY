import * as fs from 'fs';
import * as path from 'path';

describe('AppShell hooks', () => {
  it('appelle tous les hooks avant le premier return conditionnel', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../App.tsx'), 'utf8');
    const start = src.indexOf('function AppShell()');
    const end = src.indexOf('\nconst styles = StyleSheet.create');
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);

    const body = src.slice(start, end);
    const firstGate = body.indexOf('if (!authLoading && profile && needsEmailVerification)');
    expect(firstGate).toBeGreaterThan(0);

    const afterEarlyReturns = body.slice(firstGate);
    expect(afterEarlyReturns).not.toMatch(/\buse[A-Z][A-Za-z]*\s*\(/);
    expect(body.slice(0, firstGate)).toContain('useCallback');
  });
});
