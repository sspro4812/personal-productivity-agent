
PERSONAL PRODUCTIVITY AGENT

OVERVIEW

Personal Productivity Agent is an AI-powered application designed to help users track daily activities, analyze productivity patterns, and receive personalized recommendations using Google Gemini AI.

The application allows users to record productive and distracting activities. It also provides an optional Chrome extension for tracking browser activity.

FEATURES

- Daily activity tracking
- Productive and distraction time monitoring
- AI-powered productivity analysis
- Personalized recommendations
- Daily productivity summaries
- Optional browser activity tracking through a Chrome extension

TECHNOLOGY STACK

Frontend: React.js, Vite
Backend: Node.js, Express.js
AI Integration: Google Gemini API
Browser Extension: Chrome Extension (Manifest V3)

PROJECT SETUP

1. Clone the Repository

git clone https://github.com/YOUR-USERNAME/personal-productivity-agent.git

cd personal-productivity-agent

2. Install Dependencies

Ensure Node.js and npm are installed.

Run:

npm install

3. Configure Gemini API Key

Visit:
https://aistudio.google.com/apikey

Generate a Gemini API key.

Create a file named .env in the project root directory.

Add the following:

GEMINI_API_KEY=YOUR_GEMINI_API_KEY

Replace YOUR_GEMINI_API_KEY with your actual API key.

Do not upload the .env file to GitHub.

4. Configure Gemini Model

Open the file:

server/server.cjs

Locate the Gemini API request and configure the model:

model: "gemini-3.8-flash"

The model can be changed based on availability in Google AI Studio.

5. Start the Backend

Open a terminal in the project directory and run:

node server/server.cjs

Backend URL:
http://localhost:5000

6. Start the Frontend

Open another terminal and run:

npm run dev

Open the URL displayed in the terminal.

OPTIONAL CHROME EXTENSION SETUP

The Chrome extension is optional. The main application works without installing it.

Installation Steps:

1. Open Google Chrome.
2. Navigate to chrome://extensions
3. Enable Developer Mode.
4. Click Load unpacked.
5. Select the chrome-extension folder from the project directory.
6. Ensure the extension is enabled.
7. Start the backend to synchronize browser activity.

The extension records active browser tab information, including website domain, page title, and time spent.

Browser activity is included in the AI analysis without automatically classifying websites as productive or distracting.

HOW IT WORKS

1. Users enter daily activities and durations.
2. Activities are categorized as productive or distracting.
3. The optional extension collects browser activity.
4. The backend processes the recorded information.
5. Google Gemini generates productivity insights and recommendations.
6. The results are displayed on the dashboard.

SECURITY

- API keys are stored using environment variables.
- Gemini API requests are handled by the backend.
- Activity information submitted for analysis is processed through the Gemini API.

PROJECT TYPE

Academic Project
Agentic AI – Personal Productivity Agent
