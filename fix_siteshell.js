const fs = require('fs');
let file = fs.readFileSync('website/src/components/layout/SiteShell.tsx', 'utf8');

file = file.replace(
  /import \{ ScrollToHash \} from "\.\/ScrollToHash";/,
  `import { ScrollToHash } from "./ScrollToHash";\nimport { SupportModal } from "@/components/SupportModal";`
);

file = file.replace(
  /<SiteFooter \/>/g,
  "<SiteFooter />\n          <Suspense fallback={null}>\n            <SupportModal />\n          </Suspense>"
);

fs.writeFileSync('website/src/components/layout/SiteShell.tsx', file);
