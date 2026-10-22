/*
 * Proves that one template can drive several independent invitations.
 *   npm test        (needs `playwright` + a Chromium; see README)
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { serve } from '../serve.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright')); }

const CHROME = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);
const server = await serve(0);
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {});

const results = [];
async function test(name, fn) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && !/favicon/.test(m.text()) && !(page.__allow && page.__allow.test(m.text())) && problems.push('console: ' + m.text()));
  const t0 = Date.now();
  try {
    await fn(page, ctx);
    assert.deepEqual(problems, [], 'browser errors');
    results.push([true, name, Date.now() - t0]);
  } catch (e) {
    results.push([false, name, Date.now() - t0, e]);
  }
  await ctx.close();
}

const text = (page, sel) => page.locator(sel).innerText();
const rootText = (page, slug) => page.locator(`.bi[data-slug="${slug}"]`).innerText();

const compare = (extra = '') => `${base}/compare.html?stage=card&autoplay=0${extra}`;
const A = '.bi[data-slug="sarah-james"]';
const B = '.bi[data-slug="priya-daniel"]';

/* ---------------------------------------------------------------- single pages */

await test('index shows sarah-james with only its own details', async (page) => {
  await page.goto(`${base}/index.html?invite=sarah-james&stage=card&autoplay=0`);
  const t = await rootText(page, 'sarah-james');
  for (const s of ['Sarah & James', 'Sunday 15 November 2026', '3:00 PM – 6:00 PM', 'The Garden Cafe', 'BabyStore & LittleOnes', 'Baby']) assert.match(t, new RegExp(s.replace(/[&.]/g, '.')), s);
  for (const s of ['Priya', 'Maple House', 'Sip', '2027']) assert.doesNotMatch(t, new RegExp(s), `leaked: ${s}`);
  assert.equal(await page.title(), 'Baby Shower · Sarah & James');
});

await test('index shows priya-daniel with only its own details', async (page) => {
  await page.goto(`${base}/index.html?invite=priya-daniel&stage=card&autoplay=0`);
  const t = await rootText(page, 'priya-daniel');
  for (const s of ['Priya & Daniel', 'Saturday 6 February 2027', '11:30 AM – 2:30 PM', 'Maple House Tea Room', 'Sip', 'The Details']) assert.match(t, new RegExp(s.replace(/[&.]/g, '.')), s);
  for (const s of ['Sarah', 'Garden Cafe', 'BabyStore', '2026']) assert.doesNotMatch(t, new RegExp(s), `leaked: ${s}`);
});

await test('unknown invite slug shows a friendly message, no errors', async (page) => {
  page.__allow = /404/; // the missing invites/nope.js is expected
  await page.goto(`${base}/index.html?invite=nope`);
  assert.match(await text(page, '.picker'), /couldn.t find that invitation/);
  assert.equal(await page.locator('.bi').count(), 0);
});

await test('index without ?invite= and with a path-like slug load nothing', async (page) => {
  await page.goto(`${base}/index.html`);
  assert.match(await text(page, '.picker'), /Open your invitation link/);
  await page.goto(`${base}/index.html?invite=../package`);
  assert.match(await text(page, '.picker'), /couldn.t find/);
});

await test('?guest= pre-fills the RSVP name', async (page) => {
  await page.goto(`${base}/index.html?invite=priya-daniel&stage=card&page=2&autoplay=0&guest=Auntie+May`);
  assert.equal(await page.inputValue('input[name=name]'), 'Auntie May');
  assert.equal(await page.locator('.bi').getAttribute('data-page'), '2');
});

await test('full animation timeline plays open → float → land → card on its own', async (page) => {
  await page.addInitScript(() => {
    window.__stages = [];
    document.addEventListener('bi:stage', (e) => window.__stages.push(e.detail.stage));
  });
  await page.goto(`${base}/index.html?invite=sarah-james`);
  await page.waitForFunction(() => window.invitation && window.invitation.stage === 'card', null, { timeout: 16000 });
  assert.deepEqual(await page.evaluate(() => window.__stages), ['open', 'float', 'land', 'card']);
  await page.waitForTimeout(1800);
  assert.ok(await page.locator('.bi-card').isVisible());
});

await test('Skip jumps to the card; tapping the scene advances one stage', async (page) => {
  await page.goto(`${base}/index.html?invite=sarah-james`);
  await page.locator('.bi-open').click({ force: true, position: { x: 100, y: 300 } });
  assert.equal(await page.evaluate(() => invitation.stage), 'float');
  await page.click('.bi-skip');
  assert.equal(await page.evaluate(() => invitation.stage), 'card');
});

await test('prefers-reduced-motion starts on the card', async (page) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${base}/index.html?invite=sarah-james`);
  assert.equal(await page.evaluate(() => invitation.stage), 'card');
});

await test('RSVP validation, then saved response survives a reload', async (page) => {
  await page.goto(`${base}/index.html?invite=sarah-james&stage=card&page=2&autoplay=0`);
  await page.click('.bi-form button[type=submit]');
  assert.match(await text(page, '.bi-error'), /tell us your name/);
  await page.fill('input[name=name]', 'Mei');
  await page.click('.bi-form button[type=submit]');
  assert.match(await text(page, '.bi-error'), /let us know if you can join/);
  assert.equal(await page.evaluate(() => localStorage.getItem('babyshower:sarah-james:rsvp')), null);
  await page.selectOption('select[name=attending]', 'yes');
  await page.selectOption('select[name=guests]', '2');
  await page.click('.bi-form button[type=submit]');
  assert.match(await text(page, '.bi-thanks-title'), /Thank you, Mei!/);
  await page.reload();
  assert.match(await text(page, '.bi-thanks-title'), /Thank you, Mei!/);
  await page.click('[data-act=edit]');
  assert.equal(await page.inputValue('input[name=name]'), 'Mei');
  assert.equal(await page.inputValue('select[name=guests]'), '2');
});

await test('add-to-calendar downloads a correct .ics', async (page) => {
  await page.goto(`${base}/index.html?invite=sarah-james&stage=card&page=1&autoplay=0`);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('.bi-p-details [data-act=ics]')]);
  assert.equal(dl.suggestedFilename(), 'sarah-james.ics');
  const body = await (await import('node:fs/promises')).readFile(await dl.path(), 'utf8');
  assert.match(body, /DTSTART:20261115T150000/);
  assert.match(body, /DTEND:20261115T180000/);
  assert.match(body, /LOCATION:The Garden Cafe/);
});

await test('whatsapp / email delivery use each invitation\'s own contact', async (page, ctx) => {
  await ctx.route('https://wa.me/**', (r) => r.fulfill({ body: 'ok', contentType: 'text/html' }));
  await page.goto(`${base}/index.html?invite=sarah-james&stage=card&page=2&autoplay=0`);
  await page.fill('input[name=name]', 'Lee');
  await page.selectOption('select[name=attending]', 'yes');
  const [popup] = await Promise.all([page.waitForEvent('popup'), page.click('.bi-form button[type=submit]')]);
  assert.match(popup.url(), /^https:\/\/wa\.me\/6591234567\?text=/);
  assert.match(decodeURIComponent(popup.url()), /Sarah & James/);
});

await test('each invitation delivers RSVPs to its own channel (email vs whatsapp)', async (page) => {
  await page.goto(compare());
  await page.evaluate(() => {
    window.__d = { a: [], b: [] };
    A.root.addEventListener('bi:deliver', (e) => window.__d.a.push(e.detail.target));
    B.root.addEventListener('bi:deliver', (e) => window.__d.b.push(e.detail.target));
    A.setPage(2); B.setPage(2);
  });
  await page.fill(`${B} input[name=name]`, 'Kim');
  await page.selectOption(`${B} select[name=attending]`, 'yes');
  await page.selectOption(`${B} select[name=guests]`, '2');
  await page.click(`${B} button[type=submit]`);
  let d = await page.evaluate(() => window.__d);
  assert.equal(d.a.length, 0, 'A must not deliver anything when B replies');
  assert.equal(d.b.length, 1);
  assert.equal(d.b[0].mode, 'email');
  assert.match(d.b[0].url, /^mailto:priya\.daniel\.rsvp@example\.com\?subject=RSVP/);
  assert.match(decodeURIComponent(d.b[0].url), /Kim: Joyfully accepting/);

  await page.fill(`${A} input[name=name]`, 'Lee');
  await page.selectOption(`${A} select[name=attending]`, 'no');
  await page.click(`${A} button[type=submit]`);
  d = await page.evaluate(() => window.__d);
  assert.equal(d.b.length, 1);
  assert.equal(d.a.length, 1);
  assert.equal(d.a[0].mode, 'whatsapp');
  assert.match(d.a[0].url, /^https:\/\/wa\.me\/6591234567\?text=/);
  assert.match(decodeURIComponent(d.a[0].url), /Lee: Regretfully declining/);
});

/* --------------------------------------- two invitations in ONE document */


await test('two mounts share one document without leaking content', async (page) => {
  await page.goto(compare());
  assert.equal(await page.locator('.bi').count(), 2);
  const [a, b] = [await rootText(page, 'sarah-james'), await rootText(page, 'priya-daniel')];
  assert.match(a, /Sarah/); assert.doesNotMatch(a, /Priya|Maple|Sip/);
  assert.match(b, /Priya/); assert.doesNotMatch(b, /Sarah|Garden Cafe|BabyStore/);
});

await test('every SVG id/url(#…) is unique across both invitations', async (page) => {
  await page.goto(compare());
  const dupes = await page.evaluate(() => {
    const seen = {}, d = [];
    document.querySelectorAll('[id]').forEach((el) => { seen[el.id] = (seen[el.id] || 0) + 1; });
    Object.keys(seen).forEach((k) => seen[k] > 1 && d.push(k));
    // each url(#id) reference must resolve inside its own invitation
    const broken = [];
    document.querySelectorAll('.bi').forEach((root) => {
      root.querySelectorAll('[fill^="url(#"],[mask^="url(#"]').forEach((el) => {
        const id = (el.getAttribute('fill') || el.getAttribute('mask')).slice(5, -1);
        if (!root.querySelector('#' + CSS.escape(id))) broken.push(id);
      });
    });
    return { d, broken };
  });
  assert.deepEqual(dupes.d, []);
  assert.deepEqual(dupes.broken, []);
});

await test('themes are scoped: each root has its own colours', async (page) => {
  await page.goto(compare());
  const v = (sel, name) => page.locator(sel).evaluate((el, n) => getComputedStyle(el).getPropertyValue(n).trim(), name);
  assert.equal(await v(A, '--accent'), '#ef9aa8');
  assert.equal(await v(B, '--accent'), '#a98fd8');
  assert.notEqual(await v(A, '--sky-top'), await v(B, '--sky-top'));
  // and the same element renders in different actual colours
  const col = (sel) => page.locator(`${sel} .bi-p-details .bi-btn`).evaluate((el) => getComputedStyle(el).backgroundImage);
  assert.notEqual(await col(A), await col(B));
  // body/document is untouched by either mount
  assert.equal(await page.evaluate(() => document.documentElement.style.cssText + document.body.style.cssText.replace(/\s/g, '')), '');
});

await test('companion options are per invitation (bunny only on sarah-james)', async (page) => {
  await page.goto(compare());
  assert.equal(await page.locator(`${A} .bi-friend-bunny`).count(), 1);
  assert.equal(await page.locator(`${B} .bi-friend-bunny`).count(), 0);
  assert.equal(await page.locator(`${B} .bi-friend-lantern`).count(), 1);
});

await test('stage and page state are independent', async (page) => {
  await page.goto(compare('').replace('stage=card', 'stage=open'));
  assert.equal(await page.evaluate(() => [A.stage, B.stage].join()), 'open,open');
  await page.evaluate(() => A.setStage('land'));
  assert.equal(await page.evaluate(() => [A.stage, B.stage].join()), 'land,open');
  await page.evaluate(() => { A.setStage('card'); A.setPage(2); });
  await page.click(`${B} .bi-skip`);
  await page.evaluate(() => B.setPage(1));
  assert.equal(await page.evaluate(() => [A.stage, A.page, B.stage, B.page].join()), 'card,2,card,1');
  await page.click(`${B} [data-goto="2"]`);
  assert.equal(await page.evaluate(() => [A.page, B.page].join()), '2,2');
  await page.click(`${A} .bi-dots button:nth-child(1)`);
  assert.equal(await page.evaluate(() => [A.page, B.page].join()), '0,2');
});

await test('autoplay timers are independent (one can finish while the other is paused)', async (page) => {
  await page.goto(`${base}/compare.html?stage=open&autoplay=0`);
  await page.evaluate(() => { A.paused = false; A.setStage('open'); });
  await page.waitForFunction(() => A.stage === 'float', null, { timeout: 6000 });
  assert.equal(await page.evaluate(() => B.stage), 'open');
});

await test('RSVPs are stored, validated and delivered per invitation', async (page) => {
  await page.goto(compare());
  await page.evaluate(() => {
    window.__ev = { a: [], b: [] };
    A.root.addEventListener('bi:rsvp', (e) => window.__ev.a.push(e.detail.rsvp));
    B.root.addEventListener('bi:rsvp', (e) => window.__ev.b.push(e.detail.rsvp));
    A.setPage(2); B.setPage(2);
  });
  // guest limits come from each invitation's own config
  assert.equal(await page.locator(`${A} select[name=guests] option:not([disabled])`).count(), 5);
  assert.equal(await page.locator(`${B} select[name=guests] option:not([disabled])`).count(), 3);

  // Alice replies to A
  await page.fill(`${A} input[name=name]`, 'Alice');
  await page.selectOption(`${A} select[name=attending]`, 'yes');
  await page.selectOption(`${A} select[name=guests]`, '3');
  await page.fill(`${A} textarea[name=message]`, 'See you there!');
  await page.click(`${A} button[type=submit]`);
  assert.match(await text(page, `${A} .bi-thanks-title`), /Thank you, Alice!/);
  assert.match(await text(page, `${A} .bi-thanks-text`), /can.t wait/);

  // B is untouched
  assert.equal(await page.locator(`${B} .bi-thanks`).isHidden(), true);
  assert.equal(await page.inputValue(`${B} input[name=name]`), '');
  assert.equal(await page.evaluate(() => localStorage.getItem('babyshower:priya-daniel:rsvp')), null);

  // Bob declines on B
  await page.fill(`${B} input[name=name]`, 'Bob');
  await page.selectOption(`${B} select[name=attending]`, 'no');
  assert.equal(await page.locator(`${B} [data-field=guests]`).isHidden(), true);
  await page.click(`${B} button[type=submit]`);
  assert.match(await text(page, `${B} .bi-thanks-title`), /Thank you, Bob!/);
  assert.match(await text(page, `${B} .bi-thanks-text`), /miss you/);

  // A still shows Alice, not Bob
  assert.match(await text(page, `${A} .bi-thanks-title`), /Alice/);
  const store = await page.evaluate(() => ({
    a: JSON.parse(localStorage.getItem('babyshower:sarah-james:rsvp')),
    b: JSON.parse(localStorage.getItem('babyshower:priya-daniel:rsvp')),
    keys: Object.keys(localStorage).sort(),
    ev: window.__ev,
  }));
  assert.deepEqual(store.keys, ['babyshower:priya-daniel:rsvp', 'babyshower:sarah-james:rsvp']);
  assert.deepEqual([store.a.slug, store.a.name, store.a.attending, store.a.guests, store.a.message], ['sarah-james', 'Alice', 'yes', 3, 'See you there!']);
  assert.deepEqual([store.b.slug, store.b.name, store.b.attending, store.b.guests], ['priya-daniel', 'Bob', 'no', 0]);
  assert.equal(store.ev.a.length, 1); assert.equal(store.ev.b.length, 1);
  assert.equal(store.ev.a[0].name, 'Alice'); assert.equal(store.ev.b[0].name, 'Bob');

  // reload: each instance restores only its own answer
  await page.reload();
  await page.evaluate(() => { A.setPage(2); B.setPage(2); });
  assert.match(await text(page, `${A} .bi-thanks-title`), /Alice/);
  assert.match(await text(page, `${B} .bi-thanks-title`), /Bob/);

  // editing A does not touch B
  await page.click(`${A} [data-act=edit]`);
  assert.equal(await page.locator(`${A} .bi-form`).isVisible(), true);
  assert.equal(await page.locator(`${B} .bi-thanks`).isVisible(), true);
});

await test('template defaults are never mutated by mounting', async (page) => {
  await page.goto(compare());
  const before = await page.evaluate(() => JSON.stringify(BabyInvite.DEFAULTS));
  const out = await page.evaluate(() => {
    const host = document.createElement('div'); host.style.cssText = 'width:390px;height:700px'; document.body.appendChild(host);
    const c = BabyInvite.mount(host, { slug: 'bare', honouring: 'Bare Minimum', venue: { address: ['x'] }, theme: { accent: '#000000', balloons: ['#111111'] }, companions: { bunny: false }, rsvp: { maxGuests: 2 } }, { stage: 'card', deliver: false });
    return { text: c.root.innerText, defaults: JSON.stringify(BabyInvite.DEFAULTS) };
  });
  assert.equal(out.defaults, before);
  assert.match(out.text, /Bare Minimum/);
  assert.doesNotMatch(out.text, /Sarah|Priya/);
  assert.match(out.text, /Baby\s+Shower/i); // falls back to default wording
});

await test('config text is escaped (no HTML injection)', async (page) => {
  await page.goto(compare());
  const r = await page.evaluate(() => {
    const host = document.createElement('div'); host.style.cssText = 'width:390px;height:700px'; document.body.appendChild(host);
    const c = BabyInvite.mount(host, { slug: 'evil', honouring: '<img src=x onerror="window.__xss=1">', headline: '<b>Bold</b>', venue: { name: '"><script>window.__xss=2</script>', mapUrl: 'javascript:alert(1)' } }, { stage: 'card', deliver: false });
    return { imgs: c.root.querySelectorAll('.bi-names img, .bi-headline b').length, scripts: c.root.querySelectorAll('script').length, xss: window.__xss || 0, names: c.root.querySelector('.bi-names').textContent };
  });
  assert.deepEqual([r.imgs, r.scripts, r.xss], [0, 0, 0]);
  assert.match(r.names, /<img/);
});

await test('long names shrink to fit instead of overflowing the card', async (page) => {
  await page.setViewportSize({ width: 500, height: 900 });
  await page.goto(compare());
  const r = await page.evaluate(() => {
    const host = document.createElement('div'); host.style.cssText = 'width:390px;height:800px'; document.body.appendChild(host);
    const c = BabyInvite.mount(host, { slug: 'long', honouring: 'Alexandria-Rose & Maximilian-James', headline: 'A Very Sweet Little Baby Shower Brunch' }, { stage: 'card', deliver: false });
    const body = c.root.querySelector('.bi-p-invite .bi-body'), n = c.root.querySelector('.bi-names');
    return { names: n.scrollWidth <= body.clientWidth, h: body.scrollHeight <= body.clientHeight + 1, lines: c.root.querySelectorAll('.bi-headline span').length };
  });
  assert.deepEqual(r, { names: true, h: true, lines: 2 });
});

await test('destroying one invitation leaves the other working', async (page) => {
  await page.goto(compare());
  await page.evaluate(() => A.destroy());
  assert.equal(await page.locator('.bi').count(), 1);
  await page.evaluate(() => B.setPage(1));
  assert.equal(await page.locator(`${B} .bi-page.is-active .bi-title`).innerText(), 'The Details');
});

/* ------------------------------------------------------------------- report */
await browser.close();
server.close();
let failed = 0;
for (const [ok, name, ms, err] of results) {
  console.log(`${ok ? '✓' : '✗'} ${name} (${ms}ms)`);
  if (!ok) { failed++; console.log('    ' + String(err && err.message || err).split('\n').slice(0, 12).join('\n    ')); }
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
