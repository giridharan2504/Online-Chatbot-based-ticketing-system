// client/src/pages/Select.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/select.css"; // keep separate select styles

const SAMPLE_MOVIES = [
  { id: "m1", title: "Neon Nights", genre: "EDM", duration: "2h 10m" },
  { id: "m2", title: "Romance in Rain", genre: "Romance", duration: "1h 55m" },
  { id: "m3", title: "Action Frontier", genre: "Action", duration: "2h 5m" },
  { id: "m4", title: "Bollywood Beats", genre: "Bollywood", duration: "2h" },
  { id: "m5", title: "Silent Thriller", genre: "Thriller", duration: "1h 50m" },
  { id: "m6", title: "Mystery Manor", genre: "Thriller", duration: "2h 5m" },
  { id: "m7", title: "The Great Escape", genre: "Action", duration: "2h 8m" },
  { id: "m8", title: "Hearts & Harmony", genre: "Romance", duration: "1h 45m" },
  { id: "m9", title: "City Lights", genre: "Bollywood", duration: "2h 2m" },
  { id: "m10", title: "Festival Beats", genre: "EDM", duration: "1h 55m" },
];

export default function Select() {
  const navigate = useNavigate();
  const movies = useMemo(() => SAMPLE_MOVIES, []);
  const [selected, setSelected] = useState(new Set());
  const [timingPreview, setTimingPreview] = useState(null);

  function toggleSelect(id) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearAll() {
    setSelected(new Set());
  }

  function handleContinue() {
    if (selected.size >= 5) {
      const sel = Array.from(selected);
      window.localStorage.setItem("cinebuddy:selected", JSON.stringify(sel));
      navigate("/main");
    } else {
      alert("Please select at least 5 movies to continue.");
    }
  }

  function showTimings(movie) {
    setTimingPreview(movie);
    window.setTimeout(() => setTimingPreview(null), 3500);
  }

  return (
    <div className="select-page" style={{ background: "linear-gradient(180deg,#fbfdff,#f5f7fb)" }}>
      <div className="select-wrap" style={{ position: "relative", zIndex: 10 }}>
        <div className="select-header">
          <h2 className="select-title">
            Select your favorite movies <small>(pick at least 5)</small>
          </h2>

          <div className="select-actions">
            <button className="btn-clear" onClick={clearAll}>Clear</button>
            <button
              className={`btn-continue ${selected.size >= 5 ? "" : "disabled"}`}
              onClick={handleContinue}
              disabled={selected.size < 5}
            >
              Continue — Create profile
            </button>
          </div>
        </div>

        <div className="movies-grid">
          {movies.map((m) => {
            const isOn = selected.has(m.id);
            return (
              <div key={m.id} className={`movie-card ${isOn ? "selected" : ""}`}>
                <div>
                  <div className="poster-box">
                    <div className="poster-text">{m.title}</div>
                  </div>

                  <div className="movie-title">{m.title}</div>
                  <div className="movie-meta">{m.genre} • {m.duration}</div>
                </div>

                <div className="card-controls">
                  <label
                    className={`select-pill ${isOn ? "on" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSelect(m.id);
                    }}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        toggleSelect(m.id);
                      }
                    }}
                    aria-pressed={isOn}
                    role="button"
                  >
                    <input
                      type="checkbox"
                      checked={isOn}
                      readOnly
                      aria-hidden="true"
                    />
                    <span className="tick" aria-hidden="true" />
                    <span className="pill-label">{isOn ? "Selected" : "Select"}</span>
                  </label>

                  <button className="btn-gradient" onClick={() => showTimings(m)}>
                    Show Timings
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {timingPreview && (
        <div className="timing-preview">
          <div className="tp-card">
            <strong>{timingPreview.title}</strong>
            <div style={{ marginTop: 6, color: "#64748b" }}>
              Sample showtimes: 10:00 · 13:30 · 17:45
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
