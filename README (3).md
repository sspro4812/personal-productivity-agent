# Personal Productivity Agent

## Overview

The Personal Productivity Agent is an AI-powered application that helps
users review their recorded activities and understand their productivity
patterns. It uses Google Gemini to generate concise summaries and
practical recommendations based on the activities provided.

The application includes a React and Vite frontend, an Express backend,
and an optional Chrome extension that collects active browser-tab
activity for inclusion in the analysis.

## Key Features

-   Record activities with their duration and category.
-   Generate AI-powered productivity summaries and recommendations.
-   Review browser activity collected through the optional Chrome
    extension.
-   Keep browser activity separate from productive and distracting
    activity classifications unless explicitly classified.

## Technology Stack

-   **Frontend:** React, Vite
-   **Backend:** Node.js, Express
-   **AI:** Google Gemini API (`@google/genai`)
-   **Optional browser integration:** Chrome Extension Manifest V3

## Configuration

### 1. Configure the Gemini API key

1.  Obtain an API key from [Google AI
    Studio](https://aistudio.google.com/apikey).

2.  In the project root directory (the folder containing
    `package.json`), create a file named `.env`.

3.  Add the following line, replacing the example value with your API
    key:

    ``` env
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```

4.  Save the file and restart the backend if it is already running.

**Security:** Keep `.env` private. Do not upload your real API key to a
public repository or include it in frontend code.

### 2. Configure the Gemini model

Open `server/server.cjs` and locate the Gemini `generateContent`
request. The model is configured in the `model` field:

``` js
model: "gemini-3.8-flash"
```

If a different model is required, replace the value with a model name
currently available to your Google AI Studio account.

## Running the Application

Install dependencies from the project root:

``` bash
npm install
```

Start the backend:

``` bash
node server/server.cjs
```

In a separate terminal, start the frontend:

``` bash
npm run dev
```

Open the URL displayed by Vite in the terminal.

## Optional Chrome Extension Setup

The Chrome extension is optional; the main application can be used
without it.

1.  Start the backend.
2.  Open Google Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Select **Load unpacked**.
5.  Choose the `chrome-extension` folder in the project directory.
6.  Ensure the extension is enabled.

When enabled, the extension records active HTTP/HTTPS tab domains, page
titles, and elapsed time, and sends this information to the application
backend for analysis. Restricted browser pages, such as `chrome://`
pages, are not tracked.

## Notes

-   The frontend and backend must both be running to use the complete
    application.
-   Browser activity collected by the extension is used as contextual
    information and is not automatically classified as productive or
    distracting.
-   Browser activity is held in backend memory and is cleared when the
    backend restarts.
-   Gemini analysis sends the activity data included in the request to
    Google's Gemini API.
