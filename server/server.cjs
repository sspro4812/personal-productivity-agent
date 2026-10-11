
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.post("/api/analyze", async (req, res) => {
  console.log("Analyze endpoint reached");
  try {
    const { activities } = req.body;

    if (!Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({
        error: "Please provide at least one activity to analyze.",
      });
    }

    // Validate and normalize activity data
    const validActivities = activities
      .filter(
        (activity) =>
          activity &&
          typeof activity.name === "string" &&
          Number.isFinite(Number(activity.duration)) &&
          Number(activity.duration) > 0 &&
          ["Productive", "Distraction", "Browser Activity"].includes(activity.type)
      )
      .map((activity) => ({
        name: activity.name.slice(0, 200),
        duration: Number(activity.duration),
        type: activity.type,
        time: activity.time || "Not recorded",
      }));

    if (validActivities.length === 0) {
      return res.status(400).json({
        error: "No valid activities were found to analyze.",
      });
    }

    const productiveActivities = validActivities.filter(
      (activity) => activity.type === "Productive"
    );

    const distractionActivities = validActivities.filter(
      (activity) => activity.type === "Distraction"
    );

    const productiveMinutes = productiveActivities.reduce(
      (total, activity) => total + activity.duration,
      0
    );

    const distractionMinutes = distractionActivities.reduce(
      (total, activity) => total + activity.duration,
      0
    );

    const totalMinutes = productiveMinutes + distractionMinutes;

    const productivityScore =
      totalMinutes > 0
        ? Math.round((productiveMinutes / totalMinutes) * 100)
        : 0;

    const activityText = validActivities
      .map(
        (activity, index) =>
          `${index + 1}. ${activity.name} | ${activity.duration} minutes | ${activity.type} | Time: ${activity.time}`
      )
      .join("\n");

    const prompt = `

You are a Personal Productivity Agent for a student.

Analyze the activity data accurately and give a short, useful report.
Use only the supplied data. Never invent facts or assume that a
website is distracting just because it was visited.

Statistics:
- Productive time: $DIL0 minutes
- Distraction time: $DIL1 minutes
- Total classified time: $DIL2 minutes
- Productivity score: $DIL3%
ACTIVITY LOG
${activityText}

Write your response using these sections:

1. DAILY PRODUCTIVITY SUMMARY
Summarize the user's day in 2–3 sentences. Include the productive time,
distraction time, and calculated productivity score.

2. PRODUCTIVITY PATTERNS
Identify up to three useful patterns from the activity names, durations,
types, and timestamps if available. Mention which activities consumed
the most time. If the data is insufficient to identify a pattern, say so.
Do not infer a sequence from timestamps that are missing or unreliable.

3. PROBLEMS DETECTED
List the main areas for improvement based on the actual data. Avoid
judgmental language. Do not label an activity as a distraction unless
it is marked as one in the data.

4. THREE PRACTICAL RECOMMENDATIONS
Give exactly three actionable recommendations tailored to these logs.
Make each recommendation specific and achievable.

5. TOMORROW'S PLAN
Create a simple, realistic plan with 3–5 steps. Suggest reasonable
durations based on the recorded workload. Do not assume the user has
unlimited time. Present suggested durations as suggestions, not facts.

6. AGENT'S FINAL INSIGHT
Finish with one short sentence describing the most important next action.

Important:
IMPORTANT:
- Use actual numeric values calculated from the provided activities.
- Never output placeholders such as DIL0, DIL1, DIL2, or DIL3.
- Do not use template variables or special formatting tokens.
- Return plain text with actual numbers.
- Keep the whole response concise and easy to scan.
- Use clear headings and bullet points.
- Never claim to monitor other applications or observe anything outside
  the supplied activity log.
- Do not present the calculated productivity score as a measure of the
  user's overall worth or ability.
`;

console.log("Sending request to Gemini...");

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    if (!response.text) {
      throw new Error("The AI returned an empty response. Please try again.");
    }

    res.json({
      analysis: response.text,
      statistics: {
        productiveMinutes,
        distractionMinutes,
        totalMinutes,
        productivityScore,
        activityCount: validActivities.length,
      },
    });
  } catch (error) {
    console.error("Gemini Error:", error.message);

    res.status(500).json({
      error: "Unable to analyze your activities right now. Check the backend terminal and try again.",
    });
  }
});

const browserActivities = [];

app.post("/api/browser-activity", (req, res) => {
  const { domain, title, seconds } = req.body;

  if (
    typeof domain !== "string" ||
    typeof title !== "string" ||
    !Number.isFinite(seconds) ||
    seconds <= 0
  ) {
    return res.status(400).json({
      error: "Invalid browser activity"
    });
  }

  browserActivities.push({
    domain: domain.slice(0, 253),
    title: title.slice(0, 200),
    seconds: Math.min(Math.floor(seconds), 3600),
    timestamp: new Date().toISOString()
  });

  res.json({ success: true });
});

app.get("/api/browser-activity", (req, res) => {
  res.json({ activities: browserActivities });
});

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
