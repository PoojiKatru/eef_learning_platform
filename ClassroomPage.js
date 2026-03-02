import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/AppLayout';
import api from '../../utils/api';

function getYoutubeId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?\s]+)/);
  return match ? match[1] : null;
}

function getYoutubeThumbnail(url) {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

/* ===== VIDEOS TAB ===== */
function VideosTab({ classroomId, canTeach }) {
  const [videos, setVideos] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', youtube_url: '' });
  const [playing, setPlaying] = useState(null);

  useEffect(() => { api.get(`/videos/classroom/${classroomId}`).then(r => setVideos(r.data)); }, [classroomId]);

  const add = async () => {
    await api.post('/videos/', { classroom_id: classroomId, ...form });
    const r = await api.get(`/videos/classroom/${classroomId}`);
    setVideos(r.data);
    setShow(false);
    setForm({ title: '', description: '', youtube_url: '' });
  };

  const del = async (id) => {
    await api.delete(`/videos/${id}`);
    setVideos(videos.filter(v => v.id !== id));
  };

  return (
    <div>
      {canTeach && (
        <div className="flex-between mb-4">
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20 }}>Video Lessons</h3>
          <button className="btn btn-primary" onClick={() => setShow(true)}>+ Add Video</button>
        </div>
      )}
      {!canTeach && <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, marginBottom: 16 }}>Video Lessons</h3>}

      {videos.length === 0 ? (
        <div className="card empty-state"><div className="empty-state-icon">🎬</div><p>No videos yet</p></div>
      ) : (
        <div className="grid-3">
          {videos.map(v => (
            <div key={v.id} className="card card-sm" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
              {playing === v.id ? (
                <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${getYoutubeId(v.youtube_url)}?autoplay=1`}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                    allow="autoplay; encrypted-media"
                    title={v.title}
                  />
                </div>
              ) : (
                <div style={{ position: 'relative', background: '#0f172a' }} onClick={() => setPlaying(v.id)}>
                  <img src={getYoutubeThumbnail(v.youtube_url)} alt={v.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', opacity: 0.8, display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 48, height: 48, background: 'rgba(13,148,136,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>▶</div>
                  </div>
                </div>
              )}
              <div style={{ padding: '12px 14px' }}>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{v.title}</p>
                {v.description && <p style={{ fontSize: 12, color: '#94a3b8' }}>{v.description}</p>}
                {canTeach && (
                  <button className="btn btn-danger btn-sm" style={{ marginTop: 8 }} onClick={() => del(v.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {show && (
        <div className="modal-overlay" onClick={() => setShow(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Video Lesson</h3>
              <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Lesson title" />
            </div>
            <div className="form-group">
              <label className="form-label">YouTube URL *</label>
              <input className="form-input" value={form.youtube_url} onChange={e => setForm({...form, youtube_url: e.target.value})} placeholder="https://youtube.com/watch?v=..." />
              {form.youtube_url && getYoutubeThumbnail(form.youtube_url) && (
                <img src={getYoutubeThumbnail(form.youtube_url)} alt="preview" style={{ marginTop: 8, width: '100%', borderRadius: 8 }} />
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What will students learn?" />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={add} disabled={!form.title || !form.youtube_url}>
              Add Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== ASSIGNMENTS TAB ===== */
function AssignmentsTab({ classroomId, canTeach }) {
  const [assignments, setAssignments] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: '', instructions: '', due_date: '', max_points: 100 });
  const [viewing, setViewing] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submitContent, setSubmitContent] = useState('');
  const [grading, setGrading] = useState(null);
  const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '' });
  const { user } = useAuth();

  const load = useCallback(() => { api.get(`/assignments/classroom/${classroomId}`).then(r => setAssignments(r.data)); }, [classroomId]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    await api.post('/assignments/', { classroom_id: classroomId, ...form, due_date: form.due_date || null });
    load();
    setShow(false);
    setForm({ title: '', instructions: '', due_date: '', max_points: 100 });
  };

  const submit = async (assignmentId) => {
    await api.post(`/assignments/${assignmentId}/submit`, { content: submitContent });
    load();
    setSubmitContent('');
    alert('Submitted!');
  };

  const viewSubs = async (a) => {
    setViewing(a);
    const r = await api.get(`/assignments/${a.id}/submissions`);
    setSubmissions(r.data);
  };

  const submitGrade = async () => {
    await api.post(`/assignments/submissions/${grading.id}/grade`, { grade: parseFloat(gradeForm.grade), feedback: gradeForm.feedback });
    const r = await api.get(`/assignments/${viewing.id}/submissions`);
    setSubmissions(r.data);
    setGrading(null);
  };

  const statusColor = (a) => {
    if (!a.my_submission) return 'badge-red';
    if (a.my_submission.grade !== null && a.my_submission.grade !== undefined) return 'badge-green';
    return 'badge-gold';
  };

  const statusText = (a) => {
    if (!a.my_submission) return 'Missing';
    if (a.my_submission.grade !== null) return `${a.my_submission.grade}/${a.max_points}`;
    return 'Submitted';
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20 }}>Assignments</h3>
        {canTeach && <button className="btn btn-primary" onClick={() => setShow(true)}>+ Create Assignment</button>}
      </div>

      {assignments.length === 0 ? (
        <div className="card empty-state"><div className="empty-state-icon">📝</div><p>No assignments yet</p></div>
      ) : assignments.map(a => (
        <div key={a.id} className="card" style={{ marginBottom: 12 }}>
          <div className="flex-between">
            <div>
              <h4 style={{ fontSize: 16, marginBottom: 4 }}>{a.title}</h4>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>{a.instructions}</p>
              <div className="flex-center gap-3" style={{ fontSize: 12, color: '#94a3b8' }}>
                {a.due_date && <span>📅 Due {new Date(a.due_date).toLocaleDateString()}</span>}
                <span>⭐ {a.max_points} pts</span>
                {canTeach && <span>📬 {a.submission_count} submissions</span>}
              </div>
            </div>
            <div className="flex-center gap-2">
              {!canTeach && <span className={`badge ${statusColor(a)}`}>{statusText(a)}</span>}
              {canTeach && <button className="btn btn-secondary btn-sm" onClick={() => viewSubs(a)}>View Submissions</button>}
            </div>
          </div>

          {!canTeach && !a.my_submission && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
              <textarea className="form-textarea" value={submitContent} onChange={e => setSubmitContent(e.target.value)} placeholder="Write your submission here..." style={{ marginBottom: 8 }} />
              <button className="btn btn-primary btn-sm" onClick={() => submit(a.id)}>Submit</button>
            </div>
          )}

          {!canTeach && a.my_submission && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: 8, padding: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Your submission:</p>
              <p style={{ fontSize: 13, color: '#64748b' }}>{a.my_submission.content}</p>
              {a.my_submission.feedback && <p style={{ fontSize: 13, color: '#0d9488', marginTop: 8 }}>💬 Feedback: {a.my_submission.feedback}</p>}
            </div>
          )}
        </div>
      ))}

      {show && (
        <div className="modal-overlay" onClick={() => setShow(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Assignment</h3>
              <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Assignment title" />
            </div>
            <div className="form-group">
              <label className="form-label">Instructions</label>
              <textarea className="form-textarea" value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} placeholder="What should students do?" />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="datetime-local" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Points</label>
                <input className="form-input" type="number" value={form.max_points} onChange={e => setForm({...form, max_points: e.target.value})} />
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={create} disabled={!form.title}>
              Create Assignment
            </button>
          </div>
        </div>
      )}

      {viewing && (
        <div className="modal-overlay" onClick={() => { setViewing(null); setGrading(null); }}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submissions: {viewing.title}</h3>
              <button onClick={() => setViewing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>×</button>
            </div>
            {submissions.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: 24 }}>No submissions yet</p>}
            {submissions.map(s => (
              <div key={s.id} style={{ padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div className="flex-between">
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{s.student_name}</p>
                  {s.grade !== null && s.grade !== undefined ? (
                    <span className="badge badge-green">{s.grade}/{viewing.max_points}</span>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setGrading(s); setGradeForm({ grade: '', feedback: '' }); }}>Grade</button>
                  )}
                </div>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>{s.content}</p>
                {s.feedback && <p style={{ fontSize: 13, color: '#0d9488', marginTop: 4 }}>Feedback: {s.feedback}</p>}

                {grading?.id === s.id && (
                  <div style={{ marginTop: 10, padding: 12, background: '#f0fdfa', borderRadius: 8 }}>
                    <div className="grid-2" style={{ marginBottom: 8 }}>
                      <div>
                        <label className="form-label">Grade (/{viewing.max_points})</label>
                        <input className="form-input" type="number" value={gradeForm.grade} onChange={e => setGradeForm({...gradeForm, grade: e.target.value})} placeholder="0" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Feedback</label>
                      <textarea className="form-textarea" value={gradeForm.feedback} onChange={e => setGradeForm({...gradeForm, feedback: e.target.value})} placeholder="Comments for student..." style={{ minHeight: 60 }} />
                    </div>
                    <div className="flex-center gap-2">
                      <button className="btn btn-primary btn-sm" onClick={submitGrade}>Save Grade</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setGrading(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== QUIZZES TAB ===== */
function QuizzesTab({ classroomId, canTeach }) {
  const [quizzes, setQuizzes] = useState([]);
  const [show, setShow] = useState(false);
  const [taking, setTaking] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [newQuiz, setNewQuiz] = useState({ title: '', description: '', time_limit_minutes: '', due_date: '', questions: [] });
  const [questions, setQuestions] = useState([]);

  useEffect(() => { api.get(`/quizzes/classroom/${classroomId}`).then(r => setQuizzes(r.data)); }, [classroomId]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { submitQuiz(); return; }
    const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const startQuiz = (q) => {
    setTaking(q);
    setAnswers({});
    setResult(null);
    if (q.time_limit_minutes) setTimeLeft(q.time_limit_minutes * 60);
  };

  const submitQuiz = async () => {
    try {
      const r = await api.post(`/quizzes/${taking.id}/attempt`, { answers });
      setResult(r.data);
      setTaking(null);
      setTimeLeft(null);
      api.get(`/quizzes/classroom/${classroomId}`).then(r => setQuizzes(r.data));
    } catch (e) {
      alert(e.response?.data?.detail || 'Error submitting');
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now(), type: 'multiple_choice', question: '', options: ['', '', '', ''], correct_answer: '' }]);
  };

  const createQuiz = async () => {
    await api.post('/quizzes/', { classroom_id: classroomId, ...newQuiz, questions, time_limit_minutes: newQuiz.time_limit_minutes || null });
    api.get(`/quizzes/classroom/${classroomId}`).then(r => setQuizzes(r.data));
    setShow(false);
    setNewQuiz({ title: '', description: '', time_limit_minutes: '', due_date: '', questions: [] });
    setQuestions([]);
  };

  const formatTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  return (
    <div>
      <div className="flex-between mb-4">
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20 }}>Quizzes</h3>
        {canTeach && <button className="btn btn-primary" onClick={() => setShow(true)}>+ Create Quiz</button>}
      </div>

      {quizzes.length === 0 ? (
        <div className="card empty-state"><div className="empty-state-icon">📊</div><p>No quizzes yet</p></div>
      ) : quizzes.map(q => (
        <div key={q.id} className="card" style={{ marginBottom: 12 }}>
          <div className="flex-between">
            <div>
              <h4 style={{ fontSize: 16, marginBottom: 4 }}>{q.title}</h4>
              {q.description && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>{q.description}</p>}
              <div className="flex-center gap-3" style={{ fontSize: 12, color: '#94a3b8' }}>
                <span>❓ {q.question_count} questions</span>
                {q.time_limit_minutes && <span>⏱️ {q.time_limit_minutes} min</span>}
                {q.due_date && <span>📅 Due {new Date(q.due_date).toLocaleDateString()}</span>}
                {canTeach && <span>👥 {q.attempt_count} attempts</span>}
              </div>
            </div>
            <div className="flex-center gap-2">
              {q.my_attempt ? (
                <span className="badge badge-green">✓ {q.my_attempt.score !== null ? `${q.my_attempt.score}%` : 'Completed'}</span>
              ) : (
                !canTeach && <button className="btn btn-primary btn-sm" onClick={() => startQuiz(q)}>Take Quiz</button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Taking quiz modal */}
      {taking && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>{taking.title}</h3>
              {timeLeft !== null && (
                <span style={{ fontWeight: 700, color: timeLeft < 60 ? '#ef4444' : '#0d9488', fontSize: 16 }}>
                  ⏱️ {formatTime(timeLeft)}
                </span>
              )}
            </div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {taking.questions.map((q, qi) => (
                <div key={q.id} style={{ marginBottom: 24 }}>
                  <p style={{ fontWeight: 600, marginBottom: 12 }}>Q{qi+1}. {q.question}</p>
                  {q.type === 'multiple_choice' && (
                    <div>
                      {q.options?.filter(Boolean).map((opt, i) => (
                        <div key={i} className={`quiz-option ${answers[q.id] === opt ? 'selected' : ''}`} onClick={() => setAnswers({...answers, [q.id]: opt})}>
                          <span style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${answers[q.id] === opt ? '#0d9488' : '#cbd5e1'}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {answers[q.id] === opt && <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#0d9488' }} />}
                          </span>
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.type === 'true_false' && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      {['True', 'False'].map(v => (
                        <button key={v} className={`quiz-option ${answers[q.id] === v ? 'selected' : ''}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setAnswers({...answers, [q.id]: v})}>
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.type === 'short_answer' && (
                    <textarea className="form-textarea" value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} placeholder="Your answer..." style={{ minHeight: 60 }} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex-center gap-2" style={{ marginTop: 16 }}>
              <button className="btn btn-primary btn-lg" onClick={submitQuiz} style={{ flex: 1, justifyContent: 'center' }}>Submit Quiz</button>
              <button className="btn btn-ghost" onClick={() => { setTaking(null); setTimeLeft(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Result modal */}
      {result && (
        <div className="modal-overlay" onClick={() => setResult(null)}>
          <div className="modal" style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{result.score >= 70 ? '🎉' : '📚'}</div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, marginBottom: 8, color: '#0f766e' }}>Quiz Complete!</h3>
            {result.score !== null ? (
              <p style={{ fontSize: 32, fontWeight: 700, color: result.score >= 70 ? '#16a34a' : '#ef4444', marginBottom: 16 }}>{result.score}%</p>
            ) : (
              <p style={{ color: '#64748b', marginBottom: 16 }}>Short answers will be graded by your teacher.</p>
            )}
            <div style={{ marginBottom: 20 }}>
              {result.questions_with_answers?.filter(q => q.type !== 'short_answer').map((q, i) => (
                <div key={i} style={{ textAlign: 'left', padding: '10px', marginBottom: 8, borderRadius: 8, background: result.answers?.[q.id] === q.correct_answer ? '#f0fdf4' : '#fef2f2' }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{q.question}</p>
                  <p style={{ fontSize: 12, color: '#64748b' }}>Your answer: <strong>{result.answers?.[q.id] || '(no answer)'}</strong></p>
                  {result.answers?.[q.id] !== q.correct_answer && <p style={{ fontSize: 12, color: '#16a34a' }}>✓ Correct: {q.correct_answer}</p>}
                </div>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => setResult(null)}>Done</button>
          </div>
        </div>
      )}

      {/* Create quiz modal */}
      {show && (
        <div className="modal-overlay" onClick={() => setShow(false)}>
          <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Quiz</h3>
              <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={newQuiz.title} onChange={e => setNewQuiz({...newQuiz, title: e.target.value})} placeholder="Quiz title" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Time Limit (minutes)</label>
                  <input className="form-input" type="number" value={newQuiz.time_limit_minutes} onChange={e => setNewQuiz({...newQuiz, time_limit_minutes: e.target.value})} placeholder="No limit" />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="datetime-local" value={newQuiz.due_date} onChange={e => setNewQuiz({...newQuiz, due_date: e.target.value})} />
                </div>
              </div>

              <div className="divider" />
              <div className="flex-between mb-3">
                <h4 style={{ fontSize: 15 }}>Questions ({questions.length})</h4>
                <button className="btn btn-secondary btn-sm" onClick={addQuestion}>+ Add Question</button>
              </div>

              {questions.map((q, qi) => (
                <div key={q.id} className="card card-sm" style={{ marginBottom: 12, border: '1px solid #e2e8f0' }}>
                  <div className="flex-between mb-2">
                    <span style={{ fontWeight: 600, fontSize: 13 }}>Q{qi+1}</span>
                    <div className="flex-center gap-2">
                      <select className="form-select" style={{ width: 160, marginBottom: 0 }} value={q.type}
                        onChange={e => setQuestions(questions.map((x, i) => i === qi ? {...x, type: e.target.value} : x))}>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="true_false">True/False</option>
                        <option value="short_answer">Short Answer</option>
                      </select>
                      <button className="btn btn-danger btn-sm" onClick={() => setQuestions(questions.filter((_, i) => i !== qi))}>×</button>
                    </div>
                  </div>
                  <input className="form-input" value={q.question} placeholder="Question text..." onChange={e => setQuestions(questions.map((x, i) => i === qi ? {...x, question: e.target.value} : x))} style={{ marginBottom: 8 }} />
                  
                  {q.type === 'multiple_choice' && (
                    <div>
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex-center gap-2" style={{ marginBottom: 6 }}>
                          <input type="radio" name={`correct-${q.id}`} checked={q.correct_answer === opt} onChange={() => setQuestions(questions.map((x,i) => i === qi ? {...x, correct_answer: opt} : x))} />
                          <input className="form-input" value={opt} placeholder={`Option ${oi+1}`} onChange={e => {
                            const opts = [...q.options]; opts[oi] = e.target.value;
                            setQuestions(questions.map((x,i) => i === qi ? {...x, options: opts} : x));
                          }} style={{ marginBottom: 0 }} />
                        </div>
                      ))}
                      <p style={{ fontSize: 12, color: '#94a3b8' }}>Select the radio button for the correct answer</p>
                    </div>
                  )}
                  {q.type === 'true_false' && (
                    <div className="flex-center gap-3">
                      {['True','False'].map(v => (
                        <label key={v} className="flex-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" name={`tf-${q.id}`} checked={q.correct_answer === v} onChange={() => setQuestions(questions.map((x,i) => i === qi ? {...x, correct_answer: v} : x))} />
                          <span style={{ fontSize: 14 }}>{v}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {q.type === 'short_answer' && <p style={{ fontSize: 12, color: '#94a3b8' }}>Short answer — manually graded by teacher</p>}
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={createQuiz} disabled={!newQuiz.title || questions.length === 0}>
              Create Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== ATTENDANCE TAB ===== */
function AttendanceTab({ classroomId, students, canTeach }) {
  const [sessions, setSessions] = useState([]);
  const [taking, setTaking] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('Class Session');
  const [records, setRecords] = useState({});

  useEffect(() => {
    api.get(`/attendance/classroom/${classroomId}`).then(r => setSessions(r.data));
    if (students.length > 0) {
      const init = {};
      students.forEach(s => init[s.id] = 'present');
      setRecords(init);
    }
  }, [classroomId, students]);

  const save = async () => {
    const recs = Object.entries(records).map(([student_id, status]) => ({ student_id: parseInt(student_id), status }));
    await api.post(`/attendance/session?classroom_id=${classroomId}&title=${encodeURIComponent(sessionTitle)}`, { records: recs });
    api.get(`/attendance/classroom/${classroomId}`).then(r => setSessions(r.data));
    setTaking(false);
  };

  const statuses = ['present', 'absent', 'late', 'excused'];
  const statusClass = { present: 'status-present', absent: 'status-absent', late: 'status-late', excused: 'status-excused' };

  return (
    <div>
      <div className="flex-between mb-4">
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20 }}>Attendance</h3>
        {canTeach && <button className="btn btn-primary" onClick={() => setTaking(true)}>+ Take Attendance</button>}
      </div>

      {sessions.length === 0 ? (
        <div className="card empty-state"><div className="empty-state-icon">📅</div><p>No attendance records yet</p></div>
      ) : (
        <div>
          {sessions.map(s => {
            const total = Object.keys(s.records).length;
            const present = Object.values(s.records).filter(v => v === 'present').length;
            return (
              <div key={s.id} className="card" style={{ marginBottom: 10 }}>
                <div className="flex-between">
                  <div>
                    <h4 style={{ fontSize: 15, marginBottom: 2 }}>{s.title}</h4>
                    <p style={{ fontSize: 13, color: '#94a3b8' }}>{new Date(s.session_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="flex-center gap-2">
                    <span className="badge badge-green">{present} present</span>
                    <span className="badge badge-gray">{total - present} absent/other</span>
                  </div>
                </div>
                {canTeach && (
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {students.map(st => (
                      <span key={st.id} className={`attendance-status ${statusClass[s.records[st.id] || 'absent']}`}>
                        {st.full_name}: {s.records[st.id] || 'absent'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {taking && (
        <div className="modal-overlay" onClick={() => setTaking(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Take Attendance</h3>
              <button onClick={() => setTaking(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Session Title</label>
              <input className="form-input" value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} placeholder="e.g. Week 3 Monday" />
            </div>
            <div style={{ maxHeight: 350, overflowY: 'auto' }}>
              {students.map(s => (
                <div key={s.id} className="flex-between" style={{ padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                  <div className="flex-center gap-3">
                    <div className="avatar avatar-sm" style={{ background: s.avatar_color || '#0d9488' }}>{s.full_name?.[0]?.toUpperCase()}</div>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{s.full_name}</span>
                  </div>
                  <div className="flex-center gap-1">
                    {statuses.map(st => (
                      <button key={st} onClick={() => setRecords({...records, [s.id]: st})}
                        className={`attendance-status ${statusClass[st]}`}
                        style={{ opacity: records[s.id] === st ? 1 : 0.35, border: records[s.id] === st ? '2px solid currentColor' : '2px solid transparent' }}>
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={save}>Save Attendance</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== ZOOM TAB ===== */
function ZoomTab({ classroomId, canTeach }) {
  const [links, setLinks] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', scheduled_at: '', description: '' });

  useEffect(() => { api.get(`/messages/zoom/${classroomId}`).then(r => setLinks(r.data)); }, [classroomId]);

  const add = async () => {
    await api.post('/messages/zoom', { classroom_id: classroomId, ...form });
    api.get(`/messages/zoom/${classroomId}`).then(r => setLinks(r.data));
    setShow(false);
    setForm({ title: '', url: '', scheduled_at: '', description: '' });
  };

  const del = async (id) => {
    await api.delete(`/messages/zoom/${id}`);
    setLinks(links.filter(l => l.id !== id));
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20 }}>Live Sessions</h3>
        {canTeach && <button className="btn btn-primary" onClick={() => setShow(true)}>+ Add Session</button>}
      </div>

      {links.length === 0 ? (
        <div className="card empty-state"><div className="empty-state-icon">📹</div><p>No live sessions posted yet</p></div>
      ) : links.map(l => (
        <div key={l.id} className="card" style={{ marginBottom: 12, borderLeft: '4px solid #0d9488' }}>
          <div className="flex-between">
            <div>
              <h4 style={{ fontSize: 16, marginBottom: 4 }}>{l.title}</h4>
              {l.description && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>{l.description}</p>}
              {l.scheduled_at && (
                <p style={{ fontSize: 13, color: '#94a3b8' }}>
                  📅 {new Date(l.scheduled_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            <div className="flex-center gap-2">
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                🎥 Join
              </a>
              {canTeach && <button className="btn btn-danger btn-sm" onClick={() => del(l.id)}>Delete</button>}
            </div>
          </div>
        </div>
      ))}

      {show && (
        <div className="modal-overlay" onClick={() => setShow(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Live Session</h3>
              <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Session Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Week 3 Live Class" />
            </div>
            <div className="form-group">
              <label className="form-label">Zoom / Meeting Link *</label>
              <input className="form-input" value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="https://zoom.us/j/..." />
            </div>
            <div className="form-group">
              <label className="form-label">Date & Time</label>
              <input className="form-input" type="datetime-local" value={form.scheduled_at} onChange={e => setForm({...form, scheduled_at: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What will be covered?" />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={add} disabled={!form.title || !form.url}>
              Post Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== MESSAGES TAB ===== */
function MessagesTab({ classroomId, classroom }) {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [thread, setThread] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const { user } = useAuth();

  useEffect(() => { api.get('/messages/conversations').then(r => setConversations(r.data)); }, []);

  const openThread = (conv) => {
    setSelected(conv);
    api.get(`/messages/thread/${conv.user_id}`).then(r => setThread(r.data));
  };

  const send = async () => {
    if (!newMsg.trim() || !selected) return;
    await api.post('/messages/', { receiver_id: selected.user_id, content: newMsg, classroom_id: classroomId });
    setThread([...thread, { sender_id: user.id, content: newMsg, created_at: new Date().toISOString() }]);
    setNewMsg('');
  };

  // Get people in this class to message
  const contacts = user.role === 'student'
    ? (classroom?.educators || []).map(e => ({ user_id: e.id, user_name: e.full_name, avatar_color: e.avatar_color, role: 'educator' }))
    : (classroom?.students || []).map(s => ({ user_id: s.id, user_name: s.full_name, avatar_color: s.avatar_color, role: 'student' }));

  return (
    <div>
      <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, marginBottom: 16 }}>Messages</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, height: 460 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: 13 }}>
            {user.role === 'student' ? 'Teachers' : 'Students'}
          </div>
          <div style={{ overflowY: 'auto', height: 'calc(100% - 44px)' }}>
            {contacts.map(c => {
              const conv = conversations.find(x => x.user_id === c.user_id);
              return (
                <div key={c.user_id} onClick={() => openThread(conv || c)} style={{
                  padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc',
                  background: selected?.user_id === c.user_id ? '#f0fdfa' : 'white',
                  display: 'flex', gap: 8, alignItems: 'center'
                }}>
                  <div className="avatar avatar-sm" style={{ background: c.avatar_color || '#0d9488' }}>{c.user_name?.[0]?.toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{c.user_name}</p>
                    {conv && <p style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.last_message}</p>}
                  </div>
                  {conv?.unread > 0 && <span className="notif-badge" style={{ position: 'static' }}>{conv.unread}</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          {!selected ? (
            <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="empty-state-icon">💬</div><p>Select someone to message</p>
            </div>
          ) : (
            <>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{selected.user_name}</div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
                {thread.map((m, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender_id === user.id ? 'flex-end' : 'flex-start' }}>
                    <div className={`message-bubble ${m.sender_id === user.id ? 'sent' : 'received'}`}>{m.content}</div>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 4px 6px' }}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
                <input className="form-input" value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..."
                  onKeyDown={e => e.key === 'Enter' && send()} style={{ marginBottom: 0 }} />
                <button className="btn btn-primary" onClick={send}>Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== MAIN CLASSROOM PAGE ===== */
export default function ClassroomPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [activeTab, setActiveTab] = useState('videos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/classrooms/${id}`).then(r => { setClassroom(r.data); setLoading(false); }).catch(() => navigate(-1));
  }, [id, navigate]);

  const canTeach = user?.role === 'admin' || user?.role === 'educator';

  const tabs = [
    { id: 'videos', label: 'Videos', icon: '🎬' },
    { id: 'assignments', label: 'Assignments', icon: '📝' },
    { id: 'quizzes', label: 'Quizzes', icon: '📊' },
    ...(canTeach ? [{ id: 'attendance', label: 'Attendance', icon: '📅' }] : []),
    { id: 'zoom', label: 'Live Sessions', icon: '📹' },
    { id: 'messages', label: 'Messages', icon: '💬' },
  ];

  const backPath = user?.role === 'admin' ? '/admin/my-classes' : user?.role === 'educator' ? '/educator' : '/student';

  const navItems = [
    { icon: '⬅️', label: 'Back to Dashboard', path: backPath },
    { type: 'section', label: classroom?.name || 'Classroom' },
    ...tabs.map(t => ({ icon: t.icon, label: t.label, path: '#' })),
  ];

  if (loading) return (
    <div className="auth-page"><div className="full-spinner"><div className="spinner" style={{ width: 40, height: 40 }} /></div></div>
  );

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
          <button className="sidebar-link" onClick={() => navigate(backPath)}>
            <span className="sidebar-icon">⬅️</span> Back to Dashboard
          </button>
          <div className="sidebar-section-label">{classroom?.name}</div>
          {classroom?.subject && <div style={{ padding: '4px 12px', fontSize: 12, color: '#94a3b8' }}>{classroom.subject}</div>}
          {tabs.map(t => (
            <button key={t.id} className={`sidebar-link ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <span className="sidebar-icon">{t.icon}</span> {t.label}
            </button>
          ))}
          {canTeach && (
            <>
              <div className="sidebar-section-label">Members</div>
              <div style={{ padding: '4px 12px', fontSize: 12, color: '#64748b' }}>🎓 {classroom?.student_count} students</div>
            </>
          )}
        </nav>
        <div className="sidebar-user">
          <div className="avatar avatar-sm" style={{ background: user?.avatar_color || '#0d9488' }}>
            {user?.full_name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{user?.role}</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div>
            <h1 style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', color: '#0f766e' }}>{classroom?.name}</h1>
            {classroom?.subject && <p style={{ fontSize: 12, color: '#94a3b8' }}>{classroom.subject}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: classroom?.color || '#0d9488' }} />
            <span style={{ fontSize: 13, color: '#64748b' }}>{classroom?.student_count} students</span>
          </div>
        </header>

        <div className="page-content">
          <div className="tabs" style={{ marginBottom: 24 }}>
            {tabs.map(t => (
              <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'videos' && <VideosTab classroomId={id} canTeach={canTeach} />}
          {activeTab === 'assignments' && <AssignmentsTab classroomId={id} canTeach={canTeach} />}
          {activeTab === 'quizzes' && <QuizzesTab classroomId={id} canTeach={canTeach} />}
          {activeTab === 'attendance' && canTeach && <AttendanceTab classroomId={id} students={classroom?.students || []} canTeach={canTeach} />}
          {activeTab === 'zoom' && <ZoomTab classroomId={id} canTeach={canTeach} />}
          {activeTab === 'messages' && <MessagesTab classroomId={id} classroom={classroom} />}
        </div>
      </main>
    </div>
  );
}
