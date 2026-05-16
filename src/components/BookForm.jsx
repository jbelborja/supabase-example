import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function BookForm({ fetchBooks, editingBook, setEditingBook }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publishDate, setPublishDate] = useState('');

  useEffect(() => {
    if (editingBook) {
      setTitle(editingBook.title);
      setAuthor(editingBook.author);
      setPublishDate(editingBook.publish_date);
    } else {
      resetForm();
    }
  }, [editingBook]);

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setPublishDate('');
    setEditingBook(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingBook) {
      const { error } = await supabase
        .from('books')
        .update({ title, author, publish_date: publishDate })
        .eq('id', editingBook.id);
      
      if (error) {
        alert('Error updating book: ' + error.message);
      }
    } else {
      const { error } = await supabase
        .from('books')
        .insert([{ title, author, publish_date: publishDate }]);
        
      if (error) {
        alert('Error creating book: ' + error.message);
      }
    }
    resetForm();
    fetchBooks();
  };

  return (
    <form className="book-form" onSubmit={handleSubmit}>
      <h3>{editingBook ? 'Edit Book' : 'Add New Book'}</h3>
      <div className="form-group">
        <label>Title</label>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          required 
          placeholder="e.g. The Hobbit"
        />
      </div>
      <div className="form-group">
        <label>Author</label>
        <input 
          type="text" 
          value={author} 
          onChange={(e) => setAuthor(e.target.value)} 
          required 
          placeholder="e.g. J.R.R. Tolkien"
        />
      </div>
      <div className="form-group">
        <label>Publish Date</label>
        <input 
          type="date" 
          value={publishDate} 
          onChange={(e) => setPublishDate(e.target.value)} 
          required 
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary">
          {editingBook ? 'Update Book' : 'Add Book'}
        </button>
        {editingBook && (
          <button type="button" className="btn-secondary" onClick={resetForm}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
