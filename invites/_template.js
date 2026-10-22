/*
 * COPY THIS FILE to start a new customer's invitation:
 *   1. cp invites/_template.js invites/<their-slug>.js
 *   2. edit the values below (anything you delete falls back to the default)
 *   3. add <script src="invites/<their-slug>.js"></script> to index.html
 *   4. share  https://your-site/?invite=<their-slug>   (add &guest=Name to greet a guest)
 *
 * The slug also namespaces saved RSVPs, so it must be unique per customer.
 */
BabyInvite.register({
  slug: 'your-slug-here',

  // Wording
  opening: 'A special\ncelebration\nis on the way…',   // scene 1
  sign: "You're Invited!",                              // scene 3
  eyebrow: 'Please join us for a',
  headline: 'Baby Shower',                              // each word gets its own line
  honouringLabel: 'Honouring',
  honouring: 'Parent & Parent',
  detailsTitle: 'Join Us',

  // When / where (times are wall-clock; dates & "3:00 PM – 6:00 PM" are formatted for you).
  // Override with dateText / dateShort / timeText if you want custom wording.
  event: { start: '2026-01-01T15:00', end: '2026-01-01T18:00', timezone: '' },
  venue: { name: 'Venue name', address: ['Street address', 'City'], mapUrl: '' },
  registry: { text: '', url: '' },                       // leave text empty to hide the gift row

  // RSVP. mode: 'whatsapp' | 'email' | 'webhook' | 'none'
  rsvp: { deadline: '', maxGuests: 5, mode: 'none', whatsapp: '', email: '', webhookUrl: '' },

  // Optional – colours, companions, labels (translations). See template/invite.js DEFAULTS.
  // theme: { skyTop: '#9fc3e8', accent: '#ef9aa8', balloons: ['#a9c6e8', '#fbf1e4', '#f6bfc8', '#fdf6ec'] },
  // companions: { bunny: true, lantern: true },
});
