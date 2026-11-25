import React from 'react';
import { Navigate } from 'react-router-dom';
import { chatAPI } from '../api/client';

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [loggedIn, setLoggedIn] = React.useState(false);

  React.useEffect(() => {
    const tryLogin = async () => {
      try {
        const res = await chatAPI.login();
        if (res.data.user) {
          setLoggedIn(true);
        }
      } catch (err: any) {
        setError('Failed to login with Questkeeper');
      } finally {
        setLoading(false);
      }
    };

    tryLogin();
  }, []);

  if (loading) return <div>Signing in...</div>;
  if (loggedIn) return <Navigate to="/campaigns" />;

  return (
    <div className="login-page">
      <h1>Agent Chat</h1>
      <p>{error || 'Sign in with Questkeeper to continue'}</p>
      <button onClick={() => window.location.href = '/api/auth/login'}>
        Sign in with Questkeeper
      </button>
    </div>
  );
};
