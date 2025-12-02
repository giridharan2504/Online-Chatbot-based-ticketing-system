Movie Ticket Chatbot — Full project (frontend + backend)

Structure:
- server/        (Express API: movies, shows, booking, mock Groq)
- client/        (Vite + React frontend)

How to run locally:

1) Open two terminals.

Terminal 1 — start server:
   cd server
   npm install
   npm start
   The server will run at http://localhost:4000

Terminal 2 — start client:
   cd client
   npm install
   npm run dev
   The frontend will run at http://localhost:5173 (or the port Vite shows)

Notes:
- The client is configured to call the server at http://localhost:4000 for movie lists, shows, booking, and a mock /api/groq endpoint.
- For production, move Groq API calls to the server proxy to keep your API key secret.
- Replace sample movie data (server/index.js) with your own dataset or integrate a database.
