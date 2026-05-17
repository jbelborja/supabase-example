import { useState } from 'react';
import { supabase } from '../supabaseClient';

const PRESET_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
  '#a855f7', '#06b6d4', '#f97316', '#ec4899',
  '#6366f1', '#14b8a6',
];

export default function CategoryManager({ listId, categories, onCategoriesChanged }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);

    const { error } = await supabase.from('categories').insert([{
      list_id: listId,
      name: name.trim(),
      color,
      position: categories.length,
    }]);

    if (error) {
      alert('Error adding category: ' + error.message);
    } else {
      setName('');
      onCategoriesChanged();
    }
    setAdding(false);
  };

  const handleDelete = async (catId) => {
    const { error } = await supabase.from('categories').delete().eq('id', catId);
    if (error) {
      alert('Error deleting category: ' + error.message);
    } else {
      onCategoriesChanged();
    }
  };

  return (
    <div className="category-manager">
      <h4 className="category-manager-title">Categories</h4>

      <div className="category-chips">
        {categories.map(cat => (
          <div
            key={cat.id}
            className="category-chip"
            style={{ '--cat-color': cat.color }}
          >
            <span className="category-dot" style={{ background: cat.color }} />
            {cat.name}
            <button
              className="category-chip-delete"
              onClick={() => handleDelete(cat.id)}
              title="Remove category"
            >✕</button>
          </div>
        ))}
      </div>

      <form className="category-add-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="New category…"
          value={name}
          onChange={e => setName(e.target.value)}
          className="category-input"
        />
        <div className="color-swatches">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`color-swatch ${color === c ? 'color-swatch--active' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <button type="submit" className="btn-secondary btn-sm" disabled={adding}>
          {adding ? '…' : '+ Add'}
        </button>
      </form>
    </div>
  );
}
