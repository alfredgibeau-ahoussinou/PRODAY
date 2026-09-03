const fs = require('fs');
let file = fs.readFileSync('src/components/coach/CoachScreenHeader.tsx', 'utf8');

// 1. Add onBack to Props
file = file.replace(/actions\?: CoachHeaderAction\[\];/, `actions?: CoachHeaderAction[];\n  onBack?: () => void;`);

// 2. Add onBack to CoachScreenHeader params
file = file.replace(/showTeamRow = true,/, `showTeamRow = true,\n  onBack,`);

// 3. Render onBack button before the title
const targetTitleRow = `<View style={styles.titleRow}>
            <CoachText style={styles.titleText}>{title}</CoachText>`;

const newTitleRow = `<View style={styles.titleRow}>
            {onBack && (
              <CoachActionCircle
                icon="arrow-back"
                onPress={onBack}
                accessibilityLabel={t('common.close') || 'Retour'}
              />
            )}
            <CoachText style={[styles.titleText, onBack && { marginLeft: spacing.sm }]}>{title}</CoachText>`;

file = file.replace(targetTitleRow, newTitleRow);

// 4. Update CoachPane to pass onBack
file = file.replace(/export function CoachPane\(\{ title, actions, children \}: \{ title: string; actions\?: CoachHeaderAction\[\]; children: React\.ReactNode \}\) \{/, `export function CoachPane({ title, actions, onBack, children }: { title: string; actions?: CoachHeaderAction[]; onBack?: () => void; children: React.ReactNode }) {`);

file = file.replace(/<CoachScreenHeader title=\{title\} actions=\{actions\} \/>/, `<CoachScreenHeader title={title} actions={actions} onBack={onBack} />`);

fs.writeFileSync('src/components/coach/CoachScreenHeader.tsx', file);
