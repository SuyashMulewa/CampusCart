/**
 * Reusable app component: L is ti ng Ed it or.
 */
// src/components/ListingEditor.tsx
import { useState } from 'react';
import type { Listing } from '@/types/models';

export function ListingEditor({ initial, onSave }: { initial?: Partial<Listing>, onSave: (data: Partial<Listing>) => void }) {
  const [form, setForm] = useState<Partial<Listing>>(initial || { title: '', price: 0, description: '', category: '', images: [] });
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" className="input input-bordered w-full" />
      <input type="number" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="Price" className="input input-bordered w-full" />
      <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" className="textarea textarea-bordered w-full" />
      {/* TODO: Add category and image upload fields */}
      <button type="submit" className="btn btn-primary">Save</button>
    </form>
  );
}

