import fs from 'fs';
import path from 'path';
import { tabBarScrollInset } from '../navigation/tabBarLayout';

describe('Mobile Safari & iPhone Experience Verification', () => {
  const rootDir = path.resolve(__dirname, '../..');

  describe('1. Startup & Font Loading Fallback (iPhone / Safari offline & tracking protection)', () => {
    it('App.tsx includes a fontTimeout safety fallback to avoid infinite blank screens', () => {
      const appContent = fs.readFileSync(path.join(rootDir, 'App.tsx'), 'utf-8');
      expect(appContent).toContain('fontTimeout');
      expect(appContent).toContain('ready = fontsLoaded || fontTimeout');
      expect(appContent).toContain('if (!ready)');
    });

    it('web/index.html includes viewport-fit=cover and iOS Safari meta tags', () => {
      const webIndex = fs.readFileSync(path.join(rootDir, 'web/index.html'), 'utf-8');
      expect(webIndex).toContain('viewport-fit=cover');
      expect(webIndex).toContain('apple-mobile-web-app-capable');
      expect(webIndex).toContain('-webkit-text-size-adjust: 100%');
      expect(webIndex).toContain('overscroll-behavior-y: none');
    });
  });

  describe('2. Scroll Clearance & Floating Dock Separation (Coach & Club)', () => {
    it('tabBarScrollInset provides adequate bottom clearance (> 90px on mobile) to clear floating dock', () => {
      const insetWeb = tabBarScrollInset({ extra: 24 });
      const insetMobile = tabBarScrollInset({ extra: 24 });
      expect(insetWeb).toBeGreaterThanOrEqual(90);
      expect(insetMobile).toBeGreaterThanOrEqual(90);
    });

    it('ClubChapterScroll in clubUi.tsx uses tabBarScrollInset to prevent cards being trapped behind dock', () => {
      const clubUiContent = fs.readFileSync(
        path.join(rootDir, 'src/features/club/ui/clubUi.tsx'),
        'utf-8',
      );
      expect(clubUiContent).toContain('tabBarScrollInset({ extra: clubSpace.xl })');
      // Should not use fixed inadequate 40px padding
      expect(clubUiContent).not.toMatch(/paddingBottom:\s*clubSpace\.xxxl/);
    });

    it('CoachHomeScreen uses tabBarScrollInset for content paddingBottom', () => {
      const coachHomeContent = fs.readFileSync(
        path.join(rootDir, 'src/screens/coach/CoachHomeScreen.tsx'),
        'utf-8',
      );
      expect(coachHomeContent).toContain('paddingBottom: tabBarScrollInset(');
    });

    it('CoachLiveMatchCenterScreen uses tabBarScrollInset for content paddingBottom', () => {
      const liveCenterContent = fs.readFileSync(
        path.join(rootDir, 'src/screens/coach/CoachLiveMatchCenterScreen.tsx'),
        'utf-8',
      );
      expect(liveCenterContent).toContain('paddingBottom: tabBarScrollInset(');
    });

    it('CoachWorkloadHealthScreen uses tabBarScrollInset for content paddingBottom', () => {
      const workloadContent = fs.readFileSync(
        path.join(rootDir, 'src/screens/coach/CoachWorkloadHealthScreen.tsx'),
        'utf-8',
      );
      expect(workloadContent).toContain('paddingBottom: tabBarScrollInset(');
    });
  });

  describe('3. Form Fields & Keyboard Adaptation in Modals', () => {
    it('PlayerStatsRatingModal wraps form in KeyboardAvoidingView and handles taps', () => {
      const modalContent = fs.readFileSync(
        path.join(rootDir, 'src/components/coach/PlayerStatsRatingModal.tsx'),
        'utf-8',
      );
      expect(modalContent).toContain('<KeyboardAvoidingView');
      expect(modalContent).toContain('behavior={Platform.OS === \'ios\' ? \'padding\' : undefined}');
      expect(modalContent).toContain('keyboardShouldPersistTaps="handled"');
      expect(modalContent).toContain('Math.max(insets.bottom,');
    });

    it('ClubCreateFormModal wraps form in KeyboardAvoidingView with natural scroll flex', () => {
      const createModalContent = fs.readFileSync(
        path.join(rootDir, 'src/features/club/create/ClubCreateFormModal.tsx'),
        'utf-8',
      );
      expect(createModalContent).toContain('<KeyboardAvoidingView');
      expect(createModalContent).toContain('behavior={Platform.OS === \'ios\' ? \'padding\' : undefined}');
      expect(createModalContent).toContain('keyboardShouldPersistTaps="handled"');
      // Must not have restrictive fixed 420px height
      expect(createModalContent).not.toContain('style={{ maxHeight: 420 }}');
    });

    it('CoachTrainingPlannerScreen Copilot AI modal includes KeyboardAvoidingView', () => {
      const plannerContent = fs.readFileSync(
        path.join(rootDir, 'src/screens/coach/CoachTrainingPlannerScreen.tsx'),
        'utf-8',
      );
      expect(plannerContent).toContain('<KeyboardAvoidingView');
      expect(plannerContent).toContain('behavior={Platform.OS === \'ios\' ? \'padding\' : undefined}');
    });
  });

  describe('4. Gesture & PanResponder Isolation in ModalSheet', () => {
    it('ModalSheet attaches panHandlers to handleRow instead of entire sheet to avoid scroll traps', () => {
      const sheetContent = fs.readFileSync(
        path.join(rootDir, 'src/motion/primitives/ModalSheet.tsx'),
        'utf-8',
      );
      // PanHandlers should be on the handle row
      expect(sheetContent).toContain('style={styles.handleRow}');
      expect(sheetContent).toContain('{...pan.panHandlers}');
      // Animated.View sheet should not have panHandlers on entire container
      expect(sheetContent).not.toContain('{...(gestureClose ? pan.panHandlers : null)}');
    });
  });
});
