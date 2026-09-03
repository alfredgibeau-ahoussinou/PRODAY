const fs = require('fs');
let file = fs.readFileSync('website/src/app/page.tsx', 'utf8');

file = file.replace(/import { HomeAppInstallBanner } from "@\/components\/home\/HomeAppInstallBanner";\n/, '');
file = file.replace(/<HomeAppInstallBanner \/>\n\s*/, '');

fs.writeFileSync('website/src/app/page.tsx', file);
