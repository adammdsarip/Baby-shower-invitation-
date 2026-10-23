# Animated Baby Shower Invitation

A premium, mobile-first animated invitation: soft clouds and stars → a teddy bear floats down holding balloons → lands on a cloud and waves → a "You're Invited!" sign drops → the invitation card unfolds into **Invitation · Details · RSVP**.

The design is a **template**. All wording, dates, venue, RSVP behaviour and colours live in one small config file per customer, so you can reuse it without touching the animation code.

```
index.html              page that shows one invitation   (?invite=<slug>, loaded on demand)
compare.html            two invitations mounted in one document (used by the tests)
invites/
  _template.js          starting point used by `npm run new`
  sarah-james.js        demo #1  – blue & blush, bunny + lantern, WhatsApp RSVP
  priya-daniel.js       demo #2  – lavender & mint, lantern only, email RSVP
template/
  invite.js             engine: BabyInvite.register / BabyInvite.mount
  invite.css            layout + animation choreography (scoped under .bi)
  art.js                all illustrations (bear, balloons, clouds, flowers…) as themeable SVG
  fonts/ fonts.css      self-hosted Great Vibes, Cormorant Garamond, Nunito (SIL OFL)
scripts/                new-invite.mjs, build-redirects.mjs
tests/                  invites.test.mjs (per customer), isolation.test.mjs (engine)
```

## Run it

```bash
npm start            # http://localhost:8080  (or any static host – there is no build step)
```

Open `/?invite=sarah-james` and `/?invite=priya-daniel`.

Handy URL options: `&guest=Auntie+May` (pre-fills RSVP name) · `&stage=card` (skip the intro; `open|float|land|card`) · `&page=2` (start on RSVP) · `&autoplay=0` (hold the current stage).

## Add a new customer (the whole workflow)

```bash
npm run new -- mia-and-noah-k7x2q "Mia & Noah"   # creates invites/mia-and-noah-k7x2q.js
# edit that file: names, date, venue, RSVP contact, colours
npm run redirects                                # refreshes _redirects (short links /<slug>)
npm test                                         # checks EVERY invitation, including the new one
npm start                                        # preview: http://localhost:8080/?invite=mia-and-noah-k7x2q
git add -A && git commit -m "Add Mia & Noah" && git push   # Netlify deploys
```

`npm run links -- https://your-site.netlify.app` prints every customer and the exact link to send them.

No other file needs editing: `index.html` loads `invites/<slug>.js` on demand. Use an unguessable suffix in the slug for privacy. Share `https://your-site/?invite=<slug>` or the short `https://your-site/<slug>`.

What you can set (everything is optional – missing values use the defaults in `template/invite.js`):

| Area | Keys |
|---|---|
| Wording | `opening`, `sign`, `eyebrow`, `headline`, `honouringLabel`, `honouring`, `detailsTitle` |
| Event | `event.start` / `event.end` (`"2026-11-15T15:00"`) – the weekday, date and `3:00 PM – 6:00 PM` are formatted for you; override with `dateText`, `dateShort`, `timeText` |
| Venue | `venue.name`, `venue.address[]`, `venue.mapUrl` |
| Gift row | `registry.text`, `registry.url` (empty text hides the row) |
| RSVP | `rsvp.mode` = `whatsapp` \| `email` \| `webhook` \| `none`, plus `whatsapp`, `email`, `webhookUrl`, `maxGuests`, `deadline`, `intro`, thank-you messages |
| Look | `theme` (sky, ink, accent, ribbon, bow tie, 4 balloon colours, flower and leaf colours), `companions: { bunny, lantern }` |
| Language | `labels` – every button / placeholder / error message, so you can translate |

A headline with more than two words is balanced onto two lines (or use `\n`). Names and headlines shrink to fit, and a page with too much text scales its type down rather than overflowing.

### RSVPs
Every response is saved in the guest's browser under `babyshower:<slug>:rsvp` (so reopening the link shows "Thank you" and lets them change it) **and** delivered by the configured channel: a pre-filled WhatsApp message, a pre-filled email, or a `POST` of the JSON to your `webhookUrl` (e.g. a Google Apps Script / Zapier / Make endpoint that writes to a sheet). The host page can also listen for `bi:rsvp` and `bi:deliver` DOM events.

## Independence between invitations

`BabyInvite.mount(hostElement, slugOrConfig, options)` builds a self-contained subtree: its own theme (CSS variables scoped to its root, never `:root`), its own uniquely-prefixed SVG ids, its own timers, page state and storage key, and it deep-copies the defaults. Two invitations can therefore live in one page or in separate pages without affecting each other. `npm test` proves it.

## Tests

```bash
npm install            # playwright (uses any installed Chromium)
npm test               # both suites, ~2 min
npm run test:invites   # per-customer checks only (~1 min)
SHOTS_DIR=tests/screens npm run test:invites   # also save screenshots of every invitation
```

**`tests/invites.test.mjs` – runs for every file in `invites/` automatically** (adding a customer adds tests):
- config check: slug matches the file name, no unknown/typo'd settings, placeholder name/date/venue replaced, valid dates, `#rrggbb` colours, `https://` links, RSVP channel has a valid phone/email/URL, deadline before the event;
- renders on a 390×844 phone, a 320×568 small phone and a 1280×800 desktop: no console errors or failed requests, no sideways scroll, no text wider or taller than the card on any of the three pages, names/venue shown, no `undefined`/`NaN`;
- the intro stages play and a full RSVP works (validation, guest limit, storage, delivery channel);
- all invitations mounted together in one page never show each other's names or venue and share no SVG ids;
- `_redirects` is in sync (run `npm run redirects` if it complains).

**`tests/isolation.test.mjs`** – the template engine itself with the two demo invitations: separate state, timers, themes, storage and delivery; defaults never mutated; HTML-escaped config; long names fit; timeline, `.ics`, reduced-motion, reload persistence.

## Notes
* Dates are computed from `event.start`, so the weekday is always correct. (15 Nov 2026 is a **Sunday** – the reference mock-up said Saturday.)
* Respects `prefers-reduced-motion` (starts on the card). Tap anywhere during the intro, or press **Skip**, to move on.
* The "Add to calendar" file uses floating local time (the event's wall-clock time).
