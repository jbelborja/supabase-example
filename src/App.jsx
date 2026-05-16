import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from './supabaseClient';
import BookForm from './components/BookForm';
import BookList from './components/BookList';
import Auth from './components/Auth';
import './index.css';

function App() {
  const [session, setSession] = useState(null);
  const [books, setBooks] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const urlListener = CapacitorApp.addListener('appUrlOpen', async (event) => {
      if (event.url.includes('com.jbelborja.supabaseexample://login-callback')) {
        const url = new URL(event.url);
        // Supabase passes tokens in the hash
        const hashParams = new URLSearchParams(url.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      urlListener.then(listener => listener.remove());
    };
  }, []);

  useEffect(() => {
    if (session) {
      fetchBooks();
    }
  }, [session]);

  const fetchBooks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching books:', error);
    } else {
      setBooks(data);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-top">
          <h1>Library Dashboard</h1>
          <button onClick={handleSignOut} className="btn-secondary btn-sm">Sign Out</button>
        </div>
        <p>Manage your collection</p>
      </header>
      
      <main className="app-main">
        <div className="form-section">
          <BookForm 
            fetchBooks={fetchBooks} 
            editingBook={editingBook} 
            setEditingBook={setEditingBook} 
          />
        </div>
        
        <div className="list-section">
          {loading ? (
            <div className="loading">Loading books...</div>
          ) : (
            <BookList 
              books={books} 
              fetchBooks={fetchBooks} 
              setEditingBook={setEditingBook} 
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
