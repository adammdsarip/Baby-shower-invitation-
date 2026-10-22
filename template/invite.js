/*
 * Baby Shower Invitation – template engine.
 *
 *   BabyInvite.register(config)        add an invitation to the registry
 *   BabyInvite.mount(host, config|slug, options)  render one into an element
 *
 * Each mount() is fully self-contained: its own DOM subtree, its own theme
 * variables (scoped to the root element), its own timers, its own RSVP storage
 * key. Several invitations can therefore run side by side in one document.
 */
(function (global) {
  'use strict';

  const art = global.BabyInviteArt;
  const registry = Object.create(null);
  let instanceCount = 0;

  /* ------------------------------------------------------------- defaults */

  const DEFAULTS = {
    slug: 'invite',
    locale: 'en-GB',
    pageTitle: '',
    opening: 'A special\ncelebration\nis on the way…',
    sign: "You're Invited!",
    eyebrow: 'Please join us for a',
    headline: 'Baby Shower',
    honouringLabel: 'Honouring',
    honouring: 'The Parents-to-be',
    detailsTitle: 'Join Us',
    event: { start: '', end: '', timezone: '', dateText: '', dateShort: '', timeText: '', title: '' },
    venue: { name: '', address: [], mapUrl: '' },
    registry: { text: '', url: '' },
    rsvp: {
      title: 'RSVP',
      intro: "We'd love to celebrate with you!\nPlease let us know if you can make it.",
      deadline: '',
      maxGuests: 5,
      mode: 'none', // 'whatsapp' | 'email' | 'webhook' | 'none' (always stored locally too)
      whatsapp: '',
      email: '',
      webhookUrl: '',
      thankYouTitle: 'Thank you, {name}!',
      thankYouYes: "We can't wait to celebrate with you.",
      thankYouNo: "We'll miss you – thank you for letting us know.",
    },
    theme: {
      skyTop: '#9fc3e8',
      skyMid: '#f6dccb',
      skyBottom: '#fbd7b0',
      ink: '#7a5b49',
      gold: '#b98f58',
      accent: '#ef9aa8',
      accentDeep: '#e8788d',
      ribbon: '#a7c3e6',
      bowTie: '#9dbbe2',
      balloons: ['#a9c6e8', '#fbf1e4', '#f6bfc8', '#fdf6ec'],
      petal: '#f7c4cc',
      petalCore: '#f0949f',
      petalAlt: '#bcd3ef',
      petalAltCore: '#8fb0dc',
      leaf: '#a8c19a',
      leaf2: '#86a67a',
      castleRoof: '#b9c5e8',
    },
    companions: { bunny: true, lantern: true },
    labels: {
      skip: 'Skip',
      replay: 'Replay',
      viewDetails: 'View details',
      rsvpNow: 'RSVP NOW',
      send: 'Send RSVP',
      name: 'Your Name',
      attending: 'Will you be joining?',
      yes: 'Joyfully accepting',
      no: 'Regretfully declining',
      guests: 'Number of Guests',
      guestsOne: '1 guest',
      guestsMany: '{n} guests',
      message: 'Leave a message (optional)',
      addToCalendar: 'Add to calendar',
      viewMap: 'View map',
      editResponse: 'Change my response',
      replyBy: 'Kindly reply by {date}',
      sending: 'Sending…',
      needName: 'Please tell us your name.',
      needAnswer: 'Please let us know if you can join.',
      page: 'Page',
    },
    autoplay: true,
  };

  /* -------------------------------------------------------------- helpers */

  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  function merge(base, over) {
    const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    if (!isObj(over)) return out;
    Object.keys(over).forEach((k) => {
      out[k] = isObj(over[k]) && isObj(base[k]) ? merge(base[k], over[k]) : Array.isArray(over[k]) ? over[k].slice() : over[k];
    });
    return out;
  }
  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const br = (s) => esc(s).split('\n').join('<br>');
  const fmt = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
  const sleepless = (fn) => {
    try {
      return fn();
    } catch (e) {
      return undefined;
    }
  };

  /** Parse "2026-11-15T15:00" as a wall-clock time (no timezone maths). */
  function parseLocal(str) {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(str || '');
    if (!m) return null;
    return { y: +m[1], mo: +m[2], d: +m[3], h: m[4] == null ? null : +m[4], mi: m[5] == null ? 0 : +m[5] };
  }
  function time12(t) {
    if (!t || t.h == null) return '';
    const h = t.h % 12 || 12;
    return `${h}:${String(t.mi).padStart(2, '0')} ${t.h < 12 ? 'AM' : 'PM'}`;
  }
  function dateText(t, locale, opts) {
    if (!t) return '';
    const d = new Date(Date.UTC(t.y, t.mo - 1, t.d));
    return sleepless(() => new Intl.DateTimeFormat(locale, Object.assign({ timeZone: 'UTC' }, opts)).format(d)) || '';
  }
  const ics = (t) =>
    `${t.y}${String(t.mo).padStart(2, '0')}${String(t.d).padStart(2, '0')}T${String(t.h || 0).padStart(2, '0')}${String(t.mi || 0).padStart(2, '0')}00`;

  /** Everything the card needs to say about the event, derived from the config. */
  function deriveEvent(cfg) {
    const e = cfg.event;
    const s = parseLocal(e.start);
    const f = parseLocal(e.end);
    const dateLong = e.dateText || dateText(s, cfg.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const dateShort = e.dateShort || dateText(s, cfg.locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const timeText = e.timeText || (s && s.h != null ? time12(s) + (f && f.h != null ? ' – ' + time12(f) : '') : '');
    return { s, f, dateLong, dateShort, timeText };
  }

  function buildIcs(cfg, ev) {
    if (!ev.s) return '';
    const end = ev.f || ev.s;
    const where = [cfg.venue.name].concat(cfg.venue.address).filter(Boolean).join(', ');
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Baby Shower Invitation//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      `UID:${cfg.slug}@baby-shower-invitation`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, '')}`,
      `DTSTART:${ics(ev.s)}`, `DTEND:${ics(end)}`,
      `SUMMARY:${(cfg.event.title || `${cfg.headline} – ${cfg.honouring}`).replace(/[\n,;]/g, ' ')}`,
      `LOCATION:${where.replace(/[,;]/g, '\\$&')}`,
      'END:VEVENT', 'END:VCALENDAR',
    ];
    return lines.join('\r\n');
  }

  /* ---------------------------------------------------------------- theme */

  function themeVars(t) {
    const b = t.balloons;
    const mix = (c, w) => `color-mix(in srgb, ${c}, #fff ${w}%)`;
    return {
      '--sky-top': t.skyTop, '--sky-mid': t.skyMid, '--sky-bot': t.skyBottom,
      '--ink': t.ink, '--gold': t.gold, '--accent': t.accent, '--accent-deep': t.accentDeep,
      '--ribbon': t.ribbon, '--bowtie': t.bowTie,
      '--b1': b[0 % b.length], '--b2': b[1 % b.length], '--b3': b[2 % b.length], '--b4': b[3 % b.length],
      '--petal': t.petal, '--petal-core': t.petalCore, '--petal-alt': t.petalAlt, '--petal-alt-core': t.petalAltCore,
      '--petal-white-core': mix(t.petal, 55),
      '--leaf': t.leaf, '--leaf-2': t.leaf2, '--castle-roof': t.castleRoof,
      '--cloud-shade': `color-mix(in srgb, ${t.skyMid}, #fff 35%)`,
      '--cloud-deep': `color-mix(in srgb, ${t.skyMid}, ${t.skyTop} 30%)`,
    };
  }

  /* ---------------------------------------------------------------- mount */

  function resolve(input) {
    if (typeof input === 'string') {
      if (!registry[input]) throw new Error(`No invitation registered with slug "${input}".`);
      return registry[input];
    }
    return input || {};
  }

  function mount(host, input, options) {
    options = options || {};
    const cfg = merge(DEFAULTS, resolve(input));
    const id = `bi${++instanceCount}`;
    const ev = deriveEvent(cfg);
    const storage = options.storage || sleepless(() => global.localStorage) || null;
    const storeKey = `babyshower:${cfg.slug}:rsvp`;
    const L = cfg.labels;

    const root = document.createElement('div');
    root.className = 'bi';
    root.dataset.stage = 'open';
    root.dataset.slug = cfg.slug;
    root.dataset.page = '0';
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', cfg.pageTitle || `${cfg.headline} – ${cfg.honouring}`);
    const vars = themeVars(cfg.theme);
    Object.keys(vars).forEach((k) => root.style.setProperty(k, vars[k]));

    const A = (name, suffix) => `${id}-${name}${suffix || ''}`;
    const sparkles = (() => {
      const r = art.rng(art.hash(cfg.slug));
      let h = '';
      for (let i = 0; i < 26; i++) {
        h += `<i style="left:${(r() * 100).toFixed(1)}%;top:${(r() * 72).toFixed(1)}%;--s:${(0.5 + r() * 0.9).toFixed(2)};animation-delay:-${(r() * 6).toFixed(2)}s;animation-duration:${(2.6 + r() * 3).toFixed(2)}s"></i>`;
      }
      return h;
    })();

    const addr = cfg.venue.address.map(esc).join('<br>');
    const rows = [];
    if (ev.dateLong) {
      rows.push(`<div class="bi-row">${art.icon('calendar')}<div><strong>${esc(ev.dateLong)}</strong>${ev.timeText ? `<span>${esc(ev.timeText)}</span>` : ''}${
        ev.s ? `<button type="button" class="bi-link" data-act="ics">${esc(L.addToCalendar)}</button>` : ''}</div></div>`);
    }
    if (cfg.venue.name || addr) {
      rows.push(`<div class="bi-row">${art.icon('pin')}<div>${cfg.venue.name ? `<strong>${esc(cfg.venue.name)}</strong>` : ''}${addr ? `<span>${addr}</span>` : ''}${
        cfg.venue.mapUrl ? `<a class="bi-link" href="${esc(cfg.venue.mapUrl)}" target="_blank" rel="noopener">${esc(L.viewMap)}</a>` : ''}</div></div>`);
    }
    if (cfg.registry.text) {
      rows.push(`<div class="bi-row">${art.icon('gift')}<div><span class="bi-strong-lines">${br(cfg.registry.text)}</span>${
        cfg.registry.url ? `<a class="bi-link" href="${esc(cfg.registry.url)}" target="_blank" rel="noopener">${esc(cfg.registry.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>` : ''}</div></div>`);
    }

    // Headline: honour explicit line breaks, otherwise balance into at most two lines.
    const headlineLines = (() => {
      if (cfg.headline.indexOf('\n') >= 0) return cfg.headline.split('\n');
      const w = cfg.headline.split(' ');
      if (w.length <= 2) return w;
      const k = Math.ceil(w.length / 2);
      return [w.slice(0, k).join(' '), w.slice(k).join(' ')];
    })();
    const guestOptions = (() => {
      let o = '';
      for (let i = 1; i <= cfg.rsvp.maxGuests; i++) o += `<option value="${i}">${esc(i === 1 ? L.guestsOne : fmt(L.guestsMany, { n: i }))}</option>`;
      return o;
    })();
    const replyBy = cfg.rsvp.deadline
      ? fmt(L.replyBy, { date: dateText(parseLocal(cfg.rsvp.deadline), cfg.locale, { day: 'numeric', month: 'long', year: 'numeric' }) })
      : '';

    root.innerHTML = `
      <div class="bi-sky"></div>
      <div class="bi-sparkles" aria-hidden="true">${sparkles}</div>
      <div class="bi-clouds-back" aria-hidden="true">
        <div class="bi-cloud bi-c1">${art.cloud(A('c1'))}</div>
        <div class="bi-cloud bi-c2">${art.cloud(A('c2'))}</div>
        <div class="bi-cloud bi-c3">${art.cloud(A('c3'))}</div>
      </div>
      <div class="bi-stars" aria-hidden="true">
        <div class="bi-star bi-s1"><b></b>${art.star(A('s1'))}</div>
        <div class="bi-star bi-s2"><b></b>${art.star(A('s2'))}</div>
        <div class="bi-star bi-s3"><b></b>${art.star(A('s3'))}</div>
      </div>
      <div class="bi-open">
        <div class="bi-moon" aria-hidden="true">${art.moon(A('moon'))}</div>
        <div class="bi-castle" aria-hidden="true">${art.castle(A('castle'))}</div>
        <p class="bi-open-text">${br(cfg.opening)}</p>
      </div>
      <div class="bi-hero">
        <div class="bi-sign" role="heading" aria-level="1">
          <span class="bi-rope bi-rope-l"></span><span class="bi-rope bi-rope-r"></span>
          <span class="bi-sign-board">
            ${art.sprig(A('sg1'), { cls: 'bi-sprig bi-sprig-a' })}${art.sprig(A('sg2'), { cls: 'bi-sprig bi-sprig-b' })}
            <span class="bi-sign-text">${esc(cfg.sign)}</span>
            <span class="bi-sign-heart">${art.icon('heart')}</span>
          </span>
        </div>
        <div class="bi-bear">
          <div class="bi-puffs" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <div class="bi-bear-fall"><div class="bi-bear-sway">${art.floater(A('fl'))}</div></div>
        </div>
      </div>
      <div class="bi-cloud-front" aria-hidden="true">${art.cloudBank(A('cf'), { seed: art.hash(cfg.slug) % 97 + 3 })}</div>

      <div class="bi-card-wrap">
        <div class="bi-card" data-page="0">
          <div class="bi-peek" aria-hidden="true">${art.bearPeek(A('pk'))}</div>
          <div class="bi-bow" aria-hidden="true">${art.bow(A('bow'))}</div>
          <div class="bi-paper">
            <div class="bi-border"></div>
            <div class="bi-pages">

              <section class="bi-page bi-p-invite" aria-label="${esc(cfg.headline.replace(/\n/g, ' '))}">
                <div class="bi-body">
                  <p class="bi-eyebrow bi-rise" style="--i:0">${esc(cfg.eyebrow)}</p>
                  <h2 class="bi-headline bi-rise" style="--i:1">${headlineLines.map((w) => `<span>${esc(w)}</span>`).join('')}</h2>
                  <span class="bi-heart bi-rise" style="--i:2">${art.icon('heart')}</span>
                  <p class="bi-label bi-rise" style="--i:3">${esc(cfg.honouringLabel)}</p>
                  <p class="bi-names bi-rise" style="--i:4">${esc(cfg.honouring)}</p>
                  <span class="bi-rule bi-rise" style="--i:5"><i></i>${art.icon('heart')}<i></i></span>
                  <p class="bi-facts bi-rise" style="--i:6">${[ev.dateShort, ev.timeText, cfg.venue.name].filter(Boolean).map((x) => esc(x).toUpperCase()).join('<br>')}${
                    addr ? '<br>' + cfg.venue.address.map((x) => esc(x).toUpperCase()).join('<br>') : ''}</p>
                  <button type="button" class="bi-btn bi-btn-ghost bi-rise" style="--i:7" data-goto="1">${esc(L.viewDetails)}${art.icon('chevron')}</button>
                </div>
              </section>

              <section class="bi-page bi-p-details" aria-label="${esc(cfg.detailsTitle)}">
                <div class="bi-body">
                  <h2 class="bi-title bi-rise" style="--i:0">${esc(cfg.detailsTitle)}</h2>
                  <span class="bi-heart bi-rise" style="--i:1">${art.icon('heart')}</span>
                  <div class="bi-rows bi-rise" style="--i:2">${rows.join('')}</div>
                  <button type="button" class="bi-btn bi-rise" style="--i:3" data-goto="2">${esc(L.rsvpNow)}${art.icon('chevron')}</button>
                  ${replyBy ? `<p class="bi-note bi-rise" style="--i:4">${esc(replyBy)}</p>` : ''}
                </div>
              </section>

              <section class="bi-page bi-p-rsvp" aria-label="${esc(cfg.rsvp.title)}">
                <div class="bi-body">
                  <h2 class="bi-title bi-title-caps bi-rise" style="--i:0">${esc(cfg.rsvp.title)}</h2>
                  <span class="bi-heart bi-rise" style="--i:1">${art.icon('heart')}</span>
                  <form class="bi-form bi-rise" style="--i:2" novalidate>
                    <p class="bi-intro">${br(cfg.rsvp.intro)}</p>
                    <label class="bi-field">${art.icon('user')}<input name="name" type="text" autocomplete="name" placeholder="${esc(L.name)}" maxlength="80" aria-label="${esc(L.name)}"></label>
                    <label class="bi-field">${art.icon('check')}
                      <select name="attending" aria-label="${esc(L.attending)}"><option value="" selected disabled>${esc(L.attending)}</option><option value="yes">${esc(L.yes)}</option><option value="no">${esc(L.no)}</option></select>
                      ${art.icon('down', 'bi-icon bi-caret')}</label>
                    <label class="bi-field" data-field="guests">${art.icon('users')}<select name="guests" aria-label="${esc(L.guests)}"><option value="" selected disabled>${esc(L.guests)}</option>${guestOptions}</select>${art.icon('down', 'bi-icon bi-caret')}</label>
                    <label class="bi-field bi-field-area">${art.icon('chat')}<textarea name="message" rows="2" maxlength="400" placeholder="${esc(L.message)}" aria-label="${esc(L.message)}"></textarea></label>
                    <p class="bi-error" role="alert" aria-live="polite"></p>
                    <button type="submit" class="bi-btn">${esc(L.send)}${art.icon('chevron')}</button>
                  </form>
                  <div class="bi-thanks" hidden>
                    <p class="bi-thanks-title"></p>
                    <p class="bi-thanks-text"></p>
                    ${ev.s ? `<button type="button" class="bi-btn bi-btn-ghost" data-act="ics">${art.icon('calendar')}${esc(L.addToCalendar)}</button>` : ''}
                    <button type="button" class="bi-link" data-act="edit">${esc(L.editResponse)}</button>
                  </div>
                </div>
              </section>

            </div>
          </div>
          <div class="bi-garland bi-garland-l" aria-hidden="true">${art.garland(A('gl'), { seed: art.hash(cfg.slug) % 40 + 1, phase: 0 })}</div>
          <div class="bi-garland bi-garland-r" aria-hidden="true">${art.garland(A('gr'), { seed: art.hash(cfg.slug) % 40 + 2, phase: 2 })}</div>
          <div class="bi-lip" aria-hidden="true">${art.cloudBank(A('lip'), { seed: 11, h: 200, min: 40, var: 36, step: 80 })}</div>
          <div class="bi-friends" aria-hidden="true">
            <div class="bi-friend-bear">${art.bear(A('fb'))}</div>
            ${cfg.companions.lantern ? `<div class="bi-friend-lantern">${art.lantern(A('ln'))}</div>` : ''}
            ${cfg.companions.bunny ? `<div class="bi-friend-bunny">${art.bunny(A('bn'))}</div>` : ''}
          </div>
        </div>
        <nav class="bi-dots" aria-label="${esc(L.page)}">
          ${[cfg.headline, cfg.detailsTitle, cfg.rsvp.title].map((t, i) => `<button type="button" data-goto="${i}" aria-label="${esc(L.page)} ${i + 1}: ${esc(t)}"></button>`).join('')}
        </nav>
      </div>
      <button type="button" class="bi-ctl bi-skip">${esc(L.skip)}${art.icon('chevron')}</button>
      <button type="button" class="bi-ctl bi-replay" aria-label="${esc(L.replay)}">${art.icon('replay')}</button>
    `;
    host.appendChild(root);

    /* -------------------------------------------------- shrink-to-fit text */

    // Long names / headlines shrink instead of overflowing the card.
    function fitAll() {
      root.querySelectorAll('.bi-body').forEach((body) => {
        body.style.fontSize = '';
        if (!body.clientWidth) return;
        const cs = getComputedStyle(body);
        const avail = body.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        body.querySelectorAll('.bi-names, .bi-headline, .bi-title').forEach((el) => {
          el.style.fontSize = '';
          const need = el.scrollWidth;
          if (need > avail + 0.5) el.style.fontSize = `${(parseFloat(getComputedStyle(el).fontSize) * avail) / need * 0.98}px`;
        });
        // too much text for the card? scale this page's type down a little (never below 76%)
        let k = 1;
        while (body.scrollHeight > body.clientHeight + 1 && k > 0.76) {
          k -= 0.03;
          body.style.fontSize = `${k}em`;
        }
      });
    }
    let ro = null;
    if (global.ResizeObserver) {
      ro = new ResizeObserver(fitAll);
      ro.observe(root);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);

    /* ------------------------------------------------------- stage engine */

    const STAGES = ['open', 'float', 'land', 'card'];
    const DURATION = { open: 3300, float: 3300, land: 3900 };
    let timer = null;
    let destroyed = false;

    function emit(name, detail) {
      root.dispatchEvent(new CustomEvent(`bi:${name}`, { bubbles: true, detail: Object.assign({ slug: cfg.slug, id }, detail) }));
    }
    function setStage(stage) {
      if (destroyed) return;
      clearTimeout(timer);
      root.dataset.stage = stage;
      const next = STAGES[STAGES.indexOf(stage) + 1];
      if (next && cfg.autoplay !== false && !instance.paused) timer = setTimeout(() => setStage(next), DURATION[stage]);
      emit('stage', { stage });
    }
    function advance() {
      const i = STAGES.indexOf(root.dataset.stage);
      if (i < STAGES.length - 1) setStage(STAGES[i + 1]);
    }

    /* --------------------------------------------------------------- pages */

    const card = root.querySelector('.bi-card');
    const pages = Array.from(root.querySelectorAll('.bi-page'));
    function setPage(n) {
      n = Math.max(0, Math.min(pages.length - 1, n));
      root.dataset.page = card.dataset.page = String(n);
      pages.forEach((p, i) => {
        const d = i - n;
        p.style.setProperty('--d', d);
        p.classList.toggle('is-active', d === 0);
        p.toggleAttribute('inert', d !== 0);
        p.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
      });
      root.querySelectorAll('.bi-dots button').forEach((b, i) => b.classList.toggle('is-on', i === n));
      emit('page', { page: n });
    }

    /* ---------------------------------------------------------------- rsvp */

    const form = root.querySelector('.bi-form');
    const thanks = root.querySelector('.bi-thanks');
    const errorEl = root.querySelector('.bi-error');
    const guestField = root.querySelector('[data-field="guests"]');

    function readSaved() {
      return sleepless(() => JSON.parse(storage.getItem(storeKey))) || null;
    }
    function save(rec) {
      sleepless(() => storage.setItem(storeKey, JSON.stringify(rec)));
    }
    function showThanks(rec) {
      root.querySelector('.bi-thanks-title').textContent = fmt(cfg.rsvp.thankYouTitle, { name: rec.name });
      root.querySelector('.bi-thanks-text').textContent = rec.attending === 'yes' ? cfg.rsvp.thankYouYes : cfg.rsvp.thankYouNo;
      thanks.hidden = false;
      form.hidden = true;
      root.querySelector('.bi-p-rsvp').classList.add('is-done');
    }
    function fillForm(rec) {
      form.elements.name.value = rec.name || '';
      form.elements.attending.value = rec.attending || '';
      form.elements.guests.value = rec.guests ? String(rec.guests) : '';
      form.elements.message.value = rec.message || '';
      syncGuests();
    }
    function syncGuests() {
      const no = form.elements.attending.value === 'no';
      guestField.hidden = no;
    }
    form.elements.attending.addEventListener('change', syncGuests);

    function deliver(rec) {
      const r = cfg.rsvp;
      const summary =
        `${cfg.headline} – ${cfg.honouring}\n${rec.name}: ${rec.attending === 'yes' ? L.yes : L.no}` +
        (rec.attending === 'yes' ? `\n${L.guests}: ${rec.guests}` : '') +
        (rec.message ? `\n"${rec.message}"` : '');
      let target = null;
      if (r.mode === 'webhook' && r.webhookUrl) target = { mode: 'webhook', url: r.webhookUrl };
      else if (r.mode === 'whatsapp' && r.whatsapp) target = { mode: 'whatsapp', url: `https://wa.me/${String(r.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(summary)}` };
      else if (r.mode === 'email' && r.email) target = { mode: 'email', url: `mailto:${r.email}?subject=${encodeURIComponent('RSVP – ' + cfg.honouring)}&body=${encodeURIComponent(summary)}` };
      if (!target) return;
      emit('deliver', { target });
      if (options.deliver === false) return;
      if (target.mode === 'webhook') sleepless(() => fetch(target.url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(rec) }));
      else if (target.mode === 'whatsapp') sleepless(() => global.open(target.url, '_blank', 'noopener'));
      else sleepless(() => (global.location.href = target.url));
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = form.elements;
      const name = f.name.value.trim();
      if (!name) return fail(L.needName, f.name);
      if (!f.attending.value) return fail(L.needAnswer, f.attending);
      errorEl.textContent = '';
      const attending = f.attending.value;
      const rec = {
        slug: cfg.slug,
        name,
        attending,
        guests: attending === 'yes' ? Number(f.guests.value || 1) : 0,
        message: f.message.value.trim(),
        at: new Date().toISOString(),
      };
      save(rec);
      showThanks(rec);
      deliver(rec);
      emit('rsvp', { rsvp: rec });
    });
    function fail(msg, el) {
      errorEl.textContent = msg;
      el.focus();
    }
    root.querySelector('[data-act="edit"]').addEventListener('click', () => {
      thanks.hidden = true;
      form.hidden = false;
      root.querySelector('.bi-p-rsvp').classList.remove('is-done');
    });

    /* ------------------------------------------------------------ add-to-cal */

    root.querySelectorAll('[data-act="ics"]').forEach((b) =>
      b.addEventListener('click', () => {
        const text = buildIcs(cfg, ev);
        if (!text) return;
        const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${cfg.slug}.ics`;
        root.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        emit('ics', {});
      })
    );

    /* ------------------------------------------------------------- controls */

    root.addEventListener('click', (e) => {
      const goto = e.target.closest('[data-goto]');
      if (goto) return setPage(Number(goto.dataset.goto));
      if (e.target.closest('.bi-skip')) return setStage('card');
      if (e.target.closest('.bi-replay')) return instance.replay();
      if (root.dataset.stage !== 'card' && !e.target.closest('.bi-ctl')) advance();
    });

    // swipe between pages
    let sx = 0, sy = 0, tracking = false;
    card.addEventListener('pointerdown', (e) => {
      if (e.target.closest('input,select,textarea,button,a')) return;
      sx = e.clientX; sy = e.clientY; tracking = true;
    });
    card.addEventListener('pointerup', (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) setPage(Number(root.dataset.page) + (dx < 0 ? 1 : -1));
    });
    card.addEventListener('pointercancel', () => (tracking = false));
    root.tabIndex = -1;
    root.addEventListener('keydown', (e) => {
      if (root.dataset.stage !== 'card' || e.target.closest('input,select,textarea')) return;
      if (e.key === 'ArrowRight') setPage(Number(root.dataset.page) + 1);
      if (e.key === 'ArrowLeft') setPage(Number(root.dataset.page) - 1);
    });

    /* ---------------------------------------------------------------- public */

    const instance = {
      id, root, config: cfg, paused: false,
      get stage() { return root.dataset.stage; },
      get page() { return Number(root.dataset.page); },
      setStage, setPage,
      replay() {
        setPage(0);
        setStage('open');
      },
      destroy() {
        destroyed = true;
        clearTimeout(timer);
        if (ro) ro.disconnect();
        root.remove();
      },
      savedRsvp: readSaved,
      clearRsvp() {
        sleepless(() => storage.removeItem(storeKey));
      },
    };

    const saved = readSaved();
    if (saved) fillForm(saved);
    if (options.guest && !form.elements.name.value) form.elements.name.value = options.guest;
    if (saved) showThanks(saved);
    setPage(Number(options.page) || 0);

    const reduce = sleepless(() => global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const startStage = options.stage || (reduce ? 'card' : 'open');
    if (options.autoplay === false) instance.paused = true;
    setStage(startStage);
    fitAll();
    return instance;
  }

  global.BabyInvite = {
    register(cfg) {
      if (!cfg || !cfg.slug) throw new Error('An invitation needs a slug.');
      registry[cfg.slug] = cfg;
      return cfg;
    },
    list: () => Object.keys(registry),
    get: (slug) => registry[slug],
    mount,
    DEFAULTS,
  };
})(window);
