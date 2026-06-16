#!/usr/bin/env node
/**
 * prerender.cjs  — Build-time Static Pre-render for Al Zaydan International
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs AFTER `vite build` (in the `postbuild` script).
 * Reads `src/data/initialState.json` and generates a static `.html` file for
 * every product page and every key static page inside `dist/`.
 *
 * When Netlify serves these files, Googlebot and Screaming Frog see full HTML
 * content directly — without executing any JavaScript.
 *
 * Generated files:
 *   dist/product/[id]/index.html   — one per product
 *   dist/about/index.html
 *   dist/contact/index.html
 *   dist/rfq/index.html
 *   dist/blog/index.html
 *   dist/search/index.html
 *   dist/solutions/index.html
 *   dist/traffic-safety-equipment-uae/index.html
 *   dist/road-safety-products-uae/index.html
 *   dist/reflective-sheeting-uae/index.html
 *   dist/packaging-materials-supplier-uae/index.html
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Paths ────────────────────────────────────────────────────────────────────
const ROOT         = path.join(__dirname, '..');
const DIST         = path.join(ROOT, 'dist');
const INITIAL_DATA = path.join(ROOT, 'src', 'data', 'initialState.json');

// ── Load data ─────────────────────────────────────────────────────────────────
const data       = JSON.parse(fs.readFileSync(INITIAL_DATA, 'utf-8'));
const products   = (data.products  || []);
const categories = (data.categories && data.categories.list) ? data.categories.list : [];
const settings   = data.settings || {};

// ── Read the Vite-built index.html template ───────────────────────────────────
const templateHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf-8');

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

function slug(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Patch the built index.html template with page-specific SEO fields
 * and inject a static content block visible to crawlers inside <body>.
 */
function buildPage({ title, description, canonical, ogTitle, ogDesc, bodyHtml, schemaJson }) {
  let html = templateHtml;

  // 1. Title
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${esc(title)}</title>`
  );

  // 2. Meta description (first occurrence)
  html = html.replace(
    /<meta name="description"[^>]*\/>/,
    `<meta name="description" content="${esc(description)}" />`
  );

  // 3. Canonical
  html = html.replace(
    /<link rel="canonical"[^>]*\/>/,
    `<link rel="canonical" href="${esc(canonical)}" />`
  );

  // 4. OG title / description
  if (ogTitle) {
    html = html.replace(
      /<meta property="og:title"[^>]*\/>/,
      `<meta property="og:title" content="${esc(ogTitle)}" />`
    );
  }
  if (ogDesc) {
    html = html.replace(
      /<meta property="og:description"[^>]*\/>/,
      `<meta property="og:description" content="${esc(ogDesc)}" />`
    );
  }

  // 5. Inject page-specific JSON-LD schema (if any)
  if (schemaJson) {
    html = html.replace(
      '</head>',
      `<script type="application/ld+json">${JSON.stringify(schemaJson)}</script>\n</head>`
    );
  }

  // 6. Inject static crawlable content immediately before </body>
  //    (outside #root so React never touches it, but crawlers read it)
  const crawlBlock = `
  <!-- PRE-RENDERED SEO CONTENT — visible to crawlers, hidden from users -->
  <div id="prerender-content" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;" aria-hidden="true">
${bodyHtml}
  </div>`;

  html = html.replace('</body>', crawlBlock + '\n</body>');

  return html;
}

// ── Category navigation snippet (reused on every page) ───────────────────────
const categoryNavHtml = `
    <nav aria-label="Product categories">
      <h3>Browse by Category</h3>
      <ul>
${categories.map(c => `        <li><a href="/search?category=${encodeURIComponent(c)}">${esc(c)} — Industrial Supplies UAE</a></li>`).join('\n')}
      </ul>
    </nav>
    <nav aria-label="Site pages">
      <a href="/">Home</a> |
      <a href="/about">About Us</a> |
      <a href="/solutions">Solutions</a> |
      <a href="/contact">Contact</a> |
      <a href="/rfq">Request a Quote</a> |
      <a href="/blog">Blog</a> |
      <a href="/search">All Products</a>
    </nav>`;

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT PAGES  — dist/product/[id]/index.html
// ═══════════════════════════════════════════════════════════════════════════════
console.log(`\n🏗  Pre-rendering ${products.length} product pages…`);
let productCount = 0;

for (const p of products) {
  if (!p.id) continue;

  const productTitle = `${esc(p.name)} — ${esc(p.category || 'Industrial Supply')} | Al Zaydan International UAE`;
  const productDesc  = p.description
    ? esc(p.description.slice(0, 155)) + (p.description.length > 155 ? '…' : '')
    : `Buy ${esc(p.name)} in UAE. B2B wholesale industrial supply from Al Zaydan International. Request a quote today.`;

  const canonicalUrl = `https://www.alzaydaninternational.com/product/${encodeURIComponent(p.id)}`;

  // Specification rows
  const specsHtml = (p.specifications && p.specifications.length > 0)
    ? `<table>
        <thead><tr><th>Specification</th><th>Value</th></tr></thead>
        <tbody>
          ${p.specifications.map(s => `<tr><td>${esc(s.key)}</td><td>${esc(s.value)}</td></tr>`).join('\n          ')}
        </tbody>
      </table>`
    : '';

  // Related products in same category (up to 5)
  const related = products
    .filter(r => r.id !== p.id && r.category === p.category)
    .slice(0, 5);

  const relatedHtml = related.length > 0
    ? `<h3>Related Products in ${esc(p.category)}</h3>
      <ul>
        ${related.map(r => `<li><a href="/product/${encodeURIComponent(r.id)}">${esc(r.name)}</a></li>`).join('\n        ')}
      </ul>`
    : '';

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description || `${p.name} — industrial supply available in UAE`,
    image: p.image ? [p.image] : undefined,
    brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
    category: p.category,
    offers: {
      '@type': 'Offer',
      availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      priceCurrency: 'AED',
      seller: { '@type': 'Organization', name: 'Al Zaydan International FZE' },
    },
  };

  const bodyHtml = `
    <h1>${esc(p.name)}</h1>
    <p>Category: <a href="/search?category=${encodeURIComponent(p.category || '')}">${esc(p.category)}</a></p>
    ${p.description ? `<p>${esc(p.description)}</p>` : ''}
    ${p.brand ? `<p>Brand: ${esc(p.brand)}</p>` : ''}
    <p>Availability: ${p.inStock ? 'In Stock' : 'Out of Stock'}</p>
    ${specsHtml}
    ${relatedHtml}
    ${categoryNavHtml}
    <p><a href="/rfq">Request a Quote for ${esc(p.name)}</a></p>
    <p><a href="/contact">Contact Al Zaydan International UAE</a></p>`;

  const html = buildPage({
    title: productTitle,
    description: productDesc,
    canonical: canonicalUrl,
    ogTitle: productTitle,
    ogDesc: productDesc,
    bodyHtml,
    schemaJson: productSchema,
  });

  const outPath = path.join(DIST, 'product', p.id, 'index.html');
  writeFile(outPath, html);
  productCount++;
}
console.log(`  ✅  Written ${productCount} product HTML files → dist/product/`);


// ═══════════════════════════════════════════════════════════════════════════════
// STATIC PAGES
// ═══════════════════════════════════════════════════════════════════════════════

const STATIC_PAGES = [
  {
    route: 'about',
    title: 'About Al Zaydan International | UAE B2B Industrial Materials Company',
    description: 'Al Zaydan International FZE — Ajman-based B2B industrial materials sourcing and distribution company serving the UAE and GCC. Learn about our mission and expertise.',
    canonical: 'https://www.alzaydaninternational.com/about',
    bodyHtml: `
    <h1>About Al Zaydan International</h1>
    <p>
      Al Zaydan International FZE is a UAE-based B2B industrial materials trading and distribution
      company licensed in the Ajman Free Zone. We source, trade, and distribute industrial
      materials to businesses across the UAE and GCC region, including traffic safety equipment,
      road safety products, reflective sheeting, packaging materials, and industrial tools.
    </p>
    <h2>Our Mission</h2>
    <p>
      To connect UAE and GCC businesses with verified global suppliers of quality industrial
      materials at competitive wholesale prices — simplifying the procurement process for
      businesses of all sizes.
    </p>
    <h2>Products We Supply</h2>
    <ul>
      <li>Traffic Safety Equipment (Cones, Barriers, Delineators, Speed Bumps)</li>
      <li>Road Safety Products (Road Studs, Warning Signs, Retro-reflective Plates)</li>
      <li>Reflective Sheeting (Diamond Grade, High Intensity, DOT-C2, ECE-104, SOLAS)</li>
      <li>Packaging Materials (BOPP Tape, Hot Melt Adhesive, PE Foam, Security Tape)</li>
      <li>Industrial Adhesive Tapes (Double-sided, Aluminium Foil, PTFE, Masking)</li>
      <li>Industrial Sealants and Adhesives</li>
      <li>Industrial Diamond Tools</li>
      <li>Printing Supplies and Consumables</li>
    </ul>
    <h2>Contact</h2>
    <address>
      <p>Ajman Free Zone, C1 Building, Ajman, UAE</p>
      <p>Email: <a href="mailto:info@alzaydanintl.com">info@alzaydanintl.com</a></p>
      <p>Phone: <a href="tel:+971551551329">+971 55 155 1329</a></p>
    </address>
    ${categoryNavHtml}`,
  },
  {
    route: 'contact',
    title: 'Contact Al Zaydan International | UAE Industrial Supplies Supplier',
    description: 'Get in touch with Al Zaydan International FZE for B2B industrial materials, bulk orders, and procurement inquiries. Based in Ajman Free Zone, serving UAE and GCC.',
    canonical: 'https://www.alzaydaninternational.com/contact',
    bodyHtml: `
    <h1>Contact Al Zaydan International</h1>
    <p>Contact our team for B2B industrial materials sourcing, wholesale pricing, and bulk procurement inquiries.</p>
    <address>
      <p><strong>Al Zaydan International FZE</strong></p>
      <p>Ajman Free Zone, C1 Building, Ajman, United Arab Emirates</p>
      <p>Email: <a href="mailto:info@alzaydanintl.com">info@alzaydanintl.com</a></p>
      <p>Phone: <a href="tel:+971551551329">+971 55 155 1329</a></p>
      <p>Hours: Monday–Friday, 9:00 AM – 6:00 PM GST</p>
    </address>
    <h2>We Supply To</h2>
    <p>UAE (Dubai, Abu Dhabi, Sharjah, Ajman), Saudi Arabia, Qatar, Kuwait, Oman, Bahrain</p>
    ${categoryNavHtml}`,
  },
  {
    route: 'rfq',
    title: 'Request for Quote (RFQ) | Bulk Industrial Materials UAE — Al Zaydan International',
    description: 'Submit an RFQ for bulk industrial materials, traffic safety equipment, reflective sheeting, and packaging supplies. Al Zaydan International FZE responds within 24 hours.',
    canonical: 'https://www.alzaydaninternational.com/rfq',
    bodyHtml: `
    <h1>Request for Quote — Bulk Industrial Materials UAE</h1>
    <p>
      Submit a Request for Quote (RFQ) for bulk industrial materials from Al Zaydan International FZE.
      We supply traffic safety equipment, road safety products, reflective sheeting, packaging materials,
      adhesive tapes, and more to businesses across the UAE and GCC.
    </p>
    <h2>What You Can Request</h2>
    <ul>
      <li>Traffic safety cones, barriers, and delineators</li>
      <li>Reflective sheeting (Diamond Grade, DOT-C2, ECE-104, SOLAS)</li>
      <li>Road studs and cat eyes</li>
      <li>Packaging tape (BOPP, hot melt, double-sided, foam tape)</li>
      <li>Industrial adhesive tapes</li>
      <li>Safety gear and PPE</li>
      <li>Printing supplies and consumables</li>
    </ul>
    <p>Our sales team will respond with a customised quote within 24 hours.</p>
    ${categoryNavHtml}`,
  },
  {
    route: 'blog',
    title: 'Blog — Industrial Supplies & Safety Equipment UAE | Al Zaydan International',
    description: 'Read articles about traffic safety equipment, road safety products, industrial materials, reflective sheeting, and procurement best practices in UAE and GCC.',
    canonical: 'https://www.alzaydaninternational.com/blog',
    bodyHtml: `
    <h1>Industrial Supplies &amp; Safety Equipment Blog — UAE</h1>
    <p>
      Stay informed with articles from Al Zaydan International covering traffic safety equipment,
      road safety products, reflective sheeting standards, packaging materials, industrial supplies
      procurement, and B2B sourcing best practices in the UAE and GCC.
    </p>
    ${categoryNavHtml}`,
  },
  {
    route: 'search',
    title: 'All Industrial Products — Traffic Safety, Reflective Materials, Packaging UAE | Al Zaydan',
    description: 'Browse all industrial products from Al Zaydan International: traffic safety equipment, reflective sheeting, road safety products, packaging materials, adhesive tapes in UAE.',
    canonical: 'https://www.alzaydaninternational.com/search',
    bodyHtml: `
    <h1>Industrial Products Catalogue — UAE B2B Supplier</h1>
    <p>Browse all industrial products from Al Zaydan International FZE. We supply traffic safety
    equipment, road safety products, reflective sheeting, packaging materials, adhesive tapes,
    industrial tools, and more to businesses across the UAE and GCC.</p>
    <h2>Browse by Category</h2>
    <ul>
${categories.map(c => `      <li><a href="/search?category=${encodeURIComponent(c)}">${esc(c)} Products UAE</a> — ${products.filter(p => p.category === c).length} products available</li>`).join('\n')}
    </ul>
    <h2>All Products</h2>
    <ul>
${products.slice(0, 100).map(p => `      <li><a href="/product/${encodeURIComponent(p.id)}">${esc(p.name)}</a> (${esc(p.category)})</li>`).join('\n')}
    </ul>
    ${categoryNavHtml}`,
  },
  {
    route: 'solutions',
    title: 'B2B Industrial Procurement Solutions UAE | Al Zaydan International',
    description: 'Al Zaydan International provides complete B2B industrial procurement solutions in UAE — from sourcing verified suppliers to bulk delivery across the GCC.',
    canonical: 'https://www.alzaydaninternational.com/solutions',
    bodyHtml: `
    <h1>B2B Industrial Procurement Solutions — UAE</h1>
    <p>
      Al Zaydan International FZE provides end-to-end B2B industrial procurement solutions for
      businesses in the UAE and across the GCC. From sourcing verified global suppliers to
      managing bulk deliveries, we simplify industrial procurement.
    </p>
    <h2>Our Solutions</h2>
    <ul>
      <li>Traffic Safety Equipment Supply</li>
      <li>Road Safety Products Procurement</li>
      <li>Reflective Sheeting and Signage</li>
      <li>Packaging Materials Wholesale</li>
      <li>Industrial Adhesive Tape Supply</li>
      <li>Custom RFQ and Bulk Ordering</li>
    </ul>
    ${categoryNavHtml}`,
  },
  // ── SEO Landing Pages ────────────────────────────────────────────────────────
  {
    route: 'traffic-safety-equipment-uae',
    title: 'Traffic Safety Equipment UAE | Cones, Barriers, Signs — Al Zaydan International',
    description: 'Buy traffic safety equipment in UAE — cones, barriers, delineators, speed bumps, warning signs. B2B wholesale supply from Al Zaydan International. Request a quote today.',
    canonical: 'https://www.alzaydaninternational.com/traffic-safety-equipment-uae',
    bodyHtml: `
    <h1>Traffic Safety Equipment Supplier UAE</h1>
    <p>
      Al Zaydan International FZE is a leading B2B supplier of traffic safety equipment in the
      UAE. We supply traffic cones, road barriers, delineators, speed bumps, warning signs,
      reflective plates, and road safety accessories to businesses, contractors, municipalities,
      and construction companies across the UAE and GCC.
    </p>
    <h2>Traffic Safety Products We Supply</h2>
    <ul>
      <li>Traffic Cones (standard, heavy-duty, LED)</li>
      <li>Road Barriers and Water-filled Barriers</li>
      <li>Flexible Delineators and Channel Markers</li>
      <li>Speed Humps and Speed Cushions</li>
      <li>Road Signs and Warning Boards</li>
      <li>Reflective Tape (DOT-C2, ECE-104)</li>
      <li>Traffic Paddles and Safety Flags</li>
      <li>Crash Cushions and Attenuators</li>
    </ul>
    <p>
      All products meet international road safety standards. We offer competitive B2B wholesale
      pricing and fast delivery across the UAE — Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah
      — and GCC countries.
    </p>
    <h2>Products in This Category</h2>
    <ul>
${products.filter(p => p.category === 'Traffic Safety').map(p => `      <li><a href="/product/${encodeURIComponent(p.id)}">${esc(p.name)}</a></li>`).join('\n')}
    </ul>
    <p><a href="/rfq">Request a Quote for Traffic Safety Equipment</a></p>
    <p><a href="/contact">Contact Our Sales Team</a></p>
    ${categoryNavHtml}`,
  },
  {
    route: 'road-safety-products-uae',
    title: 'Road Safety Products UAE | Road Studs, Delineators, Barriers — Al Zaydan International',
    description: 'Road safety products supplier in UAE — road studs, cat eyes, delineators, barriers, speed humps. Wholesale B2B supply from Al Zaydan International FZE.',
    canonical: 'https://www.alzaydaninternational.com/road-safety-products-uae',
    bodyHtml: `
    <h1>Road Safety Products Supplier UAE</h1>
    <p>
      Al Zaydan International FZE supplies road safety products to contractors, municipalities,
      and infrastructure companies across the UAE and GCC. Our road safety product range includes
      road studs, raised pavement markers, delineators, guardrails, safety barriers, and more.
    </p>
    <h2>Road Safety Products We Supply</h2>
    <ul>
      <li>Road Studs and Raised Pavement Markers</li>
      <li>Cat Eyes and Retroreflective Markers</li>
      <li>Flexible Delineators and Post Markers</li>
      <li>Guardrails and Crash Barriers</li>
      <li>Safety Cones and Channelizing Devices</li>
      <li>Speed Humps, Bumps, and Cushions</li>
      <li>Road Marking Materials</li>
    </ul>
    <p><a href="/rfq">Request a Quote for Road Safety Products</a></p>
    ${categoryNavHtml}`,
  },
  {
    route: 'reflective-sheeting-uae',
    title: 'Reflective Sheeting UAE | Diamond Grade, DOT-C2, ECE-104, SOLAS — Al Zaydan',
    description: 'Buy reflective sheeting in UAE — Diamond Grade, High Intensity Prismatic, DOT-C2, ECE-104, SOLAS retroreflective tape. B2B wholesale from Al Zaydan International.',
    canonical: 'https://www.alzaydaninternational.com/reflective-sheeting-uae',
    bodyHtml: `
    <h1>Reflective Sheeting Supplier UAE</h1>
    <p>
      Al Zaydan International FZE is a UAE-based B2B supplier of high-quality reflective
      sheeting and retroreflective materials. We supply reflective sheeting for traffic signs,
      vehicle marking, safety vests, construction equipment, and road safety applications.
    </p>
    <h2>Reflective Sheeting Types</h2>
    <ul>
      <li>Diamond Grade Reflective Sheeting</li>
      <li>High Intensity Prismatic (HIP) Sheeting</li>
      <li>Engineer Grade Reflective Sheeting</li>
      <li>DOT-C2 Reflective Tape (truck conspicuity)</li>
      <li>ECE-104 Reflective Tape (vehicle rear marking)</li>
      <li>SOLAS Retroreflective Tape (marine safety)</li>
      <li>Type II Retroreflective Sheeting</li>
      <li>Electronic Cut Reflective Film</li>
    </ul>
    <h2>Products in This Category</h2>
    <ul>
${products.filter(p => p.category === 'Reflectors & Signage' || p.category === 'Traffic Safety').slice(0, 20).map(p => `      <li><a href="/product/${encodeURIComponent(p.id)}">${esc(p.name)}</a></li>`).join('\n')}
    </ul>
    <p><a href="/rfq">Request a Quote for Reflective Sheeting</a></p>
    ${categoryNavHtml}`,
  },
  {
    route: 'packaging-materials-supplier-uae',
    title: 'Packaging Materials Supplier UAE | BOPP Tape, Hot Melt Adhesive — Al Zaydan International',
    description: 'Industrial packaging materials supplier UAE — BOPP packaging tape, hot melt adhesive, double-sided tape, PE foam tape, acrylic foam tape. B2B wholesale from Al Zaydan.',
    canonical: 'https://www.alzaydaninternational.com/packaging-materials-supplier-uae',
    bodyHtml: `
    <h1>Packaging Materials Supplier UAE</h1>
    <p>
      Al Zaydan International FZE supplies industrial packaging materials to manufacturers,
      distributors, and businesses across the UAE and GCC. We stock a comprehensive range of
      packaging tapes, hot melt adhesives, foam tapes, and flexible packaging raw materials.
    </p>
    <h2>Packaging Materials We Supply</h2>
    <ul>
      <li>BOPP Packaging Tape (clear, brown, custom-printed)</li>
      <li>Hot Melt Adhesive for Cartons and Boxes</li>
      <li>Double-sided Tissue Tape</li>
      <li>PE Foam Tape (single and double-sided)</li>
      <li>Acrylic Foam Tape (VHB-type)</li>
      <li>Masking Tape (crepe paper, washi)</li>
      <li>Aluminium Foil Tape</li>
      <li>PTFE Tape and Coated Fabrics</li>
      <li>Security Void Tape</li>
      <li>Kraft Paper Tape</li>
    </ul>
    <h2>Products in This Category</h2>
    <ul>
${products.filter(p => p.category === 'Flexible packaging raw materials' || p.category === 'Industrial Adhesive Tapes').map(p => `      <li><a href="/product/${encodeURIComponent(p.id)}">${esc(p.name)}</a></li>`).join('\n')}
    </ul>
    <p><a href="/rfq">Request a Quote for Packaging Materials</a></p>
    ${categoryNavHtml}`,
  },
];

console.log(`\n🏗  Pre-rendering ${STATIC_PAGES.length} static pages…`);
let staticCount = 0;

for (const page of STATIC_PAGES) {
  const html = buildPage({
    title:      page.title,
    description: page.description,
    canonical:  page.canonical,
    ogTitle:    page.title,
    ogDesc:     page.description,
    bodyHtml:   page.bodyHtml,
    schemaJson: null,
  });

  const outPath = path.join(DIST, page.route, 'index.html');
  writeFile(outPath, html);
  staticCount++;
  console.log(`  ✅  ${page.route}/index.html`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════
const totalPages = productCount + staticCount;
console.log(`\n🎉  Pre-render complete!`);
console.log(`    📄  Product pages  : ${productCount}`);
console.log(`    📝  Static pages   : ${staticCount}`);
console.log(`    🔗  Total pages    : ${totalPages}`);
console.log(`\n    Google and Screaming Frog can now discover all ${totalPages} pages from HTML source.\n`);
