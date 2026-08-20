import { poleShellTransitionDirection } from '../components/motion/PoleShellTransition';

describe('poleShellTransitionDirection', () => {
  it('Parent → Supporter avance (depuis la droite)', () => {
    expect(poleShellTransitionDirection('parent', 'supporter')).toBe(1);
  });

  it('Supporter → Parent recule (depuis la gauche)', () => {
    expect(poleShellTransitionDirection('supporter', 'parent')).toBe(-1);
  });

  it('même pôle → direction neutre avant', () => {
    expect(poleShellTransitionDirection('parent', 'parent')).toBe(1);
    expect(poleShellTransitionDirection('supporter', 'supporter')).toBe(1);
  });
});
