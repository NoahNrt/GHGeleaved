#!/usr/bin/env node
/**
 * Migrate WordPress wp_posts → Strapi /api/reviews.
 *
 * Usage:
 *   STRAPI_TOKEN=<full-access-token> npm run migrate:wp -- <path-to-dump.sql>
 *
 *   # Optional:
 *   #   STRAPI_URL    base URL of the Strapi server (default http://localhost:1337)
 *   #   DRY_RUN=1     parse and print summary, don't POST anything
 *
 * Generate the API token in Strapi admin:
 *   Settings → API Tokens → "Create new API Token"
 *   Token type: "Full access"
 *   Duration: 7 days is plenty for a migration
 *
 * What this does:
 *   1. Parses the WordPress SQL dump for wp_posts, wp_postmeta and wp_users.
 *   2. Filters to published custom-post-type rows (musik/buch/film/spiel).
 *   3. For each row, builds a Strapi-shaped payload:
 *        - title, slug, genre = post_type
 *        - excerpt, publishedAt
 *        - bodyHtml: WP HTML with [caption] shortcodes converted to <figure>
 *          and bare paragraphs wrapped in <p> (wpautop port)
 *        - coverUrl: external URL pulled from the _thumbnail_id attachment
 *        - authorName: unified label per AUTHOR_MAP
 *   4. POSTs to POST /api/reviews/import-published (custom action that creates
 *      AND publishes in one shot — Strapi 5's stock POST only makes drafts).
 *   5. Skips when a review with the same slug already exists. Re-runs safe.
 */

import { readFileSync } from 'node:fs';
import { argv, env, exit, stdout } from 'node:process';

// ─── CONFIG ─────────────────────────────────────────────────────────

const STRAPI_URL = (env.STRAPI_URL ?? 'http://localhost:1337').replace(/\/+$/, '');
const STRAPI_TOKEN = env.STRAPI_TOKEN;
const DRY_RUN = env.DRY_RUN === '1' || env.DRY_RUN === 'true';

/** Which WP `post_type` values are real reviews. Map 1:1 onto our Genre enum. */
const GENRES = new Set(['musik', 'buch', 'film', 'spiel']);

/** Unified author labels per project decision: "Autor, Redakteur, Admin". */
const AUTHOR_MAP = {
  1: 'Admin', // WP user "joanna" / display "roterdorn" — system / first admin
  2: 'Redakteur', // WP user "averan" / display "Joanna Müller-Lenz"
  3: 'Autor', // WP user "marcus" / display "Marcus Pohlmann"
};
const DEFAULT_AUTHOR = 'Redakteur';

// ─── ARG / ENV CHECK ─────────────────────────────────────────────────

const sqlPath = argv[2];
if (!sqlPath) {
  console.error('Usage: npm run migrate:wp -- <path/to/dorn_db.sql>');
  exit(1);
}
if (!DRY_RUN && !STRAPI_TOKEN) {
  console.error(
    'STRAPI_TOKEN environment variable required.\n' +
      'Generate one in Strapi admin → Settings → API Tokens → Full access.',
  );
  exit(1);
}

// ─── SQL PARSING ─────────────────────────────────────────────────────

/**
 * Parse one tuple body (the text between `(` and `)` of an INSERT row).
 * Returns the column values in order. SQL NULL → JS null; quoted strings →
 * decoded JS strings; numerics → JS numbers.
 */
function parseTuple(text) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    while (i < text.length && /\s/.test(text[i])) i++;
    if (i >= text.length) break;

    if (text[i] === "'") {
      // string literal
      i++;
      let v = '';
      while (i < text.length) {
        const c = text[i];
        if (c === '\\' && i + 1 < text.length) {
          const n = text[i + 1];
          if (n === 'n') v += '\n';
          else if (n === 'r') v += '\r';
          else if (n === 't') v += '\t';
          else if (n === '0') v += '\0';
          else if (n === 'Z') v += '\x1A';
          else v += n;
          i += 2;
        } else if (c === "'") {
          if (text[i + 1] === "'") {
            v += "'";
            i += 2;
          } else {
            i++;
            break;
          }
        } else {
          v += c;
          i++;
        }
      }
      out.push(v);
    } else if (text.slice(i, i + 4).toUpperCase() === 'NULL') {
      out.push(null);
      i += 4;
    } else {
      // numeric / unquoted literal up to next comma
      let v = '';
      while (i < text.length && text[i] !== ',') {
        v += text[i];
        i++;
      }
      const t = v.trim();
      out.push(/^-?\d+(\.\d+)?$/.test(t) ? Number(t) : t);
    }

    while (i < text.length && (text[i] === ',' || /\s/.test(text[i]))) i++;
  }
  return out;
}

/**
 * Parse all rows from `INSERT INTO \`<table>\` (cols) VALUES (...), (...), ...;`
 * Walks the SQL character-by-character to correctly track strings and parens,
 * so semicolons or parens inside values don't terminate the statement early.
 */
function parseTable(sql, table) {
  const rows = [];
  const headerRe = new RegExp(`INSERT INTO \`${table}\` \\(([^)]+)\\) VALUES`, 'g');
  let m;
  while ((m = headerRe.exec(sql)) !== null) {
    const cols = m[1].split(',').map((c) => c.trim().replace(/`/g, ''));
    let i = headerRe.lastIndex;
    let inString = false;
    let depth = 0;
    let tupleStart = -1;

    while (i < sql.length) {
      const c = sql[i];
      if (inString) {
        if (c === '\\') {
          i += 2;
        } else if (c === "'") {
          if (sql[i + 1] === "'") i += 2;
          else {
            inString = false;
            i++;
          }
        } else i++;
      } else {
        if (c === "'") {
          inString = true;
          i++;
        } else if (c === '(') {
          if (depth === 0) tupleStart = i + 1;
          depth++;
          i++;
        } else if (c === ')') {
          depth--;
          if (depth === 0 && tupleStart !== -1) {
            const values = parseTuple(sql.substring(tupleStart, i));
            const row = {};
            for (let j = 0; j < cols.length; j++) row[cols[j]] = values[j];
            rows.push(row);
            tupleStart = -1;
          }
          i++;
        } else if (c === ';' && depth === 0) {
          break;
        } else {
          i++;
        }
      }
    }
    headerRe.lastIndex = i;
  }
  return rows;
}

// ─── HTML CLEANUP ───────────────────────────────────────────────────

const NAMED_ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': ' ',
  '&ndash;': '–',
  '&mdash;': '—',
  '&hellip;': '…',
  '&laquo;': '«',
  '&raquo;': '»',
  '&bdquo;': '„',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&lsquo;': '‘',
  '&rsquo;': '’',
  '&Auml;': 'Ä',
  '&Ouml;': 'Ö',
  '&Uuml;': 'Ü',
  '&auml;': 'ä',
  '&ouml;': 'ö',
  '&uuml;': 'ü',
  '&szlig;': 'ß',
};

function decodeEntities(text) {
  if (!text) return text;
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&[a-zA-Z]+;/g, (m) => NAMED_ENTITIES[m] ?? m);
}

/** Convert `[caption …]<img …/> caption text[/caption]` → `<figure>…<figcaption>…</figcaption></figure>`. */
function convertCaptionShortcodes(html) {
  return html.replace(/\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/g, (_, inner) => {
    const imgMatch = inner.match(/(<img[^>]*\/?>)\s*([\s\S]*)$/);
    if (!imgMatch) return inner;
    const [, imgTag, caption] = imgMatch;
    const trimmed = caption.trim();
    return trimmed
      ? `<figure>${imgTag}<figcaption>${trimmed}</figcaption></figure>`
      : imgTag;
  });
}

/** Remove any remaining `[shortcode]…[/shortcode]` and self-closing `[shortcode]`. */
function stripOtherShortcodes(html) {
  return html
    .replace(/\[([a-zA-Z][a-zA-Z0-9_-]*)[^\]]*\]([\s\S]*?)\[\/\1\]/g, '$2')
    .replace(/\[[^\]]+\]/g, '');
}

/** Tags that should not be wrapped in `<p>` (they're already block-level). */
const BLOCK_TAG = /^<(h[1-6]|p|div|blockquote|ul|ol|li|pre|table|figure|hr|address|fieldset|form|noscript|aside|article|section|nav|header|footer|main)([\s>])/i;

/** WordPress wpautop port: wrap loose paragraphs in `<p>`. */
function wpautop(html) {
  const normalized = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const out = [];
  let buf = [];
  const flush = () => {
    if (buf.length > 0) {
      const text = buf.join(' ').trim();
      if (text) out.push(`<p>${text}</p>`);
      buf = [];
    }
  };
  for (const line of lines) {
    const t = line.trim();
    if (!t) flush();
    else if (BLOCK_TAG.test(t)) {
      flush();
      out.push(t);
    } else {
      buf.push(t);
    }
  }
  flush();
  return out.join('\n');
}

function cleanupWpContent(html) {
  if (!html) return '';
  let h = html;
  h = convertCaptionShortcodes(h);
  h = stripOtherShortcodes(h);
  h = wpautop(h);
  return h;
}

// ─── STRAPI API ─────────────────────────────────────────────────────

async function strapiRequest(path, init = {}) {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${STRAPI_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const summary = typeof body === 'object' ? JSON.stringify(body) : String(body);
    const err = new Error(`Strapi ${res.status} ${res.statusText}: ${summary}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

async function findReviewBySlug(slug) {
  const data = await strapiRequest(
    `/api/reviews?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[pageSize]=1`,
  );
  return data?.data?.[0] ?? null;
}

async function importPublished(payload) {
  return await strapiRequest('/api/reviews/import-published', {
    method: 'POST',
    body: JSON.stringify({ data: payload }),
  });
}

// ─── MAIN ───────────────────────────────────────────────────────────

function buildPayload(wp, postById, metaByPost) {
  const slug = wp.post_name;

  // Cover URL via _thumbnail_id → attachment.guid
  const meta = metaByPost.get(wp.ID) ?? {};
  const thumbId = meta._thumbnail_id ? Number(meta._thumbnail_id) : null;
  const attachment = thumbId ? postById.get(thumbId) : null;
  const coverUrl = attachment?.guid ?? null;

  // Build published date — WordPress GMT, convert to ISO
  const gmt = wp.post_date_gmt ?? wp.post_date;
  const publishedAt = gmt ? new Date(gmt.replace(' ', 'T') + 'Z').toISOString() : null;

  return {
    title: decodeEntities(wp.post_title || '').trim() || '(ohne Titel)',
    slug,
    genre: wp.post_type,
    excerpt: wp.post_excerpt ? decodeEntities(wp.post_excerpt).trim() : null,
    bodyHtml: cleanupWpContent(wp.post_content),
    coverUrl,
    authorName: AUTHOR_MAP[wp.post_author] ?? DEFAULT_AUTHOR,
    publishedAt,
  };
}

async function main() {
  stdout.write(`Reading ${sqlPath} ...\n`);
  const sql = readFileSync(sqlPath, 'utf8');

  stdout.write('Parsing wp_posts ...\n');
  const posts = parseTable(sql, 'wp_posts');
  stdout.write('Parsing wp_postmeta ...\n');
  const postMeta = parseTable(sql, 'wp_postmeta');

  stdout.write(`Found ${posts.length} posts, ${postMeta.length} postmeta rows\n`);

  const postById = new Map(posts.map((p) => [p.ID, p]));
  const metaByPost = new Map();
  for (const m of postMeta) {
    if (!metaByPost.has(m.post_id)) metaByPost.set(m.post_id, {});
    metaByPost.get(m.post_id)[m.meta_key] = m.meta_value;
  }

  const reviews = posts.filter(
    (p) => GENRES.has(p.post_type) && p.post_status === 'publish' && p.post_name,
  );

  const byGenre = reviews.reduce((acc, r) => {
    acc[r.post_type] = (acc[r.post_type] ?? 0) + 1;
    return acc;
  }, {});
  stdout.write(`\nReviews to migrate: ${reviews.length}\n`);
  for (const [g, n] of Object.entries(byGenre)) stdout.write(`  ${g.padEnd(6)} ${n}\n`);
  stdout.write('\n');

  if (DRY_RUN) {
    stdout.write('DRY_RUN — printing first 3 payloads:\n\n');
    for (const wp of reviews.slice(0, 3)) {
      const payload = buildPayload(wp, postById, metaByPost);
      stdout.write(JSON.stringify({ ...payload, bodyHtml: payload.bodyHtml.slice(0, 200) + '…' }, null, 2));
      stdout.write('\n\n');
    }
    return;
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;
  for (const wp of reviews) {
    const slug = wp.post_name;
    try {
      const existing = await findReviewBySlug(slug);
      if (existing) {
        stdout.write(`SKIP    ${wp.post_type.padEnd(5)} ${slug} (id=${existing.id})\n`);
        skipped++;
        continue;
      }

      const payload = buildPayload(wp, postById, metaByPost);
      const result = await importPublished(payload);
      stdout.write(`OK      ${wp.post_type.padEnd(5)} ${slug} (id=${result?.data?.id ?? '?'})\n`);
      created++;
    } catch (err) {
      stdout.write(`FAIL    ${wp.post_type?.padEnd(5) ?? '?    '} ${slug}: ${err.message}\n`);
      failed++;
    }
  }

  stdout.write(`\nDone. created=${created} skipped=${skipped} failed=${failed}\n`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  exit(1);
});
