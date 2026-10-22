/* Demo invitation #1 – soft blue & blush, bunny + lantern */
BabyInvite.register({
  slug: 'sarah-james',
  headline: 'Baby Shower',
  honouring: 'Sarah & James',
  event: { start: '2026-11-15T15:00', end: '2026-11-15T18:00', timezone: 'Asia/Singapore' },
  venue: {
    name: 'The Garden Cafe',
    address: ['123 Blossom Road', 'Singapore'],
    mapUrl: 'https://maps.google.com/?q=The+Garden+Cafe+123+Blossom+Road+Singapore',
  },
  registry: { text: 'Registered at\nBabyStore & LittleOnes', url: '' },
  rsvp: { deadline: '2026-11-01', maxGuests: 5, mode: 'whatsapp', whatsapp: '+65 9123 4567' },
  // theme / companions / labels all fall back to the template defaults (blue + blush)
});
