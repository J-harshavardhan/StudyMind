import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listCategories } from '../api/categories';
import { deleteNote, listNotes, toggleNotePin } from '../api/notes';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Loader from '../components/ui/Loader';
import useDebounce from '../hooks/useDebounce';

export default function Notes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [tag, setTag] = useState('');
  const [category, setCategory] = useState('');
  const [pinned, setPinned] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const debouncedQuery = useDebounce(query, 300);

  const loadNotes = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listNotes({ q: debouncedQuery || undefined, category: category || undefined, tag: tag || undefined, pinned: pinned || undefined, page, limit: 12 });
      setNotes(data.notes);
      setMeta(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load notes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listCategories().then(({ data }) => setCategories(data.categories)).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, category, tag, pinned]);

  useEffect(() => {
    loadNotes();
    setSearchParams((params) => {
      if (debouncedQuery) params.set('q', debouncedQuery);
      else params.delete('q');
      return params;
    }, { replace: true });
  }, [debouncedQuery, category, tag, pinned, page]);

  const removeNote = async () => {
    try {
      await deleteNote(deleting._id);
      toast.success('Note deleted.');
      setDeleting(null);
      await loadNotes();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not delete note.');
    }
  };

  const togglePin = async (note) => {
    try {
      const { data } = await toggleNotePin(note._id);
      setNotes((current) => current.map((item) => (item._id === note._id ? data.note : item)));
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not update pin.');
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4"><div><h1 className="h2 mb-1">Notes</h1><p className="text-body-secondary mb-0">Capture and revisit your ideas.</p></div><Link className="btn btn-primary" to="/notes/new">New note</Link></div>
      <div className="row g-2 mb-4">
        <div className="col-lg-5"><input className="form-control" placeholder="Search notes..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className="col-sm-4 col-lg-2"><select className="form-select" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option value={item._id} key={item._id}>{item.name}</option>)}</select></div>
        <div className="col-sm-4 col-lg-2"><input className="form-control" placeholder="Tag" value={tag} onChange={(event) => setTag(event.target.value)} /></div>
        <div className="col-sm-4 col-lg-3"><select className="form-select" value={pinned} onChange={(event) => setPinned(event.target.value)}><option value="">All notes</option><option value="true">Pinned</option><option value="false">Unpinned</option></select></div>
      </div>
      {loading && <Loader />}
      {!loading && error && <ErrorState message={error} onRetry={loadNotes} />}
      {!loading && !error && notes.length === 0 && <EmptyState title="No notes found" message="Create a note or adjust your filters." action={<Link className="btn btn-primary" to="/notes/new">Create note</Link>} />}
      {!loading && !error && notes.length > 0 && (
        <>
          <div className="row g-3">{notes.map((note) => <NoteCard key={note._id} note={note} onPin={togglePin} onDelete={setDeleting} />)}</div>
          {meta.totalPages > 1 && <nav className="mt-4"><ul className="pagination justify-content-center">{Array.from({ length: meta.totalPages }, (_, index) => index + 1).map((number) => <li className={`page-item ${number === page ? 'active' : ''}`} key={number}><button className="page-link" onClick={() => setPage(number)}>{number}</button></li>)}</ul></nav>}
        </>
      )}
      {deleting && <ConfirmDialog title="Delete note?" message={`Delete “${deleting.title}”? This cannot be undone.`} onCancel={() => setDeleting(null)} onConfirm={removeNote} />}
    </>
  );
}

function NoteCard({ note, onPin, onDelete }) {
  return <div className="col-md-6 col-xl-4"><article className="card h-100"><div className="card-body d-flex flex-column"><div className="d-flex justify-content-between gap-2"><Link className="text-decoration-none text-body" to={`/notes/${note._id}`}><h2 className="h5">{note.title}</h2></Link><button className="btn btn-sm btn-link text-decoration-none" aria-label={note.isPinned ? 'Unpin note' : 'Pin note'} onClick={() => onPin(note)}>{note.isPinned ? '★' : '☆'}</button></div><Link className="text-decoration-none text-body" to={`/notes/${note._id}`}><p className="text-body-secondary small flex-grow-1">{note.excerpt || 'No content'}</p></Link><div className="d-flex flex-wrap gap-1 mb-3">{note.category && <span className="badge text-bg-primary">{note.category.name}</span>}{note.tags?.map((tag) => <span className="badge text-bg-light border" key={tag}>#{tag}</span>)}</div>{note.deadline && <small className="text-body-secondary mb-3">Due {new Date(note.deadline).toLocaleDateString()}</small>}<div className="d-flex gap-2"><Link className="btn btn-sm btn-outline-primary" to={`/notes/${note._id}/edit`}>Edit</Link><button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(note)}>Delete</button></div></div></article></div>;
}
