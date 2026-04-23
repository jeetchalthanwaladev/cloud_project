import React, { useState } from 'react';

const Auth = ({ onLoginSuccess }) => {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const switchView = (v) => {
    setView(v);
    clearMessages();
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!name || !email || !password) {
      setError('All fields are required');
      return;
    }

    try {
      const baseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Signup failed');
        return;
      }

      setSuccess('Account created! You can now login.');
      setTimeout(() => switchView('login'), 1500);
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again later.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const baseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Invalid credentials');
        return;
      }

      onLoginSuccess(data.user);
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again later.');
    }
  };

  const handleForgot = (e) => {
    e.preventDefault();
    clearMessages();
    setError('Password reset is not configured at backend yet.');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 style={{ fontSize: '2rem' }}>Learning Platform</h1>
        <p className="subtitle" style={{ marginBottom: '20px' }}>
          {view === 'login' && 'Welcome back! Please login'}
          {view === 'signup' && 'Create your free account'}
          {view === 'forgot' && 'Account Recovery'}
        </p>

        {error && <div className="msg msg-error">{error}</div>}
        {success && <div className="msg msg-success">{success}</div>}

        {view === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="custom-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="demo@learn.com" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" className="custom-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="demo123" />
            </div>
            <button type="submit" className="btn-primary">Sign In</button>
            <div className="auth-footer">
              <span onClick={() => switchView('signup')} className="auth-link">New here? Create account</span>
              <span onClick={() => switchView('forgot')} className="auth-link">Forgot password?</span>
            </div>
          </form>
        )}

        {view === 'signup' && (
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" className="custom-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="custom-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" className="custom-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select className="custom-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>
            <button type="submit" className="btn-primary">Create Account</button>
            <div className="auth-footer">
              <span onClick={() => switchView('login')} className="auth-link">Already have an account? Login</span>
            </div>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgot}>
            <div className="form-group">
              <label>Recovery Email</label>
              <input type="email" className="custom-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <button type="submit" className="btn-primary">Get Reset Link</button>
            <div className="auth-footer">
              <span onClick={() => switchView('login')} className="auth-link">Back to Login</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;