'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { CollectionItem } from '@/lib/types'

const MATERIALS = [
  // Aluminum
  'Aluminum',
  'Raw Aluminum',
  '7075 Aluminum',
  'Anodized Aluminum',
  'Cerakote Aluminum',
  // Copper-based
  'Copper',
  'Brass',
  'Bronze',
  // Exotic
  'Zirconium',
  'Zircuti',
  'Timascus',
  'Damasteel',
  'Damasteel Fenja',
  'Other',
]

function initMaterialState(material: string | null) {
  if (!material) return { selected: '', custom: '' }
  if (MATERIALS.includes(material)) return { selected: material, custom: '' }
  return { selected: 'Other', custom: material }
}

type Props = {
  item: CollectionItem
  onClose: () => void
  onSave: (id: string, updates: Partial<CollectionItem>) => void
}

export default function CollectionEditModal({ item, onClose, onSave }: Props) {
  const matInit = initMaterialState(item.material)
  const [selectedMaterial, setSelectedMaterial] = useState(matInit.selected)
  const [customMaterial, setCustomMaterial] = useState(matInit.custom)
  const [color, setColor] = useState(item.color ?? '')
  const [purchasePrice, setPurchasePrice] = useState(item.purchase_price?.toString() ?? '')
  const [purchaseDate, setPurchaseDate] = useState(item.purchase_date ?? '')
  const [quantity, setQuantity] = useState((item.quantity ?? 1).toString())
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const effectiveMaterial =
      selectedMaterial === 'Other' ? customMaterial.trim() : selectedMaterial
    const updates = {
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      material: effectiveMaterial || null,
      color: color.trim() || null,
      purchase_date: purchaseDate || null,
      quantity: Math.max(1, parseInt(quantity) || 1),
    }
    await supabase.from('user_collections').update(updates).eq('id', item.id)
    onSave(item.id, updates)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
          <X size={18} />
        </button>

        <p className="text-xs text-slate-400 mb-0.5">{item.flashlights.brand}</p>
        <h2 className="font-bold text-slate-900 mb-5">{item.flashlights.model}</h2>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Purchase Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Purchase Date</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Material</label>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
            >
              <option value="">— Select material —</option>
              {MATERIALS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {selectedMaterial === 'Other' && (
              <input
                type="text"
                value={customMaterial}
                onChange={(e) => setCustomMaterial(e.target.value)}
                placeholder="Enter material…"
                className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Color</label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. Black, Desert Tan, OD Green…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 text-sm py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white text-sm py-2 rounded-lg font-medium transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
