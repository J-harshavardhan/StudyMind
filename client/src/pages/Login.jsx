import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { api, useAuth } from '../context/AuthContext';

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
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="auth-card mx-auto">
      <h1>Welcome back</h1>
      <p className="text-muted">Continue your learning journey.</p>
      <form onSubmit={submit}>
        {['email', 'password'].map((key) => (
          <input
            key={key}
            className="form-control mb-3"
            required
            type={key === 'password' ? 'password' : 'email'}
            placeholder={key}
            value={form[key]}
            onChange={(event) => setForm({ ...form, [key]: event.target.value })}
          />
        ))}
        <button className="btn btn-primary w-100" disabled={pending}>
          {pending ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <p className="mt-3">
        New here? <Link to="/register">Create account</Link>
      </p>
    </div>
  );
}
