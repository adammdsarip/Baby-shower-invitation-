// Writes _redirects so  /<slug>  opens  /?invite=<slug>.   npm run redirects
import { readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const slugs = (await readdir(`${root}invites`)).filter((f) => f.endsWith('.js') && !f.startsWith('_')).map((f) => f.slice(0, -3)).sort();
const lines = slugs.map((s) => `/${s}  /?invite=${s}  200`);
await writeFile(`${root}_redirects`, lines.join('\n') + '\n');
console.log(`_redirects: ${slugs.length} invitation(s)\n${lines.join('\n')}`);
