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
    api.get('/notifications/').then(r => setNotifs(r.data)).catch(() => {});
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const markAll = async () => {
    await api.post('/notifications/read-all').catch(() => {});
    setNotifs(notifs.map(n => ({ ...n, is_read: true })));
  };

  const typeIcon = { approval: '👤', success: '✅', assignment: '📝', quiz: '📊', grade: '⭐', message: '💬', zoom: '📹', info: 'ℹ️' };

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 360,
      background: 'white', borderRadius: 18, boxShadow: '0 12px 40px rgba(0,0,0,0.14)',
      border: '1px solid #e8edf5', zIndex: 200, overflow: 'hidden'
    }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <strong style={{ fontSize: 15, fontFamily: 'Instrument Serif, serif' }}>Notifications</strong>
          {notifs.filter(n => !n.is_read).length > 0 && (
            <span style={{ marginLeft: 8, background: '#fef2f2', color: '#ef4444', fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100 }}>
              {notifs.filter(n => !n.is_read).length} new
            </span>
          )}
        </div>
        <button onClick={markAll} style={{ fontSize: 12, color: '#0d9488', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Mark all read
        </button>
      </div>
      <div style={{ overflowY: 'auto', maxHeight: 400 }}>
        {notifs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔔</div>
            <p style={{ fontSize: 13 }}>You're all caught up!</p>
          </div>
        ) : notifs.map(n => (
          <div key={n.id} style={{
            padding: '13px 20px', borderBottom: '1px solid #f8fafc',
            background: n.is_read ? 'white' : '#f0fdfa',
            display: 'flex', gap: 12, alignItems: 'flex-start'
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: n.is_read ? '#f1f5f9' : '#ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {typeIcon[n.type] || 'ℹ️'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{n.title}</p>
              <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{n.message}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                {new Date(n.created_at).toLocaleDateString()}
              </p>
            </div>
            {!n.is_read && <div style={{ width: 7, height: 7, background: '#0d9488', borderRadius: '50%', flexShrink: 0, marginTop: 6 }} />}
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
    const fetchUnread = () => api.get('/notifications/unread-count').then(r => setUnread(r.data.count)).catch(() => {});
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

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
              <button key={i} className={`sidebar-link ${isActive ? 'active' : ''}`} onClick={() => navigate(item.path)}>
                <span className="sidebar-icon">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-user">
          <Avatar name={user?.full_name} color={user?.avatar_color} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize' }}>{user?.role}</p>
          </div>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 13, padding: '6px 8px', borderRadius: 7, transition: 'all 0.15s' }} title="Sign out">
            ↗
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div>
            <h1 style={{ fontSize: '18px', fontFamily: 'Instrument Serif, serif', color: '#0f1923', letterSpacing: '-0.01em' }}>{title}</h1>
            <p style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: 1 }}>{today}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <button className="notif-bell" onClick={() => setShowNotifs(!showNotifs)}>
                🔔
                {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
              </button>
              {showNotifs && <NotifPanel onClose={() => setShowNotifs(false)} />}
            </div>
            <div style={{ width: 1, height: 28, background: '#e8edf5' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Avatar name={user?.full_name} color={user?.avatar_color} size="sm" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0f1923' }}>{user?.full_name}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{user?.role}</p>
              </div>
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
