const fs = require('fs');
let file = fs.readFileSync('src/components/coach/CoachCockpitChapter.tsx', 'utf8');

// 1. Remove redundant actions from CoachScreenHeader
const oldHeader = `<CoachScreenHeader
        title="Tableau de bord"
        unreadMessages={unreadMessages}
        actions={[
          { icon: 'chat', onPress: () => shellNav?.requestNav('messages'), accessibilityLabel: t('messages.title') },
          { icon: 'add', onPress: () => {}, accessibilityLabel: t('coach.calendar.create') },
        ]}
      />`;
const newHeader = `<CoachScreenHeader
        title="Tableau de bord"
        unreadMessages={unreadMessages}
      />`;
file = file.replace(oldHeader, newHeader);

// 2. Increase paddingBottom to prevent FAB from overlapping stats
file = file.replace(/scrollContent: \{ padding: spacing.md, paddingBottom: 60 \},/, 'scrollContent: { padding: spacing.md, paddingBottom: 120 },');

fs.writeFileSync('src/components/coach/CoachCockpitChapter.tsx', file);
