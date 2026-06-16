/**
 * netlify/functions/sitemap.js
 *
 * Dynamic XML Sitemap generator for alzaydaninternational.com
 * ─────────────────────────────────────────────────────────────
 * • Fetches published blog slugs live from Firestore REST API
 * • Merges with all static routes
 * • Returns well-formed XML with correct priorities
 * • Cached at CDN for 1 hour (Cache-Control: s-maxage=3600)
 * • Falls back to static-only sitemap if Firestore is unreachable
 *
 * Invoked via Netlify redirect: GET /sitemap.xml → /.netlify/functions/sitemap
 */

const BASE_URL    = 'https://www.alzaydaninternational.com';
const PROJECT_ID  = 'al-zaydan-international';
const TODAY       = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// ── Static routes ─────────────────────────────────────────────────────────────
const STATIC_URLS = [
  { path: '/',           changefreq: 'weekly',  priority: '1.0', isLanding: true },
  { path: '/traffic-safety-equipment-uae', changefreq: 'monthly', priority: '0.9', isLanding: true },
  { path: '/road-safety-products-uae', changefreq: 'monthly', priority: '0.9', isLanding: true },
  { path: '/reflective-sheeting-uae', changefreq: 'monthly', priority: '0.9', isLanding: true },
  { path: '/packaging-materials-supplier-uae', changefreq: 'monthly', priority: '0.9', isLanding: true },
  { path: '/about',      changefreq: 'monthly', priority: '0.8' },
  { path: '/solutions',  changefreq: 'monthly', priority: '0.8' },
  { path: '/contact',    changefreq: 'monthly', priority: '0.8' },
  { path: '/rfq',        changefreq: 'monthly', priority: '0.8' },
  { path: '/categories', changefreq: 'weekly',  priority: '0.8' },
  { path: '/blog',       changefreq: 'weekly',  priority: '0.7' },
  { path: '/legal',      changefreq: 'yearly',  priority: '0.3' },
];

// ── Firestore REST query for published blogs ──────────────────────────────────
async function fetchPublishedBlogSlugs() {
  const url =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;

  const body = JSON.stringify({
    structuredQuery: {
      from: [{ collectionId: 'blogs' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'published' },
          op: 'EQUAL',
          value: { booleanValue: true },
        },
      },
      select: {
        fields: [
          { fieldPath: 'slug' },
          { fieldPath: 'updatedAt' },
          { fieldPath: 'publishedAt' },
        ],
      },
      // No orderBy here — sorts in memory below to avoid needing a composite index
    },
  });

  const apiKey = process.env.FIREBASE_API_KEY;
  const endpoint = apiKey ? `${url}?key=${apiKey}` : url;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(8000), // 8 s timeout
  });

  if (!res.ok) {
    throw new Error(`Firestore REST error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();

  // Parse and sort in memory (avoids needing a composite Firestore index)
  const entries = data
    .filter(item => item.document?.fields?.slug?.stringValue)
    .map(item => {
      const fields = item.document.fields;
      const slug   = fields.slug.stringValue;
      
      if (slug.length < 20 || /(-pri|-pro|-con|-ua|-sup)$/.test(slug)) {
        console.warn(`[sitemap] Warning: Suspiciously truncated slug detected: ${slug}`);
      }

      const rawDate =
        item.document.createTime ||
        fields.publishedAt?.stringValue ||
        TODAY;
      return { slug, lastmod: rawDate.split('T')[0] };
    });

  // Sort by lastmod descending
  entries.sort((a, b) => b.lastmod.localeCompare(a.lastmod));
  return entries;
}

// ── XML builder ───────────────────────────────────────────────────────────────
function buildUrlEntry({ loc, lastmod, changefreq, priority, isLanding }) {
  let imageTag = '';
  if (isLanding) {
    imageTag = `
    <image:image>
      <image:loc>https://www.alzaydaninternational.com/images/og-banner.jpg</image:loc>
      <image:title>Al Zaydan International — UAE B2B Industrial Supplies</image:title>
    </image:image>`;
  }
  return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageTag}
  </url>`;
}

function buildSitemap(blogEntries) {
  const staticEntries = STATIC_URLS.map(u =>
    buildUrlEntry({
      loc:        `${BASE_URL}${u.path}`,
      lastmod:    TODAY,
      changefreq: u.changefreq,
      priority:   u.priority,
      isLanding:  u.isLanding,
    })
  ).join('');

  const blogUrlEntries = blogEntries.map(b =>
    buildUrlEntry({
      loc:        `${BASE_URL}/blog/${b.slug}`,
      lastmod:    b.lastmod,
      changefreq: 'monthly',
      priority:   '0.6',
    })
  ).join('');

  const totalUrls = STATIC_URLS.length + blogEntries.length;

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Al Zaydan International FZE — Dynamic XML Sitemap -->
<!-- Generated: ${new Date().toISOString()} | Total URLs: ${totalUrls} -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- ── Static Pages ──────────────────────────────────────── -->${staticEntries}

  <!-- ── Blog Posts (Firestore-dynamic, priority 0.6) ──────── -->${blogUrlEntries || '\n  <!-- No published blog posts yet -->'}

</urlset>`;
}

// ── Netlify Function handler ──────────────────────────────────────────────────
export const handler = async () => {
  let blogEntries = [];

  try {
    blogEntries = await fetchPublishedBlogSlugs();
    console.log(`[sitemap] Fetched ${blogEntries.length} published blog(s) from Firestore`);
  } catch (err) {
    // Non-fatal: serve sitemap without blog entries rather than returning 500
    console.error('[sitemap] Firestore fetch failed, serving static-only sitemap:', err.message);
  }

  const xml = buildSitemap(blogEntries);

  return {
    statusCode: 200,
    headers: {
      'Content-Type':  'application/xml; charset=utf-8',
      // CDN caches for 1 hour, Netlify CDN respects s-maxage
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'X-Sitemap-Blogs': String(blogEntries.length),
    },
    body: xml,
  };
};
