// Lists every customer and the link to send them.
//   npm run links -- https://your-site.netlify.app
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = (process.argv[2] || 'https://YOUR-SITE.netlify.app').replace(/\/$/, '');
const dir = fileURLToPath(new URL('../invites/', import.meta.url));
const files = (await readdir(dir)).filter((f) => f.endsWith('.js') && !f.startsWith('_')).sort();

for (const f of files) {
  let cfg;
  new Function('BabyInvite', await readFile(dir + f, 'utf8'))({ register: (c) => (cfg = c) });
  const slug = f.slice(0, -3);
  console.log(`${(cfg.honouring || slug)}  ·  ${(cfg.event && cfg.event.start) || 'no date'}  ·  ${(cfg.venue && cfg.venue.name) || ''}`);
  console.log(`  send this:        ${base}/${slug}`);
  console.log(`  same, per guest:  ${base}/${slug}?guest=Auntie+May   (pre-fills their name)\n`);
}
if (!files.length) console.log('No invitations yet. Run: npm run new -- <slug> "Names"');
