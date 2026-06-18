import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import ProductListingGrid from '../components/home/ProductListingGrid';
import { Filter, X, ChevronDown, ChevronUp, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { useSEO } from '../lib/useSEO';
import { generateSlug } from '../lib/blogService';



// ─── Collapsible filter section ───────────────────────────────────────────────

function FilterSection({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-slate-100 pb-4 mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <span className="text-[13px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          {title}
          {count != null && count > 0 && (
            <span className="w-5 h-5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full flex items-center justify-center">
              {count}
            </span>
          )}
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
          : <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />}
      </button>
      {open && (
        <div className="pr-1">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const { products: ALL_PRODUCTS, categories: ALL_CATEGORIES, categoryDetails } = useStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { slug } = useParams();

  const matchedCategory = useMemo(() => {
    if (!slug) return null;
    return Object.values(categoryDetails || {}).find(c => c.slug === slug) || null;
  }, [slug, categoryDetails]);

  const matchedCategoryName = matchedCategory ? matchedCategory.name : '';

  const categoryQuery  = matchedCategoryName || (searchParams.get('category') ?? '');
  const searchQuery    = searchParams.get('q')          ?? '';

  // Filter state
  const [selCategory, setSelCategory]   = useState(categoryQuery);
  const [selBrands, setSelBrands]       = useState<string[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Sync URL params → local state
  useEffect(() => { setSelCategory(categoryQuery); }, [categoryQuery]);

  // Client-side 301-like redirect for search category queries
  const categoryParam = searchParams.get('category');
  useEffect(() => {
    if (categoryParam) {
      const details = Object.values(categoryDetails || {}).find(c => c.name === categoryParam);
      const catSlug = details?.slug || generateSlug(categoryParam);
      navigate(`/category/${catSlug}`, { replace: true });
    }
  }, [categoryParam, categoryDetails, navigate]);

  // ── Derived: available brands (respect current category selection) ─
  const availableBrands = useMemo(() => {
    let base = ALL_PRODUCTS;
    if (selCategory) base = base.filter(p => p.category === selCategory);
    return Array.from(new Set<string>(base.map(p => p.brand).filter(Boolean))).sort();
  }, [ALL_PRODUCTS, selCategory]);

  // ── Derived: available categories ──────────────
  const availableCategories = ALL_CATEGORIES;

  // ── Filtered products ───────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let result = ALL_PRODUCTS;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    }
    if (selCategory) result = result.filter(p => p.category === selCategory);
    if (selBrands.length > 0) result = result.filter(p => selBrands.includes(p.brand));

    return result;
  }, [ALL_PRODUCTS, searchQuery, selCategory, selBrands]);

  // Active filter count (for badge)
  const activeFilterCount =
    (selCategory ? 1 : 0) +
    selBrands.length;

  const categorySlug = useMemo(() => {
    if (!selCategory) return '';
    const details = Object.values(categoryDetails || {}).find(c => c.name === selCategory);
    return details?.slug || generateSlug(selCategory);
  }, [selCategory, categoryDetails]);

  const resolvedCanonical = useMemo(() => {
    if (slug) {
      return `https://www.alzaydaninternational.com/category/${categorySlug}`;
    }
    return `https://www.alzaydaninternational.com/search`;
  }, [slug, categorySlug]);

  useSEO({
    title: searchQuery
      ? `"${searchQuery}" | Al Zaydan International — UAE Industrial`
      : selCategory
        ? (matchedCategory?.seoTitle || `${selCategory} Supplier UAE | Al Zaydan International`)
        : 'Browse All Products | Al Zaydan International UAE',
    description: searchQuery
      ? `Search results for "${searchQuery}" at Al Zaydan International.`
      : selCategory
        ? (matchedCategory?.metaDescription || `Buy high quality ${selCategory} products online from Al Zaydan International. request a quote today.`)
        : 'Browse Al Zaydan\'s full product catalogue — traffic safety equipment, reflective sheeting, road marking materials, packaging supplies and more.',
    canonical: resolvedCanonical,
  });

  const clearAll = useCallback(() => {
    setSelCategory('');
    setSelBrands([]);
    navigate('/search' + (searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''));
  }, [searchQuery, navigate]);

  const toggleBrand = (brand: string) =>
    setSelBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="font-extrabold text-slate-900 text-[15px]">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-500 font-bold transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Clear All
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-0 pr-1">

        {/* ── Category ── */}
        <FilterSection title="Category" count={selCategory ? 1 : 0}>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => {
                  setSelBrands([]);
                  navigate('/search' + (searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''));
                }}
                className="w-full flex items-center gap-2.5 text-[13px] text-slate-700 hover:text-slate-900 transition-colors py-1.5"
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                  !selCategory ? 'border-blue-600' : 'border-slate-300'
                }`}>
                  {!selCategory && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                </div>
                <span className={!selCategory ? 'font-bold text-slate-900' : 'font-medium'}>
                  All Categories
                </span>
              </button>
            </li>
            {availableCategories.map(cat => {
              const details = Object.values(categoryDetails || {}).find(c => c.name === cat);
              const catSlug = details?.slug || generateSlug(cat);
              return (
                <li key={cat}>
                  <button
                    onClick={() => {
                      setSelBrands([]);
                      navigate(`/category/${catSlug}`);
                    }}
                    className="w-full flex items-center gap-2.5 text-[13px] text-slate-700 hover:text-slate-900 transition-colors py-1.5"
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      selCategory === cat ? 'border-blue-600' : 'border-slate-300'
                    }`}>
                      {selCategory === cat && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                    </div>
                    <span className={selCategory === cat ? 'font-bold text-slate-900' : 'font-medium'}>
                      {cat}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </FilterSection>

        {/* ── Brand ── */}
        {availableBrands.length > 0 && (
          <FilterSection title="Brand" count={selBrands.length}>
            <ul className="space-y-1.5">
              {availableBrands.map(brand => (
                <li key={brand}>
                  <button
                    onClick={() => toggleBrand(brand)}
                    className="w-full flex items-center gap-2.5 text-[13px] text-slate-700 hover:text-slate-900 transition-colors py-1"
                  >
                    <div className={`w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                      selBrands.includes(brand)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-slate-300 bg-white'
                    }`}>
                      {selBrands.includes(brand) && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className={selBrands.includes(brand) ? 'font-bold text-slate-900' : 'font-medium'}>
                      {brand}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </FilterSection>
        )}
      </div>

      {/* Mobile apply button */}
      <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0 z-10 md:hidden">
        <button
          onClick={() => setIsMobileOpen(false)}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-xl transition-colors shadow-md"
        >
          Apply Filters {activeFilterCount > 0 && `(${activeFilterCount})`} Results
        </button>
      </div>
    </div>
  );

  // ── Active Filter Pills ───────────────────────────────────────────────────
  const ActivePills = () => (
    activeFilterCount > 0 ? (
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {selCategory && (
          <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-blue-100">
            {selCategory}
            <button onClick={() => navigate('/search' + (searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''))} className="hover:text-red-600 ml-0.5">
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        {selBrands.map(b => (
          <span key={b} className="flex items-center gap-1 bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
            {b}
            <button onClick={() => toggleBrand(b)} className="hover:text-red-600 ml-0.5">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <button onClick={clearAll} className="text-[11px] text-slate-400 hover:text-red-500 font-bold underline transition-colors">
          Clear all
        </button>
      </div>
    ) : null
  );

  // ── Render ────────────────────────────────────────────────────────────────
  const pageLabel = selCategory || searchQuery || 'All Products';

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-200px)]">

      {/* Top breadcrumb bar */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 shadow-sm">
        <div className="w-full">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <div className="flex items-center text-[13px] text-slate-500 font-medium">
                <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
                <span className="mx-2 text-slate-300">/</span>
                <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-sm">{pageLabel}</span>
              </div>
              <div className="hidden md:block">
                <ActivePills />
              </div>
            </div>

            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden flex items-center gap-1.5 border border-slate-300 rounded-lg px-3 py-2 text-[13px] font-bold text-slate-800 bg-white shadow-sm hover:bg-slate-50 transition-colors shrink-0"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                <span className="font-extrabold text-[13px]">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Mobile active pills */}
          <div className="md:hidden mt-2">
            <ActivePills />
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-5 flex gap-4 items-start">

        {/* Mobile backdrop */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        {/* Mobile drawer */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl p-5 flex flex-col
          transition-transform duration-300 ease-in-out
          md:hidden
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-extrabold text-slate-900 text-lg">Filters</span>
            <button onClick={() => setIsMobileOpen(false)} className="p-2 -mr-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          <Sidebar />
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-[260px] lg:w-[280px] shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-[calc(100vh-190px)] sticky top-[170px] overflow-hidden self-start">
          <Sidebar />
        </aside>

        {/* ── Product Grid ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-100 rounded-xl">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Filter className="w-6 h-6 text-slate-300" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">No results found</h2>
              <p className="text-slate-400 text-sm mb-5">
                Try adjusting your filters or clearing them to see all products.
              </p>
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-full text-sm transition-colors shadow-sm"
              >
                <RotateCcw className="w-4 h-4" /> Clear All Filters
              </button>
            </div>
          ) : (
            <ProductListingGrid customProducts={filteredProducts} columns={6} />
          )}
        </div>
      </div>
    </div>
  );
}
