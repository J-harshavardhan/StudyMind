import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { api, useAuth } from '../context/AuthContext';
import { userError } from '../utils/userErrors';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setErrorMessage('');
    try {
      const { data } = await api.post('/auth/register', form);
      login(data);
      navigate('/dashboard');
    } catch (error) {
      const message = error.request
        ? 'Registration failed: the StudyMind server is not reachable. Start the API and try again.'
        : userError(error, 'Registration failed. Check your details and try again.');
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-visual"><span className="eyebrow">Build your system</span><h1>Make learning feel lighter.</h1><p>Capture what you learn, plan what comes next, and turn consistency into confidence.</p><div className="auth-network"><i /><i /><i /><b>✦</b></div></div>
      <div className="auth-card">
      <p className="eyebrow">Get started</p><h1>Create your account</h1>
      {errorMessage && <div className="auth-error" role="alert">{errorMessage}</div>}
      <form onSubmit={submit} className="auth-form">
        {['name', 'email', 'password'].map((key) => (
          <label key={key} className="auth-field">{key === 'name' ? 'Full name' : key === 'email' ? 'Email address' : 'Password'}
          <input
            className="form-control mb-3"
            required
            minLength={key === 'password' ? 8 : 2}
            type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
            placeholder={key}
            value={form[key]}
            onChange={(event) => {
              setErrorMessage('');
              setForm({ ...form, [key]: event.target.value });
            }}
          />
          </label>
        ))}
        <button className="btn btn-primary w-100" disabled={pending}>
          {pending ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="mt-3">
        Already registered? <Link to="/login">Log in</Link>
      </p>
      </div>
    </div>
  );
}
