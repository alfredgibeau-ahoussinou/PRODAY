const fs = require('fs');
let file = fs.readFileSync('src/features/admin/panes/AdminUsersPane.tsx', 'utf8');

const target = `  const canImpersonate = canAdminUi(profile?.email, 'impersonate');`;

const newTarget = `  const canImpersonate = canAdminUi(profile?.email, 'impersonate');
  const [godModeContext, setGodModeContext] = useState(
    focusId === 'impersonate' ? 'impersonate' : focusId === 'create' ? 'create' : null
  );
  useEffect(() => {
    if (focusId === 'impersonate' || focusId === 'create') setGodModeContext(focusId);
  }, [focusId]);`;

file = file.replace(target, newTarget);

// Fix u.name -> u.display_name
file = file.replace(/u\.name \|\| 'Sans nom'/g, "u.display_name || 'Sans nom'");
file = file.replace(/\+ u\.name/g, "+ u.display_name");

fs.writeFileSync('src/features/admin/panes/AdminUsersPane.tsx', file);
