import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ShoppingLists({ lists, activeListId, onSelectList, onListsChanged, session }) {
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const ownedLists = lists.filter(l => l.owner_id === session.user.id);
  const sharedLists = lists.filter(l => l.owner_id !== session.user.id);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    setCreating(true);

    const { error } = await supabase.from('shopping_lists').insert([{
      name: newListName.trim(),
      owner_id: session.user.id,
    }]);

    if (error) {
      alert('Error creating list: ' + error.message);
    } else {
      setNewListName('');
      setShowInput(false);
      onListsChanged();
    }
    setCreating(false);
  };

  const handleDelete = async (listId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this list and all its items?')) return;
    const { error } = await supabase.from('shopping_lists').delete().eq('id', listId);
    if (error) {
      alert('Error deleting list: ' + error.message);
    } else {
      if (activeListId === listId) onSelectList(null);
      onListsChanged();
    }
  };

  const ListItem = ({ list, isOwner }) => (
    <div
      key={list.id}
      className={`list-item ${activeListId === list.id ? 'list-item--active' : ''}`}
      onClick={() => onSelectList(list)}
    >
      <div className="list-item-icon">{list.name.charAt(0).toUpperCase()}</div>
      <div className="list-item-info">
        <span className="list-item-name">{list.name}</span>
        {!isOwner && <span className="list-item-badge">Shared</span>}
      </div>
      {isOwner && (
        <button
          className="list-item-delete"
          onClick={(e) => handleDelete(list.id, e)}
          title="Delete list"
        >
          ✕
        </button>
      )}
    </div>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>My Lists</h2>
        <button
          className="btn-icon btn-add-list"
          onClick={() => setShowInput(v => !v)}
          title="New list"
        >
          {showInput ? '✕' : '+'}
        </button>
      </div>

      {showInput && (
        <form className="new-list-form" onSubmit={handleCreate}>
          <input
            autoFocus
            type="text"
            placeholder="List name…"
            value={newListName}
            onChange={e => setNewListName(e.target.value)}
            className="new-list-input"
          />
          <button type="submit" className="btn-primary btn-sm" disabled={creating}>
            {creating ? '…' : 'Create'}
          </button>
        </form>
      )}

      <div className="lists-section">
        {ownedLists.length === 0 && sharedLists.length === 0 && (
          <p className="sidebar-empty">No lists yet.<br />Create one above!</p>
        )}

        {ownedLists.map(list => (
          <ListItem key={list.id} list={list} isOwner={true} />
        ))}

        {sharedLists.length > 0 && (
          <>
            <div className="sidebar-divider">Shared with me</div>
            {sharedLists.map(list => (
              <ListItem key={list.id} list={list} isOwner={false} />
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
