# Hello Work ID Chatbot

A simple chatbot web app using Node.js + Express for the backend and Vanilla JavaScript for the frontend. The app integrates with Google Gemini AI and supports:

- chat conversation with AI
- markdown-formatted bot responses
- CV upload via attachment button
- CV review instructions sent to the AI
- file removal before submission

## Features

- `POST /api/chat` backend endpoint
- frontend chat UI with responsive messenger-style layout
- attachment button for uploading CV files
- file preview and clear/remove file support
- AI handles CV review requests when a file is uploaded

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with:
   ```env
   GOOGLE_GENAI_API_KEY=your_api_key_here
   ```

3. Run the app:
   ```bash
   npm start
   ```

4. Open the browser:
   ```
   http://localhost:3000
   ```

## Usage

- Type a message and click `Send` to chat with the AI.
- Click the paperclip button to upload a CV file (`.pdf`, `.txt`, `.doc`, `.docx`).
- After uploading, use the `×` button to remove the file if you change your mind.
- On submit, the chat sends both the message and uploaded CV data to the backend.
- The backend detects CV uploads and adds review instructions for the AI.

## Notes

- The frontend uses `marked` and `DOMPurify` to safely render markdown responses.
- The backend currently uses `@google/genai` and a Gemini model configured via `index.js`.
- Make sure your API key is valid and the backend is able to reach Google Gemini.
