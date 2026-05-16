import { useState, useEffect } from 'react';
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

    return () => subscription.unsubscribe();
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
