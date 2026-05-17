import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ItemList({ items, categories, onItemsChanged }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editCatId, setEditCatId] = useState('');

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  const handleToggle = async (item) => {
    await supabase.from('items').update({ checked: !item.checked }).eq('id', item.id);
    onItemsChanged();
  };

  const handleDelete = async (id) => {
    await supabase.from('items').delete().eq('id', id);
    onItemsChanged();
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditQty(String(item.quantity));
    setEditUnit(item.unit || '');
    setEditCatId(item.category_id || '');
  };

  const saveEdit = async (id) => {
    await supabase.from('items').update({
      name: editName,
      quantity: parseFloat(editQty) || 1,
      unit: editUnit,
      category_id: editCatId || null,
    }).eq('id', id);
    setEditingId(null);
    onItemsChanged();
  };

  if (!items || items.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🛒</span>
        <p>Your list is empty.<br />Add items using the form below.</p>
      </div>
    );
  }

  // Group items by category
  const grouped = {};
  const uncategorized = [];
  items.forEach(item => {
    if (item.category_id && catMap[item.category_id]) {
      const key = item.category_id;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    } else {
      uncategorized.push(item);
    }
  });

  const renderItem = (item) => {
    const isEditing = editingId === item.id;
    return (
      <div
        key={item.id}
        className={`item-row ${item.checked ? 'item-row--checked' : ''}`}
      >
        <button
          className={`item-check ${item.checked ? 'item-check--done' : ''}`}
          onClick={() => handleToggle(item)}
          aria-label={item.checked ? 'Uncheck' : 'Check'}
        >
          {item.checked ? '✓' : ''}
        </button>

        {isEditing ? (
          <div className="item-edit-row">
            <input className="item-edit-name" value={editName} onChange={e => setEditName(e.target.value)} />
            <input className="item-edit-qty" type="number" value={editQty} onChange={e => setEditQty(e.target.value)} />
            <input className="item-edit-unit" value={editUnit} onChange={e => setEditUnit(e.target.value)} placeholder="unit" />
            <select className="item-edit-cat" value={editCatId} onChange={e => setEditCatId(e.target.value)}>
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="btn-save" onClick={() => saveEdit(item.id)}>Save</button>
            <button className="btn-cancel-edit" onClick={() => setEditingId(null)}>✕</button>
          </div>
        ) : (
          <div className="item-content">
            <span className="item-name">{item.name}</span>
            {(item.quantity !== 1 || item.unit) && (
              <span className="item-qty">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
            )}
          </div>
        )}

        {!isEditing && (
          <div className="item-actions">
            <button className="btn-icon-sm" onClick={() => startEdit(item)} title="Edit">✎</button>
            <button className="btn-icon-sm btn-icon-danger" onClick={() => handleDelete(item.id)} title="Delete">✕</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="item-list">
      {categories.map(cat => {
        const catItems = grouped[cat.id];
        if (!catItems || catItems.length === 0) return null;
        return (
          <div key={cat.id} className="item-group">
            <div className="item-group-header">
              <span className="item-group-dot" style={{ background: cat.color }} />
              <span className="item-group-name">{cat.name}</span>
              <span className="item-group-count">{catItems.length}</span>
            </div>
            {catItems.map(renderItem)}
          </div>
        );
      })}

      {uncategorized.length > 0 && (
        <div className="item-group">
          <div className="item-group-header">
            <span className="item-group-dot" style={{ background: '#64748b' }} />
            <span className="item-group-name">Other</span>
            <span className="item-group-count">{uncategorized.length}</span>
          </div>
          {uncategorized.map(renderItem)}
        </div>
      )}
    </div>
  );
}
