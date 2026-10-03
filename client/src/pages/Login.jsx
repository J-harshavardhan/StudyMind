import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { api, useAuth } from '../context/AuthContext';
import { userError } from '../utils/userErrors';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [pending, setPending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
      navigate('/dashboard');
    } catch (error) {
      toast.error(userError(error, 'Unable to sign in. Check your details and try again.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-visual"><span className="eyebrow">Study smarter</span><h1>Your ideas deserve a place to grow.</h1><p>One focused workspace for the notes, tasks, and momentum that move you forward.</p><div className="auth-network"><i /><i /><i /><b>✦</b></div></div>
      <div className="auth-card">
      <p className="eyebrow">Welcome back</p><h1>Sign in to StudyMind</h1>
      <p className="text-muted">Continue your learning journey.</p>
      <form onSubmit={submit} className="auth-form">
        {['email', 'password'].map((key) => (
          <label key={key} className="auth-field">{key === 'email' ? 'Email address' : 'Password'}
          <input
            className="form-control mb-3"
            required
            type={key === 'password' ? 'password' : 'email'}
            placeholder={key}
            value={form[key]}
            onChange={(event) => setForm({ ...form, [key]: event.target.value })}
          />
          </label>
        ))}
        <button className="btn btn-primary w-100" disabled={pending}>
          {pending ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <p className="mt-3">
        New here? <Link to="/register">Create account</Link>
      </p>
      </div>
    </div>
  );
}
