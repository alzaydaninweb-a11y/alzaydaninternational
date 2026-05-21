import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Star, ShieldCheck, Truck, Heart, Share2, Info, ChevronRight, Check, ShoppingCart, Minus, Plus, PhoneCall } from 'lucide-react';
import WhatsAppIcon from '../components/icons/WhatsAppIcon';
import { useCart } from '../context/CartContext';
import ProductListingGrid from '../components/home/ProductListingGrid';
import PriceDisplay from '../components/ui/PriceDisplay';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products } = useStore();
  const product = products.find(p => p.id === (id || '1')) || products[0];
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const allImages = useMemo(() => {
    const imgs = [product.image];
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (img && img !== product.image) imgs.push(img);
      });
    }
    return imgs;
  }, [product]);

  const [activeImgIdx, setActiveImgIdx] = useState(0);

  // Auto-slide effect
  React.useEffect(() => {
    if (allImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImgIdx(prev => (prev + 1) % allImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [allImages.length]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const relatedProducts = useMemo(() => {
    // 1. Same category
    const sameCategory = products.filter(p => p.category === product.category && p.id !== product.id);
    let related = [...sameCategory];

    // 2. Others
    const others = products.filter(p => p.id !== product.id && p.category !== product.category);
    related = [...related, ...others];

    return related.slice(0, 15);
  }, [products, product]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-slate-50 py-3 px-4 md:px-6 text-[13px] md:text-sm text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 md:gap-2">
          <Link to="/" className="hover:text-amber-500 transition-colors shrink-0">Home</Link>
          <span className="text-slate-400">/</span>
          <Link to={`/search?category=${encodeURIComponent(product.category)}`} className="hover:text-amber-500 transition-colors shrink-0 whitespace-nowrap">{product.category}</Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 truncate font-semibold">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Left: Images */}
          <div className="flex flex-col-reverse md:flex-row gap-4 h-max relative md:sticky md:top-32 z-10">
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto snap-x md:w-20 shrink-0 no-scrollbar">
                {allImages.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImgIdx(i)}
                    className={`w-16 h-16 md:w-20 md:h-20 shrink-0 snap-start border-2 rounded-lg overflow-hidden transition-all ${i === activeImgIdx ? 'border-blue-600 shadow-md scale-95' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <img src={img} className="w-full h-full object-cover mix-blend-multiply" alt={`Thumbnail ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
            
            {/* Main Image Container */}
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl aspect-square flex items-center justify-center relative p-0 overflow-hidden group">
              {product.discount > 0 && (
                <div className="absolute top-4 left-4 bg-amber-400 text-black text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-sm">
                  SAVE {product.discount}%
                </div>
              )}
              <div className="absolute top-4 right-4 flex flex-col gap-3 z-10">
                <button 
                  onClick={handleShare}
                  title="Copy Link"
                  className="w-10 h-10 bg-white shadow-sm border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors relative"
                >
                  {isCopied ? <Check className="w-5 h-5 text-emerald-500" /> : <Share2 className="w-5 h-5" />}
                  {isCopied && (
                    <div className="absolute right-12 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs font-bold px-2.5 py-1 rounded shadow-sm whitespace-nowrap pointer-events-none">
                      Link copied!
                    </div>
                  )}
                </button>
              </div>

              {/* Main Image with Transition */}
              <div className="w-full h-full relative">
                {allImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={product.name}
                    className={`absolute inset-0 w-full h-full object-cover mix-blend-multiply transition-opacity duration-700 ease-in-out ${idx === activeImgIdx ? 'opacity-100' : 'opacity-0'}`}
                  />
                ))}
              </div>

              {/* Dot Indicators */}
              {allImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImgIdx(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeImgIdx ? 'w-4 bg-blue-600' : 'bg-slate-300'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex flex-col lg:pl-6">
            
            {/* Header / Badges */}
            <div className="mb-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {product.brand && (
                  <span className="text-[11px] font-black text-[#0052d9] uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">{product.brand}</span>
                )}
                {product.category && (
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{product.category}</span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4 leading-tight tracking-tight">
                {product.name}
              </h1>
              
              {product.rating != null && product.reviews != null && product.reviews > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-amber-400 text-white px-2 py-0.5 rounded text-sm font-bold">
                    {product.rating} <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="text-sm font-semibold text-slate-500 underline decoration-slate-300 underline-offset-2">
                    {product.reviews.toLocaleString()} Verified Reviews
                  </span>
                </div>
              )}
            </div>

            {/* Price / Quote Block */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 md:p-6 mb-8 shadow-sm">
              {product.priceType === 'hidden' ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                    <WhatsAppIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg mb-1">Price on Request</h3>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-md">
                      Pricing varies based on volume and specifications. Discuss via WhatsApp for a tailored B2B quote.
                    </p>
                  </div>
                </div>
              ) : (
                <PriceDisplay product={product} size="xl" />
              )}
            </div>

            {/* Key Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Availability</span>
                  <span className={`text-sm font-extrabold ${product.inStock ? 'text-emerald-600' : 'text-red-500'}`}>
                    {product.inStock ? 'In Stock & Ready' : 'Out of Stock'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200">
                  <Truck className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Shipping</span>
                  <span className="text-sm font-extrabold text-slate-900">{product.shippingRegion || 'Global Freight Options'}</span>
                </div>
              </div>

              {product.moq && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200">
                    <ShoppingCart className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Min. Order (MOQ)</span>
                    <span className="text-sm font-extrabold text-slate-900">{product.moq}</span>
                  </div>
                </div>
              )}
              
              {product.leadTime && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200">
                    <Check className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lead Time</span>
                    <span className="text-sm font-extrabold text-slate-900">{product.leadTime}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white border border-slate-200 rounded-xl h-14 px-1.5 shadow-sm shrink-0">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-50 transition-all text-slate-400 hover:text-blue-600"
                  >
                    <Minus className="w-4 h-4 stroke-[3]" />
                  </button>
                  <span className="w-10 text-center font-black text-slate-900 text-base">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-50 transition-all text-slate-400 hover:text-blue-600"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
                
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`
                    flex-1 h-14 rounded-xl font-bold text-[11px] sm:text-[13px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2
                    ${isAdded
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
                      : 'bg-[#0052d9] text-white shadow-lg shadow-blue-100 hover:bg-blue-700 hover:shadow-blue-200 active:scale-[0.98] disabled:opacity-50'
                    }
                  `}
                >
                  {isAdded ? (
                    <><Check className="w-4 h-4 stroke-[3]" /> Added to List</>
                  ) : (
                    <><ShoppingCart className="w-4 h-4" /> Add to Order List</>
                  )}
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                disabled={!product.inStock}
                className="w-full h-14 rounded-xl font-bold text-[11px] sm:text-[13px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center bg-[#25D366] text-white shadow-lg shadow-green-100 hover:bg-[#128C7E] active:scale-[0.98] disabled:opacity-50 gap-2.5"
              >
                <WhatsAppIcon className="w-5 h-5" />
                {product.priceType === 'hidden' ? 'Discuss Quote via WhatsApp' : 'Order instantly via WhatsApp'}
              </button>
              
              <div className="flex items-center justify-center gap-6 mt-4">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure B2B Portal</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><Star className="w-4 h-4 text-amber-500" /> Commercial Quality</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="mt-10 border-t border-slate-200 pt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">Product Description</h2>
              <div className="prose max-w-none text-slate-600 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {product.description ? (
                  product.description
                ) : (
                  <p>Experience the ultimate combination of power and durability with the {product.name}. Designed for professional and industrial use, it delivers top-tier performance for all your operational needs.</p>
                )}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">Specifications</h2>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left border-collapse">
                  <tbody>
                    {product.brand && (
                      <tr className="border-b border-slate-100">
                        <th className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/50 w-1/3">Brand</th>
                        <td className="py-3 px-4 text-slate-900 bg-white">{product.brand}</td>
                      </tr>
                    )}
                    {product.category && (
                      <tr className="border-b border-slate-100">
                        <th className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/50 w-1/3">Category</th>
                        <td className="py-3 px-4 text-slate-900 bg-white">{product.category}</td>
                      </tr>
                    )}
                    {product.specifications && product.specifications.length > 0 ? (
                      product.specifications.map((spec, idx) => (
                        <tr key={idx} className={idx === product.specifications!.length - 1 ? '' : 'border-b border-slate-100'}>
                          <th className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/50 w-1/3">{spec.key}</th>
                          <td className="py-3 px-4 text-slate-900 bg-white font-medium">{spec.value}</td>
                        </tr>
                      ))
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Related Products</h2>
              <Link to={`/search?category=${encodeURIComponent(product.category)}`} className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center gap-1 transition-colors">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <ProductListingGrid customProducts={relatedProducts} columns={4} />
          </div>
        )}

      </div>
    </div>
  );
}
