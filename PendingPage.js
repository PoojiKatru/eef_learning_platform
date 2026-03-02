import React from 'react';
import { Link } from 'react-router-dom';

export default function PendingPage() {
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#0f766e', marginBottom: 12 }}>
          Request Submitted!
        </h2>
        <p style={{ color: '#64748b', marginBottom: 24, lineHeight: 1.7 }}>
          Your account request has been submitted and is pending admin approval.
          You'll be able to log in once an administrator reviews and approves your account.
        </p>
        <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
          <p style={{ color: '#0f766e', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>What happens next?</p>
          <ul style={{ color: '#64748b', fontSize: 13, paddingLeft: 16, lineHeight: 1.8 }}>
            <li>An admin will review your request</li>
            <li>You'll receive an in-app notification once approved</li>
            <li>You can then log in and access the platform</li>
          </ul>
        </div>
        <Link to="/login" className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }}>
          Back to Login
        </Link>
      </div>
    </div>
  );
}
