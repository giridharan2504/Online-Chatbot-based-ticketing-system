// client/src/components/ChatWidget.jsx
import React, { useEffect, useState, useRef } from "react";
import QRCode from "react-qr-code";

export default function ChatWidget() {
  const [movies, setMovies] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [payment, setPayment] = useState(null);
  const payPollRef = useRef(null);

  // animation control states
  const [seatModalActive, setSeatModalActive] = useState(false);
  const [qrModalActive, setQrModalActive] = useState(false);

  // toast state
  const [toast, setToast] = useState({ show: false, message: "", kind: "info" });
  const toastTimer = useRef(null);

  useEffect(() => {
    fetch("http://localhost:4000/api/movies").then((r) => r.json()).then(setMovies).catch(() => {});
    return () => {
      if (payPollRef.current) clearInterval(payPollRef.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(message, kind = "info", duration = 4000) {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
    setToast({ show: true, message, kind });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), duration);
  }

  function addMessage(role, text) {
    setChatMessages((prev) => [...prev, { role, text }]);
  }

  async function handleSendMessage(e) {
    e?.preventDefault();
    const userMsg = chatInput.trim();
    if (!userMsg) return;
    addMessage("user", userMsg);
    setChatInput("");

    const lower = userMsg.toLowerCase();
    if (lower.includes("show me movies") || lower.includes("list movies")) {
      const list = movies.map((m) => ({ id: m.id, title: m.title, genre: m.genre }));
      addMessage("bot", "MOVIE_LIST:" + JSON.stringify(list));
      return;
    }

    if (lower.includes("show me timings for")) {
      const title = userMsg.split("for").pop().trim();
      const movie = movies.find((m) => m.title.toLowerCase().includes(title.toLowerCase())) || movies[0];
      try {
        const res = await fetch(`http://localhost:4000/api/shows/${movie.id}`);
        const json = await res.json();
        addMessage("bot", "TIMINGS:" + JSON.stringify({ title: movie.title, shows: json.shows || [] }));
      } catch (err) {
        addMessage("bot", "TIMINGS:[]");
      }
      return;
    }

    if (lower.startsWith("book") || lower.includes("i want to book")) {
      addMessage("bot", "OPEN_SEAT_MODAL");
      setSelectedShow({ movieId: movies[0]?.id || "m1", movie: movies[0]?.title || "Show", hall: "Main Hall", time: "8:00 PM" });
      setSelectedSeats([]);
      openSeatModal();
      return;
    }

    // fallback to your server groq endpoint (if available)
    try {
      const r = await fetch("http://localhost:4000/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMsg }),
      });
      const j = await r.json();
      addMessage("bot", j.result || "No response");
    } catch (e) {
      addMessage("bot", "Error contacting assistant");
    }
  }

  function handleOpenSeatModal(show) {
    setSelectedShow(show);
    setSelectedSeats([]);
    openSeatModal();
  }
  function toggleSeat(s) {
    setSelectedSeats((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  // open/close helpers to control animation states
  function openSeatModal() {
    setShowSeatModal(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setSeatModalActive(true)));
  }
  function closeSeatModal() {
    setSeatModalActive(false);
    setTimeout(() => setShowSeatModal(false), 260);
  }

  function openQRModal() {
    setShowQRModal(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setQrModalActive(true)));
  }
  function closeQRModal() {
    setQrModalActive(false);
    setTimeout(() => setShowQRModal(false), 260);
  }

  // Confirm booking -> create booking -> create payment -> show QR -> poll status
  async function confirmBooking() {
    if (!selectedSeats.length) return alert("Pick seats first");

    const payload = {
      movieId: selectedShow?.movieId || "m1",
      hall: selectedShow?.hall || "Main Hall",
      time: selectedShow?.time || "8:00 PM",
      seats: selectedSeats,
      user: { name: "Guest" },
    };

    try {
      // 1) create booking
      const res = await fetch("http://localhost:4000/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!j.success) {
        alert("Booking failed");
        return;
      }
      const booking = j.booking;

      // 2) create payment (demo)
      const amount = selectedSeats.length * 199;
      const p = await fetch("http://localhost:4000/api/pay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, amount }),
      }).then((r) => r.json());
      if (!p.success) {
        alert("Payment init failed");
        return;
      }
      setPayment(p.payment);

      // close seat modal then open QR modal
      closeSeatModal();
      setTimeout(() => openQRModal(), 260);

      // 3) start polling
      if (payPollRef.current) clearInterval(payPollRef.current);
      payPollRef.current = setInterval(async () => {
        try {
          const s = await fetch(`http://localhost:4000/api/pay/status?paymentId=${p.payment.id}`).then((r) => r.json());
          if (s.status === "paid") {
            clearInterval(payPollRef.current);
            closeQRModal();
            addMessage("bot", "PAYMENT_CONFIRMED: Payment successful. Booking ID: " + booking.id);
            // show nice in-app toast instead of blocking alert
            showToast(`Payment successful and booking confirmed! Seats: ${selectedSeats.join(", ")}`, "success");
          }
        } catch (e) {
          // keep polling; ignore transient failures
        }
      }, 1800);
    } catch (err) {
      console.error(err);
      alert("Booking flow failed.");
    }
  }

  // Simulate clicking a QR scan (for demo)
  async function simulatePayNow(paymentId) {
    await fetch("http://localhost:4000/api/pay/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId }),
    });
    // polling will detect paid status
  }

  // seat labels A1..D8
  const seats = [];
  for (const r of ["A", "B", "C", "D"]) for (let i = 1; i <= 8; i++) seats.push(r + "" + i);

  // ---------- inline styles for modal + toast ----------
  const baseStyles = {
    chatWrap: { padding: 16, height: "100%", display: "flex", flexDirection: "column" },
    chatHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    chatWindow: { flex: 1, overflow: "auto", padding: 12, marginTop: 8, borderRadius: 8, background: "#fff", border: "1px solid #eee" },
    inputRow: { display: "flex", gap: 8, marginTop: 8 },
    input: { flex: 1, padding: 10 },
    sendBtn: { padding: "8px 12px", background: "#000", color: "#fff", border: "none" },
  };

  return (
    <div style={baseStyles.chatWrap}>
      {/* component-scoped styles for modals, toast and animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* overlay + modal entrance (fade + pop) */
        .cb-modal-overlay {
          position: fixed;
          inset: 0;
          display:flex;
          align-items:center;
          justify-content:center;
          background: rgba(2,6,23,0.56);
          backdrop-filter: blur(3px);
          z-index: 9999;
          opacity: 0;
          transition: opacity 220ms ease;
        }
        .cb-modal-overlay.show { opacity: 1; }

        .cb-modal {
          width: 60%;
          max-width: 880px;
          background: #0f1724;
          color: #e6eef8;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 30px 80px rgba(2,6,23,0.7);
          transform-origin: center;
          transform: translateY(8px) scale(0.96);
          opacity: 0;
          transition: transform 240ms cubic-bezier(.2,.9,.3,1), opacity 200ms ease;
        }
        .cb-modal.enter { transform: translateY(0) scale(1); opacity: 1; }

        /* QR modal wrapper and card (wider & brand-styled) */
        .cb-qr-wrapper { display:flex; align-items:center; justify-content:center; padding:20px; }
        .cb-qr-card {
          width: 520px;
          max-width: 94%;
          border-radius: 12px;
          padding: 18px;
          background: linear-gradient(180deg,#ffffff,#fbfdff);
          box-shadow: 0 30px 60px rgba(2,6,23,0.28);
          color: #0f1724;
          transform: translateY(8px) scale(0.96);
          opacity: 0;
          transition: transform 240ms cubic-bezier(.2,.9,.3,1), opacity 200ms ease;
          text-align:center;
        }
        .cb-qr-card.enter { transform: translateY(0) scale(1); opacity: 1; }

        /* brand banner (logo gradient) */
        .cb-qr-banner {
          margin: 0 auto 12px;
          width: 60%;
          max-width: 320px;
          height: 36px;
          background: linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%);
          color: #fff;
          display:flex;
          align-items:center;
          justify-content:center;
          letter-spacing:6px;
          border-radius:6px;
          transform: skewX(-10deg);
          font-weight:800;
        }

        .cb-qr-frame { background: #fff; padding: 12px; border-radius: 8px; display:inline-block; }

        .cb-qr-actions { display:flex; justify-content:center; gap:10px; margin-top:12px; }
        .cb-btn-sim { padding:8px 12px; border-radius:8px; background: linear-gradient(90deg,#10b981,#06b6d4); color:#04272a; border:none; cursor:pointer; font-weight:800; }
        .cb-btn-ghost { padding:8px 12px; border-radius:8px; background:transparent; border:1px solid rgba(11,20,40,0.06); cursor:pointer; }

        /* seat button look in dark modal */
        .cb-seat-btn {
          padding: 10px 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03); color: #e6eef8; font-weight:700; cursor:pointer;
        }
        .cb-seat-btn.selected { background: linear-gradient(90deg,#10b981,#06b6d4); color: #fff; box-shadow: 0 8px 20px rgba(16,185,129,0.18); }

        /* toast */
        .cb-toast {
          position: fixed;
          right: 18px;
          bottom: 18px;
          min-width: 220px;
          max-width: 420px;
          padding: 12px 14px;
          border-radius: 10px;
          box-shadow: 0 18px 40px rgba(2,6,23,0.3);
          color: #fff;
          z-index: 11000;
          transform: translateY(12px);
          opacity: 0;
          transition: transform 240ms cubic-bezier(.2,.9,.3,1), opacity 200ms ease;
        }
        .cb-toast.show { transform: translateY(0); opacity: 1; }
        .cb-toast.info { background: linear-gradient(90deg,#3b82f6,#06b6d4); }
        .cb-toast.success { background: linear-gradient(90deg,#10b981,#06b6d4); }
        .cb-toast.warn { background: linear-gradient(90deg,#f59e0b,#ef4444); }

        @media (max-width:720px) {
          .cb-modal { width: 94%; padding: 16px; }
          .cb-qr-card { width: 94%; padding: 16px; }
        }
      ` }} />

      <div style={baseStyles.chatHeaderRow}>
        <h3 style={{ margin: 0 }}>Chatbot</h3>
        <small style={{ color: "#666" }}>Strict responses</small>
      </div>

      <div style={baseStyles.chatWindow}>
        {chatMessages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8, textAlign: m.role === "user" ? "right" : "left" }}>
            <div style={{ display: "inline-block", padding: 8, borderRadius: 8, background: m.role === "user" ? "#2563eb" : "#f3f4f6", color: m.role === "user" ? "#fff" : "#111" }}>
              {typeof m.text === "string" && m.text.startsWith && m.text.startsWith("MOVIE_LIST:") ? (
                <div>
                  <strong>Available movies:</strong>
                  <ul>{JSON.parse(m.text.replace("MOVIE_LIST:", "")).map((it) => <li key={it.id}>{it.title} ({it.genre})</li>)}</ul>
                </div>
              ) : typeof m.text === "string" && m.text.startsWith && m.text.startsWith("TIMINGS:") ? (
                <div>
                  <strong>Timings</strong>
                  <ul>{JSON.parse(m.text.replace("TIMINGS:", "")).shows.map((s, idx) => (<li key={idx}>{s.hall}: {s.timings.join(", ")} <button onClick={() => handleOpenSeatModal({ movieId: 'm1', movie: '', hall: s.hall, time: s.timings[0] })}>Book</button></li>))}</ul>
                </div>
              ) : m.text === "OPEN_SEAT_MODAL" ? <em>Opening seat selector...</em> : (typeof m.text === "string" && m.text.startsWith && m.text.startsWith("BOOKED:") ? <div><strong>Booking confirmed:</strong><pre style={{ fontSize: 11 }}>{m.text.replace("BOOKED:", "")}</pre></div> : m.text)}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} style={baseStyles.inputRow}>
        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder='Type: show me movies / show me timings for <movie> / book <movie>' style={baseStyles.input} />
        <button type="submit" style={baseStyles.sendBtn}>Send</button>
      </form>

      {/* Seat modal (dark) */}
      {showSeatModal && (
        <div className={`cb-modal-overlay ${seatModalActive ? "show" : ""}`} role="dialog" aria-modal="true">
          <div className={`cb-modal ${seatModalActive ? "enter" : ""}`}>
            <div className="cb-modal-close" style={{ position: "absolute", right: 12, top: 8, color: "#94a3b8", cursor: "pointer", fontWeight: 700, padding: 6, borderRadius: 6 }} onClick={closeSeatModal}>✕</div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>Select Your Seats</div>
              <div style={{ color: "#9aa8b8", fontSize: 13 }}>{selectedShow?.movie || selectedShow?.hall}</div>
            </div>

            <div style={{ width: "60%", maxWidth: 360, height: 36, background: "#fff", color: "#111", display: "flex", alignItems: "center", justifyContent: "center", letterSpacing: 6, borderRadius: 6, transform: "skewX(-14deg)", margin: "0 auto 14px" }}>
              SCREEN
            </div>

            <div style={{ color: "#9aa8b8", fontSize: 13, marginBottom: 8 }}>Choose seats — click to toggle</div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 10, marginBottom: 14 }}>
              {seats.map((s) => {
                const on = selectedSeats.includes(s);
                return (
                  <button key={s} onClick={() => toggleSeat(s)} className={`cb-seat-btn ${on ? "selected" : ""}`} aria-pressed={on} style={{ padding: "10px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)", background: on ? "linear-gradient(90deg,#10b981,#06b6d4)" : "rgba(255,255,255,0.03)", color: on ? "#fff" : "#e6eef8", fontWeight: 700, boxShadow: on ? "0 8px 20px rgba(16,185,129,0.18)" : "none", cursor: "pointer" }}>
                    {s}
                  </button>
                );
              })}
            </div>

            <div style={{ color: "#cbd5e1", marginTop: 6 }}>Selected: {selectedSeats.length ? selectedSeats.join(", ") : "none"}</div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end", marginTop: 14 }}>
              <input className="cb-input" placeholder="Your name (optional)" style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#fff" }} />
              <button className="cb-primary" onClick={(ev) => { ev.preventDefault(); confirmBooking(); }} disabled={selectedSeats.length === 0} style={{ padding: "10px 14px", borderRadius: 8, background: "linear-gradient(90deg,#10b981,#06b6d4)", border: "none", color: "#04272a", fontWeight: 800, cursor: "pointer" }}>Confirm Booking</button>
            </div>

            <div style={{ position: "absolute", left: 16, bottom: 14, color: "#9aa8b8", cursor: "pointer" }} onClick={closeSeatModal}>Close</div>
          </div>
        </div>
      )}

      {/* QR modal - improved and wider brand-styled card */}
      {showQRModal && payment && (
        <div className={`cb-modal-overlay ${qrModalActive ? "show" : ""}`} role="dialog" aria-modal="true" onClick={(e) => { e.stopPropagation(); }}>
          <div className="cb-qr-wrapper" aria-hidden={false}>
            <div className={`cb-qr-card ${qrModalActive ? "enter" : ""}`} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>Pay ₹{payment.amount}</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>Scan this QR to pay</div>
                </div>
                <div style={{ width: 80, textAlign: "right" }}>
                  <button className="cb-btn-ghost" onClick={() => { if (payPollRef.current) clearInterval(payPollRef.current); closeQRModal(); }} style={{ background: "transparent", border: "1px solid rgba(11,20,40,0.06)", padding: "6px 8px", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>

              <div style={{ margin: "12px 0" }}>
                <div className="cb-qr-banner">PAY</div>

                <div className="cb-qr-frame" style={{ background: "#fff", padding: 12, borderRadius: 8, display: "inline-block" }}>
                  <QRCode value={JSON.stringify({ paymentId: payment.id, payUrl: payment.payUrl })} />
                </div>
              </div>

              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 12 }}>For demo: press Simulate Pay to mark this payment as paid.</div>

              <div className="cb-qr-actions" style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 12 }}>
                <button className="cb-btn-sim" onClick={() => simulatePayNow(payment.id)} style={{ padding: "8px 12px", borderRadius: 8, background: "linear-gradient(90deg,#10b981,#06b6d4)", color: "#04272a", border: "none", cursor: "pointer", fontWeight: 800 }}>
                  Simulate Pay / Scan
                </button>
                <button className="cb-btn-ghost" onClick={() => { if (payPollRef.current) clearInterval(payPollRef.current); closeQRModal(); }} style={{ padding: "8px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(11,20,40,0.06)", cursor: "pointer" }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast (bottom-right) */}
      <div className={`cb-toast ${toast.show ? "show" : ""} ${toast.kind || "info"}`} role="status" aria-live="polite" style={{ display: toast.show ? "block" : "none" }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>{toast.kind === "success" ? "Success" : toast.kind === "warn" ? "Warning" : "Info"}</div>
        <div style={{ fontSize: 14 }}>{toast.message}</div>
      </div>
    </div>
  );
}
