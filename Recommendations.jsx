// client/src/pages/Recommendations.jsx (or src/Recommendations.jsx)
import React, { useEffect, useState } from "react";

export default function Recommendations() {
  const [picks, setPicks] = useState([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("cinebuddy:selected");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          setPicks(arr);
        } else {
          setPicks([]);
        }
      } else {
        setPicks([]);
      }
    } catch (e) {
      console.error("Failed to parse saved picks", e);
      setPicks([]);
    }
  }, []);

  // Now you can generate component UI / recommendations based on `picks`.
  // Example display:
  return (
    <div>
      <h2>Recommended for you (based on your picks)</h2>
      {picks.length === 0 ? (
        <p>No recommendations yet. Pick movies on the selection page.</p>
      ) : (
        <div>
          {/* build recs based on picks */}
        </div>
      )}
    </div>
  );
}
