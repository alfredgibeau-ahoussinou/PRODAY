const fs = require('fs');
let file = fs.readFileSync('src/components/coach/CoachScreenHeader.tsx', 'utf8');

const targetTitleRow = `<View style={styles.titleRow}>
        <CoachText variant="title" style={styles.pageTitle}>
          {title}
        </CoachText>`;

const newTitleRow = `<View style={styles.titleRow}>
        {onBack && (
          <CoachCircleIconButton
            icon="arrow-back"
            onPress={onBack}
            accessibilityLabel="Retour"
          />
        )}
        <CoachText variant="title" style={[styles.pageTitle, onBack && { marginLeft: -8 }]}>
          {title}
        </CoachText>`;

file = file.replace(targetTitleRow, newTitleRow);
fs.writeFileSync('src/components/coach/CoachScreenHeader.tsx', file);
