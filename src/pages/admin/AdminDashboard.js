import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import AppLayout, { Avatar } from '../../components/AppLayout';
import api from '../../utils/api';

const navItems = [
  { icon: '🏠', label: 'Overview', path: '/admin' },
  { type: 'section', label: 'Management' },
  { icon: '✅', label: 'Approvals', path: '/admin/approvals' },
  { icon: '👥', label: 'Users', path: '/admin/users' },
  { icon: '🏫', label: 'Classrooms', path: '/admin/classrooms' },
  { type: 'section', label: 'Teaching' },
  { icon: '📚', label: 'My Classes', path: '/admin/my-classes' },
];

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        <span className="badge badge-teal" style={{ fontSize: 11 }}>{label}</span>
      </div>
      <div className="stat-number" style={{ color }}>{value}</div>
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState({ pending: 0, users: 0, classrooms: 0 });
  const [pending, setPending] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/users/pending').then(r => {
      setPending(r.data.slice(0, 3));
      setStats(s => ({ ...s, pending: r.data.length }));
    }).catch(() => {});
    api.get('/users/all').then(r => {
      setStats(s => ({ ...s, users: r.data.length }));
    }).catch(() => {});
    api.get('/classrooms/').then(r => {
      setStats(s => ({ ...s, classrooms: r.data.length }));
    }).catch(() => {});
  }, []);

  const approve = async (id) => {
    await api.post(`/users/${id}/approve`).catch(() => {});
    setPending(pending.filter(u => u.id !== id));
    setStats(s => ({ ...s, pending: s.pending - 1 }));
  };

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, color: '#0f766e' }}>Welcome back, Admin 👋</h2>
          <p className="text-muted" style={{ fontSize: 14, marginTop: 4 }}>Here's what's happening on your platform.</p>
        </div>
      </div>

      <div className="grid-3 mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <StatCard icon="⏳" label="Pending" value={stats.pending} color="#d97706" />
        <StatCard icon="👥" label="Total Users" value={stats.users} color="#0d9488" />
        <StatCard icon="🏫" label="Classrooms" value={stats.classrooms} color="#7c3aed" />
      </div>

      {pending.length > 0 && (
        <div className="card mb-4">
          <div className="flex-between mb-4">
            <h3 style={{ fontSize: 17 }}>Pending Approvals</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/approvals')}>View all</button>
          </div>
          {pending.map(u => (
            <div key={u.id} className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div className="flex-center gap-3">
                <Avatar name={u.full_name} color="#0d9488" size="sm" />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{u.full_name}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>{u.email} · <span style={{ textTransform: 'capitalize' }}>{u.role}</span></p>
                </div>
              </div>
              <div className="flex-center gap-2">
                <button className="btn btn-primary btn-sm" onClick={() => approve(u.id)}>✓ Approve</button>
                <button className="btn btn-danger btn-sm" onClick={() => api.post(`/users/${u.id}/reject`).catch(() => {}).then(() => setPending(pending.filter(x => x.id !== u.id)))}>✗ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Approvals() {
  const [pending, setPending] = useState([]);
  useEffect(() => { api.get('/users/pending').then(r => setPending(r.data)).catch(() => {}); }, []);

  const approve = async (id) => {
    await api.post(`/users/${id}/approve`).catch(() => {});
    setPending(pending.filter(u => u.id !== id));
  };
  const reject = async (id) => {
    await api.post(`/users/${id}/reject`).catch(() => {});
    setPending(pending.filter(u => u.id !== id));
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, marginBottom: 24, color: '#0f766e' }}>Account Approvals</h2>
      {pending.length === 0 ? (
        <div className="card empty-state"><div className="empty-state-icon">✅</div><p>No pending approvals</p></div>
      ) : (
        <div className="card">
          {pending.map(u => (
            <div key={u.id} className="flex-between" style={{ padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div className="flex-center gap-3">
                <Avatar name={u.full_name} color="#0d9488" size="md" />
                <div>
                  <p style={{ fontWeight: 600 }}>{u.full_name}</p>
                  <p style={{ fontSize: 13, color: '#94a3b8' }}>{u.email}</p>
                  <span className={`badge ${u.role === 'educator' ? 'badge-teal' : 'badge-blue'}`} style={{ marginTop: 4 }}>
                    {u.role === 'educator' ? '👩‍🏫' : '🎓'} {u.role}
                  </span>
                </div>
              </div>
              <div className="flex-center gap-2">
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

function Users() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  useEffect(() => { api.get('/users/all').then(r => setUsers(r.data)).catch(() => {}); }, []);

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);

  return (
    <div>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, marginBottom: 24, color: '#0f766e' }}>All Users</h2>
      <div className="tabs" style={{ maxWidth: 400, marginBottom: 20 }}>
        {['all', 'educator', 'student'].map(f => (
          <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
        ))}
      </div>
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">👥</div><p>No users found</p></div>
        ) : filtered.map(u => (
          <div key={u.id} className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
            <div className="flex-center gap-3">
              <Avatar name={u.full_name} color={u.avatar_color} size="md" />
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{u.full_name}</p>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>{u.email}</p>
              </div>
            </div>
            <div className="flex-center gap-2">
              <span className={`badge ${u.role === 'educator' ? 'badge-teal' : 'badge-blue'}`} style={{ textTransform: 'capitalize' }}>{u.role}</span>
              <span className={`badge ${u.status === 'approved' ? 'badge-green' : u.status === 'pending' ? 'badge-gold' : 'badge-red'}`} style={{ textTransform: 'capitalize' }}>{u.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Classrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [educators, setEducators] = useState([]);
  const [students, setStudents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showManage, setShowManage] = useState(null);
  const [newClass, setNewClass] = useState({ name: '', subject: '', description: '', color: '#0d9488' });
  const navigate = useNavigate();

  const colors = ['#0d9488','#0891b2','#7c3aed','#db2777','#ea580c','#65a30d','#dc2626','#2563eb'];

  useEffect(() => {
    api.get('/classrooms/').then(r => setClassrooms(r.data)).catch(() => {});
    api.get('/users/educators').then(r => setEducators(r.data)).catch(() => {});
    api.get('/users/students').then(r => setStudents(r.data)).catch(() => {});
  }, []);

  const createClass = async () => {
    const r = await api.post('/classrooms/', newClass).catch(() => {});
    if (r) {
      setClassrooms([...classrooms, r.data]);
      setShowCreate(false);
      setNewClass({ name: '', subject: '', description: '', color: '#0d9488' });
    }
  };

  const assignStudent = async (classId, studentId) => {
    await api.post(`/classrooms/${classId}/assign-student`, { user_id: studentId }).catch(() => {});
    api.get('/classrooms/').then(r => setClassrooms(r.data)).catch(() => {});
  };

  const assignEducator = async (classId, educatorId) => {
    await api.post(`/classrooms/${classId}/assign-educator`, { educator_id: educatorId, is_admin: false }).catch(() => {});
    api.get('/classrooms/').then(r => setClassrooms(r.data)).catch(() => {});
  };

  return (
    <div>
      <div className="flex-between mb-6">
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#0f766e' }}>Classrooms</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Classroom</button>
      </div>

      <div className="grid-3">
        {classrooms.map(c => (
          <div key={c.id} className="card" style={{ borderTop: `4px solid ${c.color}` }}>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>{c.name}</h3>
            {c.subject && <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>{c.subject}</p>}
            <div className="flex-center gap-3" style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
              <span>👩‍🏫 {c.educator_count}</span>
              <span>🎓 {c.student_count}</span>
            </div>
            <div className="flex-center gap-2">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowManage(c)}>Manage</button>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/classroom/${c.id}`)}>Open →</button>
            </div>
          </div>
        ))}
        {classrooms.length === 0 && (
          <div className="card empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state-icon">🏫</div>
            <p>No classrooms yet. Create one!</p>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Classroom</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Class Name *</label>
              <input className="form-input" value={newClass.name} onChange={e => setNewClass({...newClass, name: e.target.value})} placeholder="e.g. Mathematics 101" />
            </div>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input className="form-input" value={newClass.subject} onChange={e => setNewClass({...newClass, subject: e.target.value})} placeholder="e.g. Algebra" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={newClass.description} onChange={e => setNewClass({...newClass, description: e.target.value})} placeholder="Brief description..." />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {colors.map(c => (
                  <button key={c} onClick={() => setNewClass({...newClass, color: c})} style={{
                    width: 32, height: 32, borderRadius: 8, background: c, border: newClass.color === c ? '3px solid #1e293b' : '3px solid transparent', cursor: 'pointer'
                  }} />
                ))}
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={createClass} disabled={!newClass.name}>
              Create Classroom
            </button>
          </div>
        </div>
      )}

      {showManage && (
        <div className="modal-overlay" onClick={() => setShowManage(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage: {showManage.name}</h3>
              <button onClick={() => setShowManage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>×</button>
            </div>
            <h4 style={{ marginBottom: 10, fontSize: 14, color: '#64748b' }}>Add Educator</h4>
            <select className="form-select" onChange={e => { if (e.target.value) assignEducator(showManage.id, e.target.value); }} defaultValue="">
              <option value="">Select educator...</option>
              {educators.filter(e => !showManage.educators?.find(x => x.id === parseInt(e.id))).map(e => (
                <option key={e.id} value={e.id}>{e.full_name}</option>
              ))}
            </select>
            <div className="divider" />
            <h4 style={{ marginBottom: 10, fontSize: 14, color: '#64748b' }}>Add Student</h4>
            <select className="form-select" onChange={e => { if (e.target.value) assignStudent(showManage.id, e.target.value); }} defaultValue="">
              <option value="">Select student...</option>
              {students.filter(s => !showManage.students?.find(x => x.id === parseInt(s.id))).map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
            <div className="divider" />
            <div style={{ fontSize: 13, color: '#64748b' }}>
              <strong>Educators:</strong> {showManage.educators?.map(e => e.full_name).join(', ') || 'None'}
              <br />
              <strong>Students:</strong> {showManage.student_count} enrolled
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MyClasses() {
  const [classrooms, setClassrooms] = useState([]);
  const navigate = useNavigate();
  useEffect(() => { api.get('/classrooms/').then(r => setClassrooms(r.data)).catch(() => {}); }, []);

  return (
    <div>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, marginBottom: 24, color: '#0f766e' }}>All Classrooms (Admin View)</h2>
      <div className="grid-3">
        {classrooms.map(c => (
          <div key={c.id} className="class-card" onClick={() => navigate(`/classroom/${c.id}`)}>
            <div className="class-card-header" style={{ background: c.color }}>
              <h3 style={{ color: 'white', fontSize: 16, fontFamily: 'Playfair Display, serif', position: 'relative', zIndex: 1 }}>{c.name}</h3>
            </div>
            <div className="class-card-body">
              {c.subject && <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{c.subject}</p>}
              <div className="flex-center gap-3" style={{ fontSize: 13, color: '#64748b' }}>
                <span>👩‍🏫 {c.educator_count} teachers</span>
                <span>🎓 {c.student_count} students</span>
              </div>
            </div>
          </div>
        ))}
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
