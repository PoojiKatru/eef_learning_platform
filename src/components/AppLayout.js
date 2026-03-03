import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function Avatar({ name, color, size = 'md' }) {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div className={`avatar avatar-${size}`} style={{ background: color || '#0d9488' }}>
      {initials}
    </div>
  );
}

function NotifPanel({ onClose }) {
  const [notifs, setNotifs] = useState([]);
  const ref = useRef();

  useEffect(() => {
    api.get('/notifications/').then(r => setNotifs(r.data));
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const markAll = async () => {
    await api.post('/notifications/read-all');
    setNotifs(notifs.map(n => ({ ...n, is_read: true })));
  };

  const typeIcon = { approval: '👤', success: '✅', assignment: '📝', quiz: '📊', grade: '⭐', message: '💬', zoom: '📹', info: 'ℹ️' };

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', right: 0, width: 340, background: 'white',
      borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', border: '1px solid #f1f5f9',
      zIndex: 200, overflow: 'hidden', maxHeight: 480
    }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <strong style={{ fontSize: 15 }}>Notifications</strong>
        <button onClick={markAll} style={{ fontSize: 12, color: '#0d9488', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Mark all read
        </button>
      </div>
      <div style={{ overflowY: 'auto', maxHeight: 380 }}>
        {notifs.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No notifications</div>
        ) : notifs.map(n => (
          <div key={n.id} style={{
            padding: '12px 18px', borderBottom: '1px solid #f8fafc',
            background: n.is_read ? 'white' : '#f0fdfa',
            display: 'flex', gap: 10
          }}>
            <span style={{ fontSize: 18 }}>{typeIcon[n.type] || 'ℹ️'}</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{n.title}</p>
              <p style={{ fontSize: 12, color: '#64748b' }}>{n.message}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                {new Date(n.created_at).toLocaleDateString()}
              </p>
            </div>
            {!n.is_read && <div style={{ width: 6, height: 6, background: '#0d9488', borderRadius: '50%', flexShrink: 0, marginTop: 5 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AppLayout({ navItems, title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    const fetch = () => api.get('/notifications/unread-count').then(r => setUnread(r.data.count)).catch(() => {});
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🌟</div>
          <div className="sidebar-logo-text">
            <h3>Empowering Education</h3>
            <span>Foundation</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) => {
            if (item.type === 'section') {
              return <div key={i} className="sidebar-section-label">{item.label}</div>;
            }
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <button
                key={i}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="sidebar-icon">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-user">
          <Avatar name={user?.full_name} color={user?.avatar_color} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{user?.role}</p>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16 }} title="Sign out">⬆️</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <h1 style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', color: '#0f766e' }}>{title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <button className="notif-bell" onClick={() => setShowNotifs(!showNotifs)}>
                🔔
                {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
              </button>
              {showNotifs && <NotifPanel onClose={() => setShowNotifs(false)} />}
            </div>
            <Avatar name={user?.full_name} color={user?.avatar_color} size="sm" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600 }}>{user?.full_name}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{user?.role}</p>
            </div>
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}

export { Avatar };
