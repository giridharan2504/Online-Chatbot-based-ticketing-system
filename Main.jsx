// Main.jsx (patched) — paste to replace your existing file
import React, { useEffect, useState } from "react";
import "../styles/main-upgrade.css"; // adjust path if needed
import ChatWidget from "../components/ChatWidget"; // restored chat widget

const STORAGE_KEY = "cinebuddy:selected";
const BOOKINGS_KEY = "cine_bookings";

const SAMPLE_MOVIES = [
  { id: "m1", title: "Neon Nights", genre: "EDM", runtime: "2h 10m", year: 2024 },
  { id: "m2", title: "Romance in Rain", genre: "Romance", runtime: "1h 55m", year: 2023 },
  { id: "m3", title: "Action Frontier", genre: "Action", runtime: "2h 5m", year: 2022 },
  { id: "m4", title: "Bollywood Beats", genre: "Bollywood", runtime: "2h 2m", year: 2021 },
  { id: "m5", title: "Silent Thriller", genre: "Thriller", runtime: "1h 50m", year: 2024 },
  { id: "m6", title: "Mystery Manor", genre: "Thriller", runtime: "2h 5m", year: 2022 },
  { id: "m7", title: "The Great Escape", genre: "Action", runtime: "2h 8m", year: 2020 },
  { id: "m8", title: "Hearts & Harmony", genre: "Romance", runtime: "1h 45m", year: 2021 },
];

function readPicks() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

function savePicks(arr) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error(e);
  }
}

export default function Main() {
  const [picks, setPicks] = useState(() => readPicks());
  const [movies] = useState(SAMPLE_MOVIES);
  const [detailMovie, setDetailMovie] = useState(null);
  const [seatModalMovie, setSeatModalMovie] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookingName, setBookingName] = useState("");

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setPicks(readPicks());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, []);

  // modal open/close helpers (add/remove body class)
  function openDetail(m) {
    setDetailMovie(m);
    document.body.classList.add("modal-open");
  }
  function closeDetail() {
    setDetailMovie(null);
    document.body.classList.remove("modal-open");
  }
  function openSeatModal(m) {
    setSeatModalMovie(m);
    setSelectedSeats([]);
    setBookingName("");
    document.body.classList.add("modal-open");
  }
  function closeSeatModal() {
    setSeatModalMovie(null);
    setSelectedSeats([]);
    setBookingName("");
    document.body.classList.remove("modal-open");
  }

  function clearPicks() {
    setPicks([]);
    savePicks([]);
  }

  // booking logic (demo)
  function confirmBooking() {
    try {
      const prev = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
      prev.unshift({
        movie: seatModalMovie?.title || "unknown",
        seats: selectedSeats,
        name: bookingName,
        at: new Date().toISOString(),
      });
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(prev.slice(0, 20)));
      // Use non-blocking UI feedback — ChatWidget will show toast for final payment flow.
      // Keep this alert only if you want an immediate demo confirmation:
      // alert(`Booked ${selectedSeats.length} seat(s) for "${seatModalMovie?.title}".`);
    } catch (e) {
      console.error(e);
    }
    closeSeatModal();
  }

  // seat grid generator A-D rows, 8 cols
  const seatRows = ["A", "B", "C", "D"];
  const seatCols = 8;

  function toggleSeat(row, col) {
    const id = `${row}${col}`;
    setSelectedSeats((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      return [...s, id];
    });
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        if (seatModalMovie) closeSeatModal();
        else if (detailMovie) closeDetail();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [seatModalMovie, detailMovie]);

  // poster gradient helper
  function posterStyle(id) {
    const colors = [
      ["#ff6a3d", "#c92edc"],
      ["#06b6d4", "#7c3aed"],
      ["#06b6d4", "#10b981"],
      ["#7c3aed", "#06b6d4"],
      ["#ff6a3d", "#06b6d4"],
      ["#ff6a3d", "#ffbf69"],
      ["#06b6d4", "#ff6a3d"],
      ["#8b5cf6", "#06b6d4"],
    ];
    const idx = Math.abs(
      id.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7)
    ) % colors.length;
    return { background: `linear-gradient(180deg, ${colors[idx][0]}, ${colors[idx][1]})` };
  }

  return (
    <div className="cb-main-upgrade">
      {/* HEADER / BANNER */}
      <header className="cb-header">
        <div className="cb-banner-left">
          <div className="cb-logo" aria-hidden="true">CB</div>
          <div className="cb-brand">
            <div className="cb-title">CineBuddy</div>
            <div className="cb-sub">Movie tickets · personalized</div>
          </div>
        </div>

        <div className="cb-banner-right">
          <div className="cb-location">Location: Bengaluru</div>
          <button className="cb-logout">Logout</button>
        </div>
      </header>

      <main className="cb-layout" role="main">
        <section className="cb-content">
          <h2 className="cb-heading">Recommended for you — <span className="muted">based on your picks</span></h2>

          <div className="cb-controls">
            <div className="cb-controls-left">
              <button className="btn btn-outline" onClick={() => { /* open edit picks */ alert("Edit picks — open selection page (demo)."); }}>Edit picks</button>
              <button className="btn btn-primary" onClick={() => { window.location.href = "/select"; }}>Pick more</button>
            </div>
            <div className="cb-controls-right">
              <button className="btn btn-ghost" onClick={clearPicks}>Clear picks</button>
            </div>
          </div>

          <div className="cb-picks-row" aria-label="Your picks">
            {picks && picks.length > 0 ? (
              picks.map((pid) => {
                const m = movies.find((x) => x.id === pid) || SAMPLE_MOVIES.find((x) => x.id === pid);
                if (!m) return null;
                return (
                  <div key={m.id} className="cb-pick">
                    <div className="cb-pick-poster" style={posterStyle(m.id)} />
                    <div className="cb-pick-meta">
                      <div className="cb-pick-title">{m.title}</div>
                      <div className="cb-pick-sub">{m.genre}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="cb-no-picks">No picks yet — pick movies to build recommendations.</div>
            )}
          </div>

          <div className="cb-grid" aria-live="polite">
            {movies.map((m) => (
              <article key={m.id} className="cb-card" aria-label={m.title}>
                <div className="cb-poster cb-card-poster" style={posterStyle(m.id)}>
                  <div className="cb-poster-title">{m.title}</div>
                </div>

                <div className="cb-card-body">
                  <div className="cb-card-meta">
                    <div className="cb-card-title">{m.title}</div>
                    <div className="cb-card-sub">{m.genre} • {m.runtime}</div>
                  </div>

                  <div className="cb-card-actions">
                    <button className="btn btn-ghost" onClick={() => openDetail(m)}>Details</button>
                    <button className="btn btn-outline" onClick={() => { openDetail(m); /* demo timing show */ }}>Show Timings</button>
                    <button className="btn btn-primary" onClick={() => openSeatModal(m)}>Book</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Right sidebar: restored ChatWidget */}
        <aside className="cb-side">
          <div className="cb-chat-panel" aria-label="Chatbot">
            <ChatWidget />
          </div>
        </aside>
      </main>

      {/* Details modal (simple) */}
      {detailMovie && (
        <div className="cb-modal" role="dialog" aria-modal="true" aria-label="Movie details">
          <div className="cb-modal-content">
            <button className="cb-modal-close" aria-label="Close" onClick={closeDetail}>✕</button>
            <div className="cb-detail-hero" style={posterStyle(detailMovie.id)}>
              <div className="cb-detail-hero-title">{detailMovie.title}</div>
            </div>
            <div className="cb-detail-body">
              <p><strong>{detailMovie.title}</strong> — {detailMovie.genre} • {detailMovie.runtime}</p>
              <p>This is a demo details panel. Use it to show synopsis, cast and larger images (not included in demo).</p>
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-primary" onClick={() => { openSeatModal(detailMovie); }}>Book tickets</button>
                <button className="btn btn-ghost" onClick={closeDetail} style={{ marginLeft: 8 }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seat selection modal (light demo fallback in Main; ChatWidget has its own full modal for actual flows) */}
      {seatModalMovie && (
        <div className="cb-modal" role="dialog" aria-modal="true" aria-label="Select seats">
          <div className="cb-modal-content">
            <button className="cb-modal-close" aria-label="Close" onClick={closeSeatModal}>✕</button>

            <h3 className="cb-modal-title">Select Your Seats <span className="muted small">{seatModalMovie.title}</span></h3>

            <div className="cb-modal-screen" aria-hidden="true">SCREEN</div>

            <div className="cb-seat-area">
              <div className="cb-seat-grid" role="grid" aria-label="Seat map">
                {seatRows.map((r) =>
                  Array.from({ length: seatCols }).map((_, i) => {
                    const col = i + 1;
                    const id = `${r}${col}`;
                    const isSelected = selectedSeats.includes(id);
                    return (
                      <button
                        key={id}
                        className={`cb-seat ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleSeat(r, col)}
                        aria-pressed={isSelected}
                        aria-label={`Seat ${id}`}
                      >
                        {id}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="cb-seat-selected-list">
                Selected: {selectedSeats.length ? selectedSeats.join(", ") : "none"}
              </div>

              <div className="cb-modal-footer">
                <input
                  className="cb-book-name"
                  placeholder="Your name (optional)"
                  value={bookingName}
                  onChange={(e) => setBookingName(e.target.value)}
                />
                <button
                  className="cb-confirm-btn"
                  onClick={confirmBooking}
                  disabled={selectedSeats.length === 0}
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
