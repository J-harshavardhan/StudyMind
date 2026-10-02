import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../api/categories';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Loader from '../components/ui/Loader';

const iconKeys = ['book', 'bookmark', 'briefcase', 'calculator', 'calendar', 'camera', 'check', 'code', 'flask', 'folder', 'globe', 'heart', 'language', 'laptop', 'lightbulb', 'music', 'pen', 'pencil', 'rocket', 'school', 'star', 'target', 'terminal', 'wrench'];
const initialForm = { name: '', color: '#3366FF', icon: 'book' };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listCategories();
      setCategories(data.categories);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (category) => {
    setEditingId(category._id);
    setForm({ name: category.name, color: category.color, icon: category.icon });
    setShowModal(true);
  };

  const closeModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowModal(false);
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) await updateCategory(editingId, form);
      else await createCategory(form);
      toast.success(editingId ? 'Category updated.' : 'Category created.');
      closeModal();
      await loadCategories();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not save category.');
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async () => {
    try {
      await deleteCategory(deleting._id);
      toast.success('Category deleted.');
      setDeleting(null);
      await loadCategories();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not delete category.');
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h1 className="h2 mb-1">Categories</h1><p className="text-body-secondary mb-0">Organize your notes by topic.</p></div>
        <button className="btn btn-primary" onClick={openCreate}>New category</button>
      </div>
      {loading && <Loader />}
      {!loading && error && <ErrorState message={error} onRetry={loadCategories} />}
      {!loading && !error && categories.length === 0 && <EmptyState title="No categories yet" message="Create a category to keep your notes organized." action={<button className="btn btn-primary" onClick={openCreate}>Create category</button>} />}
      {!loading && !error && categories.length > 0 && (
        <div className="row g-3">
          {categories.map((category) => (
            <div className="col-sm-6 col-lg-4" key={category._id}>
              <div className="card h-100">
                <div className="card-body d-flex align-items-center gap-3">
                  <span className="color-chip" style={{ backgroundColor: category.color }} title={category.color} />
                  <div className="flex-grow-1"><h2 className="h5 mb-1">{category.name}</h2><small className="text-body-secondary">{category.icon}</small></div>
                  <div className="btn-group">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => openEdit(category)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleting(category)}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="modal d-block confirm-backdrop" role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={saveCategory}>
              <div className="modal-header"><h2 className="modal-title h5">{editingId ? 'Edit category' : 'New category'}</h2><button type="button" className="btn-close" onClick={closeModal} aria-label="Close" /></div>
              <div className="modal-body">
                <label className="form-label">Name<input className="form-control" required maxLength="40" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
                <label className="form-label">Color<input className="form-control form-control-color d-block" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} /></label>
                <label className="form-label">Icon<select className="form-select" value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })}>{iconKeys.map((icon) => <option key={icon}>{icon}</option>)}</select></label>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
            </form>
          </div>
        </div>
      )}
      {deleting && <ConfirmDialog title="Delete category?" message={`Notes using ${deleting.name} will be uncategorized.`} onCancel={() => setDeleting(null)} onConfirm={removeCategory} />}
    </>
  );
}
