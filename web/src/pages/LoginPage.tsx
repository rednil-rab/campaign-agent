import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api/client';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = React.useState(true);
  const [signedIn, setSignedIn] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    api
      .me()
      .then(() => setSignedIn(true))
      .catch(() => undefined)
      .finally(() => setChecking(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.login(email, password);
      navigate('/campaigns');
    } catch (err) {
      setError(errorMessage(err, 'Could not sign in'));
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) return <div className="login-page"><p>Loading…</p></div>;
  if (signedIn) return <Navigate to="/campaigns" replace />;

  return (
    <form className="login-page" onSubmit={submit}>
      <h1>DM Assistant</h1>
      <p>Sign in with your Questkeeper account.</p>
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </label>
      {error && <p role="alert" className="error">{error}</p>}
      <button type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
};
