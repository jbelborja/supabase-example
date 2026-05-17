import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AddItemForm({ listId, categories, onItemAdded }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);

    const { error } = await supabase.from('items').insert([{
      list_id: listId,
      category_id: categoryId || null,
      name: name.trim(),
      quantity: parseFloat(quantity) || 1,
      unit: unit.trim(),
      checked: false,
    }]);

    if (error) {
      alert('Error adding item: ' + error.message);
    } else {
      setName('');
      setQuantity('1');
      setUnit('');
      onItemAdded();
    }
    setAdding(false);
  };

  return (
    <form className="add-item-form" onSubmit={handleSubmit}>
      <div className="add-item-row">
        <input
          type="text"
          placeholder="Add an item…"
          value={name}
          onChange={e => setName(e.target.value)}
          className="add-item-name"
          required
        />
        <input
          type="number"
          placeholder="Qty"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          className="add-item-qty"
          min="0"
          step="any"
        />
        <input
          type="text"
          placeholder="Unit"
          value={unit}
          onChange={e => setUnit(e.target.value)}
          className="add-item-unit"
        />
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className="add-item-category"
        >
          <option value="">No category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <button type="submit" className="btn-primary" disabled={adding}>
          {adding ? '…' : 'Add'}
        </button>
      </div>
    </form>
  );
}
