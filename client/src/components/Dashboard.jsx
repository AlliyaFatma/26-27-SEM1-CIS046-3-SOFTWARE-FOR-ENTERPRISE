import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Eye, 
  GraduationCap, 
  Users,
  ShieldCheck
} from 'lucide-react';

export default function Dashboard({ onLogout, onTestStudentChallenge }) {
  const { user, token } = useAuth();

  // Active Tab: 'classroom-leaderboard' | 'classrooms'
  const [activeTab, setActiveTab] = useState('classroom-leaderboard');

  // Teacher Classrooms & Leaderboard State
  const [myClassrooms, setMyClassrooms] = useState([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [selectedClassroomCode, setSelectedClassroomCode] = useState('');
  const [classroomLeaderboard, setClassroomLeaderboard] = useState([]);
  const [classroomDetails, setClassroomDetails] = useState(null);
  const [classroomStats, setClassroomStats] = useState(null);
  const [loadingClassLeaderboard, setLoadingClassLeaderboard] = useState(false);

  // Create Classroom Form State
  const [newClassTitle, setNewClassTitle] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);
  const [createNotice, setCreateNotice] = useState({ type: '', text: '' });
  const [copiedCode, setCopiedCode] = useState('');

  // Inspect Student Modal State
  const [inspectStudent, setInspectStudent] = useState(null);
  const [actionNotice, setActionNotice] = useState('');

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Copy to clipboard helper
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 3000);
  };

  // Load teacher classrooms from server
  const loadTeacherClassrooms = useCallback(async () => {
    if (!token) return;
    setLoadingClassrooms(true);
    try {
      const res = await fetch('/api/classroom/my-classrooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMyClassrooms(data.classrooms || []);
        if (data.classrooms && data.classrooms.length > 0 && !selectedClassroomCode) {
          setSelectedClassroomCode(data.classrooms[0].code);
        }
      }
    } catch (err) {
      console.error('Error fetching classrooms:', err);
    } finally {
      setLoadingClassrooms(false);
    }
  }, [token, selectedClassroomCode]);

  // Load classroom leaderboard
  const loadClassroomLeaderboard = useCallback(async (code) => {
    const codeToFetch = code || selectedClassroomCode;
    if (!codeToFetch) return;

    setLoadingClassLeaderboard(true);
    try {
      const res = await fetch(`/api/classroom/${encodeURIComponent(codeToFetch)}/leaderboard`);
      const data = await res.json();
      if (res.ok && data.success) {
        setClassroomLeaderboard(data.leaderboard || []);
        setClassroomDetails(data.classroom || null);
        setClassroomStats(data.stats || null);
      }
    } catch (err) {
      console.error('Error loading classroom leaderboard:', err);
    } finally {
      setLoadingClassLeaderboard(false);
    }
  }, [selectedClassroomCode]);

  // Initial load
  useEffect(() => {
    if (token) {
      loadTeacherClassrooms();
    }
  }, [token, loadTeacherClassrooms]);

  // Load leaderboard when selected classroom changes
  useEffect(() => {
    if (selectedClassroomCode) {
      loadClassroomLeaderboard(selectedClassroomCode);
    }
  }, [selectedClassroomCode, loadClassroomLeaderboard]);

  // Create new classroom handler
  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    setCreateNotice({ type: '', text: '' });
    setCreatingClass(true);

    try {
      const res = await fetch('/api/classroom/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newClassTitle.trim() || 'Math Puzzle Challenge',
          code: newClassCode.trim().toUpperCase(),
          puzzlesCount: 10
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCreateNotice({
          type: 'success',
          text: `Classroom created! Code: ${data.classroom.code}`
        });
        setNewClassTitle('');
        setNewClassCode('');
        setSelectedClassroomCode(data.classroom.code);
        await loadTeacherClassrooms();
        setActiveTab('classroom-leaderboard');
      } else {
        setCreateNotice({
          type: 'error',
          text: data.message || 'Failed to create classroom'
        });
      }
    } catch (err) {
      setCreateNotice({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setCreatingClass(false);
    }
  };

  // Delete classroom handler
  const handleDeleteClassroom = async (id, code, title) => {
    if (!window.confirm(`Delete classroom "${title}" (${code})? Student records for this code will be permanently removed.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/classroom/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice(`Classroom ${code} was deleted successfully.`);
        setTimeout(() => setActionNotice(''), 3500);
        await loadTeacherClassrooms();
        if (selectedClassroomCode === code) {
          setSelectedClassroomCode('');
          setClassroomLeaderboard([]);
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Teacher';

  return (
    <div className="dashboard-page">
      {/* Header Banner */}
      <div className="dashboard-hero-banner">
        <div className="container dashboard-header-content">
          <div className="user-welcome-area">
            <h1 className="welcome-heading">
              Welcome back, <span className="highlight-name">{displayName}</span>
            </h1>
            <p className="welcome-subtext">
              Manage your classroom codes and monitor real-time student leaderboard results.
            </p>
          </div>

          {/* Active Code Card */}
          {selectedClassroomCode && (
            <div className="teacher-quick-code-card">
              <span className="quick-code-label">Active Classroom Code:</span>
              <div className="quick-code-row">
                <span className="code-text-big">{selectedClassroomCode}</span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm copy-btn"
                  onClick={() => copyToClipboard(selectedClassroomCode)}
                  title="Copy Classroom Code"
                >
                  {copiedCode === selectedClassroomCode ? (
                    <>
                      <Check size={14} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy Code
                    </>
                  )}
                </button>
              </div>
              <span className="quick-code-hint">Share this code with students to join from the navbar.</span>
            </div>
          )}
        </div>
      </div>

      {actionNotice && (
        <div className="container notice-banner-wrapper">
          <div className="notice-banner">
            <ShieldCheck size={16} /> {actionNotice}
          </div>
        </div>
      )}

      {/* Main Dashboard Body */}
      <div className="container dashboard-body">
        {/* Navigation Tabs (Only Classroom Leaderboard and Manage Classrooms) */}
        <div className="dashboard-tabs-bar">
          <button
            className={`dash-tab-btn ${activeTab === 'classroom-leaderboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('classroom-leaderboard');
              if (selectedClassroomCode) loadClassroomLeaderboard(selectedClassroomCode);
            }}
          >
            <Trophy size={16} /> Classroom Leaderboard
          </button>

          <button
            className={`dash-tab-btn ${activeTab === 'classrooms' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('classrooms');
              loadTeacherClassrooms();
            }}
          >
            <Users size={16} /> Manage Classrooms & Codes ({myClassrooms.length})
          </button>
        </div>

        {/* ========================================================
            TAB 1: CLASSROOM LEADERBOARD
            ======================================================== */}
        {activeTab === 'classroom-leaderboard' && (
          <div className="classroom-leaderboard-view">
            {/* Classroom Selector Bar */}
            <div className="classroom-select-bar">
              <div className="select-dropdown-wrap">
                <label className="select-label" htmlFor="classroom-select">
                  Classroom:
                </label>
                {myClassrooms.length > 0 ? (
                  <select
                    id="classroom-select"
                    className="classroom-select-dropdown"
                    value={selectedClassroomCode}
                    onChange={(e) => setSelectedClassroomCode(e.target.value)}
                  >
                    {myClassrooms.map((cls) => (
                      <option key={cls._id} value={cls.code}>
                        {cls.title} (Code: {cls.code}) • {cls.studentCount || 0} Students
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="no-class-text">
                    No classrooms created yet.{' '}
                    <button
                      type="button"
                      className="link-btn font-bold"
                      onClick={() => setActiveTab('classrooms')}
                    >
                      + Create a classroom code
                    </button>
                  </span>
                )}
              </div>

              <div className="leaderboard-actions-right">
                {selectedClassroomCode && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => copyToClipboard(selectedClassroomCode)}
                    >
                      {copiedCode === selectedClassroomCode ? (
                        <>
                          <Check size={14} /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copy Code: <strong>{selectedClassroomCode}</strong>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        if (onTestStudentChallenge) {
                          onTestStudentChallenge(selectedClassroomCode);
                        }
                      }}
                      title="Open student view with this code"
                    >
                      <GraduationCap size={14} /> Test as Student
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => loadClassroomLeaderboard(selectedClassroomCode)}
                  disabled={loadingClassLeaderboard || !selectedClassroomCode}
                >
                  <RefreshCw size={13} className={loadingClassLeaderboard ? 'spin' : ''} /> Refresh
                </button>
              </div>
            </div>

            {/* Metrics Overview */}
            {selectedClassroomCode && (
              <div className="class-metrics-grid">
                <div className="class-metric-card">
                  <div className="metric-icon-box users-icon">
                    <Users size={18} />
                  </div>
                  <div>
                    <div className="metric-num">{classroomStats?.totalStudents || classroomLeaderboard.length}</div>
                    <div className="metric-label">Students Completed (10/10)</div>
                  </div>
                </div>

                <div className="class-metric-card">
                  <div className="metric-icon-box trophy-icon">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <div className="metric-num">{classroomStats?.avgScore || 0} pts</div>
                    <div className="metric-label">Class Average Score</div>
                  </div>
                </div>

                <div className="class-metric-card">
                  <div className="metric-icon-box star-icon">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <div className="metric-num">{classroomStats?.perfectScoresCount || 0}</div>
                    <div className="metric-label">Perfect 10/10 Scores</div>
                  </div>
                </div>

                <div className="class-metric-card">
                  <div className="metric-icon-box flame-icon">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <div className="metric-num">
                      {classroomLeaderboard[0]?.studentUsername || '—'}
                    </div>
                    <div className="metric-label">Top Scorer (Rank #1)</div>
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard Table Card */}
            <div className="tab-card">
              <div className="tab-card-header">
                <div>
                  <h2 className="tab-card-title">
                    Leaderboard: {classroomDetails?.title || selectedClassroomCode || 'Select a Classroom'}
                  </h2>
                  <p className="tab-card-subtitle">
                    Students who joined with code <strong>{selectedClassroomCode || 'N/A'}</strong> and completed all 10 puzzles.
                  </p>
                </div>
              </div>

              {loadingClassLeaderboard ? (
                <div className="tab-loading-state">
                  <div className="spinner"></div>
                  <p>Loading rankings...</p>
                </div>
              ) : !selectedClassroomCode ? (
                <div className="empty-state-box">
                  <Users size={40} color="#cbd5e1" />
                  <p>You haven't created a classroom code yet.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setActiveTab('classrooms')}
                  >
                    + Create Your First Classroom Code
                  </button>
                </div>
              ) : classroomLeaderboard.length === 0 ? (
                <div className="empty-state-box">
                  <GraduationCap size={44} color="#cbd5e1" />
                  <h3>No student submissions yet for code: {selectedClassroomCode}</h3>
                  <p>
                    Share code <strong>{selectedClassroomCode}</strong> with your students.
                    They click <strong>"Student Join"</strong> in the navbar and enter their nickname to begin.
                  </p>
                  <div className="empty-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => copyToClipboard(selectedClassroomCode)}
                    >
                      <Copy size={14} /> Copy Classroom Code
                    </button>
                    {onTestStudentChallenge && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => onTestStudentChallenge(selectedClassroomCode)}
                      >
                        <GraduationCap size={14} /> Test Submission as Student
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="enterprise-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Student Username</th>
                        <th>Score</th>
                        <th>Solved</th>
                        <th>Accuracy</th>
                        <th>Total Time</th>
                        <th>Completed</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classroomLeaderboard.map((item) => (
                        <tr key={item.id}>
                          <td className="rank-cell">
                            {item.rank === 1 ? '🥇 #1' : item.rank === 2 ? '🥈 #2' : item.rank === 3 ? '🥉 #3' : `#${item.rank}`}
                          </td>
                          <td className="player-cell">
                            <span className="player-name-bold">{item.studentUsername}</span>
                          </td>
                          <td className="score-cell font-bold">{item.score} pts</td>
                          <td>
                            <span className="tag-solved">
                              {item.correctCount} / {item.totalPuzzles || 10}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`accuracy-pill ${
                                item.accuracy >= 80 ? 'acc-high' : item.accuracy >= 50 ? 'acc-mid' : 'acc-low'
                              }`}
                            >
                              {item.accuracy}%
                            </span>
                          </td>
                          <td className="time-cell">{formatTime(item.totalTimeSec)}</td>
                          <td className="date-cell">
                            {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              onClick={() => setInspectStudent(item)}
                              title="View individual question results"
                            >
                              <Eye size={12} /> View Answers
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal: Inspect Student's 10 Puzzle Answers */}
            {inspectStudent && (
              <div className="modal-overlay" onClick={() => setInspectStudent(null)}>
                <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div>
                      <h3 className="modal-title">
                        Results: {inspectStudent.studentUsername}
                      </h3>
                      <p className="modal-subtitle">
                        Score: <strong>{inspectStudent.score} pts</strong> • Solved:{' '}
                        <strong>
                          {inspectStudent.correctCount} / {inspectStudent.totalPuzzles}
                        </strong>{' '}
                        • Time: <strong>{formatTime(inspectStudent.totalTimeSec)}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      className="modal-close-btn"
                      onClick={() => setInspectStudent(null)}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="modal-body">
                    {inspectStudent.puzzles && inspectStudent.puzzles.length > 0 ? (
                      <div className="student-puzzles-breakdown">
                        {inspectStudent.puzzles.map((p, idx) => (
                          <div
                            key={idx}
                            className={`puzzle-inspect-row ${
                              p.isCorrect ? 'row-correct' : 'row-incorrect'
                            }`}
                          >
                            <div className="inspect-col-idx">
                              <span className="badge-q-num">Q{p.puzzleIndex || idx + 1}</span>
                              {p.isCorrect ? (
                                <CheckCircle2 size={16} color="#16a34a" />
                              ) : (
                                <XCircle size={16} color="#dc2626" />
                              )}
                            </div>

                            {p.question && (
                              <div className="inspect-col-img">
                                <img
                                  src={p.question}
                                  alt={`Puzzle ${idx + 1}`}
                                  className="inspect-thumb-img"
                                />
                              </div>
                            )}

                            <div className="inspect-col-details">
                              <div>
                                Student Guess: <strong>{p.userGuess}</strong>
                              </div>
                              <div>
                                Solution: <strong className="sol-badge">{p.solution}</strong>
                              </div>
                              {p.timeTakenSec > 0 && (
                                <div className="inspect-time">
                                  <Clock size={11} /> {p.timeTakenSec}s
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>Detailed per-question log not available for this entry.</p>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setInspectStudent(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: MANAGE CLASSROOMS & CODES
            ======================================================== */}
        {activeTab === 'classrooms' && (
          <div className="manage-classrooms-view">
            {/* Create Classroom Card */}
            <div className="tab-card create-class-card">
              <div className="tab-card-header">
                <div>
                  <h2 className="tab-card-title">Create a Classroom Code</h2>
                  <p className="tab-card-subtitle">
                    Generate a code that students can enter in the navbar to participate in the 10 Math Puzzle Challenge.
                  </p>
                </div>
              </div>

              {createNotice.text && (
                <div
                  className={`alert ${
                    createNotice.type === 'success' ? 'alert-success' : 'alert-error'
                  }`}
                >
                  {createNotice.type === 'success' ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <XCircle size={16} />
                  )}
                  <span>{createNotice.text}</span>
                </div>
              )}

              <form onSubmit={handleCreateClassroom} className="create-class-form">
                <div className="form-row-2col">
                  <div className="form-group">
                    <label className="form-label" htmlFor="new-class-title">
                      Classroom / Challenge Name
                    </label>
                    <input
                      id="new-class-title"
                      type="text"
                      className="input-field"
                      placeholder="e.g. Period 2 Math, Grade 7 Challenge"
                      value={newClassTitle}
                      onChange={(e) => setNewClassTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <div className="label-with-hint">
                      <label className="form-label" htmlFor="new-class-code">
                        Classroom Code (Optional)
                      </label>
                      <span className="label-hint">Leave blank to auto-generate</span>
                    </div>
                    <div className="input-with-button">
                      <input
                        id="new-class-code"
                        type="text"
                        className="input-field code-input"
                        placeholder="e.g. MATH-101"
                        value={newClassCode}
                        onChange={(e) => setNewClassCode(e.target.value.toUpperCase())}
                      />
                      <button
                        type="button"
                        className="btn btn-outline btn-sm gen-code-btn"
                        onClick={() =>
                          setNewClassCode(`MATH-${Math.floor(1000 + Math.random() * 9000)}`)
                        }
                      >
                        Auto-Gen
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary submit-create-btn"
                  disabled={creatingClass}
                >
                  {creatingClass ? (
                    'Creating Classroom...'
                  ) : (
                    <>
                      <Plus size={15} /> Create Classroom Code
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* List of Created Classrooms */}
            <div className="tab-card existing-classes-card">
              <div className="tab-card-header">
                <div>
                  <h2 className="tab-card-title">Your Active Classrooms ({myClassrooms.length})</h2>
                  <p className="tab-card-subtitle">
                    All classroom codes you have created for your students.
                  </p>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={loadTeacherClassrooms}
                  disabled={loadingClassrooms}
                >
                  <RefreshCw size={13} className={loadingClassrooms ? 'spin' : ''} /> Refresh
                </button>
              </div>

              {loadingClassrooms ? (
                <div className="tab-loading-state">
                  <div className="spinner"></div>
                  <p>Loading classrooms...</p>
                </div>
              ) : myClassrooms.length === 0 ? (
                <div className="empty-state-box">
                  <Users size={38} color="#cbd5e1" />
                  <p>No classroom codes created yet.</p>
                </div>
              ) : (
                <div className="classrooms-cards-grid">
                  {myClassrooms.map((cls) => (
                    <div key={cls._id} className="classroom-item-card">
                      <div className="class-card-top">
                        <div className="class-code-badge">
                          <span>CODE:</span>
                          <strong>{cls.code}</strong>
                        </div>
                        <button
                          type="button"
                          className="btn-icon-copy"
                          onClick={() => copyToClipboard(cls.code)}
                          title="Copy Classroom Code"
                        >
                          {copiedCode === cls.code ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>

                      <h3 className="class-title-heading">{cls.title}</h3>
                      <p className="class-desc-text">{cls.description}</p>

                      <div className="class-stats-row">
                        <div className="class-stat-mini">
                          <span className="stat-mini-num">{cls.studentCount || 0}</span>
                          <span className="stat-mini-label">Completed</span>
                        </div>
                        <div className="class-stat-mini">
                          <span className="stat-mini-num">{cls.avgScore || 0} pts</span>
                          <span className="stat-mini-label">Avg Score</span>
                        </div>
                        <div className="class-stat-mini">
                          <span className="stat-mini-num">{cls.topScore || 0} pts</span>
                          <span className="stat-mini-label">Top Score</span>
                        </div>
                      </div>

                      <div className="class-card-footer">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm flex-1"
                          onClick={() => {
                            setSelectedClassroomCode(cls.code);
                            setActiveTab('classroom-leaderboard');
                          }}
                        >
                          <Trophy size={14} /> View Leaderboard
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline btn-sm delete-class-btn"
                          onClick={() => handleDeleteClassroom(cls._id, cls.code, cls.title)}
                          title="Delete classroom"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
