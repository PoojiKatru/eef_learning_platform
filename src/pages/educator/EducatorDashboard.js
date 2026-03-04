import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import AppLayout, { Avatar } from '../../components/AppLayout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { icon: '⚡', label: 'Overview', path: '/educator' },
  { icon: '📚', label: 'My Classes', path: '/educator' },
  { icon: '📅', label: 'Schedule', path: '/educator/schedule' },
  { icon: '📝', label: 'Homework & Quizzes', path: '/educator/homework' },
  { icon: '💬', label: 'Messages', path: '/educator/messages' },
];

/* ── SCHEDULE ── */
function Schedule() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/classrooms/').then(async r => {
      const all = [];
      for (const c of r.data) {
        try {
          const z = await api.get(`/messages/zoom/${c.id}`);
          z.data.forEach(s => all.push({ ...s, classroom_name: c.name, classroom_color: c.color }));
        } catch {}
      }
      all.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
      setSessions(all);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const upcoming = sessions.filter(s => s.scheduled_at && new Date(s.scheduled_at) >= new Date());
  const past = sessions.filter(s => !s.scheduled_at || new Date(s.scheduled_at) < new Date());

  const SessionCard = ({ s }) => {
    const d = s.scheduled_at ? new Date(s.scheduled_at) : null;
    return (
      <div className="card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 20, borderLeft: `4px solid ${s.classroom_color || '#0d9488'}` }}>
        {d ? (
          <div style={{ textAlign: 'center', minWidth: 52, flexShrink: 0 }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Instrument Serif, serif', color: s.classroom_color || '#0d9488', lineHeight: 1 }}>{d.getDate()}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.toLocaleString('en-US', { month: 'short' })}</div>
          </div>
        ) : (
          <div style={{ width: 52, height: 52, background: '#f1f5f9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📹</div>
        )}
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{s.title}</p>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: d ? 3 : 0 }}>📚 {s.classroom_name}</p>
          {d && <p style={{ fontSize: 12, color: '#64748b' }}>🕐 {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · {d.toLocaleDateString('en-US', { weekday: 'long' })}</p>}
          {s.description && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{s.description}</p>}
        </div>
        <a href={s.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">🎥 Join</a>
      </div>
    );
  };

  if (loading) return <div className="empty-state"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h2>Class Schedule</h2><p>All your upcoming live sessions</p></div>
      {sessions.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-icon">📅</div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>No sessions scheduled</p>
          <p style={{ fontSize: 13 }}>Add live sessions inside each classroom — they'll appear here.</p>
        </div>
      )}
      {upcoming.length > 0 && <div style={{ marginBottom: 28 }}><h3 style={{ fontSize: 15, fontWeight: 600, color: '#0d9488', marginBottom: 14 }}>🔜 Upcoming</h3>{upcoming.map(s => <SessionCard key={s.id} s={s} />)}</div>}
      {past.length > 0 && <div><h3 style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', marginBottom: 14 }}>Past Sessions</h3>{past.map(s => <SessionCard key={s.id} s={s} />)}</div>}
    </div>
  );
}

/* ── HOMEWORK & QUIZZES ── */
function Homework() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/classrooms/').then(async r => {
      const all = [];
      for (const c of r.data) {
        try {
          const [asgn, quiz] = await Promise.all([api.get(`/assignments/classroom/${c.id}`), api.get(`/quizzes/classroom/${c.id}`)]);
          asgn.data.forEach(a => all.push({ ...a, type: 'assignment', classroom_name: c.name, classroom_color: c.color }));
          quiz.data.forEach(q => all.push({ ...q, type: 'quiz', classroom_name: c.name, classroom_color: c.color }));
        } catch {}
      }
      all.sort((a, b) => { if (!a.due_date) return 1; if (!b.due_date) return -1; return new Date(a.due_date) - new Date(b.due_date); });
      setItems(all);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  const ItemCard = ({ item }) => {
    const overdue = item.due_date && new Date(item.due_date) < new Date();
    return (
      <div className="card" style={{ marginBottom: 10, borderLeft: `4px solid ${overdue ? '#ef4444' : item.classroom_color || '#0d9488'}` }}>
        <div className="flex-between">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 18 }}>{item.type === 'quiz' ? '📊' : '📝'}</span>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</p>
              <span className={`badge ${item.type === 'quiz' ? 'badge-blue' : 'badge-teal'}`} style={{ fontSize: 10 }}>{item.type}</span>
              {overdue && <span className="badge badge-red" style={{ fontSize: 10 }}>Overdue</span>}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
              <span>📚 {item.classroom_name}</span>
              {item.due_date && <span style={{ color: overdue ? '#ef4444' : '#64748b' }}>📅 Due {new Date(item.due_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
              {item.type === 'assignment' && <span>📬 {item.submission_count || 0} submissions</span>}
              {item.type === 'quiz' && <span>👥 {item.attempt_count || 0} attempts</span>}
              {item.max_points && <span>⭐ {item.max_points} pts</span>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="empty-state"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h2>Assignments & Quizzes</h2><p>Everything posted across all your classes</p></div>
      <div className="tabs" style={{ maxWidth: 320, marginBottom: 20 }}>
        {['all', 'assignment', 'quiz'].map(f => (
          <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f === 'all' ? 'All' : f === 'assignment' ? '📝 Assignments' : '📊 Quizzes'}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="card empty-state"><div className="empty-state-icon">📝</div><p style={{ fontWeight: 600 }}>Nothing here yet</p><p style={{ fontSize: 13 }}>Create assignments and quizzes inside your classrooms.</p></div>
      ) : filtered.map(i => <ItemCard key={`${i.type}-${i.id}`} item={i} />)}
    </div>
  );
}

/* ── OVERVIEW ── */
function Overview() {
  const [classrooms, setClassrooms] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/classrooms/').then(async r => {
      setClassrooms(r.data);
      const sessions = [], items = [];
      for (const c of r.data) {
        try { const z = await api.get(`/messages/zoom/${c.id}`); z.data.filter(s => s.scheduled_at && new Date(s.scheduled_at) >= new Date()).forEach(s => sessions.push({ ...s, classroom_name: c.name, classroom_color: c.color })); } catch {}
        try { const a = await api.get(`/assignments/classroom/${c.id}`); a.data.forEach(i => items.push({ ...i, type: 'assignment', classroom_name: c.name })); } catch {}
        try { const q = await api.get(`/quizzes/classroom/${c.id}`); q.data.forEach(i => items.push({ ...i, type: 'quiz', classroom_name: c.name })); } catch {}
      }
      sessions.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
      setUpcomingSessions(sessions.slice(0, 3));
      setPendingItems(items.filter(i => i.due_date && new Date(i.due_date) >= new Date()).slice(0, 4));
    }).catch(() => {});
  }, []);

  const totalStudents = classrooms.reduce((s, c) => s + c.student_count, 0);

  return (
    <div>
      <div className="hero-card" style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Educator Portal</p>
          <h2 style={{ fontSize: 30, color: 'white', letterSpacing: '-0.02em', marginBottom: 6 }}>Welcome back, {user?.full_name?.split(' ')[0]}! 👋</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13.5 }}>Teaching {classrooms.length} class{classrooms.length !== 1 ? 'es' : ''} · {totalStudents} student{totalStudents !== 1 ? 's' : ''}</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/educator/classes')}>My Classes</button>
            <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }} onClick={() => navigate('/educator/schedule')}>Schedule →</button>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        {[
          { icon: '📚', label: 'My Classes', value: classrooms.length, color: '#0d9488', bg: '#f0fdfa' },
          { icon: '🎓', label: 'Total Students', value: totalStudents, color: '#7c3aed', bg: '#faf5ff' },
          { icon: '📅', label: 'Upcoming Sessions', value: upcomingSessions.length, color: '#2563eb', bg: '#eff6ff' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, marginBottom: 14 }}>{s.icon}</div>
            <p className="stat-label">{s.label}</p>
            <p className="stat-number" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16 }}>Upcoming Sessions</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/educator/schedule')}>All →</button>
          </div>
          {upcomingSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}><div style={{ fontSize: 28, marginBottom: 6 }}>📅</div><p style={{ fontSize: 13 }}>No sessions scheduled</p></div>
          ) : upcomingSessions.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: s.classroom_color || '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📹</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 13 }}>{s.title}</p>
                <p style={{ fontSize: 11, color: '#94a3b8' }}>{s.classroom_name} · {new Date(s.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">Join</a>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16 }}>Active Work</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/educator/homework')}>All →</button>
          </div>
          {pendingItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}><div style={{ fontSize: 28, marginBottom: 6 }}>📝</div><p style={{ fontSize: 13 }}>No active assignments</p></div>
          ) : pendingItems.map(item => (
            <div key={`${item.type}-${item.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 20 }}>{item.type === 'quiz' ? '📊' : '📝'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</p>
                <p style={{ fontSize: 11, color: '#94a3b8' }}>{item.classroom_name}</p>
              </div>
              {item.due_date && <span style={{ fontSize: 11, color: '#64748b' }}>{new Date(item.due_date).toLocaleDateString()}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="page-header" style={{ marginBottom: 16 }}><h2>Your Classes</h2></div>
      <div className="grid-3">
        {classrooms.map(c => (
          <div key={c.id} className="class-card" onClick={() => navigate(`/classroom/${c.id}`)}>
            <div className="class-card-header" style={{ background: c.color }}>
              <h3 style={{ color: 'white', fontSize: 15, fontFamily: 'Instrument Serif, serif', position: 'relative', zIndex: 1 }}>{c.name}</h3>
            </div>
            <div className="class-card-body">
              {c.subject && <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{c.subject}</p>}
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>🎓 {c.student_count} students</p>
              <span style={{ fontSize: 11, background: '#f0fdfa', color: '#0d9488', padding: '3px 8px', borderRadius: 100, fontWeight: 600 }}>Open →</span>
            </div>
          </div>
        ))}
        {classrooms.length === 0 && (
          <div className="card empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state-icon">📚</div>
            <p style={{ fontWeight: 600 }}>No classes yet</p>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>Contact your admin to be assigned.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── MESSAGES ── */
function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [thread, setThread] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const { user } = useAuth();

  useEffect(() => { api.get('/messages/conversations').then(r => setConversations(r.data)).catch(() => {}); }, []);

  const openThread = (conv) => { setSelected(conv); api.get(`/messages/thread/${conv.user_id}`).then(r => setThread(r.data)).catch(() => {}); };
  const send = async () => {
    if (!newMsg.trim() || !selected) return;
    await api.post('/messages/', { receiver_id: selected.user_id, content: newMsg }).catch(() => {});
    setThread([...thread, { sender_id: user.id, content: newMsg, created_at: new Date().toISOString() }]);
    setNewMsg('');
  };

  return (
    <div>
      <div className="page-header"><h2>Messages</h2><p>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p></div>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 18, height: 560 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9' }}><p style={{ fontWeight: 600, fontSize: 14 }}>Conversations</p></div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {conversations.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}><div style={{ fontSize: 32, marginBottom: 8 }}>💬</div><p style={{ fontSize: 13 }}>No conversations yet</p></div>}
            {conversations.map(c => (
              <div key={c.user_id} onClick={() => openThread(c)} style={{ padding: '13px 18px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', background: selected?.user_id === c.user_id ? '#f0fdfa' : 'white', display: 'flex', gap: 11, alignItems: 'center' }}>
                <Avatar name={c.user_name} color={c.avatar_color || '#0d9488'} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 13.5 }}>{c.user_name}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last_message}</p>
                </div>
                {c.unread > 0 && <span style={{ background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{c.unread}</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {!selected ? (
            <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><div className="empty-state-icon">💬</div><p style={{ fontWeight: 600 }}>Select a conversation</p></div>
          ) : (
            <>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 11 }}>
                <Avatar name={selected.user_name} color={selected.avatar_color || '#0d9488'} size="sm" />
                <p style={{ fontWeight: 600, fontSize: 14 }}>{selected.user_name}</p>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {thread.map((m, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender_id === user.id ? 'flex-end' : 'flex-start' }}>
                    <div className={`message-bubble ${m.sender_id === user.id ? 'sent' : 'received'}`}>{m.content}</div>
                    <p style={{ fontSize: 10.5, color: '#94a3b8', margin: '2px 4px 8px' }}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: '13px 18px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 9 }}>
                <input className="form-input" value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === 'Enter' && send()} style={{ marginBottom: 0 }} />
                <button className="btn btn-primary" onClick={send}>Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EducatorDashboard() {
  return (
    <AppLayout navItems={navItems} title="Educator Dashboard">
      <Routes>
        <Route index element={<Overview />} />
        <Route path="classes" element={<Overview />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="homework" element={<Homework />} />
        <Route path="messages" element={<Messages />} />
      </Routes>
    </AppLayout>
  );
}
