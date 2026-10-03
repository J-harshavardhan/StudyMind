import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listCategories } from '../api/categories';
import { createNote, getNote, updateNote } from '../api/notes';
import Loader from '../components/ui/Loader';
import ErrorState from '../components/ui/ErrorState';
import MarkdownEditor from '../components/notes/MarkdownEditor';
import Select from '../components/ui/Select';
import { userError } from '../utils/userErrors';

const emptyForm = { title: '', content: '', tags: '', category: '', deadline: '', isPinned: false };

export default function NoteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listCategories().then(({ data }) => setCategories(data.categories)).catch(() => setCategories([]));
    if (id) {
      getNote(id).then(({ data }) => setForm({ ...data.note, tags: data.note.tags?.join(', ') || '', category: data.note.category?._id || data.note.category || '', deadline: data.note.deadline ? data.note.deadline.slice(0, 10) : '' })).catch((requestError) => setError(userError(requestError, 'Unable to load the note. Please try again.'))).finally(() => setLoading(false));
    }
  }, [id]);

  const save = async (event) => {
    event?.preventDefault();
    setSaving(true);
    const payload = { ...form, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean), category: form.category || null, deadline: form.deadline || null };
    delete payload._id;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.wordCount;
    delete payload.lastViewedAt;
    try {
      if (id) await updateNote(id, payload);
      else await createNote(payload);
      toast.success(id ? 'Note updated.' : 'Note created.');
      navigate('/notes');
    } catch (requestError) {
      toast.error(userError(requestError, 'Unable to save the note. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  return <form className="note-form" onSubmit={save}><div className="d-flex justify-content-between align-items-center mb-4"><h1 className="h2">{id ? 'Edit note' : 'New note'}</h1><Link className="secondary-button" to="/notes">Cancel</Link></div><div className="mb-3"><label className="form-label">Title<input className="form-control note-title-input" required maxLength="200" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label></div><div className="mb-3"><label className="form-label w-100">Content<MarkdownEditor value={form.content} onChange={(content) => setForm({ ...form, content })} onSave={save} /></label></div><div className="row g-3 mb-3"><div className="col-md-4"><label className="form-label">Tags<input className="form-control" placeholder="study, maths" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} /></label></div><div className="col-md-4"><Select label="Category" value={form.category} onChange={(category) => setForm({ ...form, category })} options={[{ value: '', label: 'None' }, ...categories.map((category) => ({ value: category._id, label: category.name }))]} /></div><div className="col-md-4"><label className="form-label">Deadline<input className="form-control" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></label></div></div><div className="form-check mb-4"><input className="form-check-input" id="pinned" type="checkbox" checked={form.isPinned} onChange={(event) => setForm({ ...form, isPinned: event.target.checked })} /><label className="form-check-label" htmlFor="pinned">Pin this note</label></div><button className="primary-button" disabled={saving}>{saving ? 'Saving...' : 'Save note'}</button></form>;
}
