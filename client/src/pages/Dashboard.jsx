import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTodayTasks } from '../api/tasks';
import { getUpcomingReminders } from '../api/reminders';
import { listNotes } from '../api/notes';

const quickActions = [
  { to: '/tasks', label: 'Plan a task', detail: 'Organize your next win', icon: '✓', tone: 'violet' },
  { to: '/notes/new', label: 'Capture an idea', detail: 'Turn thoughts into notes', icon: '✦', tone: 'cyan' },
  { to: '/calendar', label: 'View calendar', detail: 'See what is coming up', icon: '□', tone: 'amber' },
  { to: '/reminders', label: 'Add reminder', detail: 'Protect your focus time', icon: '◷', tone: 'green' }
  ,{ to: '/focus', label: 'Start focus', detail: 'Create a calm work block', icon: '◉', tone: 'violet' }
];

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Learner';
  const streak = user?.streak?.current || 0;
  const [summary, setSummary] = useState({ tasks: [], reminders: [], notes: 0 });

  useEffect(() => {
    Promise.all([getTodayTasks(), getUpcomingReminders(), listNotes({ limit: 1 })])
      .then(([tasksResponse, remindersResponse, notesResponse]) => {
        setSummary({
          tasks: tasksResponse.data.tasks || [],
          reminders: remindersResponse.data.reminders || [],
          notes: notesResponse.data.total || 0
        });
      })
      .catch(() => {});
  }, []);

  const completedTasks = summary.tasks.filter((task) => task.isCompleted).length;
  const progress = summary.tasks.length ? Math.round((completedTasks / summary.tasks.length) * 100) : 0;
  const nextReminder = summary.reminders[0];

  return (
    <div className="dashboard-page">
      <section className="dashboard-heading page-enter">
        <div>
          <p className="eyebrow">Your learning workspace</p>
          <h1>Good to see you, <span>{firstName}</span>.</h1>
          <p className="lede">A clear mind makes room for meaningful progress. What will you focus on today?</p>
        </div>
        <div className="date-pill"><span className="status-dot" /> {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      </section>

      <section className="dashboard-hero page-enter delay-1">
        <div className="hero-copy">
          <p className="eyebrow">Today&apos;s intention</p>
          <h2>Make space for deep work.</h2>
          <p>Small, consistent sessions compound into extraordinary results. Start with one focused step.</p>
          <Link className="primary-button" to="/tasks">Open today&apos;s tasks <span>→</span></Link>
        </div>
        <div className="orb-stage" aria-label="Abstract glowing learning orb" role="img">
          <div className="orb-ring ring-one" /><div className="orb-ring ring-two" /><div className="orb">
            <div className="orb-highlight" /><span>focus</span>
          </div>
          <div className="orbit-dot dot-one" /><div className="orbit-dot dot-two" /><div className="orbit-dot dot-three" />
        </div>
      </section>

      <section className="stats-grid page-enter delay-2" aria-label="Learning summary">
        <article className="stat-card">
          <div className="stat-icon violet">◒</div><p>Daily progress</p><strong>{progress}<span>%</span></strong>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div><small>{completedTasks} of {summary.tasks.length} tasks completed</small>
        </article>
        <article className="stat-card">
          <div className="stat-icon amber">↗</div><p>Study streak</p><strong>{streak}<span> days</span></strong>
          <div className="mini-bars"><i /><i /><i /><i /><i /><i /><i /></div><small>Consistency is your superpower</small>
        </article>
        <article className="stat-card">
          <div className="stat-icon cyan">✓</div><p>Tasks today</p><strong>{summary.tasks.length}</strong>
          <div className="stat-link"><Link to="/tasks">View task list <span>→</span></Link></div><small>Keep your priorities visible</small>
        </article>
        <article className="stat-card">
          <div className="stat-icon green">✦</div><p>Knowledge base</p><strong>{summary.notes}</strong>
          <div className="stat-link"><Link to="/notes">Browse your notes <span>→</span></Link></div><small>Ideas worth remembering</small>
        </article>
      </section>

      <section className="dashboard-next surface-card page-enter delay-3">
        <div><p className="eyebrow">Next study session</p><h2>{nextReminder ? nextReminder.title : 'Protect your next focus block'}</h2><p>{nextReminder ? `${formatDate(nextReminder.dateKey)} at ${formatTime(nextReminder.time)} · ${nextReminder.duration || 0} minutes` : 'Schedule a reminder to make your plan visible.'}</p></div>
        <Link className="secondary-button" to="/reminders">{nextReminder ? 'View reminders →' : 'Add reminder →'}</Link>
      </section>

      <section className="dashboard-lower page-enter delay-3">
        <article className="surface-card activity-card">
          <div className="section-heading"><div><p className="eyebrow">Your rhythm</p><h2>Learning activity</h2></div><span className="muted-label">Last 7 days</span></div>
          <div className="activity-empty"><div className="empty-orbit">✦</div><strong>Your activity will appear here</strong><span>Complete a task or write a note to see your rhythm take shape.</span></div>
        </article>
        <article className="surface-card actions-card">
          <div className="section-heading"><div><p className="eyebrow">Shortcuts</p><h2>Quick actions</h2></div></div>
          <div className="quick-actions">{quickActions.map((action) => <Link className="quick-action" to={action.to} key={action.to}><span className={`action-icon ${action.tone}`}>{action.icon}</span><span><strong>{action.label}</strong><small>{action.detail}</small></span><span className="action-arrow">→</span></Link>)}</div>
        </article>
      </section>
    </div>
  );
}

function formatDate(value) { return new Date(`${value}T00:00:00+05:30`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
function formatTime(value) { return new Date(`1970-01-01T${value}:00`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
