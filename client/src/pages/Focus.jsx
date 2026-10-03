import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const PRESETS = [25, 50, 90];

export default function Focus() {
  const [minutes, setMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return undefined;
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  const choosePreset = (value) => {
    setMinutes(value);
    setSecondsLeft(value * 60);
    setRunning(false);
  };

  const reset = () => {
    setSecondsLeft(minutes * 60);
    setRunning(false);
  };

  return (
    <div className="focus-page page-enter">
      <div className="feature-header"><div><p className="eyebrow">Deep work</p><h1>Focus</h1><p className="lede">One calm block. One meaningful step forward.</p></div><div className="feature-visual focus-visual" aria-hidden="true">◉</div></div>
      <div className="focus-card surface-card">
        <div className="focus-orb"><span>{String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}</span><small>{running ? 'In focus' : secondsLeft === 0 ? 'Complete' : 'Ready when you are'}</small></div>
        <div className="focus-presets">{PRESETS.map((preset) => <button type="button" className={minutes === preset ? 'active' : ''} key={preset} onClick={() => choosePreset(preset)}>{preset} min</button>)}</div>
        <div className="focus-actions"><button className="primary-button" type="button" onClick={() => setRunning((value) => !value)}>{running ? 'Pause' : secondsLeft === 0 ? 'Start again' : 'Start focus'} <span>→</span></button><button className="secondary-button" type="button" onClick={reset}>Reset</button></div>
        <p className="focus-note">Silence notifications, choose one task, and let the timer do the rest.</p>
        <Link to="/tasks" className="focus-task-link">Choose a task to work on →</Link>
      </div>
    </div>
  );
}
