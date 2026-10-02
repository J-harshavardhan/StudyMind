import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { deleteNote, getNote, toggleNotePin } from '../api/notes';
import MarkdownViewer from '../components/notes/MarkdownViewer';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ErrorState from '../components/ui/ErrorState';
import Loader from '../components/ui/Loader';

export default function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadNote = () => {
    setError('');
    getNote(id).then(({ data }) => setNote(data.note)).catch((requestError) => setError(requestError.response?.data?.message || 'Could not load note.'));
  };

  useEffect(loadNote, [id]);

  const togglePin = async () => {
    try {
      const { data } = await toggleNotePin(id);
      setNote(data.note);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not update pin.');
    }
  };

  const removeNote = async () => {
    try {
      await deleteNote(id);
      toast.success('Note deleted.');
      navigate('/notes');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not delete note.');
    }
  };

  if (error) return <ErrorState message={error} onRetry={loadNote} />;
  if (!note) return <Loader />;
  return (
    <>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div><h1 className="h2 mb-2">{note.title}</h1><div className="d-flex flex-wrap gap-2">{note.category && <span className="badge text-bg-primary">{note.category.name}</span>}{note.tags?.map((tag) => <span className="badge text-bg-light border" key={tag}>#{tag}</span>)}{note.deadline && <span className="text-body-secondary small">Due {new Date(note.deadline).toLocaleDateString()}</span>}</div></div>
        <button className="btn btn-outline-secondary" onClick={togglePin} aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}>{note.isPinned ? '★ Pinned' : '☆ Pin'}</button>
      </div>
      <MarkdownViewer content={note.content} />
      <div className="d-flex gap-2 mt-4"><Link className="btn btn-primary" to={`/notes/${id}/edit`}>Edit</Link><button className="btn btn-outline-danger" onClick={() => setDeleting(true)}>Delete</button><Link className="btn btn-outline-secondary" to="/notes">Back to notes</Link></div>
      {deleting && <ConfirmDialog title="Delete note?" message={`Delete “${note.title}”? This cannot be undone.`} onCancel={() => setDeleting(false)} onConfirm={removeNote} />}
    </>
  );
}
