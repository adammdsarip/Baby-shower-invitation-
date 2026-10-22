# Animated Baby Shower Invitation

A premium, mobile-first animated invitation: soft clouds and stars → a teddy bear floats down holding balloons → lands on a cloud and waves → a "You're Invited!" sign drops → the invitation card unfolds into **Invitation · Details · RSVP**.

The design is a **template**. All wording, dates, venue, RSVP behaviour and colours live in one small config file per customer, so you can reuse it without touching the animation code.

```
index.html              page that shows one invitation   (?invite=<slug>)
compare.html            two invitations mounted in one document (used by the tests)
invites/
  _template.js          copy this for each new customer
  sarah-james.js        demo #1  – blue & blush, bunny + lantern, WhatsApp RSVP
  priya-daniel.js       demo #2  – lavender & mint, lantern only, email RSVP
template/
  invite.js             engine: BabyInvite.register / BabyInvite.mount
  invite.css            layout + animation choreography (scoped under .bi)
  art.js                all illustrations (bear, balloons, clouds, flowers…) as themeable SVG
  fonts/ fonts.css      self-hosted Great Vibes, Cormorant Garamond, Nunito (SIL OFL)
tests/isolation.test.mjs
```

## Run it

```bash
npm start            # http://localhost:8080  (or any static host – there is no build step)
```

Open `/?invite=sarah-james` and `/?invite=priya-daniel`.

Handy URL options: `&guest=Auntie+May` (pre-fills RSVP name) · `&stage=card` (skip the intro; `open|float|land|card`) · `&page=2` (start on RSVP) · `&autoplay=0` (hold the current stage).

## Make an invitation for a new customer

1. `cp invites/_template.js invites/<their-slug>.js` and edit the values.
2. Add `<script src="invites/<their-slug>.js"></script>` to `index.html`.
3. Share `https://your-site/?invite=<their-slug>`.

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
npm install          # playwright (uses any installed Chromium)
npm test
```

22 browser tests, including: two invitations in one document never leak text, colours, stage/page state, timers, SVG ids or RSVP data into each other; each uses its own guest limit and delivery channel; defaults aren't mutated; config text is HTML-escaped; long names fit; the full intro timeline plays; `.ics` download; reduced-motion; reload persistence.

## Notes
* Dates are computed from `event.start`, so the weekday is always correct. (15 Nov 2026 is a **Sunday** – the reference mock-up said Saturday.)
* Respects `prefers-reduced-motion` (starts on the card). Tap anywhere during the intro, or press **Skip**, to move on.
* The "Add to calendar" file uses floating local time (the event's wall-clock time).
