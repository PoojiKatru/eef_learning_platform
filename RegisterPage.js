import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const requirements = [
  { test: v => v.length >= 8, label: 'At least 8 characters' },
  { test: v => /[A-Z]/.test(v), label: 'One uppercase letter' },
  { test: v => /\d/.test(v), label: 'One number' },
  { test: v => /[!@#$%^&*(),.?":{}|<>]/.test(v), label: 'One special character' },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const passOk = requirements.every(r => r.test(form.password));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!passOk) return setError('Password does not meet requirements');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      await register({ full_name: form.full_name, email: form.email, password: form.password, role: form.role });
      navigate('/pending');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">🌟</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#0f766e', fontSize: '22px' }}>
            Request Access
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: 4 }}>
            Your account will be reviewed by an admin
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="Jane Smith" value={form.full_name}
              onChange={e => setForm({...form, full_name: e.target.value})} required />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})} required />
          </div>

          <div className="form-group">
            <label className="form-label">I am a...</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['student', 'educator'].map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm({...form, role})}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid',
                    borderColor: form.role === role ? '#0d9488' : '#e2e8f0',
                    background: form.role === role ? '#f0fdfa' : 'white',
                    color: form.role === role ? '#0f766e' : '#64748b',
                    fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif'
                  }}
                >
                  {role === 'student' ? '🎓 Student' : '👩‍🏫 Educator'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Create a strong password"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            {form.password && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {requirements.map((r, i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 100,
                    background: r.test(form.password) ? '#f0fdf4' : '#fef2f2',
                    color: r.test(form.password) ? '#16a34a' : '#dc2626',
                    fontWeight: 500
                  }}>
                    {r.test(form.password) ? '✓' : '×'} {r.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className="form-input" type="password" placeholder="Repeat password"
              value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} required />
            {form.confirm && form.confirm !== form.password && (
              <p className="error-text">Passwords don't match</p>
            )}
          </div>

          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid #fee2e2' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }} disabled={loading}>
            {loading ? <><div className="spinner" style={{ borderTopColor: 'white' }} /> Submitting...</> : 'Submit Request'}
          </button>
        </form>

        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#0d9488', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
