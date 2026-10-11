import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [activities, setActivities] = useState([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [type, setType] = useState("Productive");

  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  // Automatic tracking
  const [tracking, setTracking] = useState(false);
  const [activeTime, setActiveTime] = useState(0);
  const [idleTime, setIdleTime] = useState(0);

  const [lastActivity, setLastActivity] = useState(
    new Date()
  );

  // Detect user activity
  useEffect(() => {
    if (!tracking) return;

    const updateActivity = () => {
      setLastActivity(new Date());
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("click", updateActivity);

    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
    };
  }, [tracking]);

  // Timer for active / idle time
  useEffect(() => {
    if (!tracking) return;

    const timer = setInterval(() => {
      const now = new Date();
      const difference =
        (now - lastActivity) / 1000;

      if (difference <= 30) {
        setActiveTime((time) => time + 1);
      } else {
        setIdleTime((time) => time + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [tracking, lastActivity]);

  // Start tracking
  const startTracking = () => {
    setTracking(true);
    setLastActivity(new Date());
  };

  // Stop tracking
 const stopTracking = () => {
  setTracking(false);

  const newLogs = [];

  if (activeTime > 0) {
    newLogs.push({
      name: "Automatic Active Session",
      duration: Math.max(
        1,
        Math.round(activeTime / 60)
      ),
      type: "Productive",
    });
  }

  if (idleTime > 0) {
    newLogs.push({
      name: "Idle Time",
      duration: Math.max(
        1,
        Math.round(idleTime / 60)
      ),
      type: "Distraction",
    });
  }

  if (newLogs.length > 0) {
    setActivities((prev) => [
      ...prev,
      ...newLogs,
    ]);
  }
};

  // Manual activity
  const addActivity = () => {
    if (!name || !duration) return;

    setActivities([
      ...activities,
      {
        name,
        duration: Number(duration),
        type,
      },
    ]);

    setName("");
    setDuration("");
  };

  // Send activities to Gemini
  const analyzeProductivity = async () => {
    if (activities.length === 0) {
      alert("Add or automatically collect some activities first.");
      return;
    }

    setLoading(true);
    setAnalysis("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ activities }),
        }
      );

      const data = await response.json();

      if (data.error) {
        setAnalysis("Error: " + data.error);
      } else {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      setAnalysis(
        "Could not connect to backend. Make sure the server is running."
      );
    }

    setLoading(false);
  };

  const productiveTime = activities
    .filter((a) => a.type === "Productive")
    .reduce((sum, a) => sum + a.duration, 0);

  const distractionTime = activities
    .filter((a) => a.type === "Distraction")
    .reduce((sum, a) => sum + a.duration, 0);

  const totalTime =
    productiveTime + distractionTime;

  const productivity =
    totalTime > 0
      ? Math.round(
          (productiveTime / totalTime) * 100
        )
      : 0;

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="app">

      <header>
        <h1>Personal Productivity Agent</h1>
        <p>
          AI-powered daily productivity analysis
        </p>
      </header>

      {/* Statistics */}

      <section className="stats">

        <div className="card">
          <h3>Productive Time</h3>
          <strong>
            {productiveTime} min
          </strong>
        </div>

        <div className="card">
          <h3>Distraction Time</h3>
          <strong>
            {distractionTime} min
          </strong>
        </div>

        <div className="card">
          <h3>Productivity</h3>
          <strong>
            {productivity}%
          </strong>
        </div>

      </section>

      {/* Automatic Tracking */}

      <section className="panel">

        <h2>⚡ Automatic Activity Tracking</h2>

        <p>
          Track your active and idle time while using
          the application.
        </p>

        <div style={{ marginBottom: "15px" }}>

          {!tracking ? (
            <button onClick={startTracking}>
              🟢 Start Auto Tracking
            </button>
          ) : (
            <button onClick={stopTracking}>
              🔴 Stop Tracking
            </button>
          )}

        </div>

        <div className="stats">

          <div className="card">
            <h3>Status</h3>

            <strong>
              {tracking
                ? "🟢 Tracking"
                : "⚪ Off"}
            </strong>
          </div>

          <div className="card">
            <h3>Active Time</h3>

            <strong>
              {formatTime(activeTime)}
            </strong>
          </div>

          <div className="card">
            <h3>Idle Time</h3>

            <strong>
              {formatTime(idleTime)}
            </strong>
          </div>

        </div>

      </section>

      {/* Manual Logging */}

      <section className="panel">

        <h2>📝 Log Activity Manually</h2>

        <div className="form">

          <input
            type="text"
            placeholder="Activity name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <input
            type="number"
            placeholder="Minutes"
            value={duration}
            onChange={(e) =>
              setDuration(e.target.value)
            }
          />

          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value)
            }
          >
            <option>Productive</option>
            <option>Distraction</option>
          </select>

          <button onClick={addActivity}>
            Add Activity
          </button>

        </div>

      </section>

      {/* Activities */}

      <section className="panel">

        <h2>📊 Today's Activities</h2>

        {activities.length === 0 ? (
          <p>
            No activities collected yet.
          </p>
        ) : (
          activities.map(
            (activity, index) => (

              <div
                className="activity"
                key={index}
              >

                <span>

                  <b>
                    {activity.name}
                  </b>

                  <small>
                    {activity.duration} minutes
                  </small>

                </span>

                <span
                  className={
                    activity.type ===
                    "Productive"
                      ? "productive"
                      : "distraction"
                  }
                >
                  {activity.type}
                </span>

              </div>

            )
          )
        )}

      </section>

      {/* AI Agent */}

      <section className="agent">

        <h2>
          🤖 AI Productivity Agent
        </h2>

        <button
          className="analyze"
          onClick={analyzeProductivity}
          disabled={loading}
        >
          {loading
            ? "Analyzing..."
            : "Analyze My Day"}
        </button>

        {analysis && (
          <div className="analysis">
            <pre>{analysis}</pre>
          </div>
        )}

      </section>

    </div>
  );
}

export default App;