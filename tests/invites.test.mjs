/*
 * Per-customer checks. Every file in invites/ (except _template.js) is discovered
 * and tested automatically – adding a customer adds tests, no test edits needed.
 *   npm run test:invites
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { serve } from '../serve.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright')); }

const root = fileURLToPath(new URL('../', import.meta.url));
const SHOTS = process.env.SHOTS_DIR; // set to also save screenshots, e.g. SHOTS_DIR=tests/screens
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const files = (await readdir(`${root}invites`)).filter((f) => f.endsWith('.js') && !f.startsWith('_')).sort();
const slugs = files.map((f) => f.slice(0, -3));
const CHROME = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);
const server = await serve(0);
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {});

const results = [];
async function test(name, fn, viewport = { width: 390, height: 844 }) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && !/favicon/.test(m.text()) && problems.push('console: ' + m.text()));
  page.on('requestfailed', (r) => !/^mailto:/.test(r.url()) && problems.push('request failed: ' + r.url()));
  const t0 = Date.now();
  try { await fn(page); assert.deepEqual(problems, [], 'browser errors'); results.push([true, name, Date.now() - t0]); }
  catch (e) { results.push([false, name, Date.now() - t0, e]); }
  await ctx.close();
}

/* ---------- 0. the folder itself ---------- */
await test('invites/ has at least one customer and a template', async () => {
  assert.ok(slugs.length > 0, 'no invitations found');
  assert.ok(existsSync(`${root}invites/_template.js`), 'invites/_template.js is missing');
});

/* ---------- 1. every config, one by one ---------- */
const HEX = /^#[0-9a-f]{6}$/i;
for (const slug of slugs) {
  await test(`[${slug}] config is valid`, async (page) => {
    const src = await readFile(`${root}invites/${slug}.js`, 'utf8');
    assert.match(src, new RegExp(`slug:\\s*['"]${slug}['"]`), `slug inside the file must be exactly "${slug}" (matching the file name)`);
    await page.goto(`${base}/compare.html?autoplay=0&stage=card`);
    const r = await page.evaluate(async (slug) => {
      await new Promise((ok, no) => { const s = document.createElement('script'); s.src = `invites/${slug}.js`; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
      const cfg = BabyInvite.get(slug), D = BabyInvite.DEFAULTS, errors = [];
      if (!cfg) return { errors: ['file did not call BabyInvite.register()'] };
      // typo catcher: any key that the template does not know about
      (function walk(c, d, path) {
        for (const k of Object.keys(c)) {
          if (!(k in d)) { errors.push(`unknown setting "${path}${k}"`); continue; }
          if (c[k] && typeof c[k] === 'object' && !Array.isArray(c[k]) && d[k] && typeof d[k] === 'object') walk(c[k], d[k], `${path}${k}.`);
        }
      })(cfg, D, '');
      return { errors, cfg };
    }, slug);
    assert.deepEqual(r.errors, []);
    const c = r.cfg, e = [];
    if (!c.honouring || /Parent & Parent/.test(c.honouring)) e.push('honouring still has the placeholder name');
    if (c.event) {
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(c.event.start || '')) e.push('event.start must look like 2026-11-15T15:00');
      if (c.event.start === '2026-01-01T15:00') e.push('event.start is still the template date');
      if (c.event.end && c.event.end <= c.event.start) e.push('event.end must be after event.start');
    } else e.push('event is missing');
    if (!c.venue || !c.venue.name) e.push('venue.name is missing');
    if (c.venue && /^(Venue name)$/.test(c.venue.name)) e.push('venue.name is still the placeholder');
    if (c.venue && c.venue.mapUrl && !/^https:\/\//.test(c.venue.mapUrl)) e.push('venue.mapUrl must start with https://');
    if (c.registry && c.registry.url && !/^https:\/\//.test(c.registry.url)) e.push('registry.url must start with https://');
    const m = (c.rsvp || {}).mode || 'none';
    if (!['whatsapp', 'email', 'webhook', 'none'].includes(m)) e.push(`rsvp.mode "${m}" is not whatsapp | email | webhook | none`);
    if (m === 'whatsapp' && !/\d{7,}/.test(String(c.rsvp.whatsapp || '').replace(/\D/g, ''))) e.push('rsvp.whatsapp needs a phone number with country code');
    if (m === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.rsvp.email || '')) e.push('rsvp.email is not a valid address');
    if (m === 'webhook' && !/^https:\/\//.test(c.rsvp.webhookUrl || '')) e.push('rsvp.webhookUrl must start with https://');
    if (c.rsvp && c.rsvp.deadline && c.event && c.rsvp.deadline > c.event.start) e.push('rsvp.deadline is after the event');
    if (c.rsvp && c.rsvp.maxGuests != null && !(c.rsvp.maxGuests >= 1 && c.rsvp.maxGuests <= 20)) e.push('rsvp.maxGuests should be 1–20');
    for (const [k, v] of Object.entries(c.theme || {})) {
      for (const col of [].concat(v)) if (!HEX.test(col)) e.push(`theme.${k} "${col}" must be a #rrggbb colour`);
    }
    if (c.theme && c.theme.balloons && c.theme.balloons.length < 2) e.push('theme.balloons needs at least 2 colours');
    assert.deepEqual(e, []);
  });
}

await test('slugs are unique and not guessable-by-accident placeholders', async () => {
  assert.equal(new Set(slugs).size, slugs.length);
  assert.ok(!slugs.includes('your-slug-here'));
});

/* ---------- 2. every invitation renders & behaves, at several screen sizes ---------- */
const SIZES = [
  ['phone 390×844', { width: 390, height: 844 }],
  ['small phone 320×568', { width: 320, height: 568 }],
  ['desktop 1280×800', { width: 1280, height: 800 }],
];

for (const slug of slugs) {
  for (const [label, vp] of SIZES) {
    await test(`[${slug}] renders cleanly on ${label}`, async (page) => {
      await page.goto(`${base}/index.html?invite=${slug}&stage=card&autoplay=0`);
      await page.waitForSelector('.bi-card');
      await page.evaluate(() => document.fonts.ready);
      const cfg = await page.evaluate(() => invitation.config);
      // no horizontal page scroll
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'page scrolls sideways');
      // every card page: content fits, nothing clipped, key info present
      for (let i = 0; i < 3; i++) {
        await page.evaluate((n) => invitation.setPage(n), i);
        await page.waitForTimeout(900);
        const fit = await page.evaluate(() => {
          const body = document.querySelector('.bi-page.is-active .bi-body');
          const cs = getComputedStyle(body);
          const avail = body.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
          const wide = [...body.querySelectorAll('.bi-names,.bi-headline,.bi-title,.bi-facts,.bi-row')].filter((el) => el.scrollWidth > avail + 1).map((el) => el.className);
          return { wide, tall: body.scrollHeight - body.clientHeight };
        });
        assert.deepEqual(fit.wide, [], `page ${i + 1}: text wider than the card`);
        assert.ok(fit.tall <= 2, `page ${i + 1}: content taller than the card by ${fit.tall}px (shorten the text)`);
      }
      await page.evaluate(() => invitation.setPage(0));
      await page.waitForTimeout(700);
      const t = await page.locator('.bi').innerText();
      assert.ok(t.includes(cfg.honouring), 'honouring name not shown');
      assert.ok(t.includes(cfg.venue.name.toUpperCase()) || t.includes(cfg.venue.name), 'venue not shown');
      assert.ok(!/NaN|undefined|null|\{\w+\}/.test(t), 'placeholder or "undefined" text on the card');
      assert.ok(await page.locator('.bi-card').isVisible());
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/${slug}-${label.split(' ')[0]}-card.png` });
    }, vp);
  }

  await test(`[${slug}] intro plays and the RSVP works end-to-end`, async (page) => {
    await page.goto(`${base}/index.html?invite=${slug}&autoplay=0`);
    for (const st of ['open', 'float', 'land', 'card']) {
      await page.evaluate((s) => invitation.setStage(s), st);
      await page.waitForTimeout(250);
      assert.equal(await page.evaluate(() => invitation.stage), st);
    }
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${slug}-phone-sign.png` });
    await page.evaluate(() => invitation.setPage(2));
    await page.waitForTimeout(800);
    await page.evaluate(() => document.addEventListener('bi:deliver', (e) => (window.__t = e.detail.target)));
    await page.click('.bi-form button[type=submit]');
    assert.ok((await page.locator('.bi-error').innerText()).length > 0, 'empty RSVP should show an error');
    await page.fill('input[name=name]', 'Test Guest');
    await page.selectOption('select[name=attending]', 'yes');
    const max = await page.evaluate(() => invitation.config.rsvp.maxGuests);
    assert.equal(await page.locator('select[name=guests] option:not([disabled])').count(), max);
    await page.selectOption('select[name=guests]', String(max));
    await page.evaluate(() => { window.open = () => null; });
    await page.click('.bi-form button[type=submit]');
    assert.match(await page.locator('.bi-thanks-title').innerText(), /Test Guest/);
    const stored = await page.evaluate((s) => JSON.parse(localStorage.getItem(`babyshower:${s}:rsvp`)), slug);
    assert.deepEqual([stored.slug, stored.name, stored.guests], [slug, 'Test Guest', max]);
    const t = await page.evaluate(() => window.__t || null);
    const mode = await page.evaluate(() => invitation.config.rsvp.mode);
    if (mode === 'none') assert.equal(t, null); else assert.equal(t.mode, mode);
  });
}

/* ---------- 3. all customers together in one document ---------- */
await test(`all ${slugs.length} invitations mounted at once never leak into each other`, async (page) => {
  await page.goto(`${base}/compare.html?autoplay=0&stage=card`);
  const out = await page.evaluate(async (slugs) => {
    document.body.innerHTML = '';
    for (const slug of slugs) {
      if (!BabyInvite.get(slug)) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = `invites/${slug}.js`; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
      const h = document.createElement('div'); h.style.cssText = 'width:390px;height:780px;display:inline-block'; document.body.appendChild(h);
      BabyInvite.mount(h, slug, { stage: 'card', autoplay: false, deliver: false });
    }
    await document.fonts.ready;
    const roots = [...document.querySelectorAll('.bi')];
    const ids = {}; document.querySelectorAll('[id]').forEach((e) => (ids[e.id] = (ids[e.id] || 0) + 1));
    return {
      dupIds: Object.keys(ids).filter((k) => ids[k] > 1),
      texts: roots.map((r) => ({ slug: r.dataset.slug, text: r.innerText, theme: getComputedStyle(r).getPropertyValue('--accent').trim() })),
      cfgs: slugs.map((s) => BabyInvite.get(s)),
    };
  }, slugs);
  assert.deepEqual(out.dupIds, []);
  for (const a of out.texts) {
    const mine = out.cfgs.find((c) => c.slug === a.slug);
    assert.ok(a.text.includes(mine.honouring), `${a.slug}: own name missing`);
    for (const other of out.cfgs) {
      if (other.slug === a.slug) continue;
      if (other.honouring !== mine.honouring) assert.ok(!a.text.includes(other.honouring), `${a.slug} shows ${other.slug}'s names`);
      if (other.venue.name !== mine.venue.name) assert.ok(!a.text.includes(other.venue.name), `${a.slug} shows ${other.slug}'s venue`);
    }
  }
});

/* ---------- 4. deploy files ---------- */
await test('_redirects (if present) matches the invitations folder', async () => {
  if (!existsSync(`${root}_redirects`)) return;
  const have = (await readFile(`${root}_redirects`, 'utf8')).split('\n').filter(Boolean).map((l) => l.split(/\s+/)[0].slice(1)).sort();
  assert.deepEqual(have, slugs, 'run: npm run redirects');
});

await browser.close();
server.close();
let failed = 0;
for (const [ok, name, ms, err] of results) {
  console.log(`${ok ? '✓' : '✗'} ${name} (${ms}ms)`);
  if (!ok) { failed++; console.log('    ' + String((err && err.message) || err).split('\n').slice(0, 10).join('\n    ')); }
}
console.log(`\n${results.length - failed}/${results.length} passed  (${slugs.length} invitation${slugs.length === 1 ? '' : 's'}: ${slugs.join(', ')})`);
process.exit(failed ? 1 : 0);
