import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import {
  ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle,
  TrendingUp, BarChart3, Globe, Package, Tag, FileText, Layers, RefreshCw
} from 'lucide-react';

export default function AdminSEODashboard() {
  const { products, categories, categoryDetails, redirects, pagesSeo, imagesSeo } = useStore();

  // 1. Calculations for Widgets
  const totalProducts = products.length;
  const productsMissingSeo = useMemo(() => {
    return products.filter(p => !p.seoTitle || !p.metaDescription).length;
  }, [products]);

  const productsMissingImages = useMemo(() => {
    return products.filter(p => !p.image).length;
  }, [products]);

  const productsMissingAltText = useMemo(() => {
    return products.filter(p => {
      const primaryAlt = imagesSeo[p.image]?.altText;
      return !primaryAlt || primaryAlt.trim().length === 0;
    }).length;
  }, [products, imagesSeo]);

  const totalRedirects = redirects.length;
  const totalCategories = categories.length;
  const staticPagesCount = 5; // Home, About, Contact, RFQ, Services

  // 2. Health Audits
  const alerts = useMemo(() => {
    const list: { id: string; type: 'error' | 'warning' | 'info'; title: string; desc: string; link?: string }[] = [];

    // Check Duplicate Slugs
    const slugMap: Record<string, string[]> = {};
    products.forEach(p => {
      const s = p.slug || '';
      if (s) {
        if (!slugMap[s]) slugMap[s] = [];
        slugMap[s].push(p.name);
      }
    });
    Object.entries(slugMap).forEach(([slug, names]) => {
      if (names.length > 1) {
        list.push({
          id: `dup-slug-${slug}`,
          type: 'error',
          title: `Duplicate URL Slug: /product/${slug}`,
          desc: `Used by multiple products: ${names.join(', ')}. Slugs must be unique.`,
          link: '/admin/products',
        });
      }
    });

    // Check Categories Slugs
    const catSlugMap: Record<string, string[]> = {};
    Object.entries(categoryDetails || {}).forEach(([catName, details]) => {
      const s = details.slug || '';
      if (s) {
        if (!catSlugMap[s]) catSlugMap[s] = [];
        catSlugMap[s].push(catName);
      }
    });
    Object.entries(catSlugMap).forEach(([slug, names]) => {
      if (names.length > 1) {
        list.push({
          id: `dup-cat-slug-${slug}`,
          type: 'error',
          title: `Duplicate Category Slug: /category/${slug}`,
          desc: `Used by categories: ${names.join(', ')}.`,
          link: '/admin/categories',
        });
      }
    });

    // Check Products missing SEO Title / Meta Description
    products.forEach(p => {
      if (!p.seoTitle) {
        list.push({
          id: `missing-title-${p.id}`,
          type: 'warning',
          title: `Missing SEO Title Override: ${p.name}`,
          desc: 'Search engines will fallback to name, which may not be optimized for keywords.',
          link: `/admin/products/edit/${p.id}`,
        });
      }
      if (!p.metaDescription) {
        list.push({
          id: `missing-desc-${p.id}`,
          type: 'error',
          title: `Missing Meta Description: ${p.name}`,
          desc: 'Google will auto-generate snippet text, leading to lower CTR.',
          link: `/admin/products/edit/${p.id}`,
        });
      }
      if (p.slug && p.slug.length > 50) {
        list.push({
          id: `long-url-${p.id}`,
          type: 'info',
          title: `Long URL Slug: /product/${p.slug}`,
          desc: 'URL slug is longer than 50 characters. Consider shortening it.',
          link: `/admin/products/edit/${p.id}`,
        });
      }
      if (p.canonicalUrl && !p.canonicalUrl.startsWith('https://')) {
        list.push({
          id: `broken-canonical-${p.id}`,
          type: 'error',
          title: `Invalid Canonical URL: ${p.name}`,
          desc: `Canonical URL must start with 'https://' (currently: '${p.canonicalUrl}')`,
          link: `/admin/products/edit/${p.id}`,
        });
      }
    });

    // Check static pages SEO settings
    const pages = ['home', 'about', 'contact', 'rfq', 'services'];
    pages.forEach(pg => {
      const pData = pagesSeo[pg];
      if (!pData || !pData.seoTitle) {
        list.push({
          id: `missing-page-title-${pg}`,
          type: 'error',
          title: `Missing Page SEO Config: ${pg.toUpperCase()}`,
          desc: `Configure Title and Meta description overrides for the /${pg} static page.`,
          link: '/admin/settings',
        });
      }
    });

    return list;
  }, [products, categoryDetails, pagesSeo]);

  const errorCount = alerts.filter(a => a.type === 'error').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;
  const infoCount = alerts.filter(a => a.type === 'info').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600 animate-pulse" />
            SEO Health Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Monitor and audit search ranking optimizations, redirects, and meta tags in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/seo-bulk"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            Bulk SEO Editor
          </Link>
          <Link
            to="/admin/redirects"
            className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            Manage Redirects
          </Link>
        </div>
      </div>

      {/* Audit Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-red-700">{errorCount}</div>
            <div className="text-xs text-red-500 font-semibold uppercase tracking-wider">Critical SEO Errors</div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-700">{warningCount}</div>
            <div className="text-xs text-amber-500 font-semibold uppercase tracking-wider">SEO Warnings</div>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700">
              {alerts.length === 0 ? '100%' : `${Math.max(0, Math.round(100 - (alerts.length / totalProducts) * 100))}%`}
            </div>
            <div className="text-xs text-emerald-500 font-semibold uppercase tracking-wider">Overall SEO Health Score</div>
          </div>
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Products</p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">{totalProducts}</h3>
            <span className="text-[10px] text-slate-400 font-medium">Indexed items</span>
          </div>
          <Package className="w-8 h-8 text-slate-300" />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Missing SEO Meta</p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">{productsMissingSeo}</h3>
            <span className="text-[10px] text-red-500 font-semibold">Requires description</span>
          </div>
          <FileText className="w-8 h-8 text-slate-300" />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">No Alt Image Text</p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">{productsMissingAltText}</h3>
            <span className="text-[10px] text-amber-500 font-semibold">Accessibility gap</span>
          </div>
          <Layers className="w-8 h-8 text-slate-300" />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Active Redirects</p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">{totalRedirects}</h3>
            <span className="text-[10px] text-blue-600 font-semibold">301/302 mappings</span>
          </div>
          <RefreshCw className="w-8 h-8 text-slate-300 animate-spin-slow" />
        </div>

      </div>

      {/* Health Auditor Log */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">SEO Health Auditor alerts</h2>
            <p className="text-xs text-slate-400 mt-0.5">Automated checks evaluating metadata, slug patterns, and compliance.</p>
          </div>
          <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded">
            {alerts.length} ALERTS ACTIVE
          </span>
        </div>

        {alerts.length > 0 ? (
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {alerts.map(alert => (
              <div key={alert.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex gap-3">
                  <div className="mt-0.5 shrink-0">
                    {alert.type === 'error' && <ShieldAlert className="w-4.5 h-4.5 text-red-500" />}
                    {alert.type === 'warning' && <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />}
                    {alert.type === 'info' && <HelpCircle className="w-4.5 h-4.5 text-blue-500" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{alert.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{alert.desc}</p>
                  </div>
                </div>
                {alert.link && (
                  <Link
                    to={alert.link}
                    className="px-2.5 py-1 bg-white border border-gray-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 text-[10px] font-bold rounded-lg transition-colors shrink-0 shadow-sm"
                  >
                    Fix Issue
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 font-medium text-xs">
            🎉 Great job! No SEO alerts, duplicate slugs, or missing descriptions found.
          </div>
        )}
      </div>

    </div>
  );
}
