/*
 * Baby Shower Invitation – illustration library.
 *
 * Every function returns an SVG string. Colours come from CSS custom
 * properties on the invitation root (see invite.css), so each mounted
 * invitation can have its own palette. Every gradient/mask id is prefixed with
 * the instance id `u`, so several invitations can live in one document.
 */
(function (global) {
  'use strict';

  function rng(seed) {
    let a = seed | 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  const NS = 'xmlns="http://www.w3.org/2000/svg"';
  const n = (v) => Math.round(v * 10) / 10;

  /* ------------------------------------------------------------------ bear */

  function bearDefs(u) {
    return `
    <radialGradient id="${u}-fur" cx="38%" cy="28%" r="85%">
      <stop offset="0" stop-color="#ebbd86"/><stop offset=".55" stop-color="#d7a066"/><stop offset="1" stop-color="#bd8350"/>
    </radialGradient>
    <radialGradient id="${u}-cream" cx="40%" cy="30%" r="80%">
      <stop offset="0" stop-color="#fbeed6"/><stop offset="1" stop-color="#efd2a6"/>
    </radialGradient>`;
  }

  const FUR = (u) => `fill="url(#${u}-fur)"`;
  const CREAM = (u) => `fill="url(#${u}-cream)"`;

  function foot(u, cx, flip) {
    const s = flip ? -1 : 1;
    return `<g transform="translate(${cx} 318) scale(${s} 1)">
      <ellipse rx="44" ry="33" transform="rotate(-10)" ${FUR(u)}/>
      <ellipse cx="2" cy="4" rx="25" ry="19" transform="rotate(-10)" ${CREAM(u)}/>
      <circle cx="-17" cy="-17" r="7" ${CREAM(u)}/><circle cx="0" cy="-23" r="7.5" ${CREAM(u)}/><circle cx="17" cy="-20" r="7" ${CREAM(u)}/>
    </g>`;
  }

  /** Bear drawn in a 300x340 box. pose: 'sit' | 'float' (adds hold + wave arms). */
  function bearParts(u, pose) {
    const arms =
      pose === 'float'
        ? `
      <g transform="translate(228 214)" class="bi-arm bi-arm-hold">
        <ellipse cx="11" cy="-60" rx="25" ry="64" transform="rotate(10 11 -60)" ${FUR(u)}/>
        <circle cx="21" cy="-118" r="13" ${CREAM(u)}/>
      </g>
      <g transform="translate(228 214)" class="bi-arm bi-arm-wave-wrap">
        <g class="bi-wave">
          <ellipse cx="25" cy="-44" rx="25" ry="56" transform="rotate(30 25 -44)" ${FUR(u)}/>
          <circle cx="51" cy="-90" r="14" ${CREAM(u)}/>
        </g>
      </g>`
        : `
      <ellipse cx="236" cy="262" rx="24" ry="44" transform="rotate(-22 236 262)" ${FUR(u)}/>`;
    return `
    <circle cx="78" cy="64" r="35" ${FUR(u)}/><circle cx="80" cy="67" r="19" fill="#e9b58b"/>
    <circle cx="222" cy="64" r="35" ${FUR(u)}/><circle cx="220" cy="67" r="19" fill="#e9b58b"/>
    <ellipse cx="150" cy="248" rx="82" ry="88" ${FUR(u)}/>
    <ellipse cx="150" cy="262" rx="55" ry="58" ${CREAM(u)}/>
    ${foot(u, 86, false)}${foot(u, 214, true)}
    <ellipse cx="64" cy="262" rx="24" ry="44" transform="rotate(22 64 262)" ${FUR(u)}/>
    ${arms}
    <ellipse cx="150" cy="112" rx="94" ry="83" ${FUR(u)}/>
    <ellipse cx="150" cy="140" rx="42" ry="32" ${CREAM(u)}/>
    <g class="bi-eyes">
      <circle cx="111" cy="102" r="10.5" fill="#2e1b12"/><circle cx="115" cy="98" r="3.6" fill="#fff"/><circle cx="108" cy="106" r="1.8" fill="#fff" opacity=".8"/>
      <circle cx="189" cy="102" r="10.5" fill="#2e1b12"/><circle cx="193" cy="98" r="3.6" fill="#fff"/><circle cx="186" cy="106" r="1.8" fill="#fff" opacity=".8"/>
    </g>
    <ellipse cx="88" cy="130" rx="16" ry="10" fill="#f39aa3" opacity=".42"/>
    <ellipse cx="212" cy="130" rx="16" ry="10" fill="#f39aa3" opacity=".42"/>
    <path d="M137 121 Q150 113 163 121 Q161 134 150 138 Q139 134 137 121Z" fill="#5a3925"/>
    <ellipse cx="146" cy="120" rx="5" ry="2.2" fill="#fff" opacity=".45"/>
    <path d="M150 138 V146" stroke="#5a3925" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M133 146 Q150 172 167 146 Q150 152 133 146Z" fill="#7b3a2e"/>
    <ellipse cx="150" cy="156" rx="7.5" ry="4.5" fill="#ee8f97"/>
    <path d="M133 146 Q150 152 167 146" stroke="#5a3925" stroke-width="3" stroke-linecap="round" fill="none"/>
    <g class="bi-bowtie">
      <path d="M150 198 L108 176 Q98 198 108 220Z" style="fill:var(--bowtie)"/>
      <path d="M150 198 L192 176 Q202 198 192 220Z" style="fill:var(--bowtie)"/>
      <path d="M150 198 L108 176 Q98 198 108 220Z M150 198 L192 176 Q202 198 192 220Z" fill="#000" opacity=".08"/>
      <path d="M118 184 Q112 198 118 212 M182 184 Q188 198 182 212" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".45"/>
      <rect x="138" y="184" width="24" height="28" rx="9" style="fill:var(--bowtie)"/>
      <rect x="138" y="184" width="24" height="28" rx="9" fill="#000" opacity=".1"/>
      <path d="M143 190 Q150 187 157 190" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".55"/>
    </g>`;
  }

  function bear(u, o) {
    o = o || {};
    return `<svg ${NS} class="${o.cls || ''}" viewBox="${o.view || '0 0 300 340'}" aria-hidden="true" focusable="false">
      <defs>${bearDefs(u)}</defs>${bearParts(u, 'sit')}</svg>`;
  }

  /** Head + paws that rest on the top edge of the RSVP card. */
  function bearPeek(u, o) {
    o = o || {};
    return `<svg ${NS} class="${o.cls || ''}" viewBox="0 0 300 236" aria-hidden="true" focusable="false">
      <defs>${bearDefs(u)}</defs>
      <ellipse cx="150" cy="238" rx="100" ry="56" ${FUR(u)}/>
      <circle cx="78" cy="64" r="35" ${FUR(u)}/><circle cx="80" cy="67" r="19" fill="#e9b58b"/>
      <circle cx="222" cy="64" r="35" ${FUR(u)}/><circle cx="220" cy="67" r="19" fill="#e9b58b"/>
      <ellipse cx="150" cy="112" rx="94" ry="83" ${FUR(u)}/>
      <ellipse cx="150" cy="140" rx="42" ry="32" ${CREAM(u)}/>
      <g class="bi-eyes">
        <circle cx="111" cy="102" r="10.5" fill="#2e1b12"/><circle cx="115" cy="98" r="3.6" fill="#fff"/><circle cx="108" cy="106" r="1.8" fill="#fff" opacity=".8"/>
        <circle cx="189" cy="102" r="10.5" fill="#2e1b12"/><circle cx="193" cy="98" r="3.6" fill="#fff"/><circle cx="186" cy="106" r="1.8" fill="#fff" opacity=".8"/>
      </g>
      <ellipse cx="88" cy="130" rx="16" ry="10" fill="#f39aa3" opacity=".42"/>
      <ellipse cx="212" cy="130" rx="16" ry="10" fill="#f39aa3" opacity=".42"/>
      <path d="M137 121 Q150 113 163 121 Q161 134 150 138 Q139 134 137 121Z" fill="#5a3925"/>
      <ellipse cx="146" cy="120" rx="5" ry="2.2" fill="#fff" opacity=".45"/>
      <path d="M150 138 V146" stroke="#5a3925" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path d="M133 146 Q150 172 167 146 Q150 152 133 146Z" fill="#7b3a2e"/>
      <ellipse cx="150" cy="156" rx="7.5" ry="4.5" fill="#ee8f97"/>
      <path d="M133 146 Q150 152 167 146" stroke="#5a3925" stroke-width="3" stroke-linecap="round" fill="none"/>
      <g class="bi-peek-paws">
        <ellipse cx="86" cy="226" rx="30" ry="22" ${FUR(u)}/><ellipse cx="214" cy="226" rx="30" ry="22" ${FUR(u)}/>
        <circle cx="76" cy="222" r="5" ${CREAM(u)}/><circle cx="88" cy="218" r="5" ${CREAM(u)}/><circle cx="100" cy="222" r="5" ${CREAM(u)}/>
        <circle cx="200" cy="222" r="5" ${CREAM(u)}/><circle cx="212" cy="218" r="5" ${CREAM(u)}/><circle cx="224" cy="222" r="5" ${CREAM(u)}/>
      </g>
    </svg>`;
  }

  /* -------------------------------------------------------------- balloons */

  function balloonPath(rx, ry) {
    return `M0 ${-ry} C${n(rx)} ${-ry} ${n(rx * 1.12)} ${n(ry * 0.62)} 0 ${ry} C${n(-rx * 1.12)} ${n(ry * 0.62)} ${n(-rx)} ${-ry} 0 ${-ry}Z`;
  }

  /**
   * The full floating scene: balloons + teddy, one 420x800 SVG so the strings
   * always meet the paw. The balloon group is released after landing.
   */
  function floater(u) {
    const P = [308, 424]; // where the strings are gathered
    const H = [309, 520]; // paw
    const B = [
      { x: 232, y: 150, rx: 56, ry: 68, c: 'b2', r: -4, d: 0, gold: true },
      { x: 158, y: 222, rx: 49, ry: 61, c: 'b1', r: -12, d: 0.6 },
      { x: 306, y: 218, rx: 50, ry: 62, c: 'b3', r: 9, d: 1.1 },
      { x: 238, y: 262, rx: 47, ry: 59, c: 'b4', r: 2, d: 1.7, gold: true },
      { x: 352, y: 150, rx: 42, ry: 53, c: 'b1', r: 12, d: 0.3 },
      { x: 104, y: 160, rx: 38, ry: 48, c: 'b3', r: -10, d: 1.4 },
      { x: 302, y: 86, rx: 40, ry: 50, c: 'b4', r: 6, d: 0.9, gold: true },
    ];
    const grads = ['b1', 'b2', 'b3', 'b4']
      .map(
        (c) => `<radialGradient id="${u}-${c}" cx="36%" cy="30%" r="82%">
        <stop offset="0" style="stop-color:color-mix(in srgb,var(--${c}),#fff 62%)"/>
        <stop offset=".5" style="stop-color:var(--${c})"/>
        <stop offset="1" style="stop-color:color-mix(in srgb,var(--${c}),#7a4a3a 14%)"/>
      </radialGradient>`
      )
      .join('');
    const strings = B.map((b) => {
      const kx = b.x,
        ky = b.y + b.ry + 8;
      const cx = (kx + P[0]) / 2 + (kx < P[0] ? -6 : 6);
      const cy = (ky + P[1]) / 2 + 22;
      return `<path d="M${kx} ${ky} Q${n(cx)} ${n(cy)} ${P[0]} ${P[1]}" />`;
    }).join('');
    const balloons = B.map(
      (b) => `<g transform="translate(${b.x} ${b.y}) rotate(${b.r})"><g class="bi-balloon" style="animation-delay:-${b.d}s">
        <path d="${balloonPath(b.rx, b.ry)}" fill="url(#${u}-${b.c})"/>
        <path d="M-6 ${b.ry + 9} L0 ${b.ry - 2} L6 ${b.ry + 9}Z" style="fill:color-mix(in srgb,var(--${b.c}),#7a4a3a 18%)"/>
        <ellipse cx="${n(-b.rx * 0.38)}" cy="${n(-b.ry * 0.42)}" rx="${n(b.rx * 0.17)}" ry="${n(b.ry * 0.3)}" transform="rotate(24 ${n(-b.rx * 0.38)} ${n(-b.ry * 0.42)})" fill="#fff" opacity=".6"/>
        ${
          b.gold
            ? `<g fill="#d9b36b" opacity=".75"><circle cx="${n(b.rx * 0.2)}" cy="${n(-b.ry * 0.1)}" r="2"/><circle cx="${n(b.rx * 0.5)}" cy="${n(b.ry * 0.25)}" r="1.6"/><circle cx="${n(-b.rx * 0.2)}" cy="${n(b.ry * 0.35)}" r="2.2"/><circle cx="${n(-b.rx * 0.5)}" cy="${n(b.ry * 0.05)}" r="1.5"/><circle cx="${n(b.rx * 0.05)}" cy="${n(-b.ry * 0.6)}" r="1.5"/></g>`
            : ''
        }
      </g></g>`
    ).join('');
    return `<svg ${NS} class="bi-floater" viewBox="0 0 420 800" aria-hidden="true" focusable="false">
      <defs>${bearDefs(u)}${grads}</defs>
      <g class="bi-balloons">
        <g class="bi-strings" fill="none" stroke="#c9ad8c" stroke-width="1.6" stroke-linecap="round">${strings}
          <path d="M${P[0]} ${P[1]} Q${P[0] + 6} ${(P[1] + H[1]) / 2} ${H[0]} ${H[1]}" stroke-width="2.2"/></g>
        ${balloons}
        <g transform="translate(${P[0]} ${P[1]})">
          <path d="M0 0 C-30 -22 -46 -2 -34 12 C-26 22 -8 12 0 0Z M0 0 C30 -22 46 -2 34 12 C26 22 8 12 0 0Z" style="fill:var(--ribbon)"/>
          <path d="M0 0 C-18 -4 -30 6 -24 10 M0 0 C18 -4 30 6 24 10" stroke="#fff" stroke-width="2" opacity=".5" fill="none"/>
          <path d="M-2 4 L-14 34 L-4 30 L0 40 L4 8Z M2 4 L16 32 L6 29 L2 38Z" style="fill:var(--ribbon)"/>
          <circle r="7" style="fill:var(--ribbon)"/><circle r="7" fill="#000" opacity=".1"/>
        </g>
      </g>
      <g transform="translate(60 430)">${bearParts(u, 'float')}</g>
    </svg>`;
  }

  /* ---------------------------------------------------------------- clouds */

  function cloudDefs(u) {
    return `<linearGradient id="${u}-cl" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff"/><stop offset=".62" stop-color="#fff4ea"/><stop offset="1" style="stop-color:var(--cloud-shade)"/>
      </linearGradient>
      <linearGradient id="${u}-cl2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color:var(--cloud-shade)"/><stop offset="1" style="stop-color:var(--cloud-deep)"/>
      </linearGradient>`;
  }

  /** A single fluffy cloud (viewBox 400x150). */
  function cloud(u, o) {
    o = o || {};
    return `<svg ${NS} class="${o.cls || ''}" viewBox="0 0 400 150" aria-hidden="true" focusable="false">
      <defs>${cloudDefs(u)}</defs>
      <g fill="url(#${u}-cl)">
        <circle cx="76" cy="98" r="48"/><circle cx="142" cy="68" r="60"/><circle cx="226" cy="58" r="68"/>
        <circle cx="304" cy="82" r="56"/><circle cx="352" cy="108" r="40"/>
        <rect x="40" y="96" width="340" height="52" rx="26"/>
      </g>
      <g fill="#fff" opacity=".7"><circle cx="150" cy="52" r="34"/><circle cx="232" cy="44" r="38"/><circle cx="296" cy="66" r="26"/></g>
    </svg>`;
  }

  /** A wide bank of clouds that fills a strip along the bottom (viewBox w x h). */
  function cloudBank(u, o) {
    o = o || {};
    const w = 900,
      h = o.h || 300,
      r = rng(o.seed || 7);
    let back = '',
      front = '';
    const step = o.step || 90;
    for (let x = -20; x < w + 60; x += step * (0.7 + r() * 0.5)) {
      const rad = (o.min || 46) + r() * (o.var || 44);
      back += `<circle cx="${n(x)}" cy="${n(h * 0.38 + r() * h * 0.2)}" r="${n(rad * 1.12)}"/>`;
    }
    for (let x = 10; x < w + 60; x += step * (0.65 + r() * 0.5)) {
      const rad = (o.min || 46) + r() * (o.var || 44);
      front += `<circle cx="${n(x)}" cy="${n(h * 0.55 + r() * h * 0.18)}" r="${n(rad)}"/>`;
    }
    return `<svg ${NS} class="${o.cls || ''}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="${u}-bk1" gradientUnits="userSpaceOnUse" x1="0" y1="${h * 0.25}" x2="0" y2="${h}">
          <stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#fff5ec"/><stop offset="1" style="stop-color:var(--cloud-shade)"/>
        </linearGradient>
        <linearGradient id="${u}-bk2" gradientUnits="userSpaceOnUse" x1="0" y1="${h * 0.15}" x2="0" y2="${h}">
          <stop offset="0" style="stop-color:color-mix(in srgb,var(--cloud-shade),#fff 30%)"/><stop offset="1" style="stop-color:var(--cloud-deep)"/>
        </linearGradient>
      </defs>
      <g fill="url(#${u}-bk2)">${back}<rect x="0" y="${h * 0.5}" width="${w}" height="${h * 0.6}"/></g>
      <g fill="url(#${u}-bk1)">${front}<rect x="0" y="${h * 0.7}" width="${w}" height="${h * 0.4}"/></g>
    </svg>`;
  }

  /* ----------------------------------------------------------- sky details */

  function star(u, o) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? 22 : 50;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      pts.push(n(60 + Math.cos(a) * rad) + ' ' + n(60 + Math.sin(a) * rad));
    }
    return `<svg ${NS} class="${(o && o.cls) || ''}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs><linearGradient id="${u}-st" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b3"/><stop offset=".55" stop-color="#f2c862"/><stop offset="1" stop-color="#d9a33f"/></linearGradient></defs>
      <path d="M${pts.join('L')}Z" fill="url(#${u}-st)" stroke="#f9dd8d" stroke-width="9" stroke-linejoin="round"/>
      <path d="M${pts.join('L')}Z" fill="url(#${u}-st)" stroke="url(#${u}-st)" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="46" cy="44" rx="9" ry="5" fill="#fff" opacity=".6" transform="rotate(-35 46 44)"/>
    </svg>`;
  }

  function moon(u) {
    return `<svg ${NS} viewBox="0 0 140 160" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="${u}-mn" cx="30%" cy="30%" r="90%"><stop offset="0" stop-color="#fffbe8"/><stop offset=".6" stop-color="#fbe9b8"/><stop offset="1" stop-color="#f1d28e"/></radialGradient>
        <mask id="${u}-mk"><rect width="140" height="160" fill="#fff"/><circle cx="92" cy="62" r="56" fill="#000"/></mask>
      </defs>
      <circle cx="62" cy="82" r="62" fill="url(#${u}-mn)" mask="url(#${u}-mk)"/>
    </svg>`;
  }

  function castle(u) {
    const roof = (x, w, h, y) => `<path d="M${x - 4} ${y} L${x + w / 2} ${y - h} L${x + w + 4} ${y}Z" style="fill:var(--castle-roof)"/>`;
    const win = (x, y) => `<path d="M${x - 4} ${y + 12} V${y} a4 4 0 0 1 8 0 V${y + 12}Z" fill="#f4cf84"/>`;
    return `<svg ${NS} viewBox="0 0 340 300" aria-hidden="true" focusable="false">
      <defs><linearGradient id="${u}-ca" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fffaf1"/><stop offset=".7" stop-color="#f6e4e4"/><stop offset="1" stop-color="#e5d3e6"/></linearGradient></defs>
      <g fill="url(#${u}-ca)">
        <rect x="128" y="120" width="86" height="170"/><rect x="62" y="150" width="54" height="140"/><rect x="226" y="140" width="56" height="150"/>
        <rect x="20" y="190" width="38" height="100"/><rect x="290" y="176" width="36" height="114"/><rect x="104" y="196" width="130" height="94"/>
      </g>
      ${roof(130, 82, 78, 120)}${roof(62, 54, 64, 150)}${roof(226, 56, 66, 140)}${roof(20, 38, 54, 190)}${roof(290, 36, 52, 176)}
      <g>${win(170, 150)}${win(189, 150)}${win(86, 184)}${win(250, 176)}${win(38, 220)}${win(308, 210)}${win(170, 226)}</g>
      <path d="M171 120 V92 M171 92 l16 6 -16 6" stroke="#d9a33f" stroke-width="2" fill="#f19aa8"/>
      <rect x="156" y="250" width="30" height="40" rx="15" fill="#f1d9a3" opacity=".9"/>
    </svg>`;
  }

  /* --------------------------------------------------------------- flowers */

  function flowerDefs(u) {
    return `
    <linearGradient id="${u}-pw" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:var(--petal-white-core)"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
    <linearGradient id="${u}-pp" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:var(--petal-core)"/><stop offset="1" style="stop-color:var(--petal)"/></linearGradient>
    <linearGradient id="${u}-pb" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:var(--petal-alt-core)"/><stop offset="1" style="stop-color:var(--petal-alt)"/></linearGradient>`;
  }

  function flower(u, x, y, s, kind, rot, petals) {
    petals = petals || 5;
    const fill = `url(#${u}-${kind})`;
    let p = '';
    for (let i = 0; i < petals; i++) {
      p += `<ellipse cx="0" cy="${n(-s * 0.56)}" rx="${n(s * 0.44)}" ry="${n(s * 0.62)}" transform="rotate(${n((360 / petals) * i)})" fill="${fill}"/>`;
    }
    return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)})">
      <g opacity=".14" fill="#8a5a4a" transform="translate(1.2 2)">${p.replace(/fill="[^"]+"/g, '')}</g>
      <g stroke="#e8c7c7" stroke-opacity=".5" stroke-width=".6">${p}</g>
      <circle r="${n(s * 0.2)}" fill="#f0c25e"/><circle r="${n(s * 0.2)}" fill="url(#${u}-pw)" opacity=".18"/>
      <g fill="#c8892f"><circle cx="${n(-s * 0.07)}" cy="${n(-s * 0.05)}" r="${n(s * 0.03)}"/><circle cx="${n(s * 0.08)}" cy="${n(s * 0.02)}" r="${n(s * 0.03)}"/><circle cx="${n(-s * 0.01)}" cy="${n(s * 0.09)}" r="${n(s * 0.03)}"/></g>
    </g>`;
  }

  function leaf(x, y, s, rot, alt) {
    return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)})"><path d="M0 0 C${n(s * 0.3)} ${n(-s * 0.32)} ${n(s * 0.8)} ${n(-s * 0.3)} ${n(s)} 0 C${n(s * 0.8)} ${n(s * 0.3)} ${n(s * 0.3)} ${n(s * 0.32)} 0 0Z" style="fill:var(${alt ? '--leaf-2' : '--leaf'})"/><path d="M${n(s * 0.08)} 0 H${n(s * 0.84)}" stroke="#fff" stroke-opacity=".35" stroke-width="1"/></g>`;
  }

  /** A vertical vine of flowers (viewBox 120x800); flip with CSS for the right side. */
  function garland(u, o) {
    o = o || {};
    const r = rng(o.seed || 1);
    const W = 120,
      H = 800;
    const vineX = (y) => 30 + Math.sin(y / 120 + (o.phase || 0)) * 14;
    let vine = `M${vineX(0)} -10`;
    for (let y = 0; y <= H + 20; y += 20) vine += ` L${n(vineX(y))} ${y}`;
    let leaves = '',
      blooms = '',
      dots = '';
    for (let y = 10; y < H; y += 26 + r() * 20) {
      const side = r() > 0.5 ? 1 : -1;
      leaves += leaf(vineX(y), y, 26 + r() * 18, side > 0 ? -20 + r() * 40 : 160 + r() * 40, r() > 0.5);
    }
    const kinds = ['pw', 'pw', 'pp', 'pb', 'pw', 'pp'];
    // big blooms near the ends, smaller towards the middle
    const slots = [30, 95, 160, 250, 330, 410, 500, 585, 650, 715, 775];
    slots.forEach((y, i) => {
      const edge = Math.min(y, H - y) / 400;
      const size = 17 + (1 - Math.min(1, edge * 1.6)) * 12 + r() * 6;
      const x = vineX(y) + (r() - 0.35) * 40;
      blooms += flower(u, x, y + (r() - 0.5) * 14, size, kinds[(i + (o.seed || 0)) % kinds.length], r() * 72, 5 + (r() > 0.75 ? 1 : 0));
    });
    for (let i = 0; i < 18; i++) {
      const y = r() * H;
      dots += `<circle cx="${n(vineX(y) + (r() - 0.2) * 56)}" cy="${n(y)}" r="${n(2 + r() * 3)}" style="fill:var(${r() > 0.5 ? '--petal-alt' : '--petal'})"/>`;
    }
    return `<svg ${NS} class="${o.cls || ''}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" style="overflow:visible">
      <defs>${flowerDefs(u)}</defs>
      <path d="${vine}" fill="none" style="stroke:var(--leaf-2)" stroke-width="2.4" stroke-linejoin="round"/>
      ${leaves}${dots}${blooms}
    </svg>`;
  }

  /** Small bouquet used on the corners of the "You're Invited" sign. */
  function sprig(u, o) {
    o = o || {};
    return `<svg ${NS} class="${o.cls || ''}" viewBox="0 0 120 90" aria-hidden="true" focusable="false">
      <defs>${flowerDefs(u)}</defs>
      ${leaf(18, 70, 40, -30)}${leaf(40, 78, 36, -8, true)}${leaf(8, 56, 30, -70, true)}${leaf(70, 74, 34, 10)}
      ${flower(u, 34, 56, 18, 'pw', 10)}${flower(u, 64, 62, 14, 'pp', 40)}${flower(u, 18, 36, 12, 'pb', 0)}
    </svg>`;
  }

  /* ----------------------------------------------------------- companions */

  function bunny(u, o) {
    return `<svg ${NS} class="${(o && o.cls) || ''}" viewBox="0 0 150 200" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="${u}-bn" cx="40%" cy="30%" r="85%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f1e1d6"/></radialGradient>
      </defs>
      <g class="bi-bunny-ear"><ellipse cx="52" cy="40" rx="17" ry="40" transform="rotate(-8 52 40)" fill="url(#${u}-bn)"/><ellipse cx="53" cy="44" rx="8" ry="28" transform="rotate(-8 53 44)" fill="#f5b9c1"/></g>
      <g class="bi-bunny-ear bi-bunny-ear-r"><ellipse cx="100" cy="42" rx="17" ry="40" transform="rotate(10 100 42)" fill="url(#${u}-bn)"/><ellipse cx="99" cy="46" rx="8" ry="28" transform="rotate(10 99 46)" fill="#f5b9c1"/></g>
      <ellipse cx="76" cy="158" rx="50" ry="40" fill="url(#${u}-bn)"/>
      <circle cx="126" cy="170" r="14" fill="#fff"/>
      <ellipse cx="76" cy="104" rx="46" ry="40" fill="url(#${u}-bn)"/>
      <ellipse cx="46" cy="190" rx="22" ry="11" fill="url(#${u}-bn)"/><ellipse cx="106" cy="190" rx="22" ry="11" fill="url(#${u}-bn)"/>
      <circle cx="58" cy="100" r="5.2" fill="#2e1b12"/><circle cx="60" cy="98" r="1.8" fill="#fff"/>
      <circle cx="94" cy="100" r="5.2" fill="#2e1b12"/><circle cx="96" cy="98" r="1.8" fill="#fff"/>
      <ellipse cx="44" cy="114" rx="9" ry="6" fill="#f5a8b0" opacity=".55"/><ellipse cx="108" cy="114" rx="9" ry="6" fill="#f5a8b0" opacity=".55"/>
      <path d="M71 111 Q76 107 81 111 Q79 116 76 117 Q73 116 71 111Z" fill="#e88f9b"/>
      <path d="M76 117 Q76 123 70 124 M76 117 Q76 123 82 124" stroke="#b9776f" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="60" cy="150" rx="11" ry="16" fill="url(#${u}-bn)" transform="rotate(14 60 150)"/><ellipse cx="94" cy="150" rx="11" ry="16" fill="url(#${u}-bn)" transform="rotate(-14 94 150)"/>
    </svg>`;
  }

  function lantern(u, o) {
    return `<svg ${NS} class="${(o && o.cls) || ''}" viewBox="0 0 80 140" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="${u}-lt" cx="50%" cy="55%" r="60%"><stop offset="0" stop-color="#fffbe0"/><stop offset=".55" stop-color="#ffe49a"/><stop offset="1" stop-color="#f5bd5a"/></radialGradient>
      </defs>
      <path d="M28 18 Q40 -2 52 18" stroke="#b98f58" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="22" y="18" width="36" height="9" rx="4" fill="#c9a266"/>
      <path d="M26 27 H54 L60 112 Q40 122 20 112Z" fill="url(#${u}-lt)" class="bi-lantern-glass"/>
      <path d="M40 27 V116 M30 27 L27 114 M50 27 L53 114" stroke="#b98f58" stroke-width="1.6" opacity=".7" fill="none"/>
      <rect x="18" y="110" width="44" height="10" rx="5" fill="#c9a266"/>
    </svg>`;
  }

  /* ----------------------------------------------------------------- misc */

  function bow(u) {
    return `<svg ${NS} viewBox="0 0 220 110" aria-hidden="true" focusable="false">
      <defs><linearGradient id="${u}-rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(--ribbon),#fff 40%)"/><stop offset="1" style="stop-color:var(--ribbon)"/></linearGradient></defs>
      <path d="M110 56 C70 6 14 8 12 44 C10 78 70 82 110 56Z" fill="url(#${u}-rb)"/>
      <path d="M110 56 C150 6 206 8 208 44 C210 78 150 82 110 56Z" fill="url(#${u}-rb)"/>
      <path d="M100 56 C70 26 40 22 28 38 M120 56 C150 26 180 22 192 38" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M104 62 L74 106 L92 100 L98 108 L116 66Z M116 62 L148 104 L130 99 L124 108 L106 66Z" fill="url(#${u}-rb)"/>
      <rect x="94" y="38" width="32" height="34" rx="12" fill="url(#${u}-rb)"/><rect x="94" y="38" width="32" height="34" rx="12" fill="#000" opacity=".07"/>
      <path d="M102 46 Q110 42 118 46" stroke="#fff" stroke-opacity=".6" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  const stroke = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
  const icons = {
    calendar: `<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/><path d="M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 17h.01M12 17h.01" stroke-width="2.2"/>`,
    pin: `<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10" r="2.4"/>`,
    gift: `<rect x="4" y="9.5" width="16" height="10.5" rx="1.8"/><path d="M3 6.5h18v3H3zM12 6.5V20"/><path d="M12 6.5C10 2.5 6 3.5 7 5.5c.6 1.1 3 1 5 1zM12 6.5c2-4 6-3 5-1-.6 1.1-3 1-5 1z"/>`,
    user: `<circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6"/>`,
    check: `<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12.2l2.7 2.7L16.2 9"/>`,
    users: `<circle cx="9" cy="9" r="3.1"/><path d="M3.2 19c.6-3.3 2.8-5 5.8-5s5.2 1.7 5.8 5"/><circle cx="17" cy="9.6" r="2.5"/><path d="M16.4 14.2c2.6-.1 4.2 1.3 4.7 4.2"/>`,
    chat: `<path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16.5h-7l-4.5 3.5v-3.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5z"/><path d="M8 10h.01M12 10h.01M16 10h.01" stroke-width="2.2"/>`,
    chevron: `<path d="M9 5l7 7-7 7"/>`,
    down: `<path d="M6 9l6 6 6-6"/>`,
    replay: `<path d="M4.5 12a7.5 7.5 0 1 0 2.6-5.7"/><path d="M4 4.5v4.2h4.2"/>`,
    heart: `<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z" fill="currentColor" stroke="none"/>`,
    cal2: `<path d="M12 5v14M5 12h14"/>`,
  };
  function icon(name, cls) {
    return `<svg ${NS} class="${cls || 'bi-icon'}" viewBox="0 0 24 24" ${stroke} aria-hidden="true" focusable="false">${icons[name]}</svg>`;
  }

  global.BabyInviteArt = {
    rng, hash, bear, bearPeek, floater, cloud, cloudBank, star, moon, castle,
    garland, sprig, bunny, lantern, bow, icon,
  };
})(typeof window !== 'undefined' ? window : globalThis);
