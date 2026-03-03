import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { icon: '🏠', label: 'Dashboard', path: '/student' },
  { icon: '📚', label: 'My Classes', path: '/student/classes' },
  { icon: '💬', label: 'Messages', path: '/student/messages' },
];

function Overview() {
  const [classrooms, setClassrooms] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { api.get('/classrooms/').then(r => setClassrooms(r.data)); }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, color: '#0f766e' }}>
          Welcome, {user?.full_name?.split(' ')[0]} 🎓
        </h2>
        <p className="text-muted" style={{ fontSize: 14, marginTop: 4 }}>You're enrolled in {classrooms.length} class{classrooms.length !== 1 ? 'es' : ''}.</p>
      </div>

      <h3 style={{ fontSize: 17, marginBottom: 16, fontFamily: 'Playfair Display, serif' }}>Your Classes</h3>
      <div className="grid-3">
        {classrooms.map(c => (
          <div key={c.id} className="class-card" onClick={() => navigate(`/classroom/${c.id}`)}>
            <div className="class-card-header" style={{ background: c.color }}>
              <h3 style={{ color: 'white', fontSize: 15, fontFamily: 'Playfair Display, serif', position: 'relative', zIndex: 1 }}>{c.name}</h3>
            </div>
            <div className="class-card-body">
              {c.subject && <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{c.subject}</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {c.educators?.slice(0, 2).map(e => (
                  <span key={e.id} style={{ fontSize: 12, color: '#64748b' }}>👩‍🏫 {e.full_name}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {classrooms.length === 0 && (
          <div className="card empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state-icon">🎓</div>
            <p>Not enrolled in any classes yet. Contact your admin.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Messages() {
  const [conversations, setConversations] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [thread, setThread] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [showNew, setShowNew] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/messages/conversations').then(r => setConversations(r.data));
    api.get('/classrooms/').then(r => setClassrooms(r.data));
  }, []);

  const openThread = (conv) => {
    setSelected(conv);
    api.get(`/messages/thread/${conv.user_id}`).then(r => setThread(r.data));
  };

  const send = async () => {
    if (!newMsg.trim() || !selected) return;
    await api.post('/messages/', { receiver_id: selected.user_id, content: newMsg });
    setThread([...thread, { sender_id: user.id, content: newMsg, created_at: new Date().toISOString() }]);
    setNewMsg('');
  };

  const teachers = classrooms.flatMap(c => c.educators || []).filter((e, i, a) => a.findIndex(x => x.id === e.id) === i);

  return (
    <div>
      <div className="flex-between mb-6">
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#0f766e' }}>Messages</h2>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New Message</button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, height: 500 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: 14 }}>Conversations</div>
          <div style={{ overflowY: 'auto', height: 'calc(100% - 50px)' }}>
            {conversations.length === 0 && <div className="empty-state" style={{ padding: 24 }}>No conversations yet</div>}
            {conversations.map(c => (
              <div key={c.user_id} onClick={() => openThread(c)} style={{
                padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f8fafc',
                background: selected?.user_id === c.user_id ? '#f0fdfa' : 'white',
                display: 'flex', gap: 10, alignItems: 'center'
              }}>
                <div className="avatar avatar-sm" style={{ background: c.avatar_color || '#0d9488' }}>{c.user_name?.[0]?.toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{c.user_name}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last_message}</p>
                </div>
                {c.unread > 0 && <span className="notif-badge" style={{ position: 'static' }}>{c.unread}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          {!selected ? (
            <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="empty-state-icon">💬</div><p>Select a conversation</p>
            </div>
          ) : (
            <>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{selected.user_name}</div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
                {thread.map((m, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender_id === user.id ? 'flex-end' : 'flex-start' }}>
                    <div className={`message-bubble ${m.sender_id === user.id ? 'sent' : 'received'}`}>{m.content}</div>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 4px 8px' }}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
                <input className="form-input" value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..."
                  onKeyDown={e => e.key === 'Enter' && send()} style={{ marginBottom: 0 }} />
                <button className="btn btn-primary" onClick={send}>Send</button>
              </div>
            </>
          )}
        </div>
      </div>

      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Message a Teacher</h3>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>×</button>
            </div>
            {teachers.map(t => (
              <button key={t.id} onClick={() => {
                setSelected({ user_id: t.id, user_name: t.full_name, avatar_color: t.avatar_color });
                api.get(`/messages/thread/${t.id}`).then(r => setThread(r.data));
                setShowNew(false);
              }} style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                <div className="avatar avatar-sm" style={{ background: t.avatar_color || '#0d9488' }}>{t.full_name?.[0]?.toUpperCase()}</div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{t.full_name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <AppLayout navItems={navItems} title="Student Dashboard">
      <Routes>
        <Route index element={<Overview />} />
        <Route path="classes" element={<Overview />} />
        <Route path="messages" element={<Messages />} />
      </Routes>
    </AppLayout>
  );
}
