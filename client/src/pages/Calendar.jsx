import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getMonthCalendar,
  getUpcomingEvents
} from '../api/calendar';
import { getUpcomingReminders } from '../api/reminders';
import ErrorState from '../components/ui/ErrorState';
import Loader from '../components/ui/Loader';
import { userError } from '../utils/userErrors';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const today = getKolkataDate();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [days, setDays] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState('');

  const loadCalendar = async () => {
    setLoading(true);
    setError('');

    try {
      const [monthResponse, upcomingResponse, remindersResponse] = await Promise.all([
        getMonthCalendar(year, month),
        getUpcomingEvents(14),
        getUpcomingReminders()
      ]);

      setDays(monthResponse.data.days || []);
      const firstToday = monthResponse.data.days?.find((day) => day.dateKey === kolkataDateKey());
      setSelectedDay(firstToday?.dateKey || monthResponse.data.days?.[0]?.dateKey || '');
      setUpcoming(upcomingResponse.data.events || []);
      setUpcomingReminders(remindersResponse.data.reminders || []);
    } catch (requestError) {
      const message = userError(requestError, 'Unable to load your calendar. Please try again.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, [year, month]);

  const calendarCells = useMemo(() => {
    if (!days.length) return [];

    const firstDate = new Date(
      year,
      month - 1,
      1
    );

    const leadingEmptyDays = firstDate.getDay();

    return [
      ...Array(leadingEmptyDays).fill(null),
      ...days
    ];
  }, [days, year, month]);

  const upcomingEvents = useMemo(
    () => upcoming.filter((event) => event.type !== 'reminder'),
    [upcoming]
  );

  const previousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((current) => current - 1);
    } else {
      setMonth((current) => current - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((current) => current + 1);
    } else {
      setMonth((current) => current + 1);
    }
  };

  const goToToday = () => {
    const current = getKolkataDate();
    setYear(current.getFullYear());
    setMonth(current.getMonth() + 1);
  };

  return (
    <>
      <div className="feature-header page-enter">
        <div>
          <p className="eyebrow">Your rhythm</p>
          <h1>Calendar</h1>
          <p className="lede">Make time visible and keep your next milestone in view.</p>
        </div>
        <div className="feature-visual calendar-visual" aria-hidden="true"><span>31</span><i /><i /><i /></div>
        <button
          className="secondary-button"
          onClick={goToToday}
        >
          Today
        </button>
      </div>

      {loading && <Loader />}

      {!loading && error && (
        <ErrorState message={error} onRetry={loadCalendar} />
      )}

      {!loading && !error && (
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card calendar-card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={previousMonth}
                    aria-label="Previous month"
                  >
                    ←
                  </button>

                  <h2 className="h4 mb-0">
                    {new Date(
                      year,
                      month - 1,
                      1
                    ).toLocaleDateString(undefined, {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h2>

                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={nextMonth}
                    aria-label="Next month"
                  >
                    →
                  </button>
                </div>

                <div className="calendar-weekdays" aria-hidden="true">
                  {WEEKDAYS.map((day) => (
                    <div className="calendar-weekday" key={day}>{day}</div>
                  ))}
                </div>

                <div className="calendar-grid">
                  {calendarCells.map((day, index) => (
                    <div className="calendar-grid-cell" key={day ? day.dateKey : `empty-${index}`}>
                      {day ? (
                        <CalendarDay day={day} selected={selectedDay === day.dateKey} onSelect={() => setSelectedDay(day.dateKey)} />
                      ) : (
                        <div className="calendar-empty-cell" aria-hidden="true" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card h-100">
              <div className="card-body">
                {selectedDay && <SelectedDayPanel day={days.find((day) => day.dateKey === selectedDay)} />}
                <h2 className="h5 mb-3">
                  Upcoming events
                </h2>

                {upcomingEvents.length === 0 ? (
                  <p className="text-body-secondary mb-0">
                    No upcoming events in the next 14 days.
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {upcomingEvents.map((event) => (
                      <div
                        className="border rounded p-3"
                        key={`${event.type}-${event.id}-${event.dateKey}`}
                      >
                        <div className="d-flex justify-content-between gap-2">
                          <strong>{event.title}</strong>

                          <span
                            className={`badge ${
                              event.type === 'task'
                                ? 'text-bg-primary'
                                : event.type === 'reminder'
                                  ? 'text-bg-success'
                                  : 'text-bg-info'
                            }`}
                          >
                            {event.type}
                          </span>
                        </div>

                        <small className="text-body-secondary">
                          {formatDate(event.dateKey)}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
                <h2 className="h5 mt-4 mb-3">Upcoming study sessions</h2>
                {upcomingReminders.length === 0 ? (
                  <p className="text-body-secondary mb-0">No scheduled study reminders.</p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {upcomingReminders.slice(0, 6).map((reminder) => (
                      <div className="border rounded p-3 reminder-agenda-item" key={reminder._id}>
                        <strong>{reminder.time} · {reminder.title}</strong>
                        <small className="text-body-secondary d-block">{formatDate(reminder.occurrenceDateKey || reminder.dateKey)} · {reminder.timezone}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CalendarDay({ day, selected, onSelect }) {
  const isToday =
    day.dateKey ===
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`calendar-day-button ${selected ? 'calendar-selected' : ''} ${isToday ? 'calendar-today' : ''}`}
      aria-label={`${formatDate(day.dateKey)}${selected ? ', selected' : ''}${isToday ? ', today' : ''}, ${day.taskCount || 0} tasks, ${day.noteDeadlines?.length || 0} notes, ${day.reminderCount || 0} reminders`}
      aria-pressed={selected}
    >
      <div className="calendar-day-number">
        {Number(day.dateKey.slice(-2))}
      </div>

      <div className="calendar-indicators" aria-hidden="true">
        {day.taskCount > 0 && <span className="calendar-indicator task-indicator">{day.taskCount}</span>}
        {day.noteDeadlines?.length > 0 && <span className="calendar-indicator note-indicator">{day.noteDeadlines.length}</span>}
        {day.reminderCount > 0 && <span className="calendar-indicator reminder-indicator">{day.reminderCount}</span>}
      </div>
    </button>
  );
}

function SelectedDayPanel({ day }) {
  if (!day) return null;
  return <div className="selected-day-panel border rounded p-3 mb-4">
    <p className="eyebrow mb-1">Selected day</p>
    <h2 className="h5">{formatDate(day.dateKey)}</h2>
    <p className="text-body-secondary mb-2">{day.taskCount} task{day.taskCount === 1 ? '' : 's'} · {day.noteDeadlines?.length || 0} note{day.noteDeadlines?.length === 1 ? '' : 's'} · {day.reminderCount || 0} reminder{day.reminderCount === 1 ? '' : 's'}</p>
    {day.reminders?.map((reminder) => <div className="calendar-detail-row" key={reminder.id}><strong>{reminder.time}</strong><span>{reminder.title}</span></div>)}
  </div>;
}

function formatDate(value) {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getKolkataDate() {
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' })
    .format(new Date()).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function kolkataDateKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}