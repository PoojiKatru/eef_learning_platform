import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import AppLayout, { Avatar } from '../../components/AppLayout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { icon: '⚡', label: 'Overview', path: '/student' },
  { icon: '📚', label: 'My Classes', path: '/student/classes' },
  { icon: '📅', label: 'Schedule', path: '/student/schedule' },
  { icon: '📝', label: 'My Homework', path: '/student/homework' },
  { icon: '💬', label: 'Messages', path: '/student/messages' },
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
    const isToday = d && d.toDateString() === new Date().toDateString();
    const isTomorrow = d && d.toDateString() === new Date(Date.now() + 86400000).toDateString();
    return (
      <div className="card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 20, borderLeft: `4px solid ${s.classroom_color || '#0d9488'}` }}>
        {d ? (
          <div style={{ textAlign: 'center', minWidth: 56, flexShrink: 0 }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Instrument Serif, serif', color: s.classroom_color || '#0d9488', lineHeight: 1 }}>{d.getDate()}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.toLocaleString('en-US', { month: 'short' })}</div>
          </div>
        ) : (
          <div style={{ width: 52, height: 52, background: '#f1f5f9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📹</div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <p style={{ fontWeight: 600, fontSize: 15 }}>{s.title}</p>
            {isToday && <span className="badge badge-teal" style={{ fontSize: 10 }}>Today</span>}
            {isTomorrow && <span className="badge badge-gold" style={{ fontSize: 10 }}>Tomorrow</span>}
          </div>
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
      <div className="page-header"><h2>My Schedule</h2><p>All your upcoming live class sessions</p></div>
      {sessions.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-icon">📅</div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>No sessions scheduled yet</p>
          <p style={{ fontSize: 13 }}>Your teachers will post live session links here.</p>
        </div>
      )}
      {upcoming.length > 0 && <div style={{ marginBottom: 28 }}><h3 style={{ fontSize: 15, fontWeight: 600, color: '#0d9488', marginBottom: 14 }}>🔜 Upcoming</h3>{upcoming.map(s => <SessionCard key={s.id} s={s} />)}</div>}
      {past.length > 0 && <div><h3 style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', marginBottom: 14 }}>Past Sessions</h3>{past.map(s => <SessionCard key={s.id} s={s} />)}</div>}
    </div>
  );
}

/* ── HOMEWORK ── */
function Homework() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/classrooms/').then(async r => {
      const all = [];
      for (const c of r.data) {
        try {
          const [asgn, quiz] = await Promise.all([api.get(`/assignments/classroom/${c.id}`), api.get(`/quizzes/classroom/${c.id}`)]);
          asgn.data.forEach(a => all.push({ ...a, type: 'assignment', classroom_name: c.name, classroom_color: c.color, classroom_id: c.id }));
          quiz.data.forEach(q => all.push({ ...q, type: 'quiz', classroom_name: c.name, classroom_color: c.color, classroom_id: c.id }));
        } catch {}
      }
      all.sort((a, b) => { if (!a.due_date) return 1; if (!b.due_date) return -1; return new Date(a.due_date) - new Date(b.due_date); });
      setItems(all);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const getStatus = (item) => {
    if (item.type === 'assignment') {
      if (!item.my_submission) return item.due_date && new Date(item.due_date) < now ? 'overdue' : 'todo';
      if (item.my_submission.grade !== null && item.my_submission.grade !== undefined) return 'graded';
      return 'submitted';
    }
    if (item.type === 'quiz') {
      if (item.my_attempt) return 'completed';
      return item.due_date && new Date(item.due_date) < now ? 'overdue' : 'todo';
    }
    return 'todo';
  };

  const statusBadge = { todo: { label: 'To Do', cls: 'badge-gold' }, overdue: { label: 'Overdue', cls: 'badge-red' }, submitted: { label: 'Submitted', cls: 'badge-blue' }, graded: { label: 'Graded', cls: 'badge-green' }, completed: { label: 'Completed', cls: 'badge-green' } };

  const filtered = items.filter(i => {
    if (filter === 'all') return true;
    if (filter === 'todo') return ['todo', 'overdue'].includes(getStatus(i));
    if (filter === 'done') return ['submitted', 'graded', 'completed'].includes(getStatus(i));
    if (filter === 'assignment') return i.type === 'assignment';
    if (filter === 'quiz') return i.type === 'quiz';
    return true;
  });

  const todoCount = items.filter(i => ['todo', 'overdue'].includes(getStatus(i))).length;
  const overdueCount = items.filter(i => getStatus(i) === 'overdue').length;

  const ItemCard = ({ item }) => {
    const status = getStatus(item);
    const overdue = status === 'overdue';
    const sb = statusBadge[status];
    return (
      <div className="card" style={{ marginBottom: 10, borderLeft: `4px solid ${overdue ? '#ef4444' : status === 'todo' ? '#f59e0b' : '#10b981'}`, cursor: 'pointer' }} onClick={() => navigate(`/classroom/${item.classroom_id}`)}>
        <div className="flex-between">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 18 }}>{item.type === 'quiz' ? '📊' : '📝'}</span>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</p>
              <span className={`badge ${sb.cls}`} style={{ fontSize: 10 }}>{sb.label}</span>
              {item.type === 'quiz' && item.my_attempt?.score !== null && item.my_attempt?.score !== undefined && (
                <span className="badge badge-green" style={{ fontSize: 10 }}>Score: {item.my_attempt.score}%</span>
              )}
              {item.type === 'assignment' && item.my_submission?.grade !== null && item.my_submission?.grade !== undefined && (
                <span className="badge badge-green" style={{ fontSize: 10 }}>{item.my_submission.grade}/{item.max_points}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
              <span>📚 {item.classroom_name}</span>
              {item.due_date && <span style={{ color: overdue ? '#ef4444' : '#64748b' }}>📅 Due {new Date(item.due_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
              {item.type === 'assignment' && item.max_points && <span>⭐ {item.max_points} pts</span>}
              {item.type === 'quiz' && item.question_count && <span>❓ {item.question_count} questions</span>}
            </div>
            {item.type === 'assignment' && item.my_submission?.feedback && (
              <p style={{ fontSize: 12, color: '#0d9488', marginTop: 5 }}>💬 Feedback: {item.my_submission.feedback}</p>
            )}
          </div>
          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 12 }}>Open →</span>
        </div>
      </div>
    );
  };

  if (loading) return <div className="empty-state"><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div className="page-header" style={{ margin: 0 }}>
          <h2>My Homework</h2>
          <p>{todoCount} item{todoCount !== 1 ? 's' : ''} to do{overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}</p>
        </div>
        {overdueCount > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <p style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>{overdueCount} overdue item{overdueCount !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      <div className="tabs" style={{ maxWidth: 480, marginBottom: 20 }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'todo', label: `📌 To Do (${items.filter(i => ['todo','overdue'].includes(getStatus(i))).length})` },
          { key: 'done', label: '✅ Done' },
          { key: 'assignment', label: '📝 HW' },
          { key: 'quiz', label: '📊 Quiz' },
        ].map(f => (
          <button key={f.key} className={`tab ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">{filter === 'done' ? '🎉' : '📝'}</div>
          <p style={{ fontWeight: 600 }}>{filter === 'done' ? 'Nothing completed yet' : 'All caught up!'}</p>
          <p style={{ fontSize: 13 }}>Your assignments and quizzes will appear here.</p>
        </div>
      ) : filtered.map(i => <ItemCard key={`${i.type}-${i.id}`} item={i} />)}
    </div>
  );
}

/* ── OVERVIEW ── */
function Overview() {
  const [classrooms, setClassrooms] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [todoItems, setTodoItems] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/classrooms/').then(async r => {
      setClassrooms(r.data);
      const sessions = [], items = [];
      for (const c of r.data) {
        try { const z = await api.get(`/messages/zoom/${c.id}`); z.data.filter(s => s.scheduled_at && new Date(s.scheduled_at) >= new Date()).forEach(s => sessions.push({ ...s, classroom_name: c.name, classroom_color: c.color })); } catch {}
        try { const a = await api.get(`/assignments/classroom/${c.id}`); a.data.filter(a => !a.my_submission).forEach(i => items.push({ ...i, type: 'assignment', classroom_name: c.name, classroom_color: c.color, classroom_id: c.id })); } catch {}
        try { const q = await api.get(`/quizzes/classroom/${c.id}`); q.data.filter(q => !q.my_attempt).forEach(i => items.push({ ...i, type: 'quiz', classroom_name: c.name, classroom_color: c.color, classroom_id: c.id })); } catch {}
      }
      sessions.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
      items.sort((a, b) => { if (!a.due_date) return 1; if (!b.due_date) return -1; return new Date(a.due_date) - new Date(b.due_date); });
      setUpcomingSessions(sessions.slice(0, 3));
      setTodoItems(items.slice(0, 4));
    }).catch(() => {});
  }, []);

  const overdueCount = todoItems.filter(i => i.due_date && new Date(i.due_date) < new Date()).length;
  const totalTeachers = classrooms.flatMap(c => c.educators || []).filter((e, i, a) => a.findIndex(x => x.id === e.id) === i).length;

  return (
    <div>
      <div className="hero-card" style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Student Portal</p>
          <h2 style={{ fontSize: 30, color: 'white', letterSpacing: '-0.02em', marginBottom: 6 }}>Welcome, {user?.full_name?.split(' ')[0]}! 🎓</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13.5 }}>
            {todoItems.length} item{todoItems.length !== 1 ? 's' : ''} to complete
            {overdueCount > 0 && <span style={{ color: '#fca5a5', fontWeight: 600 }}> · {overdueCount} overdue</span>}
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/student/homework')}>My Homework</button>
            <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }} onClick={() => navigate('/student/schedule')}>Schedule →</button>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        {[
          { icon: '📚', label: 'My Classes', value: classrooms.length, color: '#0d9488', bg: '#f0fdfa' },
          { icon: '👩‍🏫', label: 'My Teachers', value: totalTeachers, color: '#7c3aed', bg: '#faf5ff' },
          { icon: '📌', label: 'To Complete', value: todoItems.length, color: overdueCount > 0 ? '#ef4444' : '#2563eb', bg: overdueCount > 0 ? '#fef2f2' : '#eff6ff' },
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
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/student/schedule')}>All →</button>
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
            <h3 style={{ fontSize: 16 }}>Things To Do</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/student/homework')}>All →</button>
          </div>
          {todoItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}><div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div><p style={{ fontSize: 13 }}>All caught up!</p></div>
          ) : todoItems.map(item => {
            const overdue = item.due_date && new Date(item.due_date) < new Date();
            return (
              <div key={`${item.type}-${item.id}`} onClick={() => navigate(`/classroom/${item.classroom_id}`)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                <span style={{ fontSize: 20 }}>{item.type === 'quiz' ? '📊' : '📝'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8' }}>{item.classroom_name}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {item.due_date && <p style={{ fontSize: 11, color: overdue ? '#ef4444' : '#64748b', fontWeight: overdue ? 600 : 400 }}>{overdue ? '⚠️ Overdue' : new Date(item.due_date).toLocaleDateString()}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="page-header" style={{ marginBottom: 16 }}><h2>My Classes</h2></div>
      <div className="grid-3">
        {classrooms.map(c => (
          <div key={c.id} className="class-card" onClick={() => navigate(`/classroom/${c.id}`)}>
            <div className="class-card-header" style={{ background: c.color }}>
              <h3 style={{ color: 'white', fontSize: 15, fontFamily: 'Instrument Serif, serif', position: 'relative', zIndex: 1 }}>{c.name}</h3>
            </div>
            <div className="class-card-body">
              {c.subject && <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{c.subject}</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                {c.educators?.slice(0, 2).map(e => (
                  <span key={e.id} style={{ fontSize: 11, color: '#64748b', background: '#f8fafc', padding: '2px 7px', borderRadius: 100, border: '1px solid #e8edf5' }}>👩‍🏫 {e.full_name}</span>
                ))}
              </div>
              <span style={{ fontSize: 11, background: '#f0fdfa', color: '#0d9488', padding: '3px 8px', borderRadius: 100, fontWeight: 600 }}>Open →</span>
            </div>
          </div>
        ))}
        {classrooms.length === 0 && (
          <div className="card empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state-icon">🎓</div>
            <p style={{ fontWeight: 600 }}>Not enrolled yet</p>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>Contact your admin to be enrolled in a classroom.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── MESSAGES ── */
function Messages() {
  const [conversations, setConversations] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [thread, setThread] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [showNew, setShowNew] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/messages/conversations').then(r => setConversations(r.data)).catch(() => {});
    api.get('/classrooms/').then(r => setClassrooms(r.data)).catch(() => {});
  }, []);

  const openThread = (conv) => { setSelected(conv); api.get(`/messages/thread/${conv.user_id}`).then(r => setThread(r.data)).catch(() => {}); };
  const send = async () => {
    if (!newMsg.trim() || !selected) return;
    await api.post('/messages/', { receiver_id: selected.user_id, content: newMsg }).catch(() => {});
    setThread([...thread, { sender_id: user.id, content: newMsg, created_at: new Date().toISOString() }]);
    setNewMsg('');
  };

  const teachers = classrooms.flatMap(c => c.educators || []).filter((e, i, a) => a.findIndex(x => x.id === e.id) === i);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div className="page-header" style={{ margin: 0 }}><h2>Messages</h2><p>Chat with your teachers</p></div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New Message</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 18, height: 560 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9' }}><p style={{ fontWeight: 600, fontSize: 14 }}>Conversations</p></div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {conversations.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                <p style={{ fontSize: 13 }}>No conversations yet</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setShowNew(true)}>Start one</button>
              </div>
            )}
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
            <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><div className="empty-state-icon">💬</div><p style={{ fontWeight: 600 }}>Select a conversation</p><p style={{ fontSize: 13, marginTop: 4 }}>or start a new one with a teacher</p></div>
          ) : (
            <>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 11 }}>
                <Avatar name={selected.user_name} color={selected.avatar_color || '#0d9488'} size="sm" />
                <div><p style={{ fontWeight: 600, fontSize: 14 }}>{selected.user_name}</p><p style={{ fontSize: 11, color: '#94a3b8' }}>Teacher</p></div>
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

      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div><h3 style={{ fontSize: 20 }}>Message a Teacher</h3><p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Select a teacher to start chatting</p></div>
              <button onClick={() => setShowNew(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            {teachers.length === 0 && <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No teachers found.</p>}
            {teachers.map(t => (
              <button key={t.id} onClick={() => { setSelected({ user_id: t.id, user_name: t.full_name, avatar_color: t.avatar_color }); api.get(`/messages/thread/${t.id}`).then(r => setThread(r.data)).catch(() => {}); setShowNew(false); }}
                style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                <Avatar name={t.full_name} color={t.avatar_color || '#0d9488'} size="md" />
                <div style={{ textAlign: 'left' }}><p style={{ fontWeight: 600, fontSize: 14 }}>{t.full_name}</p><p style={{ fontSize: 12, color: '#94a3b8' }}>Educator</p></div>
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
    <AppLayout navItems={navItems} title="Student Portal">
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
