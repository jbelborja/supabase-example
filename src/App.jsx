import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import BookForm from './components/BookForm';
import BookList from './components/BookList';
import './index.css';

function App() {
  const [books, setBooks] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, []);

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

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Library Dashboard</h1>
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
