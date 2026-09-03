const fs = require('fs');
let file = fs.readFileSync('src/features/admin/shell/renderAdminPane.tsx', 'utf8');

file = file.replace(/return <AdminAiPane onNavigate=\{onNavigate\} \/>;/, `return <AdminAiPane onNavigate={onNavigate} focusId={focusId} />;`);
file = file.replace(/return <AdminSecurityPane \/>;/, `return <AdminSecurityPane focusId={focusId} />;`);
file = file.replace(/return <AdminSystemPane onPreviewUserApp=\{onPreviewUserApp\} \/>;/, `return <AdminSystemPane onPreviewUserApp={onPreviewUserApp} focusId={focusId} />;`);

fs.writeFileSync('src/features/admin/shell/renderAdminPane.tsx', file);
