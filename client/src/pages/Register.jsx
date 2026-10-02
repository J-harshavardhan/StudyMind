import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { api, useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [pending, setPending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="auth-card mx-auto">
      <h1>Join StudyMind</h1>
      <form onSubmit={submit}>
        {['name', 'email', 'password'].map((key) => (
          <input
            key={key}
            className="form-control mb-3"
            required
            minLength={key === 'password' ? 8 : 2}
            type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
            placeholder={key}
            value={form[key]}
            onChange={(event) => setForm({ ...form, [key]: event.target.value })}
          />
        ))}
        <button className="btn btn-primary w-100" disabled={pending}>
          {pending ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="mt-3">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
