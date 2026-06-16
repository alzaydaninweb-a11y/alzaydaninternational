import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  schema?: object;
}

/**
 * useSEO — sets page-level <title>, <meta description>, <link rel="canonical">
 * og:* Open Graph, twitter:* Card, and injects/removes JSON-LD structured data.
 *
 * All props are reactive: changing any will immediately update the DOM.
 */
export function useSEO({ title, description, canonical, ogImage, ogType = 'website', schema }: SEOProps) {
  useEffect(() => {
    // ── Shared OG image (fallback to logo if none provided) ───────────────
    const resolvedImage = ogImage || 'https://www.alzaydaninternational.com/images/og-banner.jpg';
    
    // ── Dynamic Canonical URL ──────────────────────────────────────────────
    const resolvedCanonical = canonical || `https://www.alzaydaninternational.com${window.location.pathname.replace(/\/$/, '')}`;

    // ── Title ──────────────────────────────────────────────────────────────
    document.title = title;

    // ── Meta description ───────────────────────────────────────────────────
    let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = description;

    // ── Canonical ──────────────────────────────────────────────────────────
    let canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.rel = 'canonical';
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = resolvedCanonical;

    // ── Hreflang ───────────────────────────────────────────────────────────
    const setHreflang = (lang: string, url: string) => {
      let el = document.querySelector<HTMLLinkElement>(`link[hreflang="${lang}"]`);
      if (!el) {
        el = document.createElement('link');
        el.rel = 'alternate';
        el.hreflang = lang;
        document.head.appendChild(el);
      }
      el.href = url;
    };
    setHreflang('en', resolvedCanonical);
    setHreflang('x-default', resolvedCanonical);
    // Note: When Arabic pages are built in /ar/, add: setHreflang('ar', canonical.replace('.com/', '.com/ar/'));

    // ── Open Graph ─────────────────────────────────────────────────────────
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.content = content;
    };
    setMeta('og:title',       title);
    setMeta('og:description', description);
    setMeta('og:url',         resolvedCanonical);
    setMeta('og:type',        ogType);
    setMeta('og:site_name',   'Al Zaydan International');
    setMeta('og:image',       resolvedImage);
    setMeta('og:image:width',  '1200');
    setMeta('og:image:height', '630');
    setMeta('og:locale',      'en_AE');

    // ── Twitter / X Card ───────────────────────────────────────────────────
    const setName = (name: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };
    setName('twitter:card',        'summary_large_image');
    setName('twitter:site',        '@alzaydanintl');
    setName('twitter:title',       title);
    setName('twitter:description', description);
    setName('twitter:image',       resolvedImage);

    // ── JSON-LD Structured Data ─────────────────────────────────────────────
    const SCHEMA_ID = 'page-jsonld';
    let scriptEl = document.getElementById(SCHEMA_ID) as HTMLScriptElement | null;
    if (schema) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = SCHEMA_ID;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(schema);
    } else if (scriptEl) {
      scriptEl.remove();
    }

    return () => {
      // Cleanup schema on page navigation
      document.getElementById(SCHEMA_ID)?.remove();
    };
  }, [title, description, canonical, ogImage, ogType, schema]);
}
