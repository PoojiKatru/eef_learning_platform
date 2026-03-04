import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import AppLayout, { Avatar } from '../../components/AppLayout';
import api from '../../utils/api';

const navItems = [
  { icon: '⚡', label: 'Overview', path: '/admin' },
  { type: 'section', label: 'Management' },
  { icon: '✅', label: 'Approvals', path: '/admin/approvals' },
  { icon: '👥', label: 'Users', path: '/admin/users' },
  { icon: '🏫', label: 'Classrooms', path: '/admin/classrooms' },
  { type: 'section', label: 'Teaching' },
  { icon: '📚', label: 'All Classes', path: '/admin/my-classes' },
];

/* ── OVERVIEW ── */
function Overview() {
  const [stats, setStats] = useState({ pending: 0, users: 0, classrooms: 0, educators: 0 });
  const [pending, setPending] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/users/pending'), api.get('/users/all'), api.get('/classrooms/'), api.get('/users/educators')])
      .then(([p, u, c, e]) => {
        setPending(p.data.slice(0, 4));
        setClassrooms(c.data.slice(0, 3));
        setStats({ pending: p.data.length, users: u.data.length, classrooms: c.data.length, educators: e.data.length });
      }).catch(() => {});
  }, []);

  const approve = async (id) => { await api.post(`/users/${id}/approve`).catch(() => {}); setPending(p => p.filter(u => u.id !== id)); setStats(s => ({ ...s, pending: s.pending - 1 })); };
  const reject = async (id) => { await api.post(`/users/${id}/reject`).catch(() => {}); setPending(p => p.filter(u => u.id !== id)); setStats(s => ({ ...s, pending: s.pending - 1 })); };

  return (
    <div>
      <div className="hero-card" style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Admin Dashboard</p>
          <h2 style={{ fontSize: 30, color: 'white', letterSpacing: '-0.02em', marginBottom: 6 }}>Platform Overview 🛠️</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13.5 }}>
            {stats.pending > 0 ? `${stats.pending} account${stats.pending > 1 ? 's' : ''} waiting for approval.` : 'Everything is running smoothly.'}
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/approvals')}>View Approvals</button>
            <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }} onClick={() => navigate('/admin/classrooms')}>Classrooms →</button>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        {[
          { icon: '⏳', label: 'Pending Approvals', value: stats.pending, color: '#d97706', bg: '#fffbeb', trend: stats.pending > 0 ? 'Needs attention' : 'All clear' },
          { icon: '👥', label: 'Total Users', value: stats.users, color: '#0d9488', bg: '#f0fdfa', trend: `${stats.educators} educators` },
          { icon: '🏫', label: 'Classrooms', value: stats.classrooms, color: '#7c3aed', bg: '#faf5ff', trend: 'Active' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.icon}</div>
              <span style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, padding: '3px 9px', borderRadius: 100 }}>{s.trend}</span>
            </div>
            <p className="stat-label">{s.label}</p>
            <p className="stat-number" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 18 }}>
            <div><h3 style={{ fontSize: 17 }}>Pending Approvals</h3><p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{stats.pending} waiting</p></div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/approvals')}>See all →</button>
          </div>
          {pending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: '#94a3b8' }}><div style={{ fontSize: 32, marginBottom: 8 }}>✅</div><p style={{ fontSize: 13 }}>All caught up!</p></div>
          ) : pending.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid #f1f5f9' }}>
              <Avatar name={u.full_name} color="#0d9488" size="md" />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 13.5 }}>{u.full_name}</p>
                <p style={{ fontSize: 11.5, color: '#94a3b8' }}>{u.email}</p>
                <span className={`badge ${u.role === 'educator' ? 'badge-teal' : 'badge-blue'}`} style={{ marginTop: 3, fontSize: 10 }}>{u.role === 'educator' ? '👩‍🏫' : '🎓'} {u.role}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={() => approve(u.id)}>✓</button>
                <button className="btn btn-danger btn-sm" onClick={() => reject(u.id)}>✗</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="flex-between" style={{ marginBottom: 18 }}>
            <div><h3 style={{ fontSize: 17 }}>Recent Classrooms</h3><p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{stats.classrooms} total</p></div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/classrooms')}>See all →</button>
          </div>
          {classrooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: '#94a3b8' }}><div style={{ fontSize: 32, marginBottom: 8 }}>🏫</div><p style={{ fontSize: 13 }}>No classrooms yet</p></div>
          ) : classrooms.map(c => (
            <div key={c.id} onClick={() => navigate(`/classroom/${c.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏫</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 13.5 }}>{c.name}</p>
                {c.subject && <p style={{ fontSize: 11.5, color: '#94a3b8' }}>{c.subject}</p>}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>
                <div>👩‍🏫 {c.educator_count}</div>
                <div>🎓 {c.student_count}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── APPROVALS ── */
function Approvals() {
  const [pending, setPending] = useState([]);
  useEffect(() => { api.get('/users/pending').then(r => setPending(r.data)).catch(() => {}); }, []);
  const approve = async (id) => { await api.post(`/users/${id}/approve`).catch(() => {}); setPending(p => p.filter(u => u.id !== id)); };
  const reject = async (id) => { await api.post(`/users/${id}/reject`).catch(() => {}); setPending(p => p.filter(u => u.id !== id)); };

  return (
    <div>
      <div className="page-header"><h2>Account Approvals</h2><p>{pending.length} request{pending.length !== 1 ? 's' : ''} pending</p></div>
      {pending.length === 0 ? (
        <div className="card empty-state"><div className="empty-state-icon">✅</div><p style={{ fontWeight: 600 }}>All caught up!</p><p style={{ fontSize: 13 }}>No pending approvals</p></div>
      ) : (
        <div className="card">
          {pending.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
              <Avatar name={u.full_name} color={u.role === 'educator' ? '#0d9488' : '#3b82f6'} size="lg" />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 15 }}>{u.full_name}</p>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 1 }}>{u.email}</p>
                <span className={`badge ${u.role === 'educator' ? 'badge-teal' : 'badge-blue'}`} style={{ marginTop: 5 }}>{u.role === 'educator' ? '👩‍🏫 Educator' : '🎓 Student'}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={() => approve(u.id)}>✓ Approve</button>
                <button className="btn btn-danger" onClick={() => reject(u.id)}>✗ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── USERS ── */
function Users() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  useEffect(() => { api.get('/users/all').then(r => setUsers(r.data)).catch(() => {}); }, []);

  const filtered = users.filter(u => {
    const matchRole = filter === 'all' || u.role === filter;
    const matchSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const deactivate = async (id) => { if (!window.confirm('Deactivate this user?')) return; await api.post(`/users/${id}/reject`).catch(() => {}); setUsers(users.map(u => u.id === id ? { ...u, status: 'rejected' } : u)); };
  const reactivate = async (id) => { await api.post(`/users/${id}/approve`).catch(() => {}); setUsers(users.map(u => u.id === id ? { ...u, status: 'approved' } : u)); };
  const deleteUser = async (id) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
    await api.delete(`/users/${id}`).catch(() => {});
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <div>
      <div className="page-header"><h2>All Users</h2><p>{users.length} registered users</p></div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input className="form-input" style={{ maxWidth: 260 }} placeholder="🔍  Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="tabs" style={{ margin: 0, maxWidth: 320 }}>
          {['all', 'educator', 'student'].map(f => (
            <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
          ))}
        </div>
      </div>
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">👥</div><p>No users found</p></div>
        ) : filtered.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: '1px solid #f8fafc' }}>
            <Avatar name={u.full_name} color={u.avatar_color || '#0d9488'} size="md" />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{u.full_name}</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>{u.email}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`badge ${u.role === 'educator' ? 'badge-teal' : 'badge-blue'}`} style={{ textTransform: 'capitalize' }}>{u.role}</span>
              <span className={`badge ${u.status === 'approved' ? 'badge-green' : u.status === 'pending' ? 'badge-gold' : 'badge-red'}`} style={{ textTransform: 'capitalize' }}>{u.status}</span>
              {u.status === 'approved' && <button className="btn btn-danger btn-sm" onClick={() => deactivate(u.id)}>Deactivate</button>}
              {u.status === 'rejected' && <button className="btn btn-primary btn-sm" onClick={() => reactivate(u.id)}>Reactivate</button>}
              <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', padding: '6px 10px' }} onClick={() => deleteUser(u.id)} title="Delete user">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── CLASSROOMS ── */
function Classrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [educators, setEducators] = useState([]);
  const [students, setStudents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showManage, setShowManage] = useState(null);
  const [newClass, setNewClass] = useState({ name: '', subject: '', description: '', color: '#0d9488' });
  const navigate = useNavigate();
  const colors = ['#0d9488', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#65a30d', '#dc2626', '#2563eb', '#0f766e', '#7e22ce'];

  const reload = () => {
    Promise.all([api.get('/classrooms/'), api.get('/users/educators'), api.get('/users/students')])
      .then(([c, e, s]) => { setClassrooms(c.data); setEducators(e.data); setStudents(s.data); }).catch(() => {});
  };
  useEffect(() => { reload(); }, []);

  const createClass = async () => {
    const r = await api.post('/classrooms/', newClass).catch(() => {});
    if (r) { reload(); setShowCreate(false); setNewClass({ name: '', subject: '', description: '', color: '#0d9488' }); }
  };

  const deleteClass = async (id) => {
    if (!window.confirm('Delete this classroom? This cannot be undone.')) return;
    await api.delete(`/classrooms/${id}`).catch(() => {});
    setClassrooms(classrooms.filter(c => c.id !== id));
  };

  const assignStudent = async (classId, studentId) => {
    await api.post(`/classrooms/${classId}/assign-student`, { user_id: parseInt(studentId) }).catch(() => {});
    reload();
    setShowManage(m => classrooms.find(c => c.id === classId) || m);
    setTimeout(() => { api.get('/classrooms/').then(r => { setClassrooms(r.data); setShowManage(r.data.find(c => c.id === classId) || null); }).catch(() => {}); }, 500);
  };

  const assignEducator = async (classId, educatorId) => {
    await api.post(`/classrooms/${classId}/assign-educator`, { educator_id: parseInt(educatorId), is_admin: false }).catch(() => {});
    setTimeout(() => { api.get('/classrooms/').then(r => { setClassrooms(r.data); setShowManage(r.data.find(c => c.id === classId) || null); }).catch(() => {}); }, 500);
  };

  const removeStudent = async (classId, studentId) => {
    await api.delete(`/classrooms/${classId}/remove-student/${studentId}`).catch(() => {});
    setTimeout(() => { api.get('/classrooms/').then(r => { setClassrooms(r.data); setShowManage(r.data.find(c => c.id === classId) || null); }).catch(() => {}); }, 500);
  };

  const removeEducator = async (classId, educatorId) => {
    await api.delete(`/classrooms/${classId}/remove-educator/${educatorId}`).catch(() => {});
    setTimeout(() => { api.get('/classrooms/').then(r => { setClassrooms(r.data); setShowManage(r.data.find(c => c.id === classId) || null); }).catch(() => {}); }, 500);
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div className="page-header" style={{ margin: 0 }}><h2>Classrooms</h2><p>{classrooms.length} total</p></div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Classroom</button>
      </div>

      <div className="grid-3">
        {classrooms.map(c => (
          <div key={c.id} className="class-card">
            <div className="class-card-header" style={{ background: c.color }}>
              <h3 style={{ color: 'white', fontSize: 15, fontFamily: 'Instrument Serif, serif', position: 'relative', zIndex: 1, lineHeight: 1.2 }}>{c.name}</h3>
            </div>
            <div className="class-card-body">
              {c.subject && <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>{c.subject}</p>}
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b', marginBottom: 14 }}>
                <span>👩‍🏫 {c.educator_count}</span><span>🎓 {c.student_count}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowManage(c)}>Manage</button>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/classroom/${c.id}`)}>Open →</button>
                <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', padding: '6px 10px' }} onClick={() => deleteClass(c.id)} title="Delete">🗑️</button>
              </div>
            </div>
          </div>
        ))}
        {classrooms.length === 0 && (
          <div className="card empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state-icon">🏫</div>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>No classrooms yet</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create your first classroom</button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: 22 }}>Create Classroom</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <div className="form-group"><label className="form-label">Class Name *</label><input className="form-input" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} placeholder="e.g. Mathematics 101" /></div>
            <div className="form-group"><label className="form-label">Subject</label><input className="form-input" value={newClass.subject} onChange={e => setNewClass({ ...newClass, subject: e.target.value })} placeholder="e.g. Algebra" /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={newClass.description} onChange={e => setNewClass({ ...newClass, description: e.target.value })} placeholder="Brief description..." /></div>
            <div className="form-group">
              <label className="form-label">Color Theme</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {colors.map(c => <button key={c} onClick={() => setNewClass({ ...newClass, color: c })} style={{ width: 30, height: 30, borderRadius: 8, background: c, border: newClass.color === c ? '3px solid #1e293b' : '3px solid transparent', cursor: 'pointer' }} />)}
              </div>
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={createClass} disabled={!newClass.name}>Create Classroom</button>
          </div>
        </div>
      )}

      {/* Manage Modal */}
      {showManage && (
        <div className="modal-overlay" onClick={() => setShowManage(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: 20 }}>{showManage.name}</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Manage members</p>
              </div>
              <button onClick={() => setShowManage(null)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            {/* Educators section */}
            <div style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ marginBottom: 8 }}>Add Educator</label>
              <select className="form-select" onChange={e => { if (e.target.value) { assignEducator(showManage.id, e.target.value); e.target.value = ''; } }} defaultValue="">
                <option value="">Select educator...</option>
                {educators.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
              {showManage.educators?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {showManage.educators.map(e => (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={e.full_name} color={e.avatar_color || '#0d9488'} size="sm" />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{e.full_name}</span>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => removeEducator(showManage.id, e.id)}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="divider" />

            {/* Students section */}
            <div>
              <label className="form-label" style={{ marginBottom: 8 }}>Add Student</label>
              <select className="form-select" onChange={e => { if (e.target.value) { assignStudent(showManage.id, e.target.value); e.target.value = ''; } }} defaultValue="">
                <option value="">Select student...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
              {showManage.students?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {showManage.students.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={s.full_name} color={s.avatar_color || '#3b82f6'} size="sm" />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{s.full_name}</span>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => removeStudent(showManage.id, s.id)}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
              {(!showManage.students || showManage.students.length === 0) && (
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>No students enrolled yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── MY CLASSES ── */
function MyClasses() {
  const [classrooms, setClassrooms] = useState([]);
  const navigate = useNavigate();
  useEffect(() => { api.get('/classrooms/').then(r => setClassrooms(r.data)).catch(() => {}); }, []);

  return (
    <div>
      <div className="page-header"><h2>All Classrooms</h2><p>Admin view of all {classrooms.length} classrooms</p></div>
      <div className="grid-3">
        {classrooms.map(c => (
          <div key={c.id} className="class-card" onClick={() => navigate(`/classroom/${c.id}`)}>
            <div className="class-card-header" style={{ background: c.color }}>
              <h3 style={{ color: 'white', fontSize: 15, fontFamily: 'Instrument Serif, serif', position: 'relative', zIndex: 1 }}>{c.name}</h3>
            </div>
            <div className="class-card-body">
              {c.subject && <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{c.subject}</p>}
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b' }}>
                <span>👩‍🏫 {c.educator_count}</span><span>🎓 {c.student_count}</span>
              </div>
            </div>
          </div>
        ))}
        {classrooms.length === 0 && (
          <div className="card empty-state" style={{ gridColumn: '1/-1' }}><div className="empty-state-icon">🏫</div><p>No classrooms yet</p></div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AppLayout navItems={navItems} title="Admin Dashboard">
      <Routes>
        <Route index element={<Overview />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="users" element={<Users />} />
        <Route path="classrooms" element={<Classrooms />} />
        <Route path="my-classes" element={<MyClasses />} />
      </Routes>
    </AppLayout>
  );
}
