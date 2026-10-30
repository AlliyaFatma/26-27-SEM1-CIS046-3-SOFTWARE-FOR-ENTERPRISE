import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, 
  Flame, 
  Award, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Clock, 
  Send, 
  History, 
  RotateCcw, 
  Gamepad2, 
  User as UserIcon, 
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function Dashboard({ onLogout }) {
  const { user, token, logout, updateUser, refreshUser } = useAuth();

  // Active Tab: 'play' | 'leaderboard' | 'history'
  const [activeTab, setActiveTab] = useState('play');

  // Game State
  const [puzzle, setPuzzle] = useState(null); // { question: string, solution: number }
  const [loadingPuzzle, setLoadingPuzzle] = useState(false);
  const [puzzleError, setPuzzleError] = useState(null);
  const [selectedDigit, setSelectedDigit] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error' | 'hint', message: string, points?: number }
  const [submitting, setSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // Stats & History from Server
  const [stats, setStats] = useState({
    score: user?.score || 0,
    gamesPlayed: user?.gamesPlayed || 0,
    gamesWon: user?.gamesWon || 0,
    currentStreak: user?.currentStreak || 0,
    bestStreak: user?.bestStreak || 0,
    winRate: user?.gamesPlayed ? Math.round(((user?.gamesWon || 0) / user.gamesPlayed) * 100) : 0
  });
  const [historyList, setHistoryList] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  // Sync user state with stats
  useEffect(() => {
    if (user) {
      setStats(prev => ({
        ...prev,
        score: user.score || 0,
        gamesPlayed: user.gamesPlayed || 0,
        gamesWon: user.gamesWon || 0,
        currentStreak: user.currentStreak || 0,
        bestStreak: user.bestStreak || 0,
        winRate: user.gamesPlayed ? Math.round(((user.gamesWon || 0) / user.gamesPlayed) * 100) : 0
      }));
    }
  }, [user]);

  // Fetch a new puzzle from API
  const fetchNewPuzzle = useCallback(async () => {
    setLoadingPuzzle(true);
    setPuzzleError(null);
    setFeedback(null);
    setSelectedDigit('');
    setShowHint(false);
    setElapsedSeconds(0);

    // Stop timer
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      // 1. Try fetching via our server proxy first
      let res = await fetch('/api/game/puzzle');
      let data;
      
      if (res.ok) {
        data = await res.json();
      } else {
        // Fallback: direct call to Marc Conrad API
        res = await fetch('https://marcconrad.com/uob/banana/api.php?out=json');
        data = await res.json();
      }

      if (data && data.question && data.solution !== undefined) {
        setPuzzle({
          question: data.question,
          solution: Number(data.solution)
        });

        // Start timer
        timerRef.current = setInterval(() => {
          setElapsedSeconds(s => s + 1);
        }, 1000);
      } else {
        throw new Error('Received unexpected format from Banana API');
      }
    } catch (err) {
      console.error('Failed to load puzzle:', err);
      setPuzzleError('Failed to load puzzle from Banana Game API. Click retry to try again.');
    } finally {
      setLoadingPuzzle(false);
    }
  }, []);

  // Initial puzzle load
  useEffect(() => {
    fetchNewPuzzle();
    loadStatsAndHistory();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchNewPuzzle]);

  // Fetch full stats and history from server
  const loadStatsAndHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/game/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
        setHistoryList(data.history || []);
        updateUser(data.stats);
      }
    } catch (err) {
      console.error('Error fetching game stats:', err);
    }
  };

  // Fetch Leaderboard
  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch('/api/game/leaderboard');
      const data = await res.json();
      if (res.ok && data.success) {
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Handle Tab Change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'leaderboard') {
      fetchLeaderboard();
    } else if (tab === 'history') {
      loadStatsAndHistory();
    }
  };

  // Submit Answer
  const handleAnswerSubmit = async (digitToTest) => {
    const digit = digitToTest !== undefined ? digitToTest : selectedDigit;
    if (digit === '' || digit === null || isNaN(digit)) {
      setFeedback({
        type: 'error',
        message: 'Please choose a digit (0 to 9) before submitting!'
      });
      return;
    }

    if (!puzzle) return;

    setSubmitting(true);
    const numericGuess = Number(digit);
    const numericSolution = Number(puzzle.solution);
    const isCorrect = numericGuess === numericSolution;

    // Stop timer
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      // Record game in MongoDB backend
      const res = await fetch('/api/game/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          question: puzzle.question,
          userGuess: numericGuess,
          solution: numericSolution,
          timeTakenSec: elapsedSeconds
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStats(data.stats);
        updateUser(data.stats);
        if (data.history) {
          setHistoryList(data.history);
        }

        if (isCorrect) {
          setFeedback({
            type: 'success',
            message: `🎉 Correct! The missing digit was ${numericSolution}!`,
            points: data.pointsEarned
          });
        } else {
          setFeedback({
            type: 'error',
            message: `❌ Not quite! You answered ${numericGuess}, but that is incorrect. Try another guess or check the hint!`
          });
        }
      } else {
        // Fallback local update if network hiccups
        if (isCorrect) {
          setFeedback({
            type: 'success',
            message: `🎉 Correct! The missing digit was ${numericSolution}!`,
            points: 10
          });
        } else {
          setFeedback({
            type: 'error',
            message: `❌ Incorrect digit. Try again!`
          });
        }
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      if (isCorrect) {
        setFeedback({
          type: 'success',
          message: `🎉 Correct answer: ${numericSolution}!`,
          points: 10
        });
      } else {
        setFeedback({
          type: 'error',
          message: `❌ Incorrect guess. Try again!`
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard number support
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only capture if on play tab and not typing in an input
      if (activeTab !== 'play') return;
      if (e.target.tagName === 'INPUT' && e.target.id !== 'banana-custom-input') return;

      if (e.key >= '0' && e.key <= '9') {
        setSelectedDigit(e.key);
      } else if (e.key === 'Enter' && selectedDigit !== '') {
        handleAnswerSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, selectedDigit, puzzle]);

  // Reset Stats Handler
  const handleResetStats = async () => {
    if (!window.confirm('Are you sure you want to reset your score and streak to 0?')) return;
    try {
      const res = await fetch('/api/game/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
        setHistoryList([]);
        updateUser(data.stats);
        setActionNotice('Your game stats were reset successfully.');
        setTimeout(() => setActionNotice(''), 3500);
      }
    } catch (err) {
      console.error('Failed to reset stats:', err);
    }
  };

  return (
    <div className="dashboard-page">
      {/* Top Banner & Header */}
      <div className="dashboard-hero-banner">
        <div className="container dashboard-header-content">
          <div className="user-welcome-area">
            <div className="welcome-tag">
              <span className="role-pill">{user?.role || 'student'}</span>
            </div>
            <h1 className="welcome-heading">
              Welcome back, <span className="highlight-name">{user?.name || user?.email?.split('@')[0]}</span>! 🍌
            </h1>
            <p className="welcome-subtext">
              Solve Dr. Marc Conrad's Banana math puzzles, rack up points, maintain your winning streak, and climb the classroom leaderboard!
            </p>
          </div>

          <div className="header-quick-stats">
            <div className="stat-pill-group">
              <div className="stat-pill-card">
                <div className="pill-icon trophy-bg">
                  <Trophy size={18} />
                </div>
                <div>
                  <div className="pill-value">{stats.score}</div>
                  <div className="pill-label">Total Points</div>
                </div>
              </div>

              <div className="stat-pill-card">
                <div className="pill-icon flame-bg">
                  <Flame size={18} />
                </div>
                <div>
                  <div className="pill-value">{stats.currentStreak} 🔥</div>
                  <div className="pill-label">Streak (Best: {stats.bestStreak})</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="container notice-banner-wrapper">
          <div className="notice-banner">
            <ShieldCheck size={18} /> {actionNotice}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="container dashboard-body">
        {/* Navigation Tabs */}
        <div className="dashboard-tabs-bar">
          <button 
            className={`dash-tab-btn ${activeTab === 'play' ? 'active' : ''}`}
            onClick={() => handleTabChange('play')}
          >
            <Gamepad2 size={17} /> Banana Math Arena
          </button>
          <button 
            className={`dash-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('leaderboard')}
          >
            <Trophy size={17} /> Classroom Leaderboard
          </button>
          <button 
            className={`dash-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabChange('history')}
          >
            <History size={17} /> Match History ({historyList.length})
          </button>
        </div>

        {/* ========================================================
            TAB 1: PLAY ARENA
            ======================================================== */}
        {activeTab === 'play' && (
          <div className="game-grid-layout">
            {/* Left: Main Game Arena */}
            <div className="game-arena-card">
              <div className="arena-card-top">
                <div className="arena-title-area">
                  <h2 className="arena-title">Math Puzzle Challenge</h2>
                  <span className="arena-subtitle">Find the missing digit (0 - 9) to satisfy the equations</span>
                </div>
                <div className="arena-top-actions">
                  <div className="timer-badge" title="Time on current puzzle">
                    <Clock size={15} /> {elapsedSeconds}s
                  </div>
                  <button 
                    className="btn btn-outline btn-sm refresh-btn"
                    onClick={fetchNewPuzzle}
                    disabled={loadingPuzzle}
                    title="Get a new puzzle from API"
                  >
                    <RefreshCw size={14} className={loadingPuzzle ? 'spin' : ''} />
                    <span>Skip / New</span>
                  </button>
                </div>
              </div>

              {/* Puzzle Image Container */}
              <div className="puzzle-display-wrapper">
                {loadingPuzzle ? (
                  <div className="puzzle-loading-state">
                    <div className="spinner spinner-yellow"></div>
                    <p className="loading-text">Fetching fresh puzzle from Marc Conrad's API...</p>
                    <span className="loading-url">https://marcconrad.com/uob/banana/api.php</span>
                  </div>
                ) : puzzleError ? (
                  <div className="puzzle-error-state">
                    <XCircle size={36} color="#ef4444" />
                    <p>{puzzleError}</p>
                    <button className="btn btn-primary btn-sm" onClick={fetchNewPuzzle}>
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="puzzle-image-frame">
                    <img 
                      src={puzzle?.question} 
                      alt="Banana Math Puzzle" 
                      className="banana-puzzle-img"
                    />
                    <div className="puzzle-source-caption">
                      <span>Source: Marc Conrad Banana API</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Keypad & Solution Controls */}
              <div className="puzzle-interaction-zone">
                <div className="input-instruction-row">
                  <span className="input-instruction">
                    👉 <strong>Select or click the missing single digit (0 to 9):</strong>
                  </span>
                  {selectedDigit !== '' && (
                    <span className="selected-preview-badge">
                      Selected: <strong>{selectedDigit}</strong>
                    </span>
                  )}
                </div>

                {/* 0-9 Digit Buttons Keypad */}
                <div className="digit-keypad">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                    const isSelected = selectedDigit === String(digit);
                    return (
                      <button
                        key={digit}
                        type="button"
                        className={`digit-key-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedDigit(String(digit))}
                        disabled={loadingPuzzle || submitting}
                      >
                        {digit}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback Banner */}
                {feedback && (
                  <div className={`feedback-alert feedback-${feedback.type}`}>
                    {feedback.type === 'success' ? (
                      <CheckCircle2 size={22} className="alert-icon" />
                    ) : feedback.type === 'hint' ? (
                      <HelpCircle size={22} className="alert-icon" />
                    ) : (
                      <XCircle size={22} className="alert-icon" />
                    )}
                    <div className="feedback-content">
                      <div className="feedback-message">{feedback.message}</div>
                      {feedback.points && (
                        <div className="points-awarded-badge">
                          <Sparkles size={14} /> +{feedback.points} Points Earned!
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="arena-submit-actions">
                  <div className="left-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm hint-btn"
                      onClick={() => {
                        if (!puzzle) return;
                        setShowHint(!showHint);
                        if (!showHint) {
                          const isEven = puzzle.solution % 2 === 0;
                          const range = puzzle.solution >= 5 ? '5 or higher (5-9)' : '4 or lower (0-4)';
                          setFeedback({
                            type: 'hint',
                            message: `💡 Hint: The missing digit is ${isEven ? 'EVEN' : 'ODD'} and is ${range}.`
                          });
                        }
                      }}
                      disabled={loadingPuzzle || !puzzle}
                    >
                      <HelpCircle size={15} /> {showHint ? 'Hide Hint' : 'Get Hint'}
                    </button>
                  </div>

                  <div className="right-actions">
                    {feedback?.type === 'success' ? (
                      <button 
                        type="button" 
                        className="btn btn-success btn-lg next-puzzle-btn"
                        onClick={fetchNewPuzzle}
                      >
                        Next Puzzle <ChevronRight size={18} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-lg submit-answer-btn"
                        onClick={() => handleAnswerSubmit()}
                        disabled={selectedDigit === '' || loadingPuzzle || submitting}
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border-sm"></span> Verifying...
                          </>
                        ) : (
                          <>
                            <Send size={16} /> Submit Answer
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Performance Sidebar */}
            <div className="game-sidebar">
              {/* Performance Summary Card */}
              <div className="sidebar-card">
                <div className="sidebar-card-header">
                  <BarChartSummary stats={stats} />
                </div>
              </div>

              {/* User Session Profile Card */}
              <div className="sidebar-card profile-summary-card">
                <div className="sidebar-header-title">
                  <UserIcon size={16} /> Player Profile
                </div>
                <div className="profile-rows">
                  <div className="profile-row">
                    <span className="row-label">User Email</span>
                    <span className="row-value">{user?.email}</span>
                  </div>
                  <div className="profile-row">
                    <span className="row-label">Role</span>
                    <span className="row-value badge-role">{user?.role || 'student'}</span>
                  </div>
                  <div className="profile-row">
                    <span className="row-label">Streak Status</span>
                    <span className="row-value">
                      {stats.currentStreak >= 3 ? '🔥 Streak Bonus Active!' : 'Standard (10 pts)'}
                    </span>
                  </div>
                </div>

                <div className="sidebar-actions-footer">
                  <button 
                    type="button" 
                    className="btn btn-outline btn-xs"
                    onClick={handleResetStats}
                    title="Reset stats to 0"
                  >
                    <RotateCcw size={12} /> Reset Stats
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-xs"
                    onClick={() => {
                      logout();
                      if (onLogout) onLogout();
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: CLASSROOM LEADERBOARD
            ======================================================== */}
        {activeTab === 'leaderboard' && (
          <div className="leaderboard-wrapper">
            <div className="tab-card">
              <div className="tab-card-header">
                <div>
                  <h2 className="tab-card-title">🏆 Classroom Leaderboard</h2>
                  <p className="tab-card-subtitle">Real-time ranking of students stored in MongoDB Atlas</p>
                </div>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={fetchLeaderboard}
                  disabled={loadingLeaderboard}
                >
                  <RefreshCw size={14} className={loadingLeaderboard ? 'spin' : ''} /> Refresh
                </button>
              </div>

              {loadingLeaderboard ? (
                <div className="tab-loading-state">
                  <div className="spinner spinner-yellow"></div>
                  <p>Fetching rankings from MongoDB Atlas...</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="empty-state-box">
                  <Trophy size={42} color="#cbd5e1" />
                  <p>No players on the leaderboard yet. Solve your first puzzle to take #1!</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('play')}>
                    Play Now
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="enterprise-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Total Score</th>
                        <th>Solved</th>
                        <th>Win Rate</th>
                        <th>Best Streak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((item) => {
                        const isCurrentUser = user && (user.id === item.id || user.email === item.maskedEmail);
                        return (
                          <tr key={item.id} className={isCurrentUser ? 'current-user-row' : ''}>
                            <td className="rank-cell">
                              {item.rank === 1 ? '🥇 1' : item.rank === 2 ? '🥈 2' : item.rank === 3 ? '🥉 3' : `#${item.rank}`}
                            </td>
                            <td className="player-cell">
                              <span className="player-name">{item.name}</span>
                              {isCurrentUser && <span className="you-pill">You</span>}
                            </td>
                            <td className="score-cell">
                              <strong>{item.score}</strong> pts
                            </td>
                            <td>{item.gamesWon} / {item.gamesPlayed}</td>
                            <td>
                              <div className="progress-bar-wrap">
                                <span className="progress-text">{item.winRate}%</span>
                                <div className="progress-track">
                                  <div className="progress-fill" style={{ width: `${item.winRate}%` }}></div>
                                </div>
                              </div>
                            </td>
                            <td>{item.bestStreak} 🔥</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: MATCH HISTORY
            ======================================================== */}
        {activeTab === 'history' && (
          <div className="history-wrapper">
            <div className="tab-card">
              <div className="tab-card-header">
                <div>
                  <h2 className="tab-card-title">📜 Recent Puzzle History</h2>
                  <p className="tab-card-subtitle">Log of your past answers and results stored in your account</p>
                </div>
                <button className="btn btn-outline btn-sm" onClick={loadStatsAndHistory}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              {historyList.length === 0 ? (
                <div className="empty-state-box">
                  <History size={42} color="#cbd5e1" />
                  <p>You haven't played any puzzles yet. Start playing now to build your history!</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('play')}>
                    Play First Puzzle
                  </button>
                </div>
              ) : (
                <div className="history-cards-grid">
                  {historyList.map((entry, index) => (
                    <div 
                      key={index} 
                      className={`history-item-card ${entry.isCorrect ? 'history-correct' : 'history-incorrect'}`}
                    >
                      <div className="history-thumb-frame">
                        {entry.question ? (
                          <img src={entry.question} alt="Puzzle thumbnail" className="history-thumb-img" />
                        ) : (
                          <div className="no-img-thumb">No Preview</div>
                        )}
                        <span className={`status-tag ${entry.isCorrect ? 'tag-win' : 'tag-loss'}`}>
                          {entry.isCorrect ? 'Correct (+10)' : 'Incorrect'}
                        </span>
                      </div>

                      <div className="history-info-body">
                        <div className="history-info-row">
                          <span className="info-muted">Your Guess:</span>
                          <span className="info-bold">{entry.userGuess}</span>
                        </div>
                        <div className="history-info-row">
                          <span className="info-muted">Actual Solution:</span>
                          <span className="info-bold solution-color">{entry.solution}</span>
                        </div>
                        {entry.timeTakenSec > 0 && (
                          <div className="history-info-row">
                            <span className="info-muted">Time:</span>
                            <span>{entry.timeTakenSec}s</span>
                          </div>
                        )}
                        <div className="history-date">
                          {entry.playedAt ? new Date(entry.playedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                        </div>
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

// Subcomponent: Performance Metrics Bar Chart Summary
function BarChartSummary({ stats }) {
  return (
    <div className="metrics-box">
      <div className="metrics-header">
        <Award size={18} color="#eab308" />
        <h3>Your Learning Stats</h3>
      </div>
      <div className="metrics-grid">
        <div className="metric-cell">
          <span className="metric-num">{stats.score}</span>
          <span className="metric-label">Points</span>
        </div>
        <div className="metric-cell">
          <span className="metric-num">{stats.gamesWon}</span>
          <span className="metric-label">Solved</span>
        </div>
        <div className="metric-cell">
          <span className="metric-num">{stats.gamesPlayed}</span>
          <span className="metric-label">Played</span>
        </div>
        <div className="metric-cell">
          <span className="metric-num">{stats.winRate}%</span>
          <span className="metric-label">Accuracy</span>
        </div>
      </div>
    </div>
  );
}
