import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Save, Plus, Trash2, HeadphonesIcon, HelpCircle, PhoneCall } from 'lucide-react';

const ROUTING_CONTEXTS = [
  { id: 'contact', label: 'Contact Page (General Inquiries)' },
  { id: 'rfq', label: 'RFQ & Bulk Orders' },
  { id: 'product', label: 'Product Page (Order Receiving)' },
  { id: 'procurement', label: 'Sticky Procurement Dock' }
];

export default function AdminCustomerSupport() {
  const { settings, updateGeneralSettings } = useStore();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Local state for routing map
  // Convert Record<string, string> to array for easy UI manipulation
  const [routes, setRoutes] = useState<{ context: string; number: string }[]>(() => {
    const existing = settings?.whatsappRouting || {};
    return Object.keys(existing).map(key => ({
      context: key,
      number: existing[key] || ''
    }));
  });

  const handleAddRoute = () => {
    setRoutes(prev => [...prev, { context: '', number: '' }]);
  };

  const handleRemoveRoute = (index: number) => {
    setRoutes(prev => prev.filter((_, i) => i !== index));
  };

  const handleChangeRoute = (index: number, field: 'context' | 'number', value: string) => {
    setRoutes(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    setErrorMsg('');

    try {
      // Validate: Ensure no duplicate contexts and contexts are selected
      const newMap: Record<string, string> = {};
      for (const route of routes) {
        if (!route.context) {
          throw new Error('Please select an action area for all routes.');
        }
        if (!route.number.trim()) {
          throw new Error('Please enter a WhatsApp number for all routes.');
        }
        if (newMap[route.context]) {
          throw new Error(`Duplicate action area selected: ${ROUTING_CONTEXTS.find(c => c.id === route.context)?.label}`);
        }
        newMap[route.context] = route.number;
      }

      await updateGeneralSettings({ ...settings, whatsappRouting: newMap });
      setSuccess('WhatsApp routing successfully updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <HeadphonesIcon className="w-6 h-6 text-blue-600" />
          Customer Support & WhatsApp Routing
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-sm shadow-blue-600/20 disabled:opacity-50"
        >
          {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 flex items-center gap-2 border border-green-100">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="font-medium text-sm">{success}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="font-medium text-sm">{errorMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-slate-800">WhatsApp Routing Manager</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">Map specific website actions to different WhatsApp numbers.</p>
          </div>
          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <PhoneCall className="w-3 h-3" /> Routing Active
          </div>
        </div>

        <div className="p-6">
          <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100/60 flex items-start gap-3 mb-6">
            <div className="mt-0.5 shrink-0 text-blue-500">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">How WhatsApp Routing Works</h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                By default, all WhatsApp buttons redirect to the general number configured in your "General Settings".
                Here, you can assign specific WhatsApp numbers to distinct parts of your website. For example, you can send RFQ form submissions straight to your Procurement Team, and Contact Page messages to General Support.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center justify-between px-1">
              Active WhatsApp Routes ({routes.length})
              {routes.length > 0 && (
                <button
                  onClick={handleAddRoute}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add More
                </button>
              )}
            </h3>
            
            {routes.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/30 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-400 mb-4">No custom WhatsApp routes configured.</p>
                <button
                  onClick={handleAddRoute}
                  className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add your first route
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {routes.map((route, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 rounded-xl bg-slate-50/30 items-center">
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 px-1">Action Area</label>
                      <select
                        value={route.context}
                        onChange={(e) => handleChangeRoute(idx, 'context', e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                      >
                        <option value="">-- Select an area --</option>
                        {ROUTING_CONTEXTS.map(ctx => (
                          <option key={ctx.id} value={ctx.id}>{ctx.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 px-1">WhatsApp Number</label>
                      <input
                        type="text"
                        value={route.number}
                        onChange={(e) => handleChangeRoute(idx, 'number', e.target.value)}
                        placeholder="e.g. +971 52 123 4567"
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                      />
                    </div>
                    <div className="pt-5 shrink-0">
                      <button
                        onClick={() => handleRemoveRoute(idx)}
                        className="text-slate-400 hover:text-red-500 p-2 rounded-lg transition-colors"
                        title="Remove Route"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
