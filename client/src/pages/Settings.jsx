import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { api, useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [settings, setSettings] = useState(user?.settings || { timezone: 'Asia/Kolkata', theme: 'light', dailyFocusGoalMinutes: 30 });
  const [profilePending, setProfilePending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

  const handleProfile = async (event) => {
    event.preventDefault();
    if (profilePending) return;

    setProfilePending(true);
    try {
      const { data } = await api.patch('/auth/profile', { name, settings });
      updateUser(data.user);
      toast.success('Profile saved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save profile');
    } finally {
      setProfilePending(false);
    }
  };

  const handlePassword = async (event) => {
    event.preventDefault();
    if (passwordPending) return;

    setPasswordPending(true);
    try {
      await api.patch('/auth/change-password', passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      toast.success('Password updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update password');
    } finally {
      setPasswordPending(false);
    }
  };

  return (
    <>
      <h1>Settings</h1>
      <div className="row g-4">
        <form className="col-md-6" onSubmit={handleProfile}>
          <h5>Profile</h5>
          <input
            className="form-control mb-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Full name"
          />
          <select
            className="form-select mb-2"
            value={settings.theme || 'light'}
            onChange={(event) => setSettings({ ...settings, theme: event.target.value })}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <label className="form-label d-block">Daily focus goal (minutes)</label>
          <input
            className="form-control mb-2"
            type="number"
            min="0"
            max="600"
            value={settings.dailyFocusGoalMinutes || 30}
            onChange={(event) => setSettings({ ...settings, dailyFocusGoalMinutes: Number(event.target.value) })}
          />
          <input
            className="form-control mb-2"
            value={settings.timezone || 'Asia/Kolkata'}
            onChange={(event) => setSettings({ ...settings, timezone: event.target.value })}
            placeholder="Timezone"
          />
          <input className="form-control mb-2" disabled value={user?.email || ''} />
          <button className="btn btn-primary" disabled={profilePending}>
            {profilePending ? 'Saving...' : 'Save profile'}
          </button>
        </form>

        <form className="col-md-6" onSubmit={handlePassword}>
          <h5>Password</h5>
          {['currentPassword', 'newPassword'].map((key) => (
            <input
              key={key}
              className="form-control mb-2"
              required
              minLength={key === 'newPassword' ? 8 : 1}
              type="password"
              placeholder={key === 'currentPassword' ? 'Current password' : 'New password'}
              value={passwordForm[key]}
              onChange={(event) => setPasswordForm({ ...passwordForm, [key]: event.target.value })}
            />
          ))}
          <button className="btn btn-outline-primary" disabled={passwordPending}>
            {passwordPending ? 'Updating...' : 'Change password'}
          </button>
        </form>
      </div>
    </>
  );
}
