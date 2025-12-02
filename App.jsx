import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Select from "./pages/Select";
import Main from "./pages/Main";
import "./styles/main.css";

export default function App() {
  return (
    <Router>
      {/* Clean layout — NO VIDEO BACKGROUND */}
      <div className="app-root" style={{ minHeight: "100vh", background: "#f5f6fa" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/select" element={<Select />} />
          <Route path="/main" element={<Main />} />
        </Routes>
      </div>
    </Router>
  );
}
