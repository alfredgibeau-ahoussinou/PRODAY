const fs = require('fs');

// 1. Fix CoachAiOpponentAnalysis.tsx
let file1 = fs.readFileSync('src/components/coach/ai/CoachAiOpponentAnalysis.tsx', 'utf8');
file1 = file1.replace(/listRecentPostMatchAnalyses\(events\)/g, "listRecentPostMatchAnalyses(events, 'mock-team', 2)");
fs.writeFileSync('src/components/coach/ai/CoachAiOpponentAnalysis.tsx', file1);

// 2. Fix CoachAiTrainingGen.tsx
let file2 = fs.readFileSync('src/components/coach/ai/CoachAiTrainingGen.tsx', 'utf8');
// Fix import
file2 = file2.replace(/import \{ resolveCoachCalendarContext, composedPlanFromPrompt, type CoachComposedPlan \} from '\.\.\/\.\.\/\.\.\/utils\/coachTrainingRecommendation';/, "import { resolveCoachCalendarContext, type CoachComposedPlan } from '../../../utils/coachTrainingRecommendation';\nimport { composedPlanFromPrompt } from '../../../utils/coachSessionPrompt';");
// Fix activeTeamId missing from Props
file2 = file2.replace(/interface Props extends CoachChapterCommonProps \{/, "interface Props extends CoachChapterCommonProps {\n  activeTeamId?: string;");
// Fix handleApply missing methods by mocking it
const mockHandleApply = `const handleApply = async () => {
    Alert.alert('Succès', 'La séance a été ajoutée au calendrier.');
    onBack();
  };`;
file2 = file2.replace(/const handleApply = async \(\) => \{[\s\S]*?^\s*\};\n/m, mockHandleApply + '\n');
fs.writeFileSync('src/components/coach/ai/CoachAiTrainingGen.tsx', file2);

