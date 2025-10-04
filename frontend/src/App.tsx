import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Context
import { AuthProvider, useAuth } from './hooks/useAuth';

// Debug utilities (development only)
import './utils/debug';

// Components
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TrackingCodes from './pages/TrackingCodes';
import LineAccounts from './pages/LineAccounts';
import Analytics from './pages/Analytics';
import AIInsights from './pages/AIInsights';
import TestAPI from './pages/TestAPI';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading L-TRACK®...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
        } />

        <Route path="/" element={
          isAuthenticated ? <Layout /> : <Navigate to="/login" />
        }>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tracking" element={<TrackingCodes />} />
          <Route path="line-accounts" element={<LineAccounts />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="ai-insights" element={<AIInsights />} />
          <Route path="test-api" element={<TestAPI />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;