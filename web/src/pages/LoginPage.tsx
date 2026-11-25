import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button, Panel } from '@questkeeper/theme';
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

  if (checking) return <main className="login-page"><p className="muted">Loading…</p></main>;
  if (signedIn) return <Navigate to="/campaigns" replace />;

  return (
    <main className="login-page">
      <h1 className="page-title">DM Assistant</h1>
      <Panel>
        <p className="muted">Sign in with your Questkeeper account.</p>
        <form className="form" onSubmit={submit}>
          <label className="field">
            Email
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          </label>
          <label className="field">
            Password
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </label>
          {error && <p role="alert" className="error">{error}</p>}
          <Button type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</Button>
        </form>
      </Panel>
    </main>
  );
};
