import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Trophy, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RefreshCw, 
  HelpCircle, 
  GraduationCap, 
  RotateCcw, 
  Home,
  Check,
  Send,
  ChevronRight
} from 'lucide-react';

export default function StudentChallenge({ onBackToHome, prefilledCode = '' }) {
  // Step: 'join' | 'playing' | 'completed'
  const [step, setStep] = useState('join');

  // Join Form State
  const [username, setUsername] = useState('');
  const [classroomCode, setClassroomCode] = useState(prefilledCode || '');
  const [joinError, setJoinError] = useState('');
  const [validating, setValidating] = useState(false);
  const [classroomData, setClassroomData] = useState(null);

  // Challenge State (Exactly 10 Puzzles)
  const TOTAL_PUZZLES = 10;
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0); // 0 to 9
  const [puzzlesList, setPuzzlesList] = useState([]); // stores results for all 10 puzzles
  const [currentPuzzle, setCurrentPuzzle] = useState(null); // { question, solution }
  const [loadingPuzzle, setLoadingPuzzle] = useState(false);
  const [puzzleError, setPuzzleError] = useState('');
  const [selectedDigit, setSelectedDigit] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [feedback, setFeedback] = useState(null); // { isCorrect, message, solution }
  const [showHint, setShowHint] = useState(false);

  // Timer & Scoring
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [puzzleSeconds, setPuzzleSeconds] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const totalTimerRef = useRef(null);
  const puzzleTimerRef = useRef(null);

  // Completed & Leaderboard State
  const [finalResult, setFinalResult] = useState(null);
  const [classroomLeaderboard, setClassroomLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [savingResult, setSavingResult] = useState(false);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
      if (puzzleTimerRef.current) clearInterval(puzzleTimerRef.current);
    };
  }, []);

  // Fetch puzzle from Marc Conrad's Banana API
  const fetchPuzzle = useCallback(async () => {
    setLoadingPuzzle(true);
    setPuzzleError('');
    setSelectedDigit('');
    setFeedback(null);
    setShowHint(false);
    setPuzzleSeconds(0);

    try {
      let data = null;
      try {
        const res = await fetch('/api/game/puzzle');
        if (res.ok) {
          data = await res.json();
        }
      } catch (proxyErr) {
        console.warn('Proxy fetch failed, trying direct:', proxyErr);
      }

      if (!data || !data.question) {
        const directRes = await fetch('https://marcconrad.com/uob/banana/api.php?out=json');
        data = await directRes.json();
      }

      if (data && data.question && data.solution !== undefined) {
        setCurrentPuzzle({
          question: data.question,
          solution: Number(data.solution)
        });
      } else {
        throw new Error('Invalid puzzle format from Banana API');
      }
    } catch (err) {
      console.error('Error fetching puzzle:', err);
      setPuzzleError('Failed to load puzzle. Please click Retry.');
    } finally {
      setLoadingPuzzle(false);
    }
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Handle Join Form Submission
  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinError('');

    const cleanUsername = username.trim();
    const cleanCode = classroomCode.trim().toUpperCase();

    if (!cleanUsername) {
      setJoinError('Please enter a username or nickname');
      return;
    }
    if (cleanUsername.length < 2) {
      setJoinError('Username must be at least 2 characters');
      return;
    }
    if (!cleanCode) {
      setJoinError('Please enter your classroom code');
      return;
    }

    setValidating(true);
    try {
      const res = await fetch(`/api/classroom/validate/${encodeURIComponent(cleanCode)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setJoinError(data.message || 'Invalid classroom code. Please check with your teacher.');
        return;
      }

      setClassroomData(data.classroom);
      setCurrentPuzzleIndex(0);
      setPuzzlesList([]);
      setCurrentScore(0);
      setCorrectCount(0);
      setTotalSeconds(0);
      setStep('playing');

      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
      totalTimerRef.current = setInterval(() => {
        setTotalSeconds((s) => s + 1);
      }, 1000);

      if (puzzleTimerRef.current) clearInterval(puzzleTimerRef.current);
      puzzleTimerRef.current = setInterval(() => {
        setPuzzleSeconds((s) => s + 1);
      }, 1000);

      fetchPuzzle();
    } catch (err) {
      console.error('Validate error:', err);
      setJoinError('Could not connect to classroom. Please check your connection.');
    } finally {
      setValidating(false);
    }
  };

  // Keyboard navigation for digits (0-9 and Enter)
  useEffect(() => {
    if (step !== 'playing') return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;

      if (e.key >= '0' && e.key <= '9') {
        setSelectedDigit(e.key);
      } else if (e.key === 'Enter') {
        if (feedback) {
          handleNextPuzzle();
        } else if (selectedDigit !== '') {
          handleSubmitAnswer();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, selectedDigit, feedback]);

  // Submit Answer for the current puzzle
  const handleSubmitAnswer = () => {
    if (selectedDigit === '' || !currentPuzzle || feedback || submittingAnswer) return;

    setSubmittingAnswer(true);
    const guessNum = Number(selectedDigit);
    const solNum = Number(currentPuzzle.solution);
    const isCorrect = guessNum === solNum;

    const puzzlePoints = isCorrect ? 10 : 0;
    const newScore = currentScore + puzzlePoints;
    const newCorrect = correctCount + (isCorrect ? 1 : 0);

    setCurrentScore(newScore);
    if (isCorrect) setCorrectCount(newCorrect);

    const puzzleRecord = {
      puzzleIndex: currentPuzzleIndex + 1,
      question: currentPuzzle.question,
      userGuess: guessNum,
      solution: solNum,
      isCorrect,
      timeTakenSec: puzzleSeconds
    };

    setPuzzlesList((prev) => [...prev, puzzleRecord]);

    setFeedback({
      isCorrect,
      message: isCorrect
        ? `Correct! The missing digit was ${solNum}.`
        : `Incorrect. You guessed ${guessNum}, but the answer was ${solNum}.`,
      pointsEarned: puzzlePoints
    });

    setSubmittingAnswer(false);
  };

  // Move to next puzzle or complete challenge
  const handleNextPuzzle = () => {
    if (currentPuzzleIndex + 1 >= TOTAL_PUZZLES) {
      finishChallenge();
    } else {
      setCurrentPuzzleIndex((prev) => prev + 1);
      fetchPuzzle();
    }
  };

  // Finish 10-Puzzle Challenge & Submit to Classroom Leaderboard
  const finishChallenge = async () => {
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    if (puzzleTimerRef.current) clearInterval(puzzleTimerRef.current);

    setStep('completed');
    setSavingResult(true);

    const submissionPayload = {
      classroomCode: classroomCode.trim().toUpperCase(),
      studentUsername: username.trim(),
      score: currentScore,
      correctCount,
      totalPuzzles: TOTAL_PUZZLES,
      totalTimeSec: totalSeconds,
      puzzles: puzzlesList
    };

    try {
      const res = await fetch('/api/classroom/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionPayload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFinalResult({
          rank: data.rank,
          submission: data.submission
        });
      }
    } catch (err) {
      console.error('Failed to submit challenge results:', err);
    } finally {
      setSavingResult(false);
      loadClassroomLeaderboard(classroomCode.trim().toUpperCase());
    }
  };

  // Fetch Classroom Leaderboard
  const loadClassroomLeaderboard = async (code) => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch(`/api/classroom/${encodeURIComponent(code)}/leaderboard`);
      const data = await res.json();
      if (res.ok && data.success) {
        setClassroomLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Restart Challenge with same classroom
  const handleRestart = () => {
    setCurrentPuzzleIndex(0);
    setPuzzlesList([]);
    setCurrentScore(0);
    setCorrectCount(0);
    setTotalSeconds(0);
    setFeedback(null);
    setSelectedDigit('');
    setStep('playing');

    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    totalTimerRef.current = setInterval(() => {
      setTotalSeconds((s) => s + 1);
    }, 1000);

    fetchPuzzle();
  };

  // ========================================================
  // VIEW 1: JOIN CLASSROOM FORM
  // ========================================================
  if (step === 'join') {
    return (
      <div className="join-view-container">
        <div className="join-card">
          <div className="join-header">
            <h2>Join Classroom</h2>
            <p>Enter your nickname and your teacher's classroom code to take the 10-puzzle challenge.</p>
          </div>

          {joinError && (
            <div className="alert alert-error">
              <XCircle size={16} />
              <span>{joinError}</span>
            </div>
          )}

          <form onSubmit={handleJoin} className="join-form">
            <div className="form-group">
              <label className="form-label" htmlFor="student-username">
                Nickname / Username
              </label>
              <input
                id="student-username"
                type="text"
                className="input-field"
                placeholder="e.g. Alex"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={30}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="classroom-code">
                Classroom Code
              </label>
              <input
                id="classroom-code"
                type="text"
                className="input-field code-input"
                placeholder="e.g. MATH-4821"
                value={classroomCode}
                onChange={(e) => setClassroomCode(e.target.value.toUpperCase())}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={validating}
            >
              {validating ? 'Connecting...' : 'Start Challenge'}
            </button>
          </form>

          <div className="join-footer">
            <button
              type="button"
              className="link-btn"
              onClick={onBackToHome}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // VIEW 2: 10 MATH PUZZLE CHALLENGE (PLAYING)
  // ========================================================
  if (step === 'playing') {
    return (
      <div className="challenge-screen">
        {/* Clean Challenge Sub-Header */}
        <div className="challenge-header-bar">
          <div className="container challenge-header-inner">
            <div className="challenge-meta-left">
              <span className="class-code-badge">{classroomData?.code}</span>
              <span className="class-name-text">{classroomData?.title || 'Math Challenge'}</span>
            </div>

            <div className="challenge-meta-right">
              <span className="student-tag">{username}</span>
              <span className="score-tag">{currentScore} pts</span>
              <span className="time-tag">
                <Clock size={13} />
                <span>{formatTime(totalSeconds)}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="container challenge-content">
          {/* Progress Row */}
          <div className="challenge-progress-bar-card">
            <div className="progress-top-row">
              <span className="progress-label">
                Question {currentPuzzleIndex + 1} of {TOTAL_PUZZLES}
              </span>
              <span className="progress-score-status">
                Solved: {correctCount} / {TOTAL_PUZZLES}
              </span>
            </div>

            {/* Step Indicators */}
            <div className="puzzle-step-row">
              {Array.from({ length: TOTAL_PUZZLES }).map((_, idx) => {
                const pastResult = puzzlesList[idx];
                const isCurrent = idx === currentPuzzleIndex;
                let stepClass = 'step-upcoming';

                if (pastResult) {
                  stepClass = pastResult.isCorrect ? 'step-correct' : 'step-wrong';
                } else if (isCurrent) {
                  stepClass = 'step-current';
                }

                return (
                  <div key={idx} className={`step-dot ${stepClass}`}>
                    {pastResult ? (
                      pastResult.isCorrect ? <Check size={12} /> : '✕'
                    ) : (
                      idx + 1
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Puzzle Card */}
          <div className="challenge-card">
            <div className="puzzle-view-area">
              {loadingPuzzle ? (
                <div className="puzzle-loading-box">
                  <div className="spinner"></div>
                  <p>Loading question {currentPuzzleIndex + 1}...</p>
                </div>
              ) : puzzleError ? (
                <div className="puzzle-error-box">
                  <p>{puzzleError}</p>
                  <button className="btn btn-outline btn-sm" onClick={fetchPuzzle}>
                    <RefreshCw size={14} /> Retry
                  </button>
                </div>
              ) : (
                <div className="puzzle-image-box">
                  <img
                    src={currentPuzzle?.question}
                    alt={`Question ${currentPuzzleIndex + 1}`}
                    className="puzzle-clean-img"
                  />
                </div>
              )}
            </div>

            {/* Answer Control Section */}
            <div className="puzzle-input-section">
              <div className="input-prompt-row">
                <span className="input-prompt-text">
                  Choose the missing digit (0–9):
                </span>
                {selectedDigit !== '' && (
                  <span className="active-digit-badge">
                    Selected: <strong>{selectedDigit}</strong>
                  </span>
                )}
              </div>

              {/* Clean Digit Row */}
              <div className="clean-digit-row">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                  const isSelected = selectedDigit === String(digit);
                  return (
                    <button
                      key={digit}
                      type="button"
                      className={`clean-digit-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => !feedback && setSelectedDigit(String(digit))}
                      disabled={loadingPuzzle || submittingAnswer || feedback !== null}
                    >
                      {digit}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Alert */}
              {feedback && (
                <div className={`clean-feedback-alert ${feedback.isCorrect ? 'alert-correct' : 'alert-wrong'}`}>
                  {feedback.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="challenge-controls-row">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    if (!currentPuzzle) return;
                    setShowHint(!showHint);
                  }}
                  disabled={loadingPuzzle || !currentPuzzle || feedback !== null}
                >
                  <HelpCircle size={14} /> {showHint ? 'Hide Hint' : 'Hint'}
                </button>

                {!feedback ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmitAnswer}
                    disabled={selectedDigit === '' || loadingPuzzle || submittingAnswer}
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary next-step-btn"
                    onClick={handleNextPuzzle}
                    autoFocus
                  >
                    <span>{currentPuzzleIndex + 1 >= TOTAL_PUZZLES ? 'View Results' : 'Next Question'}</span>
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>

              {showHint && currentPuzzle && (
                <div className="clean-hint-callout">
                  Hint: The missing digit is <strong>{currentPuzzle.solution % 2 === 0 ? 'even' : 'odd'}</strong> and is <strong>{currentPuzzle.solution >= 5 ? '5 or higher' : 'less than 5'}</strong>.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // VIEW 3: CHALLENGE COMPLETED & CLASSROOM LEADERBOARD
  // ========================================================
  return (
    <div className="completed-view">
      <div className="container completed-inner">
        {/* Summary Card */}
        <div className="summary-card">
          <div className="summary-trophy-box">
            <Trophy size={36} />
          </div>

          <h2>Challenge Completed</h2>
          <p className="summary-sub">
            Completed all 10 puzzles for classroom <strong>{classroomCode}</strong>
          </p>

          <div className="summary-metrics-row">
            <div className="metric-box">
              <span className="metric-title">Score</span>
              <span className="metric-number">{currentScore}</span>
              <span className="metric-caption">out of 100</span>
            </div>

            <div className="metric-box">
              <span className="metric-title">Solved</span>
              <span className="metric-number">{correctCount} / {TOTAL_PUZZLES}</span>
              <span className="metric-caption">{Math.round((correctCount / TOTAL_PUZZLES) * 100)}% accuracy</span>
            </div>

            <div className="metric-box">
              <span className="metric-title">Total Time</span>
              <span className="metric-number">{formatTime(totalSeconds)}</span>
              <span className="metric-caption">completed</span>
            </div>

            {finalResult?.rank && (
              <div className="metric-box">
                <span className="metric-title">Class Rank</span>
                <span className="metric-number rank-number">#{finalResult.rank}</span>
                <span className="metric-caption">on leaderboard</span>
              </div>
            )}
          </div>

          <div className="summary-actions">
            <button className="btn btn-primary" onClick={handleRestart}>
              <RotateCcw size={15} /> Play Again
            </button>
            <button className="btn btn-outline" onClick={onBackToHome}>
              <Home size={15} /> Back to Home
            </button>
          </div>
        </div>

        {/* Live Classroom Leaderboard */}
        <div className="leaderboard-card">
          <div className="leaderboard-card-header">
            <div>
              <h3>Classroom Leaderboard</h3>
              <p>Classroom: <strong>{classroomData?.title || classroomCode}</strong> ({classroomCode})</p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => loadClassroomLeaderboard(classroomCode)}
              disabled={loadingLeaderboard}
            >
              <RefreshCw size={13} className={loadingLeaderboard ? 'spin' : ''} /> Refresh
            </button>
          </div>

          {loadingLeaderboard ? (
            <div className="loading-state-p">
              <div className="spinner"></div>
              <p>Loading leaderboard...</p>
            </div>
          ) : classroomLeaderboard.length === 0 ? (
            <div className="empty-leaderboard-box">
              <p>No other players yet. You are #1!</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th>Score</th>
                    <th>Solved</th>
                    <th>Accuracy</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {classroomLeaderboard.map((item) => {
                    const isMe = item.studentUsername.toLowerCase() === username.toLowerCase();
                    return (
                      <tr key={item.id} className={isMe ? 'row-highlight' : ''}>
                        <td className="cell-rank">#{item.rank}</td>
                        <td className="cell-name">
                          {item.studentUsername} {isMe && <span className="you-tag">You</span>}
                        </td>
                        <td className="cell-score">{item.score} pts</td>
                        <td>{item.correctCount} / {item.totalPuzzles || 10}</td>
                        <td>{item.accuracy}%</td>
                        <td>{formatTime(item.totalTimeSec)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
