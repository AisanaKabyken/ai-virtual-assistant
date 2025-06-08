import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from './context/AuthContext';
import { Bot, Calendar, ListTodo } from 'lucide-react';

// Initialize Supabase client using environment variable from .env
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

// Exported features array used to display features on LandingPage
export const features = [
  {
    title: "AI Chat Assistant", // Feature title 
    description: "Get instant answers to your questions with our AI virtual assistant", // Feature description
    icon: Bot // Feature Icon
  },
  {
    title: "Task Management",
    description: "Organize your tasks with a simple Kanban board",
    icon: ListTodo
  },
  {
    title: "Schedule Appointments",
    description: "Keep track of your appointments with an easy-to-use calendar",
    icon: Calendar
  }
];

// Main app component
function App() {
  return (
    // React Router for client-side navigation
    <Router>
      {/* Wrap everything with AuthProvider so any component can access auth state */}
      <AuthProvider>
        <Routes>
          {/* Home route - landing page with login and signup */}
          <Route path="/" element={<LandingPage />} />
          {/* Dashboard route - accessible after login */}
          <Route path="/dashboard/*" element={<Dashboard />} />
          {/* Redirect any unknown routes back to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;