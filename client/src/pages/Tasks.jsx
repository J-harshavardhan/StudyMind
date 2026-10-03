import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createTask,
  deleteTask,
  getTodayTasks,
  toggleTaskComplete,
  updateTask
} from '../api/tasks';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Loader from '../components/ui/Loader';
import { userError } from '../utils/userErrors';
import Select from '../components/ui/Select';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [dateKey, setDateKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [deleting, setDeleting] = useState(null);

  const loadTasks = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await getTodayTasks();
      setTasks(data.tasks || []);
      setDateKey(data.dateKey || '');
    } catch (requestError) {
      setError(
        getTaskRequestError(requestError, 'Could not load today’s tasks.')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const addTask = async (event) => {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      toast.error('Task title is required.');
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      const { data } = await createTask({
        title: trimmedTitle,
        dateKey: dateKey || undefined,
        priority,
        source: 'manual'
      });

      setTasks((current) => [...current, data.task]);
      setTitle('');
      setPriority('medium');
      toast.success('Task added.');
    } catch (requestError) {
      const message = getTaskRequestError(requestError, 'Could not create task.');
      setSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleComplete = async (task) => {
    try {
      const { data } = await toggleTaskComplete(task._id);

      setTasks((current) =>
        current.map((item) =>
          item._id === task._id ? data.task : item
        )
      );
    } catch (requestError) {
      toast.error(userError(requestError, 'Unable to update the task. Please try again.'));
    }
  };

  const removeTask = async () => {
    if (!deleting) return;

    try {
      await deleteTask(deleting._id);

      setTasks((current) =>
        current.filter((task) => task._id !== deleting._id)
      );

      toast.success('Task deleted.');
      setDeleting(null);
    } catch (requestError) {
      toast.error(userError(requestError, 'Unable to delete the task. Please try again.'));
    }
  };

  const editTask = async (task) => {
    const nextTitle = window.prompt('Update task title:', task.title);

    if (nextTitle === null) return;

    const trimmedTitle = nextTitle.trim();

    if (!trimmedTitle) {
      toast.error('Task title cannot be empty.');
      return;
    }

    try {
      const { data } = await updateTask(task._id, {
        title: trimmedTitle
      });

      setTasks((current) =>
        current.map((item) =>
          item._id === task._id ? data.task : item
        )
      );

      toast.success('Task updated.');
    } catch (requestError) {
      toast.error(userError(requestError, 'Unable to update the task. Please try again.'));
    }
  };

  const completedCount = tasks.filter(
    (task) => task.isCompleted
  ).length;

  return (
    <>
      <div className="feature-header page-enter">
        <div>
          <p className="eyebrow">Daily execution</p>
          <h1>Tasks</h1>
          <p className="lede">Turn your priorities into visible, achievable progress.</p>
        </div>
        <div className="feature-header-meta"><div className="feature-visual checklist-visual" aria-hidden="true"><span>✓</span><i /><i /><i /></div>{dateKey && <span className="date-pill">{formatDate(dateKey)}</span>}</div>
      </div>

      <div className="surface-card task-composer mb-4 page-enter delay-1">
        <div className="card-body">
          <form onSubmit={addTask}>
            {saveError && <div className="alert alert-danger py-2 mb-3" role="alert">{saveError}</div>}
            <div className="row g-2">
              <div className="col-lg-7">
                <label className="form-label">New task</label>
                <input
                  className="form-control"
                  placeholder="What do you want to accomplish?"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={200}
                />
              </div>

              <div className="col-sm-6 col-lg-3">
                <Select label="Priority" value={priority} onChange={setPriority} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
              </div>

              <div className="col-sm-6 col-lg-2 d-flex align-items-end">
                <button
                  className="btn btn-primary w-100"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Adding...' : 'Add task'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {!loading && !error && tasks.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mb-3 page-enter delay-2">
          <span className="text-body-secondary">
            {completedCount} of {tasks.length} completed
          </span>

          <div
            className="progress"
            style={{ width: '180px', height: '8px' }}
            aria-label="Task completion progress"
          >
            <div
              className="progress-bar"
              style={{
                width: `${
                  tasks.length
                    ? (completedCount / tasks.length) * 100
                    : 0
                }%`
              }}
            />
          </div>
        </div>
      )}

      {loading && <Loader />}

      {!loading && error && (
        <ErrorState message={error} onRetry={loadTasks} />
      )}

      {!loading && !error && tasks.length === 0 && (
        <EmptyState
          title="No tasks for today"
          message="Add your first study task above."
        />
      )}

      {!loading && !error && tasks.length > 0 && (
        <div className="card task-list page-enter delay-2">
          <div className="list-group list-group-flush">
            {tasks.map((task) => (
              <div
                className="list-group-item py-3"
                key={task._id}
              >
                <div className="d-flex align-items-center gap-3">
                  <input
                    className="form-check-input flex-shrink-0"
                    type="checkbox"
                    checked={Boolean(task.isCompleted)}
                    onChange={() => toggleComplete(task)}
                    aria-label={`Mark ${task.title} ${
                      task.isCompleted
                        ? 'incomplete'
                        : 'complete'
                    }`}
                  />

                  <div className="flex-grow-1">
                    <div
                      className={
                        task.isCompleted
                          ? 'text-decoration-line-through text-body-secondary'
                          : ''
                      }
                    >
                      {task.title}
                    </div>

                    <div className="mt-1">
                      <span
                        className={`badge ${
                          task.priority === 'high'
                            ? 'text-bg-danger'
                            : task.priority === 'low'
                              ? 'text-bg-success'
                              : 'text-bg-warning'
                        }`}
                      >
                        {task.priority || 'medium'}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => editTask(task)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => setDeleting(task)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete task?"
          message={`Delete “${deleting.title}”? This cannot be undone.`}
          onCancel={() => setDeleting(null)}
          onConfirm={removeTask}
        />
      )}
    </>
  );
}

function formatDate(value) {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(
    undefined,
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }
  );
}

function getTaskRequestError(requestError, fallback) {
  if (requestError.request) {
    return 'The StudyMind API is not reachable. Start the API with “npm.cmd run dev:memory”, then retry.';
  }

  return userError(requestError, fallback);
}