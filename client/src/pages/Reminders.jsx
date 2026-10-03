import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createReminder,
  deleteReminder,
  getUpcomingReminders,
  updateReminder,
  updateReminderStatus
} from '../api/reminders';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Loader from '../components/ui/Loader';
import Select from '../components/ui/Select';
import { userError } from '../utils/userErrors';

const initialForm = {
  title: '',
  dateKey: getTodayKey(),
  time: '17:00',
  duration: '',
  description: '',
  repeat: 'none',
  reminderOffset: 0,
  ringtoneType: 'default'
};

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [alarm, setAlarm] = useState(null);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [customRingtone] = useState(() => localStorage.getItem('studymind_custom_ringtone') || '');
  const notified = useRef(new Set());

  const loadReminders = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getUpcomingReminders();
      setReminders(data.reminders || []);
    } catch (requestError) {
      setError(userError(requestError, 'Unable to load your reminders. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
    const interval = window.setInterval(loadReminders, 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const check = () => {
      if (getReminderSettings().enabled === false) return;
      const now = new Date();
      reminders.forEach((reminder) => {
        const due = new Date(`${reminder.dateKey}T${reminder.time}:00+05:30`);
        const triggerAt = due.getTime() - Number(reminder.reminderOffset || 0) * 60000;
        const effectiveTrigger = reminder.snoozedUntil ? new Date(reminder.snoozedUntil).getTime() : triggerAt;
        if (Math.abs(now.getTime() - effectiveTrigger) < 30000 && !notified.current.has(reminder._id)) {
          notified.current.add(reminder._id);
          setAlarm(reminder);
          notifyBrowser(reminder.title);
          void playAlarm(customRingtone, getReminderSettings()).then((played) => {
            if (!played) setSoundBlocked(true);
          });
          void updateReminderStatus(reminder._id, 'triggered');
        }
      });
    };
    check();
    const interval = window.setInterval(check, 30000);
    return () => window.clearInterval(interval);
  }, [reminders]);

  const save = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || saving) return;
    setSaving(true);
    try {
      const payload = { ...form, title: form.title.trim(), duration: form.duration ? Number(form.duration) : undefined };
      const { data } = editing
        ? await updateReminder(editing.seriesId || editing._id, payload)
        : await createReminder(payload);
      if (editing) await loadReminders();
      else setReminders((current) => [...current, data.reminder].sort(sortReminders));
      setForm(initialForm);
      setEditing(null);
      toast.success(editing ? 'Reminder series updated.' : 'Reminder scheduled.');
    } catch (requestError) {
      toast.error(userError(requestError, 'Unable to save your reminder. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (reminder, status) => {
    try {
      const { data } = await updateReminderStatus(reminder.seriesId || reminder._id, status, reminder.occurrenceDateKey);
      setReminders((current) => current.map((item) => item._id === reminder._id ? data.reminder : item));
      if (alarm?._id === reminder._id) setAlarm(null);
      toast.success(status === 'snoozed' ? 'Snoozed for 5 minutes.' : `Reminder ${status}.`);
    } catch (requestError) {
      toast.error(userError(requestError, 'Unable to update your reminder. Please try again.'));
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await deleteReminder(deleting._id);
      setReminders((current) => current.filter((item) => item.seriesId !== deleting.seriesId));
      setDeleting(null);
      toast.success('Reminder deleted.');
    } catch (requestError) {
      toast.error(userError(requestError, 'Unable to delete your reminder. Please try again.'));
    }
  };

  const upcoming = useMemo(() => reminders.filter((item) => item.status === 'upcoming' || item.status === 'snoozed'), [reminders]);
  const reminderSeries = useMemo(() => {
    const groups = new Map();
    upcoming.forEach((reminder) => {
      const key = reminder.seriesId || reminder._id;
      const current = groups.get(key) || [];
      current.push(reminder);
      groups.set(key, current);
    });
    return [...groups.values()].map((occurrences) => ({
      next: occurrences[0],
      occurrences: occurrences.slice(0, 3),
      total: occurrences.length
    }));
  }, [upcoming]);

  return (
    <div className="reminders-page page-enter">
      <div className="feature-header">
        <div><p className="eyebrow">Plan your focus</p><h1>Reminders</h1><p className="lede">Give your important study sessions a time and a gentle nudge.</p></div>
        <div className="feature-visual reminder-visual" aria-hidden="true"><span>◷</span><i /><i /><i /></div>
      </div>
      <div className="row g-4">
        <div className="col-xl-5">
          <form className="surface-card reminder-form" onSubmit={save}>
            <p className="eyebrow">New session</p><h2 className="h4">Schedule study time</h2>
            <label className="form-label">Title<input className="form-control" required maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Study DSA" /></label>
            <div className="row g-2"><label className="col-7 form-label">Date<input className="form-control" required type="date" value={form.dateKey} onChange={(event) => setForm({ ...form, dateKey: event.target.value })} /></label><label className="col-5 form-label">Time<input className="form-control" required type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} /></label></div>
            <div className="row g-2"><label className="col-6 form-label">Duration (minutes)<input className="form-control" type="number" min="1" max="1440" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} placeholder="60" /></label><div className="col-6"><Select label="Repeat" value={form.repeat} onChange={(repeat) => setForm({ ...form, repeat })} options={[{ value: 'none', label: 'None' }, { value: 'daily', label: 'Daily' }, { value: 'weekdays', label: 'Weekdays' }, { value: 'weekly', label: 'Weekly' }]} /></div></div>
            <Select label="Remind me" value={String(form.reminderOffset)} onChange={(reminderOffset) => setForm({ ...form, reminderOffset: Number(reminderOffset) })} options={[{ value: '0', label: 'At the scheduled time' }, { value: '5', label: '5 minutes before' }, { value: '10', label: '10 minutes before' }, { value: '15', label: '15 minutes before' }]} />
            <Select label="Ringtone" value={form.ringtoneType} onChange={(ringtoneType) => setForm({ ...form, ringtoneType })} options={[{ value: 'default', label: 'StudyMind Alarm' }, ...(customRingtone ? [{ value: 'custom', label: 'Custom local ringtone' }] : [])]} />
            {form.ringtoneType === 'custom' && customRingtone && <audio className="w-100 mb-2" controls src={customRingtone} />}
            <label className="form-label">Description<textarea className="form-control" rows="2" maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What will you focus on?" /></label>
            <button className="primary-button w-100" disabled={saving}>{saving ? 'Scheduling...' : 'Schedule reminder →'}</button>
          </form>
        </div>
        <div className="col-xl-7">
          <div className="surface-card reminders-list"><div className="section-heading"><div><p className="eyebrow">Asia/Kolkata</p><h2>Upcoming sessions</h2></div><span className="muted-label">{reminderSeries.length} {reminderSeries.length === 1 ? 'series' : 'series'}</span></div>
            {loading && <Loader />}
            {!loading && error && <ErrorState message={error} onRetry={loadReminders} />}
            {!loading && !error && reminderSeries.length === 0 && <EmptyState title="No reminders yet" message="Schedule a study session and let your future self know what matters." />}
            {!loading && !error && reminderSeries.length > 0 && <div className="reminder-items">{reminderSeries.map((series) => <ReminderItem key={series.next.seriesId || series.next._id} {...series} onStatus={changeStatus} onDelete={setDeleting} onEdit={(item) => { setEditing(item); setForm({ ...item, duration: item.duration || '' }); }} />)}</div>}
          </div>
        </div>
      </div>
      {alarm && <AlarmModal reminder={alarm} soundBlocked={soundBlocked} onPlaySound={() => { setSoundBlocked(false); void playAlarm(customRingtone, getReminderSettings()).then((played) => { if (!played) setSoundBlocked(true); }); }} onStart={() => changeStatus(alarm, 'completed')} onSnooze={() => changeStatus(alarm, 'snoozed')} onDismiss={() => changeStatus(alarm, 'dismissed')} />}
      {deleting && <ConfirmDialog title="Delete reminder?" message={`Remove “${deleting.title}”?`} onCancel={() => setDeleting(null)} onConfirm={remove} />}
    </div>
  );
}

function ReminderItem({ next: reminder, occurrences, total, onStatus, onDelete, onEdit }) {
  const isRecurring = reminder.repeat !== 'none';
  const nextDateKey = reminder.occurrenceDateKey || reminder.dateKey;
  return <article className="reminder-item">
    <div className="reminder-time"><strong>{formatTime(reminder.time)}</strong><small>Next: {formatDate(nextDateKey)}</small></div>
    <div className="reminder-copy"><strong>{reminder.title}</strong><span>{reminder.duration ? `${reminder.duration} min · ` : ''}{labelForRepeat(reminder.repeat)}{reminder.reminderOffset ? ` · ${reminder.reminderOffset} min before` : ''}</span>{reminder.description && <p>{reminder.description}</p>}<small className="reminder-state">{reminder.status}</small>{isRecurring && <div className="reminder-occurrences"><span>Next sessions</span>{occurrences.map((occurrence) => <time key={occurrence._id}>{formatDate(occurrence.occurrenceDateKey || occurrence.dateKey)}</time>)}{total > occurrences.length && <em>+{total - occurrences.length} more</em>}</div>}</div>
    <div className="reminder-actions"><button className="btn btn-sm btn-outline-success" onClick={() => onStatus(reminder, 'completed')}>Complete occurrence</button><button className="btn btn-sm btn-outline-secondary" onClick={() => onEdit(reminder)}>Edit series</button><button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(reminder)}>Delete series</button></div>
  </article>;
}

function AlarmModal({ reminder, soundBlocked, onPlaySound, onStart, onSnooze, onDismiss }) {
  return <div className="alarm-backdrop"><div className="alarm-modal" role="dialog" aria-modal="true" aria-labelledby="alarm-title"><div className="alarm-bell" aria-hidden="true">◷</div><p className="eyebrow">Study reminder</p><h2 id="alarm-title">{reminder.title}</h2><p>{formatTime(reminder.time)} · {reminder.duration || 0} min</p>{soundBlocked && <p className="alert alert-warning py-2">Sound was blocked by your browser. Choose Play sound after interacting with the page.</p>}<div className="alarm-actions"><button className="primary-button" onClick={onPlaySound}>Play sound</button><button className="primary-button" onClick={onStart}>Start studying</button><button className="secondary-button" onClick={onSnooze}>Snooze 5 min</button><button className="btn btn-link" onClick={onDismiss}>Dismiss</button></div></div></div>;
}

function sortReminders(a, b) { return `${a.dateKey}${a.time}`.localeCompare(`${b.dateKey}${b.time}`); }
function getTodayKey() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()); }
function formatDate(value) { return new Date(`${value}T00:00:00+05:30`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
function formatTime(value) { return new Date(`1970-01-01T${value}:00`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
function labelForRepeat(value) { return value === 'none' ? 'One time' : value.charAt(0).toUpperCase() + value.slice(1); }
function notifyBrowser(title) {
  let enabled = true;
  try {
    enabled = JSON.parse(localStorage.getItem('studymind_reminder_settings'))?.enabled !== false;
  } catch {
    enabled = true;
  }
  let notifications = false;
  try {
    notifications = JSON.parse(localStorage.getItem('studymind_reminder_settings'))?.notifications === true;
  } catch {
    notifications = false;
  }
  if (enabled && notifications && 'Notification' in window && globalThis.Notification.permission === 'granted') {
    new globalThis.Notification('StudyMind reminder', { body: title });
  }
}
function getReminderSettings() {
  try { return JSON.parse(localStorage.getItem('studymind_reminder_settings')) || {}; } catch { return {}; }
}
async function playAlarm(customSource, settings = {}) {
  if (settings.soundEnabled === false) return true;
  if (customSource) {
    const audio = new globalThis.Audio(customSource);
    audio.volume = Number(settings.volume ?? 0.4);
    try { await audio.play(); return true; } catch { return false; }
  }
  try { const context = new globalThis.AudioContext(); const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.frequency.value = 880; gain.gain.value = Number(settings.volume ?? 0.4) * 0.1; oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.35); return true; } catch { return false; }
}
