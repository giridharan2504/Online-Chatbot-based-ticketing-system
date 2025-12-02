// client/src/pages/HowItWorks.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function HowItWorks() {
  const nav = useNavigate();

  return (
    <div style={{ padding: 40 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <button onClick={() => nav(-1)} style={{ marginBottom: 20, padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}>
          ← Back
        </button>

        <div className="card" style={{ padding: 28 }}>
          <h1 style={{ marginTop: 0 }}>How CineBuddy works</h1>

          <p style={{ color: "#475569", lineHeight: 1.7 }}>
            CineBuddy is a small demo that mimics a movie ticket booking flow:
          </p>

          <ol style={{ color: "#334155", lineHeight: 1.8 }}>
            <li><strong>Login</strong> — the demo stores a minimal profile locally (no external auth required).</li>
            <li><strong>Select movies</strong> — choose at least 5 movies to build a taste profile used for recommendations.</li>
            <li><strong>Main page</strong> — left column shows recommendations filtered by the genres you chose, right column is the booking assistant chat widget powered by your assistant model.</li>
            <li><strong>Assistant chatbot</strong> — accepts commands such as <code>show me movies</code>, <code>show me timings for &lt;movie&gt;</code>, and <code>book &lt;movie&gt;</code>. The assistant calls the backend to fetch showtimes and performs booking flows (seat selector modal, booking confirmation).</li>
            <li><strong>Payment</strong> — in the demo the payment step is represented by a QR popup; you can wire a real payment gateway in production.</li>
            <li><strong>Data</strong> — recommendations are generated client-side using the choices you made; the assistant interaction is powered by your selected AI backend (Groq, Gemini, etc.).</li>
          </ol>

          <h3 style={{ marginTop: 22 }}>Developer notes</h3>
          <ul>
            <li>Backend endpoints are under <code>/server</code>. The assistant endpoint is <code>/api/groq</code> (replace per your provider).</li>
            <li>Store API keys in `.env` on the server only — never push keys to the client bundle.</li>
            <li>To style pages consistently, modify <code>client/src/styles.css</code>.</li>
          </ul>

          <div style={{ marginTop: 18 }}>
            <button onClick={() => nav("/select")} className="gradient-pill">Go select movies</button>
          </div>
        </div>
      </div>
    </div>
  );
}
