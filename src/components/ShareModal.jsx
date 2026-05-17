import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function ShareModal({ list, onClose }) {
  const [email, setEmail] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shares, setShares] = useState([]);
  const [loadingShares, setLoadingShares] = useState(true);

  useEffect(() => {
    fetchShares();
  }, [list.id]);

  const fetchShares = async () => {
    setLoadingShares(true);
    const { data, error } = await supabase
      .from('list_shares')
      .select('*')
      .eq('list_id', list.id)
      .order('created_at', { ascending: true });

    if (!error) setShares(data || []);
    setLoadingShares(false);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;
    setSharing(true);

    // Look up user by email via auth.users (using RPC or profiles table)
    // We store the email and try to resolve the user ID if they already exist
    const { error } = await supabase.from('list_shares').insert([{
      list_id: list.id,
      shared_with_email: trimmedEmail,
    }]);

    if (error) {
      if (error.code === '23505') {
        alert('This list is already shared with that email.');
      } else {
        alert('Error sharing list: ' + error.message);
      }
    } else {
      setEmail('');
      fetchShares();
    }
    setSharing(false);
  };

  const handleRevoke = async (shareId) => {
    const { error } = await supabase.from('list_shares').delete().eq('id', shareId);
    if (error) {
      alert('Error revoking access: ' + error.message);
    } else {
      fetchShares();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Share <em>"{list.name}"</em></h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <form className="share-form" onSubmit={handleShare}>
          <div className="share-input-row">
            <input
              type="email"
              autoFocus
              placeholder="Invite by email address…"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="share-input"
            />
            <button type="submit" className="btn-primary" disabled={sharing}>
              {sharing ? '…' : 'Invite'}
            </button>
          </div>
          <p className="share-hint">
            The user must be registered. They'll see the list in their sidebar.
          </p>
        </form>

        <div className="share-list">
          <h4>Shared with</h4>
          {loadingShares ? (
            <p className="text-muted">Loading…</p>
          ) : shares.length === 0 ? (
            <p className="text-muted">Nobody else has access yet.</p>
          ) : (
            shares.map(share => (
              <div key={share.id} className="share-row">
                <span className="share-avatar">{share.shared_with_email.charAt(0).toUpperCase()}</span>
                <span className="share-email">{share.shared_with_email}</span>
                <button
                  className="btn-revoke"
                  onClick={() => handleRevoke(share.id)}
                  title="Revoke access"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
