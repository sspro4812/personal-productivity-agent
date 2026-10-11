
import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [activities, setActivities] = useState([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [type, setType] = useState("Productive");

  const [tracking, setTracking] = useState(false);
  const [activeTime, setActiveTime] = useState(0);
  const [idleTime, setIdleTime] = useState(0);

  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lastInputTime = useRef(Date.now());
  const previousTick = useRef(null);
  const sessionStart = useRef(null);
  const activeSeconds = useRef(0);
  const idleSeconds = useRef(0);

  // Format seconds as HH:MM:SS
  const formatTime = (totalSeconds) => {
    const seconds = Math.floor(totalSeconds);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return [hours, minutes, remainingSeconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  };

  // Track mouse and keyboard activity while tracking is enabled
  useEffect(() => {
    if (!tracking) return;

    const recordActivity = () => {
      lastInputTime.current = Date.now();
    };

    window.addEventListener("mousemove", recordActivity);
    window.addEventListener("keydown", recordActivity);
    window.addEventListener("click", recordActivity);

    return () => {
      window.removeEventListener("mousemove", recordActivity);
      window.removeEventListener("keydown", recordActivity);
      window.removeEventListener("click", recordActivity);
    };
  }, [tracking]);

  // Update active and idle timers without restarting on every user action
  useEffect(() => {
    if (!tracking) return;

    previousTick.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();

      const elapsed = Math.min(
        (now - previousTick.current) / 1000,
        2
      );

      previousTick.current = now;

      if (now - lastInputTime.current <= 30000) {
        activeSeconds.current += elapsed;
        setActiveTime(activeSeconds.current);
      } else {
        idleSeconds.current += elapsed;
        setIdleTime(idleSeconds.current);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tracking]);

  // Add an activity manually
  const addActivity = (event) => {
    event.preventDefault();

    if (!name.trim() || !duration || Number(duration) <= 0) {
      return;
    }

    const newActivity = {
      id: Date.now(),
      name: name.trim(),
      duration: Number(duration),
      type,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setActivities((previous) => [...previous, newActivity]);
    setName("");
    setDuration("");
  };

  // Start a fresh tracking session
  const startTracking = () => {
    if (tracking) return;

    activeSeconds.current = 0;
    idleSeconds.current = 0;

    setActiveTime(0);
    setIdleTime(0);
    setError("");
    setAnalysis("");

    const now = Date.now();

    sessionStart.current = now;
    lastInputTime.current = now;
    previousTick.current = now;

    setTracking(true);
  };

  // Stop tracking and save the session
  const stopTracking = () => {
    if (!tracking) return;

    const now = Date.now();

    if (previousTick.current !== null) {
      const elapsed = Math.min(
        (now - previousTick.current) / 1000,
        2
      );

      if (now - lastInputTime.current <= 30000) {
        activeSeconds.current += elapsed;
      } else {
        idleSeconds.current += elapsed;
      }
    }

    const active = activeSeconds.current;
    const idle = idleSeconds.current;

    setActiveTime(active);
    setIdleTime(idle);
    setTracking(false);

    const sessionDuration = Math.round(
      (now - sessionStart.current) / 1000
    );

    if (sessionDuration > 0) {
      const newActivities = [];

      if (active > 0) {
        newActivities.push({
          id: Date.now(),
          name: "Automatic Active Session",
          duration: Math.max(1, Math.round(active / 60)),
          type: "Productive",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      }

      if (idle > 0) {
        newActivities.push({
          id: Date.now() + 1,
          name: "Automatic Idle Time",
          duration: Math.max(1, Math.round(idle / 60)),
          type: "Distraction",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      }

      setActivities((previous) => [
        ...previous,
        ...newActivities,
      ]);
    }

    previousTick.current = null;
    sessionStart.current = null;
  };

  // Calculate productivity statistics from logged activities
  const productiveTime = activities
    .filter((activity) => activity.type === "Productive")
    .reduce((total, activity) => total + activity.duration, 0);

  const distractionTime = activities
    .filter((activity) => activity.type === "Distraction")
    .reduce((total, activity) => total + activity.duration, 0);

  const totalLoggedTime = productiveTime + distractionTime;

  const productivityPercentage =
    totalLoggedTime > 0
      ? Math.round((productiveTime / totalLoggedTime) * 100)
      : 0;

  // Ask Gemini to analyze the day's activities
  // Ask Gemini to analyze the day's activities
const analyzeProductivity = async () => {
  if (activities.length === 0) {
    setError("Add or track some activities before requesting an analysis.");
    return;
  }

  setLoading(true);
  setError("");
  setAnalysis("");

  try {
    // Fetch optional browser activity from the extension
    let browserActivities = [];

    try {
      const browserResponse = await fetch(
        "http://localhost:5000/api/browser-activity"
      );

      if (browserResponse.ok) {
        const browserData = await browserResponse.json();

        browserActivities = (browserData.activities || []).map(
          (item) => ({
            name: `Browser: ${item.domain} (${item.title})`,
            duration: Math.max(1, Math.round(item.seconds / 60)),
            type: "Browser Activity",
            time: item.timestamp || "Browser activity",
          })
        );
      }
    } catch {
      // The extension is optional. Continue with regular activities.
    }

    const allActivities = [...activities, ...browserActivities];
if (allActivities.length === 0) {
  setError("No activities found. Use the app or browse with the extension enabled.");
  return;
}
    const response = await fetch(
      "http://localhost:5000/api/analyze",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activities: allActivities }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "The productivity analysis failed."
      );
    }

    setAnalysis(
      data.analysis || "The agent returned an empty analysis."
    );
  } catch (err) {
    setError(
      err.message ||
        "Unable to connect to the backend. Check that the server is running."
    );
  } finally {
    setLoading(false);
  }
};
  // Delete a logged activity
  const deleteActivity = (id) => {
    setActivities((previous) =>
      previous.filter((activity) => activity.id !== id)
    );
  };

  return (
    <div className="app-container">
      <header className="header">
        <div>
          <p className="eyebrow">AI-POWERED DAILY PLANNER</p>
          <h1>Personal Productivity Agent</h1>
          <p className="subtitle">
            Track your day, understand your habits, and plan smarter.
          </p>
        </div>

        <div className="tracking-status">
          <span
            className={`status-dot ${tracking ? "status-active" : ""}`}
          />
          {tracking ? "Tracking active" : "Tracking stopped"}
        </div>
      </header>

      <main>
        <section className="stats-grid">
          <div className="stat-card">
            <p>Productive Time</p>
            <h2>{productiveTime} min</h2>
            <span>Time logged as productive</span>
          </div>

          <div className="stat-card">
            <p>Distraction Time</p>
            <h2>{distractionTime} min</h2>
            <span>Time logged as distraction</span>
          </div>

          <div className="stat-card">
            <p>Productivity Score</p>
            <h2>{productivityPercentage}%</h2>
            <span>Based on logged activity minutes</span>
          </div>

          <div className="stat-card">
            <p>Activities Logged</p>
            <h2>{activities.length}</h2>
            <span>Recorded activities today</span>
          </div>
        </section>

        <section className="tracker-section">
          <div className="section-heading">
            <div>
              <h2>Automatic Activity Tracker</h2>
              <p>
                Tracks interaction with this webpage while tracking is on.
              </p>
            </div>

            <span className="tracker-badge">
              {tracking ? "LIVE" : "READY"}
            </span>
          </div>

          <div className="timer-grid">
            <div className="timer-card">
              <p>Active Time</p>
              <h2>{formatTime(activeTime)}</h2>
              <span>Recent mouse or keyboard activity</span>
            </div>

            <div className="timer-card">
              <p>Idle Time</p>
              <h2>{formatTime(idleTime)}</h2>
              <span>No detected input for over 30 seconds</span>
            </div>
          </div>

          <div className="tracker-actions">
            <button
              className="primary-button"
              onClick={startTracking}
              disabled={tracking}
            >
              Start Tracking
            </button>

            <button
              className="secondary-button"
              onClick={stopTracking}
              disabled={!tracking}
            >
              Stop & Save Session
            </button>
          </div>

          <p className="helper-text">
            Note: This is browser-only tracking. It does not monitor other
            Windows applications. Move your mouse or use your keyboard
            occasionally while testing.
          </p>
        </section>

        <section className="form-section">
          <div className="section-heading">
            <div>
              <h2>Log an Activity</h2>
              <p>Record study sessions, breaks, and other tasks manually.</p>
            </div>
          </div>

          <form className="activity-form" onSubmit={addActivity}>
            <div className="form-group">
              <label htmlFor="activity-name">Activity Name</label>
              <input
                id="activity-name"
                type="text"
                placeholder="e.g. Studying Data Structures"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="activity-duration">Duration (minutes)</label>
              <input
                id="activity-duration"
                type="number"
                min="1"
                placeholder="e.g. 60"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="activity-type">Activity Type</label>
              <select
                id="activity-type"
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option value="Productive">Productive</option>
                <option value="Distraction">Distraction</option>
              </select>
            </div>

            <button className="primary-button" type="submit">
              Add Activity
            </button>
          </form>
        </section>

        <section className="activities-section">
          <div className="section-heading">
            <div>
              <h2>Today's Activities</h2>
              <p>Your manually logged and automatically tracked sessions.</p>
            </div>

            <span className="count-badge">{activities.length} entries</span>
          </div>

          {activities.length === 0 ? (
            <div className="empty-state">
              <h3>No activities yet</h3>
              <p>
                Start tracking or add an activity manually to begin.
              </p>
            </div>
          ) : (
            <div className="activity-list">
              {activities.map((activity) => (
                <div className="activity-item" key={activity.id}>
                  <div className="activity-icon">
                    {activity.type === "Productive" ? "✓" : "○"}
                  </div>

                  <div className="activity-details">
                    <h3>{activity.name}</h3>
                    <p>{activity.time || "Logged today"}</p>
                  </div>

                  <div className="activity-meta">
                    <strong>{activity.duration} min</strong>
                    <span
                      className={`type-label ${
                        activity.type === "Productive"
                          ? "productive-label"
                          : "distraction-label"
                      }`}
                    >
                      {activity.type}
                    </span>
                  </div>

                  <button
                    className="delete-button"
                    type="button"
                    onClick={() => deleteActivity(activity.id)}
                    aria-label={`Delete ${activity.name}`}
                    title="Delete activity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="agent-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">AI ASSISTANT</p>
              <h2>Analyze My Day</h2>
              <p>
                Let Gemini identify patterns and suggest improvements
                based on your logged activities.
              </p>
            </div>
          </div>

          <button
            className="primary-button analyze-button"
            onClick={analyzeProductivity}
            disabled={loading || activities.length === 0}
          >
            {loading ? "Analyzing your day..." : "Analyze My Day"}
          </button>

          {loading && (
            <div className="agent-status">
              <span className="loading-spinner" />
              <p>
                Your agent is reviewing your activities and preparing
                recommendations...
              </p>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

       
{analysis && (
  <div className="analysis-result">
    <div className="analysis-header">
      <div>
        <p className="eyebrow">YOUR DAILY REPORT</p>
        <h3>Productivity Insights</h3>
      </div>
      <span className="analysis-badge">AI Generated</span>
    </div>

    <div className="analysis-content">{analysis}</div>

    <button
      className="secondary-button"
      onClick={() => {
        navigator.clipboard.writeText(analysis);
      }}
    >
      Copy Analysis
    </button>
  </div>
)}

        </section>
      </main>

      <footer className="footer">
        Personal Productivity Agent · AI-assisted daily productivity
      </footer>
    </div>
  );
}

export default App;
