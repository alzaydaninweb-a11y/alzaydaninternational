import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  schema?: object;
}

/**
 * useSEO — sets page-level <title>, <meta description>, <link rel="canonical">
 * and injects/removes JSON-LD structured data on each page visit.
 */
export function useSEO({ title, description, canonical, ogImage, schema }: SEOProps) {
  useEffect(() => {
    // ── Title ──────────────────────────────────────────────────────────
    document.title = title;

    // ── Meta description ───────────────────────────────────────────────
    let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = description;

    // ── Canonical ──────────────────────────────────────────────────────
    let canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.rel = 'canonical';
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = canonical;

    // ── OG tags ────────────────────────────────────────────────────────
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.content = content;
    };
    setMeta('og:title', title);
    setMeta('og:description', description);
    setMeta('og:url', canonical);
    if (ogImage) setMeta('og:image', ogImage);

    // ── Twitter / X Card ───────────────────────────────────────────────
    const setTwitterMeta = (name: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };
    setTwitterMeta('twitter:card', 'summary_large_image');
    setTwitterMeta('twitter:title', title);
    setTwitterMeta('twitter:description', description);
    setTwitterMeta('twitter:site', '@alzaydanintl');
    if (ogImage) setTwitterMeta('twitter:image', ogImage);

    // ── JSON-LD Schema ─────────────────────────────────────────────────
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
      // Cleanup schema on unmount
      document.getElementById(SCHEMA_ID)?.remove();
    };
  }, [title, description, canonical, ogImage, schema]);
}
