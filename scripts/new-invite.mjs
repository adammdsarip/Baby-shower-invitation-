// Create a new customer invitation:  npm run new -- <slug> ["Names & Names"]
import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const [slug, names] = process.argv.slice(2);
if (!slug || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) {
  console.error('Usage: npm run new -- <slug> ["Honouring Names"]\n  slug = lowercase letters, digits and dashes, e.g. mia-and-noah-k7x2q');
  process.exit(1);
}
const dir = fileURLToPath(new URL('../invites/', import.meta.url));
const out = `${dir}${slug}.js`;
try { await access(out); console.error(`invites/${slug}.js already exists.`); process.exit(1); } catch {}

let src = await readFile(`${dir}_template.js`, 'utf8');
src = src.replace("slug: 'your-slug-here'", `slug: '${slug}'`);
if (names) src = src.replace("honouring: 'Parent & Parent'", `honouring: ${JSON.stringify(names)}`);
await writeFile(out, src);
console.log(`Created invites/${slug}.js
Next:
  1. edit it (names, date, venue, RSVP contact, colours)
  2. npm test                    # checks every invitation, including this one
  3. npm start  ->  http://localhost:8080/?invite=${slug}
  4. git add -A && git commit && git push   (Netlify deploys it)`);
