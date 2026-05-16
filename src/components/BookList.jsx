import { supabase } from '../supabaseClient';

export default function BookList({ books, fetchBooks, setEditingBook }) {
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this book?')) {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);
        
      if (error) {
        alert('Error deleting book: ' + error.message);
      } else {
        fetchBooks();
      }
    }
  };

  if (!books || books.length === 0) {
    return <div className="empty-state">No books found. Add one above!</div>;
  }

  return (
    <div className="book-list">
      <h3>Book Library</h3>
      <div className="books-grid">
        {books.map((book) => (
          <div key={book.id} className="book-card">
            <div className="book-info">
              <h4>{book.title}</h4>
              <p className="book-author">By {book.author}</p>
              <p className="book-date">Published: {new Date(book.publish_date).toLocaleDateString()}</p>
            </div>
            <div className="book-actions">
              <button 
                className="btn-edit" 
                onClick={() => setEditingBook(book)}
              >
                Edit
              </button>
              <button 
                className="btn-delete" 
                onClick={() => handleDelete(book.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
