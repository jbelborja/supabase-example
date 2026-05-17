import { useState, useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from './supabaseClient';
import ShoppingLists from './components/ShoppingLists';
import ItemList from './components/ItemList';
import AddItemForm from './components/AddItemForm';
import CategoryManager from './components/CategoryManager';
import ShareModal from './components/ShareModal';
import Auth from './components/Auth';
import './index.css';

function App() {
  const [session, setSession] = useState(null);
  const [lists, setLists] = useState([]);
  const [activeList, setActiveList] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const realtimeRef = useRef(null);

  // ─── Auth ────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const urlListener = CapacitorApp.addListener('appUrlOpen', async (event) => {
      if (event.url.includes('com.jbelborja.supabaseexample://login-callback')) {
        const url = new URL(event.url);
        const hashParams = new URLSearchParams(url.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      urlListener.then(l => l.remove());
    };
  }, []);

  // ─── Fetch lists ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (session) fetchLists();
  }, [session]);

  const fetchLists = async () => {
    setLoading(true);
    const { data: owned } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: true });

    const { data: shares } = await supabase
      .from('list_shares')
      .select('list_id, shopping_lists(*)')
      .eq('shared_with_id', session.user.id);

    const sharedLists = (shares || []).map(s => s.shopping_lists).filter(Boolean);
    const all = [...(owned || []), ...sharedLists];
    setLists(all);
    setLoading(false);
  };

  // ─── Fetch items + categories for active list ─────────────────────────────
  useEffect(() => {
    if (!activeList) {
      setItems([]);
      setCategories([]);
      return;
    }
    fetchCategories();
    fetchItems();
    subscribeRealtime();

    return () => {
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
    };
  }, [activeList?.id]);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('list_id', activeList.id)
      .order('created_at', { ascending: true });
    setItems(data || []);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('list_id', activeList.id)
      .order('position', { ascending: true });
    setCategories(data || []);
  };

  const subscribeRealtime = () => {
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    const channel = supabase
      .channel(`items:${activeList.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'items',
        filter: `list_id=eq.${activeList.id}`,
      }, () => fetchItems())
      .subscribe();
    realtimeRef.current = channel;
  };

  const handleSignOut = async () => {
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    await supabase.auth.signOut();
    setActiveList(null);
    setLists([]);
  };

  const checkedCount = items.filter(i => i.checked).length;
  const progress = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  if (!session) return <Auth />;

  return (
    <div className="app-shell">
      {/* ── Top bar ── */}
      <header className="topbar">
        <button className="btn-icon topbar-menu" onClick={() => setSidebarOpen(v => !v)} title="Toggle sidebar">
          ☰
        </button>
        <div className="topbar-brand">
          <span className="topbar-logo">🛒</span>
          <span className="topbar-title">ShopList</span>
        </div>
        <div className="topbar-actions">
          {activeList && (
            <>
              <button className="btn-ghost btn-sm" onClick={() => setShowCategories(v => !v)}>
                🏷 Categories
              </button>
              <button className="btn-ghost btn-sm" onClick={() => setShowShare(true)}>
                🔗 Share
              </button>
            </>
          )}
          <button className="btn-ghost btn-sm" onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

      <div className="app-body">
        {/* ── Sidebar ── */}
        <div className={`sidebar-wrapper ${sidebarOpen ? 'sidebar-wrapper--open' : ''}`}>
          {!loading && (
            <ShoppingLists
              lists={lists}
              activeListId={activeList?.id}
              onSelectList={(list) => { setActiveList(list); setSidebarOpen(false); }}
              onListsChanged={fetchLists}
              session={session}
            />
          )}
        </div>

        {/* ── Main content ── */}
        <main className="main-content">
          {!activeList ? (
            <div className="welcome">
              <div className="welcome-icon">🛒</div>
              <h2>Welcome to ShopList</h2>
              <p>Select or create a shopping list to get started.</p>
            </div>
          ) : (
            <div className="list-view">
              {/* List header */}
              <div className="list-header">
                <div>
                  <h2 className="list-title">{activeList.name}</h2>
                  <p className="list-meta">
                    {items.length} item{items.length !== 1 ? 's' : ''} · {checkedCount} checked
                  </p>
                </div>
                {items.length > 0 && (
                  <div className="progress-wrap">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="progress-label">{progress}%</span>
                  </div>
                )}
              </div>

              {/* Category manager (collapsible) */}
              {showCategories && (
                <CategoryManager
                  listId={activeList.id}
                  categories={categories}
                  onCategoriesChanged={fetchCategories}
                />
              )}

              {/* Items */}
              <ItemList
                items={items}
                categories={categories}
                onItemsChanged={fetchItems}
              />

              {/* Add item form */}
              <AddItemForm
                listId={activeList.id}
                categories={categories}
                onItemAdded={fetchItems}
              />
            </div>
          )}
        </main>
      </div>

      {/* ── Share modal ── */}
      {showShare && activeList && (
        <ShareModal list={activeList} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}

export default App;
