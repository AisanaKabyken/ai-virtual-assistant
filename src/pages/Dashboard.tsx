import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatBot from '../components/ChatBot';
import KanbanBoard from '../components/KanbanBoard';
import Calendar from '../components/Calendar';
import { Bot, Calendar as CalendarIcon, ListTodo, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { signOut } = useAuth(); // Access sign out function from auth context
  const navigate = useNavigate(); // React Router's navigation hook

  // Function to handle sign out and redirect to login page
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 flex items-center">
          {/* Logo and Title */}
          <img src="/logo1.png" alt="ASTRA AI Logo" className="h-10 w-10" />
          <h1 className="text-xl font-semibold text-gray-800 ml-3">AI Assistant</h1>
        </div>

        {/* Navigation Links */}
        <nav className="mt-4">
          {/* Link to Chat Assistant */}
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 ${
                isActive ? 'bg-indigo-50 text-indigo-600' : ''
              }`
            }
          >
            <Bot className="h-5 w-5 mr-3" />
            Chat Assistant
          </NavLink>

          {/* Link to Tasks (Kanban Board) */}
          <NavLink
            to="/dashboard/tasks"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 ${
                isActive ? 'bg-indigo-50 text-indigo-600' : ''
              }`
            }
          >
            <ListTodo className="h-5 w-5 mr-3" />
            Tasks
          </NavLink>

          {/* Link to Calendar */}
          <NavLink
            to="/dashboard/calendar"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 ${
                isActive ? 'bg-indigo-50 text-indigo-600' : ''
              }`
            }
          >
            <CalendarIcon className="h-5 w-5 mr-3" />
            Calendar
          </NavLink>
        </nav>

        {/* Sign out button at the bottom */}
        <div className="absolute bottom-0 w-64 p-4">
          <button
            onClick={handleSignOut}
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 w-full rounded"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area*/}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Routes>
            <Route path="/" element={<ChatBot />} />
            <Route path="/tasks" element={<KanbanBoard />} />
            <Route path="/calendar" element={<Calendar />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;