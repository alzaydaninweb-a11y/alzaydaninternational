import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { PlusCircle, Pencil, Trash2, Check, X, Tag, Loader2, Image as ImageIcon, Upload } from 'lucide-react';
import { uploadToR2 } from '../../lib/cloudflareR2';

export default function AdminCategories() {
  const { categories, categoryImages, products, addCategory, updateCategory, deleteCategory, updateCategoryImage } = useStore();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeUploadCat, setActiveUploadCat] = useState<string | null>(null);

  const getProductCount = (cat: string) => products.filter(p => p.category === cat).length;

  const withBusy = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Operation failed.');
    } finally { setBusy(false); }
  };

  const handleAdd = () => {
    const name = newCategoryName.trim();
    if (!name) { setError('Category name cannot be empty.'); return; }
    if (categories.includes(name)) { setError('Category already exists.'); return; }
    withBusy(async () => {
      await addCategory(name);
      setNewCategoryName('');
      setError('');
    });
  };

  const handleSaveEdit = () => {
    const name = editValue.trim();
    if (!name) return;
    if (name !== editingCategory && categories.includes(name)) { setError('Category already exists.'); return; }
    withBusy(async () => {
      await updateCategory(editingCategory!, name);
      if (editImageUrl.trim() !== (categoryImages[editingCategory!] || '')) {
        await updateCategoryImage(name, editImageUrl.trim());
      }
      setEditingCategory(null);
      setEditValue('');
      setEditImageUrl('');
      setError('');
    });
  };

  const handleDelete = (cat: string) => {
    withBusy(async () => {
      await deleteCategory(cat);
      setConfirmDeleteCategory(null);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadCat) return;
    
    setUploadingImage(activeUploadCat);
    try {
      const url = await uploadToR2(file, 'categories');
      await updateCategoryImage(activeUploadCat, url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploadingImage(null);
      setActiveUploadCat(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Categories</h1>
        <p className="text-slate-500 text-sm mt-0.5">{categories.length} categories · Manage product categories</p>
      </div>

      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        accept="image/*"
        onChange={handleImageUpload}
      />

      {/* Add Category */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <h2 className="font-bold text-slate-900 mb-3 text-[15px]">Add New Category</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-3 py-2 rounded-lg mb-3">{error}</div>
        )}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={newCategoryName}
              onChange={e => { setNewCategoryName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="e.g. Power Tools"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none transition-all" />
          </div>
          <button onClick={handleAdd} disabled={busy}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />} Add
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-[1fr_auto_auto] gap-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category Image & Name</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-24 text-center">Products</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-24 text-right">Actions</span>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {categories.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium text-sm">No categories yet. Add one above.</div>
          ) : (
            categories.map(cat => (
              <div key={cat} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={() => { setActiveUploadCat(cat); fileInputRef.current?.click(); }}
                      className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden group relative"
                      title="Upload Cover Image"
                    >
                      {uploadingImage === cat ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      ) : categoryImages[cat] ? (
                        <>
                          <img src={categoryImages[cat]} alt={cat} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="w-4 h-4 text-white" />
                          </div>
                        </>
                      ) : (
                        <ImageIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      )}
                    </div>
                    {editingCategory === cat ? (
                      <div className="flex flex-col gap-2 w-full">
                        <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveEdit()} autoFocus placeholder="Category Name"
                          className="w-full border border-blue-400 rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
                        <input type="text" value={editImageUrl} onChange={e => setEditImageUrl(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveEdit()} placeholder="Image URL (optional)"
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none" />
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-800 text-sm">{cat}</span>
                    )}
                  </div>
                  <div className="w-24 text-center">
                    <span className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      {getProductCount(cat)} items
                    </span>
                  </div>
                  <div className="w-24 flex items-center justify-end gap-1">
                    {editingCategory === cat ? (
                      <>
                        <button onClick={handleSaveEdit} disabled={busy}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50">
                          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button onClick={() => { setEditingCategory(null); setError(''); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-gray-100 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : confirmDeleteCategory === cat ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-red-600 font-semibold">Delete?</span>
                        <button onClick={() => handleDelete(cat)} disabled={busy}
                          className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50">
                          {busy ? '...' : 'Yes'}
                        </button>
                        <button onClick={() => setConfirmDeleteCategory(null)} className="text-xs font-bold text-slate-400 hover:underline">No</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => { setEditingCategory(cat); setEditValue(cat); setEditImageUrl(categoryImages[cat] || ''); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDeleteCategory(cat)}
                          disabled={getProductCount(cat) > 0}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={getProductCount(cat) > 0 ? 'Remove all products first' : 'Delete category'}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {confirmDeleteCategory === cat && getProductCount(cat) > 0 && (
                  <p className="text-xs text-red-500 font-medium mt-1 ml-4">
                    Cannot delete — {getProductCount(cat)} product(s) are using this category.
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
