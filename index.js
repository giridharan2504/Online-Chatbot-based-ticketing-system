// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
// If Node >= 18 you can remove node-fetch and use native fetch
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 4000;
app.use(cors());
app.use(bodyParser.json());

// ---- Sample movie data (replace with your DB) ----
const movies = [
  { id: 'm1', title: 'Neon Nights', genre: 'EDM', duration: '2h 10m' },
  { id: 'm2', title: 'Romance in Rain', genre: 'Romance', duration: '1h 55m' },
  { id: 'm3', title: 'Action Frontier', genre: 'Action', duration: '2h 5m' },
  { id: 'm4', title: 'Bollywood Beats', genre: 'Bollywood', duration: '2h' },
  { id: 'm5', title: 'Silent Thriller', genre: 'Thriller', duration: '1h 50m' },
  { id: 'm6', title: 'Mystery Manor', genre: 'Thriller', duration: '2h 5m' },
  { id: 'm7', title: 'The Great Escape', genre: 'Action', duration: '2h 8m' },
  { id: 'm8', title: 'Hearts & Harmony', genre: 'Romance', duration: '1h 45m' },
  { id: 'm9', title: 'City Lights', genre: 'Bollywood', duration: '2h 2m' },
  { id: 'm10', title: 'Festival Beats', genre: 'EDM', duration: '1h 55m' }
];

const shows = {
  m1: [{ hall: 'Dobaraa - Phoenix Mall', timings: ['6:00 PM','8:00 PM','10:30 PM'] }],
  m2: [{ hall: 'PVR Forum', timings: ['5:30 PM','8:15 PM'] }],
  m3: [{ hall: 'Cinepolis City', timings: ['7:00 PM','9:45 PM'] }],
  m4: [{ hall: 'Dobaraa - Phoenix Mall', timings: ['6:30 PM','9:00 PM'] }],
  m5: [{ hall: 'PVR Forum', timings: ['4:00 PM','7:30 PM'] }],
  m6: [{ hall: 'Cineplex Downtown', timings: ['5:00 PM','8:30 PM'] }],
  m7: [{ hall: 'Cinepolis City', timings: ['6:20 PM','9:10 PM'] }],
  m8: [{ hall: 'PVR Forum', timings: ['3:30 PM','6:45 PM'] }],
  m9: [{ hall: 'Dobaraa - Phoenix Mall', timings: ['7:30 PM','10:00 PM'] }],
  m10: [{ hall: 'Cineplex Downtown', timings: ['5:45 PM','9:15 PM'] }]
};

// in-memory stores
const bookings = [];   // { id, movieId, hall, time, seats, user, createdAt }
const payments = {};   // { paymentId: { id, amount, status, bookingId, payUrl, createdAt } }

// ---- Simple endpoints ----
app.get('/api/movies', (req,res) => {
  const genres = req.query.genres ? req.query.genres.split(',') : null;
  const result = genres ? movies.filter(m => genres.includes(m.genre)) : movies;
  res.json(result);
});

app.get('/api/shows/:movieId', (req,res) => {
  const movieId = req.params.movieId;
  res.json({ movieId, shows: shows[movieId] || [] });
});

app.post('/api/book', (req,res) => {
  const { movieId, hall, time, seats, user } = req.body;
  if (!movieId || !seats || seats.length === 0) return res.status(400).json({ error: 'missing fields' });
  const id = 'bk_' + Math.random().toString(36).slice(2,9);
  const booking = { id, movieId, hall, time, seats, user: user || { name: 'guest' }, createdAt: new Date().toISOString() };
  bookings.push(booking);
  res.json({ success: true, booking });
});

//
// PAYMENT (mock) endpoints
//

// create payment: returns payment object (mock)
app.post('/api/pay/create', (req,res) => {
  const { bookingId, amount } = req.body;
  if (!bookingId || !amount) return res.status(400).json({ error: 'missing fields' });
  const id = 'pay_' + Math.random().toString(36).slice(2,9);
  // payUrl would be a real provider URL in production; here it's just a placeholder
  const payUrl = `https://demo.pay/local/${id}`;
  payments[id] = { id, amount, status: 'pending', bookingId, payUrl, createdAt: new Date().toISOString() };
  res.json({ success: true, payment: payments[id] });
});

// poll payment status
app.get('/api/pay/status', (req,res) => {
  const { paymentId } = req.query;
  if (!paymentId || !payments[paymentId]) return res.json({ status: 'not_found' });
  return res.json({ status: payments[paymentId].status, payment: payments[paymentId] });
});

// simulate confirm payment (demo only) - in production this is a webhook
app.post('/api/pay/confirm', (req,res) => {
  const { paymentId } = req.body;
  if (!paymentId || !payments[paymentId]) return res.status(400).json({ error: 'not_found' });
  payments[paymentId].status = 'paid';
  // optionally: mark booking as paid (we just keep payments separate)
  return res.json({ success: true, payment: payments[paymentId] });
});

//
// Groq proxy: if GROQ_API_KEY present we forward, otherwise fallback to mock
//
app.post('/api/groq', async (req,res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ result: 'No prompt provided' });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
  const GROQ_MODEL = process.env.GROQ_MODEL || 'mixtral-8x7b-32768';

  // local mock behavior if no API key
  if (!GROQ_API_KEY) {
    const lower = prompt.toLowerCase();
    if (lower.includes('show me movies')) {
      return res.json({ result: JSON.stringify(movies.map(m => ({ id: m.id, title: m.title, genre: m.genre }))) });
    }
    if (lower.includes('show me timings for')) {
      const title = prompt.split('for').pop().trim();
      const m = movies.find(x => x.title.toLowerCase().includes(title.toLowerCase())) || movies[0];
      return res.json({ result: JSON.stringify({ title: m.title, shows: shows[m.id] || [] }) });
    }
    if (lower.includes('book')) {
      return res.json({ result: JSON.stringify({ status: 'OPEN_SEAT_MODAL' }) });
    }
    return res.json({ result: 'ACK' });
  }

  // forward to Groq / OpenAI-compatible endpoint
  try {
    const messages = [
      { role: "system", content: "You are a movie-booking assistant. Answer directly and only. Do NOT ask clarifying questions. Provide JSON for lists when asked." },
      { role: "user", content: prompt }
    ];
    const body = { model: GROQ_MODEL, messages, temperature: 0.0, max_tokens: 400 };

    const r = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error('Groq Error:', r.status, txt);
      return res.status(502).json({ error: 'Groq API error', status: r.status, body: txt });
    }

    const data = await r.json();
    const content = (data?.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || data?.result || data?.output || JSON.stringify(data);
    return res.json({ result: content });
  } catch (err) {
    console.error('Groq proxy error:', err);
    return res.status(500).json({ error: 'internal server error', details: String(err) });
  }
});

app.listen(port, () => console.log('Server running on', port));
