const fs = require('fs');
let file = fs.readFileSync('website/src/components/SiteNav.tsx', 'utf8');

file = file.replace(
  /<div className="pointer-events-none sticky inset-x-0 top-0 z-\[110\] flex justify-center px-3 pt-3 sm:px-5 sm:pt-5">/,
  '<div className="pointer-events-none fixed inset-x-0 top-0 z-[110] flex justify-center px-3 pt-3 sm:px-5 sm:pt-5">'
);

fs.writeFileSync('website/src/components/SiteNav.tsx', file);
