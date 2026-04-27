import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CitizenDashboard from './pages/CitizenDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import IssueDetails from './pages/IssueDetails';
import ReportIssue from './pages/ReportIssue';
import CitizenLogin from './pages/CitizenLogin';
import CitizenSignup from './pages/CitizenSignup';
import OfficerLogin from './pages/OfficerLogin';

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/citizen-login" element={<CitizenLogin />} />
          <Route path="/citizen-signup" element={<CitizenSignup />} />
          <Route path="/officer-login" element={<OfficerLogin />} />
          <Route path="/citizen" element={<CitizenDashboard />} />
          <Route path="/officer" element={<OfficerDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/issue/:id" element={<IssueDetails />} />
          <Route path="/report" element={<ReportIssue />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
