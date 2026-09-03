const fs = require('fs');

let readme = fs.readFileSync('README.md', 'utf8');
readme = readme.replace(
  /\[!\[Bêta\]\(https:\/\/img\.shields\.io\/badge\/Bêta-Inscription-0891b2\?style=for-the-badge\)\]\(https:\/\/proday75\.fr\/beta\/inscription\)/,
  '[![Bêta](https://img.shields.io/badge/Bêta-Ouverte-0891b2?style=for-the-badge)](https://proday75.fr/beta/inscription)'
);
readme = readme.replace(
  /💡 \*\*Accès Bêta Publique :\*\* \[proday75\.fr\/beta\/inscription\]\(https:\/\/proday75\.fr\/beta\/inscription\)/,
  '💡 **Bêta Ouverte (Direct) :** [proday75.fr/beta/inscription](https://proday75.fr/beta/inscription)'
);
fs.writeFileSync('README.md', readme);

let websiteReadme = fs.readFileSync('website/README.md', 'utf8');
websiteReadme = websiteReadme.replace(
  /\[!\[Bêta\]\(https:\/\/img\.shields\.io\/badge\/Bêta-Inscription-0891b2\?style=for-the-badge\)\]\(https:\/\/proday75\.fr\/beta\/inscription\)/,
  '[![Bêta](https://img.shields.io/badge/Bêta-Ouverte-0891b2?style=for-the-badge)](https://proday75.fr/beta/inscription)'
);
fs.writeFileSync('website/README.md', websiteReadme);
