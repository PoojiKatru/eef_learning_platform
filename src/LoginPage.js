import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'educator') navigate('/educator');
      else navigate('/student');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed';
      if (msg.includes('pending')) setError('Your account is pending admin approval. Please check back soon.');
      else if (msg.includes('rejected')) setError('Your account request was not approved. Contact support.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🌟</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#0f766e', fontSize: '22px' }}>
            Empowering Education
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: 4 }}>Foundation Learning Platform</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid #fee2e2' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }} disabled={loading}>
            {loading ? <><div className="spinner" style={{ borderTopColor: 'white' }} /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#0d9488', fontWeight: 600, textDecoration: 'none' }}>
            Request Access
          </Link>
        </div>

        <div style={{ marginTop: 20, padding: '12px 16px', background: '#f0fdfa', borderRadius: 8, fontSize: 12, color: '#0f766e', border: '1px solid #99f6e4' }}>
          <strong>Default Admin:</strong> admin@eef.org / Admin@123!<br />
          <span style={{ color: '#94a3b8' }}>(Run /api/auth/seed-admin first)</span>
        </div>
      </div>
    </div>
  );
}
