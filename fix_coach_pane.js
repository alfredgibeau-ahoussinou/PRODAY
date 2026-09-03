const fs = require('fs');
let file = fs.readFileSync('src/components/coach/CoachScreenHeader.tsx', 'utf8');

const targetPane = `export function CoachPane({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: CoachHeaderAction[];
  children: React.ReactNode;
}) {
  const { tokens } = useCoachTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  return (
    <View style={styles.pane}>
      <CoachScreenHeader title={title} actions={actions} onBack={onBack} />
      <View style={styles.paneBody}>{children}</View>
    </View>
  );
}`;

const newPane = `export function CoachPane({
  title,
  actions,
  onBack,
  children,
}: {
  title: string;
  actions?: CoachHeaderAction[];
  onBack?: () => void;
  children: React.ReactNode;
}) {
  const { tokens } = useCoachTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  return (
    <View style={styles.pane}>
      <CoachScreenHeader title={title} actions={actions} onBack={onBack} />
      <View style={styles.paneBody}>{children}</View>
    </View>
  );
}`;

file = file.replace(targetPane, newPane);
fs.writeFileSync('src/components/coach/CoachScreenHeader.tsx', file);
