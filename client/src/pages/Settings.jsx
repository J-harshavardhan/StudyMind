import { useEffect, useState } from 'react';

import toast from 'react-hot-toast';

import { api, useAuth } from '../context/AuthContext';

import Select from '../components/ui/Select';

import { useTheme } from '../context/ThemeContext';

import { userError } from '../utils/userErrors';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { dark, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');

  const [settings, setSettings] = useState(
    user?.settings || {
      timezone: 'Asia/Kolkata',
      theme: 'light',
      dailyFocusGoalMinutes: 30
    }
  );

  const [profilePending, setProfilePending] = useState(false);

  const [passwordPending, setPasswordPending] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: ''
  });

  const [reminderSettings, setReminderSettings] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem('studymind_reminder_settings')) || {
          enabled: true,
          notifications: false,
          soundEnabled: true,
          volume: 0.4,
          defaultTime: '17:00',
          ringtone: 'default'
        }
      );
    } catch {
      return {
        enabled: true,
        notifications: false,
        soundEnabled: true,
        volume: 0.4,
        defaultTime: '17:00',
        ringtone: 'default'
      };
    }
  });

  const [avatarError, setAvatarError] = useState('');

  const [ringtone, setRingtone] = useState(
    () => localStorage.getItem('studymind_custom_ringtone') || ''
  );

  const [ringtoneError, setRingtoneError] = useState('');
  const selectedTheme = dark ? 'dark' : 'light';
  const volumePercent = Math.round(Number(reminderSettings.volume ?? 0.4) * 100);

  useEffect(() => {
    setSettings((current) => current.theme === selectedTheme ? current : { ...current, theme: selectedTheme });
  }, [selectedTheme]);

  const handleProfile = async (event) => {
    event.preventDefault();

    if (profilePending) return;

    if (!name.trim()) {
      toast.error('Please enter your full name.');
      return;
    }

    if (!settings.timezone?.trim()) {
      toast.error('Timezone is required.');
      return;
    }

    if (!Number.isFinite(Number(settings.dailyFocusGoalMinutes)) || Number(settings.dailyFocusGoalMinutes) <= 0) {
      toast.error('Daily focus goal must be a positive number.');
      return;
    }

    setProfilePending(true);

    try {
      const { data } = await api.patch('/auth/profile', {
        name: name.trim(),
        settings: {
          ...settings,
          timezone: settings.timezone.trim(),
          dailyFocusGoalMinutes: Number(settings.dailyFocusGoalMinutes)
        }
      });

      updateUser(data.user);

      toast.success('Profile saved successfully.');
    } catch (error) {
      toast.error(userError(error, 'Unable to save your profile. Please try again.'));
    } finally {
      setProfilePending(false);
    }
  };

  const handlePassword = async (event) => {
    event.preventDefault();

    if (passwordPending) return;

    if (!passwordForm.currentPassword.trim()) {
      toast.error('Current password is required.');
      return;
    }

    if (!passwordForm.newPassword.trim()) {
      toast.error('New password is required.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error('New password must be different from current password.');
      return;
    }

    setPasswordPending(true);

    try {
      await api.patch('/auth/change-password', passwordForm);

      setPasswordForm({ currentPassword: '', newPassword: '' });

      toast.success('Password updated successfully.');
    } catch (error) {
      toast.error(userError(error, 'Unable to update your password. Please try again.'));
    } finally {
      setPasswordPending(false);
    }
  };

  const saveReminderSettings = (nextSettings) => {
    setReminderSettings(nextSettings);

    localStorage.setItem('studymind_reminder_settings', JSON.stringify(nextSettings));
  };

  const enableNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Browser notifications are not supported here.');

      return;
    }

    const permission = await window.Notification.requestPermission();

    saveReminderSettings({
      ...reminderSettings,
      notifications: permission === 'granted'
    });

    toast[permission === 'granted' ? 'success' : 'error'](
      permission === 'granted'
        ? 'Browser reminders enabled.'
        : 'Notification permission was not granted.'
    );
  };

  const handleAvatar = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setAvatarError('');

    if (!file.type.startsWith('image/')) {
      setAvatarError('Choose an image file.');

      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Profile images must be 2 MB or smaller.');

      return;
    }

    const reader = new globalThis.FileReader();

    reader.onload = () => updateUser({ ...user, avatarDataUrl: reader.result });

    reader.onerror = () => setAvatarError('Could not read that image.');

    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    const nextUser = { ...user };

    delete nextUser.avatarDataUrl;

    updateUser(nextUser);
  };

  const testSound = () => {
    try {
      const context = new globalThis.AudioContext();

      const oscillator = context.createOscillator();

      const gain = context.createGain();

      oscillator.frequency.value = 880;

      gain.gain.value = Number(reminderSettings.volume ?? 0.4) * 0.1;

      oscillator.connect(gain);

      gain.connect(context.destination);

      oscillator.start();

      oscillator.stop(context.currentTime + 0.35);

      toast.success('Sound test played.');
    } catch {
      toast.error('Tap the page first, then try the sound test again.');
    }
  };

  const handleRingtone = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (
      !['audio/mpeg', 'audio/wav', 'audio/ogg'].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setRingtoneError('Choose an MP3, WAV, or OGG file up to 5 MB.');

      return;
    }

    setRingtoneError('');

    const reader = new globalThis.FileReader();

    reader.onload = () => {
      localStorage.setItem('studymind_custom_ringtone', reader.result);

      setRingtone(reader.result);

      saveReminderSettings({
        ...reminderSettings,
        ringtone: 'custom'
      });

      toast.success('Custom ringtone saved locally.');
    };

    reader.onerror = () => setRingtoneError('Could not read that audio file.');

    reader.readAsDataURL(file);
  };

  const removeRingtone = () => {
    localStorage.removeItem('studymind_custom_ringtone');

    setRingtone('');

    saveReminderSettings({
      ...reminderSettings,
      ringtone: 'default'
    });
  };

  const changeTheme = (theme) => {
    setTheme(theme);
    setSettings((current) => ({ ...current, theme }));
  };

  return (
    <main className="settings-page page-enter">
      <section className="settings-hero">
        <div>
          <p className="eyebrow">Workspace preferences</p>
          <h1>Settings</h1>
          <p className="lede">
            Tune your learning environment, profile, reminders, and account security.
          </p>
        </div>

        <div className="feature-visual settings-visual settings-hero-visual" aria-hidden="true">
          ⚙
        </div>
      </section>

      <section className="settings-layout">
        <form className="surface-card settings-card settings-profile-card" onSubmit={handleProfile}>
          <div className="settings-card-header">
            <p className="eyebrow">Profile</p>
            <h2>Personal details</h2>
            <p>Manage your display name, theme, focus goal, and local profile picture.</p>
          </div>

          <div className="profile-avatar-editor settings-avatar-row">
            {user?.avatarDataUrl ? (
              <img src={user.avatarDataUrl} alt={`${user.name} profile`} />
            ) : (
              <span>{user?.name?.charAt(0).toUpperCase() || 'S'}</span>
            )}

            <div className="settings-avatar-actions">
              <label className="secondary-button avatar-upload">
                Change picture
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatar}
                />
              </label>

              {user?.avatarDataUrl && (
                <button type="button" className="btn btn-link btn-sm" onClick={removeAvatar}>
                  Remove
                </button>
              )}

              <small>Private to this browser · max 2 MB</small>
            </div>
          </div>

          {avatarError && <div className="alert alert-danger py-2">{avatarError}</div>}

          <div className="settings-form-grid">
            <label className="form-label">
              Full name
              <input
                className="form-control"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your full name"
              />
            </label>

            <Select
              label="Theme"
              value={selectedTheme}
              onChange={changeTheme}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' }
              ]}
            />

            <label className="form-label">
              Daily focus goal
              <input
                className="form-control"
                type="number"
                min="1"
                max="600"
                value={settings.dailyFocusGoalMinutes || 30}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    dailyFocusGoalMinutes: Number(event.target.value)
                  })
                }
                placeholder="30"
              />
              <small className="field-hint">Minutes per day</small>
            </label>

            <label className="form-label">
              Timezone
              <input
                className="form-control"
                value={settings.timezone || 'Asia/Kolkata'}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    timezone: event.target.value
                  })
                }
                placeholder="Asia/Kolkata"
              />
              <small className="field-hint">
                Used for reminders, calendar, and study sessions.
              </small>
            </label>

            <label className="form-label">
              Email
              <span className="settings-readonly-field"><input className="form-control" readOnly aria-readonly="true" value={user?.email || ''} /><span>Read only</span></span>
              <small className="field-hint">Email is read-only for account safety.</small>
            </label>
          </div>

          <div className="settings-actions">
            <button className="primary-button" disabled={profilePending}>
              {profilePending ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </form>

        <form className="surface-card settings-card settings-security-card" onSubmit={handlePassword}>
          <div className="settings-card-header">
            <p className="eyebrow">Security</p>
            <h2>Change password</h2>
            <p>
              Update your password with clear validation and protected account-session handling.
            </p>
          </div>

          <div className="settings-form-grid">
            <label className="form-label">
              Current password
              <input
                className="form-control"
                required
                minLength={1}
                type="password"
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: event.target.value
                  })
                }
              />
            </label>

            <label className="form-label">
              New password
              <input
                className="form-control"
                required
                minLength={8}
                type="password"
                placeholder="Enter new password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: event.target.value
                  })
                }
              />
              <small className="field-hint">Use at least 8 characters.</small>
            </label>
          </div>

          <div className="settings-actions">
            <button className="secondary-button" disabled={passwordPending}>
              {passwordPending ? 'Updating...' : 'Change password'}
            </button>
          </div>
        </form>
      </section>

      <section className="surface-card settings-card settings-reminders-card page-enter delay-2">
        <div className="settings-card-header">
          <p className="eyebrow">Reminders</p>
          <h2>Study reminder preferences</h2>
          <p>
            Control default reminder time, ringtone, notification permission, alarm sound, and
            volume.
          </p>
        </div>

        <div className="reminder-preferences-grid">
          <div className="settings-preference-panel">
            <h3>Default schedule</h3>

            <label className="form-label">
              Default reminder time
              <input
                className="form-control"
                type="time"
                value={reminderSettings.defaultTime}
                onChange={(event) =>
                  saveReminderSettings({
                    ...reminderSettings,
                    defaultTime: event.target.value
                  })
                }
              />
              <small className="field-hint">
                Used as the starting time when creating new reminders.
              </small>
            </label>
          </div>

          <div className="settings-preference-panel">
            <h3>Ringtone</h3>

            <Select
              label="Default ringtone"
              value={reminderSettings.ringtone}
              onChange={(ringtoneValue) =>
                saveReminderSettings({
                  ...reminderSettings,
                  ringtone: ringtoneValue
                })
              }
              options={[
                { value: 'default', label: 'StudyMind Alarm' },
                ...(ringtone ? [{ value: 'custom', label: 'Custom local ringtone' }] : [])
              ]}
            />

            <div className="settings-inline-actions">
              <label className="secondary-button avatar-upload">
                Upload audio
                <input
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/ogg"
                  onChange={handleRingtone}
                />
              </label>

              {ringtone && (
                <button type="button" className="btn btn-link btn-sm" onClick={removeRingtone}>
                  Remove
                </button>
              )}
            </div>

            {ringtoneError && <small className="text-danger d-block">{ringtoneError}</small>}

            <small className="field-hint">
              MP3, WAV, or OGG up to 5 MB. Stored only in this browser.
            </small>
          </div>

          <div className="settings-preference-panel settings-preference-panel-wide">
            <h3>Notification and sound</h3>

            <div className="settings-toggle-grid">
              <button
                type="button"
                className={`settings-toggle ${reminderSettings.enabled ? 'is-active' : ''}`}
                onClick={() =>
                  saveReminderSettings({
                    ...reminderSettings,
                    enabled: !reminderSettings.enabled
                  })
                }
              >
                <span>{reminderSettings.enabled ? 'On' : 'Off'}</span>
                Reminders {reminderSettings.enabled ? 'enabled' : 'disabled'}
              </button>

              <button
                type="button"
                className={`settings-toggle ${reminderSettings.soundEnabled ? 'is-active' : ''}`}
                onClick={() =>
                  saveReminderSettings({
                    ...reminderSettings,
                    soundEnabled: !reminderSettings.soundEnabled
                  })
                }
              >
                <span>{reminderSettings.soundEnabled ? 'On' : 'Off'}</span>
                Alarm sound {reminderSettings.soundEnabled ? 'enabled' : 'muted'}
              </button>

              <button
                type="button"
                className={`settings-toggle ${reminderSettings.notifications ? 'is-active' : ''}`}
                onClick={enableNotifications}
              >
                <span>{reminderSettings.notifications ? 'On' : 'Off'}</span>
                {reminderSettings.notifications ? 'Notifications enabled' : 'Allow notifications'}
              </button>

              <button type="button" className="settings-toggle" onClick={testSound}>
                <span>Test</span>
                Test sound
              </button>
            </div>

            <label className="form-label settings-volume">
              Alarm volume <strong>{volumePercent}%</strong>
              <input
                className="form-range"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={reminderSettings.volume ?? 0.4}
                onChange={(event) =>
                  saveReminderSettings({
                    ...reminderSettings,
                    volume: Number(event.target.value)
                  })
                }
              />
            </label>
          </div>
        </div>

        <small className="settings-note">
          Notifications are requested only when you choose “Allow notifications”. Browser and
          device settings may still limit background alerts.
        </small>
      </section>
    </main>
  );
}
