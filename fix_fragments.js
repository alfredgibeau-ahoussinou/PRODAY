const fs = require('fs');

function wrapWithFragment(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/return \(\n\s*<ScrollView/, 'return (\n    <>\n      <ScrollView');
  content = content.replace(/<\/AdminModalSheet>\n\s*\);\n\}/, '<\/AdminModalSheet>\n    </>\n  );\n}');
  fs.writeFileSync(file, content);
}

wrapWithFragment('src/features/admin/panes/AdminSystemPane.tsx');
wrapWithFragment('src/features/admin/panes/AdminSecurityPane.tsx');
wrapWithFragment('src/features/admin/panes/AdminAiPane.tsx');
