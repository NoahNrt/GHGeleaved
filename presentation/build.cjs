/**
 * Generator for the Roter Dorn project presentation.
 *
 * Run:   node presentation/build.cjs
 * Out:   presentation/Roter-Dorn-Praesentation.pptx
 *
 * Visual identity: dark background mirrors the live site (bg-neutral-950).
 * Red accent `DC2626` is the only chromatic colour — everything else is
 * neutral grays and white. Georgia for headers (editorial feel suits a
 * review site), Calibri for body, Consolas for code.
 */

const pptxgen = require('pptxgenjs');
const path = require('path');

// ─── DESIGN TOKENS ────────────────────────────────────────────────

const COLOR = {
  bg: '0A0A0A',          // near-black canvas
  bgCard: '171717',      // card / panel background
  bgCode: '1A1A1A',      // code block background
  text: 'F5F5F5',        // primary text
  textMuted: 'A3A3A3',   // captions, subtle text
  border: '404040',      // subtle dividers
  accent: 'DC2626',      // brand red
  accentLight: 'F87171', // softer red for hover/highlight
  amber: 'F59E0B',       // for code keywords / star ratings
  green: '10B981',       // success / checkmarks
  codeKey: 'F87171',     // code keywords (in red family for cohesion)
  codeStr: 'FBBF24',     // code strings (amber)
  codeCmt: '737373',     // code comments (gray)
};

const FONT_HEAD = 'Georgia';
const FONT_BODY = 'Calibri';
const FONT_CODE = 'Consolas';

// Slide dimensions for LAYOUT_16x9 → 10" × 5.625"
const SLIDE_W = 10;
const SLIDE_H = 5.625;

// ─── HELPERS ──────────────────────────────────────────────────────

/** Dark background plus a left red sidebar that acts as a visual motif. */
function applyBaseStyle(slide, { sideBar = true } = {}) {
  slide.background = { color: COLOR.bg };
  if (sideBar) {
    slide.addShape('rect', {
      x: 0, y: 0, w: 0.08, h: SLIDE_H,
      fill: { color: COLOR.accent }, line: { color: COLOR.accent, width: 0 },
    });
  }
}

/** Tiny eyebrow label at top — section/category tag. */
function addEyebrow(slide, label) {
  slide.addText(label.toUpperCase(), {
    x: 0.5, y: 0.32, w: 9, h: 0.3,
    fontSize: 10, fontFace: FONT_BODY, bold: true, charSpacing: 6,
    color: COLOR.accent, align: 'left', margin: 0,
  });
}

/** Big slide title sitting below the eyebrow. */
function addTitle(slide, title) {
  slide.addText(title, {
    x: 0.5, y: 0.62, w: 9, h: 0.8,
    fontSize: 32, fontFace: FONT_HEAD, bold: true,
    color: COLOR.text, align: 'left', margin: 0,
  });
}

/** Small caption typically at the bottom of code/SQL slides. */
function addCaption(slide, text, opts = {}) {
  slide.addText(text, {
    x: 0.5, y: SLIDE_H - 0.55, w: 9, h: 0.35,
    fontSize: 12, fontFace: FONT_BODY, italic: true,
    color: COLOR.textMuted, align: 'left', margin: 0,
    ...opts,
  });
}

/**
 * Compose a code block from coloured runs. `lines` is an array of strings
 * (one per line) OR arrays of { text, color } runs. Comments get the muted
 * gray; keywords default to red; strings to amber.
 */
function addCodeBlock(slide, { x, y, w, h, lines, fontSize = 12 }) {
  // panel background
  slide.addShape('rect', {
    x, y, w, h,
    fill: { color: COLOR.bgCode },
    line: { color: COLOR.border, width: 0.5 },
  });

  const runs = [];
  lines.forEach((line, idx) => {
    if (typeof line === 'string') {
      runs.push({ text: line, options: { color: COLOR.text } });
    } else if (Array.isArray(line)) {
      for (const run of line) {
        runs.push({
          text: run.text,
          options: { color: run.color ?? COLOR.text, bold: run.bold ?? false },
        });
      }
    }
    if (idx < lines.length - 1) {
      runs[runs.length - 1].options = {
        ...(runs[runs.length - 1].options ?? {}),
        breakLine: true,
      };
    }
  });

  slide.addText(runs, {
    x: x + 0.2, y: y + 0.15, w: w - 0.4, h: h - 0.3,
    fontSize, fontFace: FONT_CODE,
    color: COLOR.text, align: 'left', valign: 'top', margin: 0,
    paraSpaceAfter: 0,
  });
}

/** Colour-coded code line. `tokens` = array of { t (text), c (color key) }. */
function codeLine(...tokens) {
  return tokens.map(({ t, c }) => ({ text: t, color: c ?? COLOR.text }));
}
const K = COLOR.codeKey;
const S = COLOR.codeStr;
const C = COLOR.codeCmt;
const T = COLOR.text;
const N = COLOR.amber;

// ─── PRESENTATION ─────────────────────────────────────────────────

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.title = 'Roter Dorn — Projektpräsentation';
pres.author = 'Michael Brauns';
pres.subject = 'Berufsschulprojekt: Nachbau von roterdorn.de mit Angular und Strapi';

// ─── SLIDE 1: TITLE ───────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLOR.bg };

  // Large diamond glyph as the brand motif
  s.addText('❖', {
    x: 0, y: 0.9, w: SLIDE_W, h: 1.0,
    fontSize: 64, fontFace: FONT_HEAD, color: COLOR.accent,
    align: 'center', valign: 'middle', margin: 0,
  });

  s.addText('ROTER DORN', {
    x: 0, y: 1.9, w: SLIDE_W, h: 1.0,
    fontSize: 60, fontFace: FONT_HEAD, bold: true,
    color: COLOR.text, align: 'center', valign: 'middle',
    charSpacing: 12, margin: 0,
  });

  s.addText('Reviews zu Büchern, Filmen, Musik und Spielen', {
    x: 0, y: 2.9, w: SLIDE_W, h: 0.5,
    fontSize: 18, fontFace: FONT_HEAD, italic: true,
    color: COLOR.textMuted, align: 'center', valign: 'middle', margin: 0,
  });

  // Accent divider
  s.addShape('rect', {
    x: SLIDE_W / 2 - 0.6, y: 3.6, w: 1.2, h: 0.04,
    fill: { color: COLOR.accent }, line: { color: COLOR.accent, width: 0 },
  });

  s.addText('Berufsschulprojekt · Nachbau einer Medienplattform', {
    x: 0, y: 3.75, w: SLIDE_W, h: 0.4,
    fontSize: 14, fontFace: FONT_BODY,
    color: COLOR.text, align: 'center', margin: 0,
  });

  s.addText('Angular  ·  Strapi  ·  SQLite  ·  Tailwind CSS', {
    x: 0, y: 4.15, w: SLIDE_W, h: 0.4,
    fontSize: 13, fontFace: FONT_BODY,
    color: COLOR.accent, align: 'center', charSpacing: 4, margin: 0,
  });

  s.addText('Michael Brauns  ·  Mai 2026', {
    x: 0, y: SLIDE_H - 0.6, w: SLIDE_W, h: 0.4,
    fontSize: 11, fontFace: FONT_BODY,
    color: COLOR.textMuted, align: 'center', margin: 0,
  });
}

// ─── SLIDE 2: PROJEKTÜBERBLICK ────────────────────────────────────
{
  const s = pres.addSlide();
  applyBaseStyle(s);
  addEyebrow(s, 'Projekt');
  addTitle(s, 'Was wir gebaut haben');

  // Left column — bullet list
  s.addText(
    [
      { text: 'Vorlage: ', options: { bold: true, color: COLOR.text } },
      { text: 'roterdorn.de — Online-Medienportal', options: { color: COLOR.text, breakLine: true } },
      { text: ' ', options: { breakLine: true, fontSize: 6 } },
      { text: 'Reviews aus vier Bereichen:', options: { color: COLOR.textMuted, breakLine: true } },
      { text: '❖ ', options: { color: COLOR.accent } },
      { text: 'Bücher  ·  ', options: { color: COLOR.text } },
      { text: '❖ ', options: { color: COLOR.accent } },
      { text: 'Filme  ·  ', options: { color: COLOR.text } },
      { text: '❖ ', options: { color: COLOR.accent } },
      { text: 'Musik  ·  ', options: { color: COLOR.text } },
      { text: '❖ ', options: { color: COLOR.accent } },
      { text: 'Spiele', options: { color: COLOR.text, breakLine: true } },
      { text: ' ', options: { breakLine: true, fontSize: 6 } },
      { text: 'Detailseiten mit Coverbild, Sterne-Bewertung,', options: { color: COLOR.text, breakLine: true } },
      { text: 'Autor und Veröffentlichungsdatum.', options: { color: COLOR.text, breakLine: true } },
      { text: ' ', options: { breakLine: true, fontSize: 6 } },
      { text: 'Anonyme Kommentare ', options: { color: COLOR.text } },
      { text: 'mit Moderation durch die Redaktion.', options: { color: COLOR.text, breakLine: true } },
      { text: ' ', options: { breakLine: true, fontSize: 6 } },
      { text: 'Server-Side Rendering ', options: { color: COLOR.text } },
      { text: 'für schnelle Erstanzeige und SEO.', options: { color: COLOR.text } },
    ],
    {
      x: 0.5, y: 1.7, w: 5.2, h: 3.5,
      fontSize: 16, fontFace: FONT_BODY,
      color: COLOR.text, valign: 'top', margin: 0, paraSpaceAfter: 4,
    },
  );

  // Right column — three stacked "review card" mockups
  const cardX = 6.0;
  const cardW = 3.4;
  const genres = [
    { tag: 'BUCH',  title: 'Drei Minuten Gehör',                    rating: '★ ★ ★ ★ ☆' },
    { tag: 'MUSIK', title: 'Faszination Weltraum',                   rating: '★ ★ ★ ★ ★' },
    { tag: 'SPIEL', title: 'Terra Mystica',                          rating: '★ ★ ★ ★ ☆' },
  ];
  genres.forEach((g, i) => {
    const y = 1.7 + i * 1.18;
    s.addShape('rect', {
      x: cardX, y, w: cardW, h: 1.05,
      fill: { color: COLOR.bgCard },
      line: { color: COLOR.border, width: 0.5 },
    });
    s.addText(g.tag, {
      x: cardX + 0.2, y: y + 0.12, w: 1.5, h: 0.3,
      fontSize: 10, fontFace: FONT_BODY, bold: true, charSpacing: 4,
      color: COLOR.accent, align: 'left', margin: 0,
    });
    s.addText(g.rating, {
      x: cardX + cardW - 1.5, y: y + 0.12, w: 1.3, h: 0.3,
      fontSize: 11, fontFace: FONT_BODY, color: COLOR.amber, align: 'right', margin: 0,
    });
    s.addText(g.title, {
      x: cardX + 0.2, y: y + 0.45, w: cardW - 0.4, h: 0.5,
      fontSize: 15, fontFace: FONT_HEAD, bold: true,
      color: COLOR.text, align: 'left', margin: 0,
    });
  });
}

// ─── SLIDE 3: ARCHITEKTUR ─────────────────────────────────────────
{
  const s = pres.addSlide();
  applyBaseStyle(s);
  addEyebrow(s, 'Architektur');
  addTitle(s, 'Die drei Bausteine');

  const colW = 2.8;
  const gap = 0.25;
  const startX = (SLIDE_W - (colW * 3 + gap * 2)) / 2;
  const cols = [
    {
      label: 'Frontend',
      title: 'Angular 20',
      desc: 'TypeScript, Standalone Components, SSR, Tailwind CSS',
    },
    {
      label: 'Backend',
      title: 'Strapi 5',
      desc: 'Headless CMS, REST/GraphQL API, Admin-Panel, Berechtigungen',
    },
    {
      label: 'Datenbank',
      title: 'SQLite',
      desc: 'Dateibasiert, kein eigener Server, perfekt für Entwicklung',
    },
  ];

  cols.forEach((col, i) => {
    const x = startX + i * (colW + gap);
    const y = 1.9;
    s.addShape('rect', {
      x, y, w: colW, h: 2.6,
      fill: { color: COLOR.bgCard },
      line: { color: COLOR.border, width: 0.5 },
    });
    s.addText(col.label.toUpperCase(), {
      x: x + 0.25, y: y + 0.25, w: colW - 0.5, h: 0.3,
      fontSize: 10, fontFace: FONT_BODY, bold: true, charSpacing: 4,
      color: COLOR.accent, align: 'left', margin: 0,
    });
    s.addText(col.title, {
      x: x + 0.25, y: y + 0.6, w: colW - 0.5, h: 0.6,
      fontSize: 22, fontFace: FONT_HEAD, bold: true,
      color: COLOR.text, align: 'left', margin: 0,
    });
    s.addText(col.desc, {
      x: x + 0.25, y: y + 1.3, w: colW - 0.5, h: 1.2,
      fontSize: 13, fontFace: FONT_BODY,
      color: COLOR.textMuted, align: 'left', valign: 'top', margin: 0,
    });
  });

  // Two arrows between the three columns
  const arrowY = 3.05;
  for (let i = 0; i < 2; i++) {
    const ax = startX + colW + i * (colW + gap) - gap + 0.02;
    s.addText('→', {
      x: ax, y: arrowY - 0.2, w: gap - 0.04, h: 0.4,
      fontSize: 22, fontFace: FONT_BODY, bold: true,
      color: COLOR.accent, align: 'center', valign: 'middle', margin: 0,
    });
  }

  s.addText('HTTP REST  ·  JSON  ·  unidirektionaler Datenfluss vom Backend nach vorne', {
    x: 0.5, y: 4.8, w: 9, h: 0.4,
    fontSize: 12, fontFace: FONT_BODY, italic: true,
    color: COLOR.textMuted, align: 'center', margin: 0,
  });
}

// ─── SLIDE 4: WARUM ANGULAR? ──────────────────────────────────────
{
  const s = pres.addSlide();
  applyBaseStyle(s);
  addEyebrow(s, 'Frontend');
  addTitle(s, 'Warum Angular?');

  const items = [
    {
      head: 'TypeScript',
      body: 'Tippfehler werden zur Compile-Zeit erkannt — nicht erst, wenn der Nutzer auf der Seite ist.',
    },
    {
      head: 'Komponenten + Signals',
      body: 'Aktuelles Reactive-Pattern. UI-Stücke sind wiederverwendbar, der Daten-Fluss ist explizit.',
    },
    {
      head: 'Server-Side Rendering eingebaut',
      body: 'Crawler und Erstanzeige bekommen fertiges HTML — wichtig für SEO und Performance.',
    },
    {
      head: 'Großes Ökosystem',
      body: 'Reactive Forms, RxJS, Tailwind, Angular Material — alles spielt zusammen ohne Glue-Code.',
    },
  ];

  const cardW = 4.4;
  const cardH = 1.5;
  const gapX = 0.2;
  const gapY = 0.2;
  const startX = (SLIDE_W - (cardW * 2 + gapX)) / 2;
  const startY = 1.7;
  items.forEach((it, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);
    s.addShape('rect', {
      x, y, w: cardW, h: cardH,
      fill: { color: COLOR.bgCard },
      line: { color: COLOR.border, width: 0.5 },
    });
    s.addShape('rect', {
      x, y, w: 0.06, h: cardH,
      fill: { color: COLOR.accent }, line: { color: COLOR.accent, width: 0 },
    });
    s.addText(it.head, {
      x: x + 0.3, y: y + 0.18, w: cardW - 0.5, h: 0.4,
      fontSize: 17, fontFace: FONT_HEAD, bold: true,
      color: COLOR.text, align: 'left', margin: 0,
    });
    s.addText(it.body, {
      x: x + 0.3, y: y + 0.6, w: cardW - 0.5, h: 0.8,
      fontSize: 13, fontFace: FONT_BODY,
      color: COLOR.textMuted, align: 'left', valign: 'top', margin: 0,
    });
  });
}

// ─── SLIDE 5: WARUM STRAPI? ───────────────────────────────────────
{
  const s = pres.addSlide();
  applyBaseStyle(s);
  addEyebrow(s, 'Backend');
  addTitle(s, 'Warum Strapi?');

  const items = [
    {
      head: 'Headless CMS',
      body: 'Frontend frei wählbar — wir nutzen Angular, könnte auch React oder eine mobile App sein.',
    },
    {
      head: 'Schemas per JSON-Datei',
      body: 'Content Types liegen als Datei im Git — Schema-Änderungen sind reviewbar und versionierbar.',
    },
    {
      head: 'Admin-Panel inklusive',
      body: 'Die Redaktion schreibt Reviews mit Editor, Bildupload, Vorschau — ohne eine Zeile Code.',
    },
    {
      head: 'REST + GraphQL automatisch',
      body: 'Aus dem Schema generiert Strapi sofort CRUD-Endpoints inkl. Filter, Sortierung, Paginierung.',
    },
  ];

  const cardW = 4.4;
  const cardH = 1.5;
  const gapX = 0.2;
  const gapY = 0.2;
  const startX = (SLIDE_W - (cardW * 2 + gapX)) / 2;
  const startY = 1.7;
  items.forEach((it, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);
    s.addShape('rect', {
      x, y, w: cardW, h: cardH,
      fill: { color: COLOR.bgCard },
      line: { color: COLOR.border, width: 0.5 },
    });
    s.addShape('rect', {
      x, y, w: 0.06, h: cardH,
      fill: { color: COLOR.accent }, line: { color: COLOR.accent, width: 0 },
    });
    s.addText(it.head, {
      x: x + 0.3, y: y + 0.18, w: cardW - 0.5, h: 0.4,
      fontSize: 17, fontFace: FONT_HEAD, bold: true,
      color: COLOR.text, align: 'left', margin: 0,
    });
    s.addText(it.body, {
      x: x + 0.3, y: y + 0.6, w: cardW - 0.5, h: 0.8,
      fontSize: 13, fontFace: FONT_BODY,
      color: COLOR.textMuted, align: 'left', valign: 'top', margin: 0,
    });
  });
}

// ─── SLIDE 6: DATENMODELL ─────────────────────────────────────────
{
  const s = pres.addSlide();
  applyBaseStyle(s);
  addEyebrow(s, 'Datenmodell');
  addTitle(s, 'Zwei Content Types');

  const fieldHead = (text) => ({
    text,
    options: {
      bold: true, color: COLOR.text, fill: { color: COLOR.bgCard },
      align: 'left', valign: 'middle', fontSize: 13, fontFace: FONT_BODY,
    },
  });
  const cell = (text, opts = {}) => ({
    text,
    options: {
      color: COLOR.text, fill: { color: COLOR.bgCode },
      align: 'left', valign: 'middle', fontSize: 12, fontFace: FONT_BODY, ...opts,
    },
  });

  const reviewRows = [
    [fieldHead('Feld'), fieldHead('Typ')],
    [cell('title'),         cell('string')],
    [cell('slug'),          cell('uid (aus title)')],
    [cell('genre'),         cell('buch | film | musik | spiel')],
    [cell('cover'),         cell('media')],
    [cell('body'),          cell('blocks (Rich Text)')],
    [cell('rating'),        cell('integer 1–5')],
    [cell('authorName'),    cell('string')],
    [cell('publishedAt'),   cell('datetime')],
  ];
  const commentRows = [
    [fieldHead('Feld'), fieldHead('Typ')],
    [cell('body'),         cell('text')],
    [cell('authorName'),   cell('string')],
    [cell('authorEmail'),  cell('email (optional)')],
    [cell('approved'),     cell('boolean — default: false', { color: COLOR.accentLight, bold: true })],
    [cell('review'),       cell('relation → Review')],
  ];

  // Left header
  s.addText('Review', {
    x: 0.5, y: 1.7, w: 4.4, h: 0.4,
    fontSize: 18, fontFace: FONT_HEAD, bold: true, color: COLOR.text, margin: 0,
  });
  s.addTable(reviewRows, {
    x: 0.5, y: 2.15, w: 4.4, h: 2.7,
    border: { type: 'solid', color: COLOR.border, pt: 0.5 },
    rowH: 0.34, colW: [1.7, 2.7],
  });

  // Right header
  s.addText('Comment', {
    x: 5.1, y: 1.7, w: 4.4, h: 0.4,
    fontSize: 18, fontFace: FONT_HEAD, bold: true, color: COLOR.text, margin: 0,
  });
  s.addTable(commentRows, {
    x: 5.1, y: 2.15, w: 4.4, h: 2.04,
    border: { type: 'solid', color: COLOR.border, pt: 0.5 },
    rowH: 0.34, colW: [1.7, 2.7],
  });

  addCaption(s, '`approved: false` als Default sorgt dafür, dass Kommentare erst nach Freigabe öffentlich erscheinen.');
}

// ─── SLIDE 7: CODE — FRONTEND SERVICE ─────────────────────────────
{
  const s = pres.addSlide();
  applyBaseStyle(s);
  addEyebrow(s, 'Code · Frontend');
  addTitle(s, 'Reviews aus dem Backend holen');

  addCodeBlock(s, {
    x: 0.5, y: 1.65, w: 9.0, h: 3.3, fontSize: 11,
    lines: [
      codeLine({ t: '@Injectable', c: K }, { t: '({ providedIn: ', c: T }, { t: "'root'", c: S }, { t: ' })', c: T }),
      codeLine({ t: 'export class', c: K }, { t: ' ReviewService {', c: T }),
      codeLine({ t: '  private readonly', c: K }, { t: ' http = ', c: T }, { t: 'inject', c: K }, { t: '(HttpClient);', c: T }),
      codeLine({ t: '  private readonly', c: K }, { t: ' strapi = ', c: T }, { t: 'inject', c: K }, { t: '(StrapiService);', c: T }),
      codeLine({ t: '', c: T }),
      codeLine({ t: '  ', c: T }, { t: 'getLatest', c: N }, { t: '(limit = ', c: T }, { t: '12', c: N }, { t: '): Observable<Review[]> {', c: T }),
      codeLine({ t: '    const', c: K }, { t: ' url = ', c: T }, { t: 'this', c: K }, { t: '.strapi.', c: T }, { t: 'apiUrl', c: N }, { t: "('/reviews', {", c: S }),
      codeLine({ t: "      'populate'", c: S }, { t: ': ', c: T }, { t: "'cover'", c: S }, { t: ',', c: T }),
      codeLine({ t: "      'sort'", c: S }, { t: ': ', c: T }, { t: "'publishedAt:desc'", c: S }, { t: ',', c: T }),
      codeLine({ t: "      'pagination[pageSize]'", c: S }, { t: ': limit,', c: T }),
      codeLine({ t: '    });', c: T }),
      codeLine({ t: '    return this', c: K }, { t: '.http.', c: T }, { t: 'get', c: N }, { t: '<StrapiCollectionResponse<Review>>(url)', c: T }),
      codeLine({ t: '      .', c: T }, { t: 'pipe', c: N }, { t: '(', c: T }, { t: 'map', c: N }, { t: '((res) => res.data));', c: T }),
      codeLine({ t: '  }', c: T }),
      codeLine({ t: '}', c: T }),
    ],
  });

  addCaption(s, 'Typsicher dank TypeScript — die IDE warnt, wenn ein Feld umbenannt wird, das im Frontend genutzt wird.');
}

// ─── SLIDE 8: CODE — BACKEND MODERATION ───────────────────────────
{
  const s = pres.addSlide();
  applyBaseStyle(s);
  addEyebrow(s, 'Code · Backend');
  addTitle(s, 'Kommentare automatisch moderieren');

  addCodeBlock(s, {
    x: 0.5, y: 1.65, w: 9.0, h: 3.3, fontSize: 11,
    lines: [
      codeLine({ t: '// In api/comment/controllers/comment.ts:', c: C }),
      codeLine({ t: 'async', c: K }, { t: ' ', c: T }, { t: 'create', c: N }, { t: '(ctx) {', c: T }),
      codeLine({ t: '  const', c: K }, { t: ' data = ctx.request.body?.data ?? {};', c: T }),
      codeLine({ t: '', c: T }),
      codeLine({ t: '  ', c: T }, { t: '// Whitelist + erzwinge approved = false', c: C }),
      codeLine({ t: '  ctx.request.body = {', c: T }),
      codeLine({ t: '    data: {', c: T }),
      codeLine({ t: '      body: data.body,', c: T }),
      codeLine({ t: '      authorName: data.authorName,', c: T }),
      codeLine({ t: '      authorEmail: data.authorEmail,', c: T }),
      codeLine({ t: '      review: data.review,', c: T }),
      codeLine([{ text: '      approved: ', color: T }, { text: 'false', color: COLOR.accentLight, bold: true }, { text: ',  // immer false, egal was der Client schickt', color: C }]),
      codeLine({ t: '    },', c: T }),
      codeLine({ t: '  };', c: T }),
      codeLine({ t: '  return await super', c: K }, { t: '.', c: T }, { t: 'create', c: N }, { t: '(ctx);', c: T }),
      codeLine({ t: '}', c: T }),
    ],
  });

  addCaption(s, 'Auch wenn ein böswilliger Client `approved: true` mitsendet — der Server schreibt zwingend `false` rein.');
}

// ─── SLIDE 9: SQL ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  applyBaseStyle(s);
  addEyebrow(s, 'Datenbank');
  addTitle(s, 'Was Strapi unter der Haube ausführt');

  addCodeBlock(s, {
    x: 0.5, y: 1.65, w: 9.0, h: 3.0, fontSize: 12,
    lines: [
      codeLine({ t: '-- HTTP: GET /api/reviews?populate=cover&sort=publishedAt:desc&limit=4', c: C }),
      codeLine({ t: '', c: T }),
      codeLine({ t: 'SELECT', c: K }, { t: ' r.id, r.title, r.slug, r.genre, r.rating, r.published_at,', c: T }),
      codeLine({ t: '       f.url ', c: T }, { t: 'AS', c: K }, { t: ' cover_url', c: T }),
      codeLine({ t: 'FROM', c: K }, { t: ' reviews r', c: T }),
      codeLine({ t: 'LEFT JOIN', c: K }, { t: ' files_related_morphs frm', c: T }),
      codeLine({ t: '       ', c: T }, { t: 'ON', c: K }, { t: ' frm.related_id = r.id', c: T }),
      codeLine({ t: '      ', c: T }, { t: 'AND', c: K }, { t: " frm.related_type = 'api::review.review'", c: S }),
      codeLine({ t: 'LEFT JOIN', c: K }, { t: ' files f ', c: T }, { t: 'ON', c: K }, { t: ' f.id = frm.file_id', c: T }),
      codeLine({ t: 'WHERE', c: K }, { t: ' r.published_at ', c: T }, { t: 'IS NOT NULL', c: K }),
      codeLine({ t: 'ORDER BY', c: K }, { t: ' r.published_at ', c: T }, { t: 'DESC', c: K }),
      codeLine({ t: 'LIMIT', c: K }, { t: ' ', c: T }, { t: '4', c: N }, { t: ';', c: T }),
    ],
  });

  addCaption(s, 'Aus einem HTTP-Aufruf macht Strapi automatisch ein parametriertes SQL — mit JOIN zur Media-Tabelle für das Cover.');
}

// ─── SLIDE 10: MIGRATION ──────────────────────────────────────────
{
  const s = pres.addSlide();
  applyBaseStyle(s);
  addEyebrow(s, 'Migration');
  addTitle(s, '171 Reviews aus WordPress importieren');

  // Left: numbers / stats
  const stats = [
    { num: '171',     label: 'migrierte Reviews' },
    { num: '108',     label: 'Spiele · 30 Bücher · 25 Musik · 8 Filme' },
    { num: '~ 30 s',  label: 'Laufzeit für den gesamten Import' },
    { num: '✓',       label: 'idempotent — mehrfaches Ausführen sicher' },
  ];
  stats.forEach((stat, i) => {
    const y = 1.85 + i * 0.75;
    s.addText(stat.num, {
      x: 0.5, y, w: 1.4, h: 0.55,
      fontSize: 28, fontFace: FONT_HEAD, bold: true,
      color: COLOR.accent, align: 'right', valign: 'middle', margin: 0,
    });
    s.addText(stat.label, {
      x: 1.95, y, w: 3.2, h: 0.55,
      fontSize: 13, fontFace: FONT_BODY,
      color: COLOR.text, align: 'left', valign: 'middle', margin: 0,
    });
  });

  // Right: code snippet of the parser
  addCodeBlock(s, {
    x: 5.3, y: 1.7, w: 4.2, h: 3.2, fontSize: 11,
    lines: [
      codeLine({ t: '// 1. SQL-Tupel parsen (string-aware)', c: C }),
      codeLine({ t: 'function', c: K }, { t: ' ', c: T }, { t: 'parseTuple', c: N }, { t: '(text) { …', c: T }),
      codeLine({ t: '', c: T }),
      codeLine({ t: '// 2. Captions → <figure>', c: C }),
      codeLine({ t: 'html.', c: T }, { t: 'replace', c: N }, { t: '(/\\[caption[^\\]]*\\]/g,', c: S }),
      codeLine({ t: '             ', c: T }, { t: "'<figure>'", c: S }, { t: ');', c: T }),
      codeLine({ t: '', c: T }),
      codeLine({ t: '// 3. wpautop — lose Absätze in <p>', c: C }),
      codeLine({ t: 'function', c: K }, { t: ' ', c: T }, { t: 'wpautop', c: N }, { t: '(html) { …', c: T }),
      codeLine({ t: '', c: T }),
      codeLine({ t: '// 4. Cover via _thumbnail_id', c: C }),
      codeLine({ t: '//    → attachment.guid', c: C }),
      codeLine({ t: '', c: T }),
      codeLine({ t: '// 5. POST /reviews/import-published', c: C }),
    ],
  });

  addCaption(s, 'Eigener SQL-Parser + WordPress-Cleanup, weil HTML-Bodies Shortcodes und proprietäre Strukturen enthalten.');
}

// ─── SLIDE 11: FAZIT ──────────────────────────────────────────────
{
  const s = pres.addSlide();
  applyBaseStyle(s);
  addEyebrow(s, 'Fazit');
  addTitle(s, 'Was steht — und was ich gelernt habe');

  // Left: delivered features
  s.addText('Funktioniert:', {
    x: 0.5, y: 1.7, w: 4.4, h: 0.4,
    fontSize: 16, fontFace: FONT_HEAD, bold: true,
    color: COLOR.text, margin: 0,
  });
  const done = [
    'Dunkles, responsives Frontend',
    'Vier Genre-Listen + Detailseiten',
    'Moderierte Kommentare',
    'Server-Side Rendering + SEO-Tags',
    'Loading-Skeletons + 404-Page',
    '171 Reviews aus WordPress migriert',
  ];
  s.addText(
    done.flatMap((d, i) => [
      { text: '✓ ', options: { color: COLOR.green, bold: true } },
      { text: d, options: { color: COLOR.text, breakLine: i < done.length - 1 } },
    ]),
    {
      x: 0.5, y: 2.15, w: 4.4, h: 2.8,
      fontSize: 14, fontFace: FONT_BODY, valign: 'top', margin: 0, paraSpaceAfter: 6,
    },
  );

  // Right: learnings
  s.addText('Mitgenommen:', {
    x: 5.1, y: 1.7, w: 4.4, h: 0.4,
    fontSize: 16, fontFace: FONT_HEAD, bold: true,
    color: COLOR.text, margin: 0,
  });
  const learnings = [
    'Headless CMS = saubere Trennung von Inhalt und Darstellung',
    'TypeScript spart auf Dauer mehr Zeit als es kostet',
    'SSR + Hydration ist subtiler als gedacht',
    'Migrationen brauchen einen robusten Parser, nicht nur Regex',
    'Schemas in Git verwalten ist sehr wertvoll',
  ];
  s.addText(
    learnings.flatMap((l, i) => [
      { text: '❖ ', options: { color: COLOR.accent } },
      { text: l, options: { color: COLOR.text, breakLine: i < learnings.length - 1 } },
    ]),
    {
      x: 5.1, y: 2.15, w: 4.4, h: 2.8,
      fontSize: 13, fontFace: FONT_BODY, valign: 'top', margin: 0, paraSpaceAfter: 6,
    },
  );

  // Bottom: Q&A invite
  s.addShape('rect', {
    x: SLIDE_W / 2 - 0.8, y: SLIDE_H - 0.7, w: 1.6, h: 0.04,
    fill: { color: COLOR.accent }, line: { color: COLOR.accent, width: 0 },
  });
  s.addText('Fragen?', {
    x: 0, y: SLIDE_H - 0.55, w: SLIDE_W, h: 0.45,
    fontSize: 22, fontFace: FONT_HEAD, italic: true,
    color: COLOR.text, align: 'center', valign: 'middle', margin: 0,
  });
}

// ─── WRITE ────────────────────────────────────────────────────────

const outPath = path.join(__dirname, 'Roter-Dorn-Praesentation.pptx');
pres
  .writeFile({ fileName: outPath })
  .then(() => console.log('Geschrieben:', outPath))
  .catch((err) => {
    console.error('Fehler:', err);
    process.exit(1);
  });
