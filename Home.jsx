// client/src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Home (movie-style) — Continue -> /recommendations
 * Keeps localStorage keys compatible with your app (cine_user, cine_picks).
 */

export default function Home() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [user, setUser] = useState(null);
  const [picksCount, setPicksCount] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cine_user");
      if (saved) setUser(JSON.parse(saved));
      const picks = JSON.parse(localStorage.getItem("cine_picks") || "[]");
      if (Array.isArray(picks)) setPicksCount(picks.length);
    } catch (err) {
      console.warn("Home: localStorage read failed", err);
    }
  }, []);

  // keep this navigating to recommendations (not main/chat)
  function saveAndContinue(e) {
    e?.preventDefault();
    const trimmed = (name || "").trim();
    if (!trimmed) {
      alert("Please enter your name to continue.");
      return;
    }
    const newUser = { name: trimmed, createdAt: new Date().toISOString() };
    try {
      localStorage.setItem("cine_user", JSON.stringify(newUser));
    } catch (err) {
      console.warn("Home: localStorage set failed", err);
    }
    setUser(newUser);
    // Redirect to the recommendations page (new route)
    navigate("/select");
  }

  function openChat() {
    navigate("/main");
  }

  function pickMovies() {
    navigate("/select");
  }

  function logout() {
    try {
      localStorage.removeItem("cine_user");
    } catch (err) {}
    setUser(null);
    setName("");
  }

  // static poster samples (presentational)
  const samplePosters = [
    { title: "Neon Drift", year: 2024 },
    { title: "Midnight Ocean", year: 2023 },
    { title: "Skyline Heist", year: 2022 },
    { title: "The Last Score", year: 2021 },
    { title: "Sunset Riders", year: 2020 },
  ];

  return (
    <div className="home-moviepage">
      <header className="hb-topbar">
        <div className="brand">
          <div className="brand-logo">CB</div>
          <div className="brand-meta">
            <div className="brand-title">CineBuddy</div>
            <div className="brand-sub">Movie tickets, personalized</div>
          </div>
        </div>

        <div className="top-actions">
          <div className="location">Location: Bengaluru</div>
          {user ? (
            <div className="user-chip">
              <div className="user-name">Welcome, {user.name}</div>
              <button className="chip-logout" onClick={logout} title="Logout">
                Logout
              </button>
            </div>
          ) : (
            <div className="user-chip muted">Not signed in</div>
          )}
        </div>
      </header>

      <main className="hb-main">
        <section className="hero">
          <div className="hero-left">
            <h1 className="hero-title">Find movie magic — fast.</h1>
            <p className="hero-sub">
              Personalized picks, showtimes and simple booking suggestions.
              Sign in so CineBuddy can remember your taste.
            </p>

            <form className="hero-form" onSubmit={saveAndContinue}>
              <div className="form-row">
                <input
                  className="input-name"
                  type="text"
                  placeholder={user ? `Signed in as ${user.name}` : "Enter your name"}
                  value={user ? user.name : name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!!user}
                  aria-label="name"
                />
                <button type="submit" className="btn-cta">
                  {user ? "Open Chat" : "Continue"}
                </button>
              </div>

              {!user && (
                <div className="small-note muted">
                  You'll be asked to pick a few movies to help build recommendations.
                </div>
              )}

              <div className="hero-actions">
                <button type="button" className="btn-outline" onClick={openChat}>
                  Open Chat (when ready)
                </button>
                <button type="button" className="btn-primary" onClick={pickMovies}>
                  Pick Movies
                  <span className="pill">{picksCount}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="hero-right">
            <div className="poster-stack" aria-hidden>
              {samplePosters.slice(0, 5).map((p, i) => (
                <div key={p.title} className={`poster poster-${i}`}>
                  <div className="poster-gradient" />
                  <div className="poster-meta">
                    <div className="poster-title">{p.title}</div>
                    <div className="poster-year">{p.year}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="content-grid">
          <div className="card info-card">
            <h3>About the chatbot</h3>
            <p>
              CineBuddy helps you find movies, showtimes and book demo seats. Use it once you're ready.
            </p>
            <ul>
              <li>Find movies that match your taste</li>
              <li>Show available showtimes and book seats</li>
              <li>Quick tips: "show me timings for &lt;movie&gt;"</li>
            </ul>
            <div className="muted small">Your name and picks are stored locally in the browser.</div>
          </div>

          <div className="card posters-preview">
            <h3>Trending / suggestions</h3>
            <div className="grid-posters">
              {samplePosters.map((p) => (
                <div key={p.title} className="small-poster">
                  <div className="small-art" />
                  <div className="small-meta">
                    <div className="small-title">{p.title}</div>
                    <div className="small-year muted">{p.year}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="hb-footer">
        <div>© {new Date().getFullYear()} CineBuddy — Demo</div>
        <div className="muted">Built for your project</div>
      </footer>
    </div>
  );
}
