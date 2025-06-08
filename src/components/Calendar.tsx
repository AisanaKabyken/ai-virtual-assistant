import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../context/AuthContext';

// Initialise Supabase client using environment variables
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

// Define structure of an event object
interface Event {
  id: string;
  title: string;
  date: Date;
}

const Calendar = () => {
  const { user } = useAuth(); // Get the authenticated user
  const [currentDate, setCurrentDate] = useState(new Date()); // Store the currently displayed month
  const [events, setEvents] = useState<Event[]>([]); // Store events for the selected month
  const [showAddEvent, setShowAddEvent] = useState(false); // Toggle event creation modal
  const [newEvent, setNewEvent] = useState({ title: '', date: new Date() }); // Store new event details
  const [isLoading, setIsLoading] = useState(true); // Loading state while fetching events

  // Fetch events when user logs in or when the displayed month changes
  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, currentDate]);

  // Function to fetch events from Supabase for the selected month
  const fetchEvents = async () => {
    setIsLoading(true);
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user?.id) // Filter by user ID
      .gte('date', monthStart.toISOString()) // Get events from start of the month
      .lte('date', monthEnd.toISOString()) // Get events up to the end of the month
      .order('date', { ascending: true }); // Sort events by date

    if (error) {
      console.error('Error fetching events:', error);
      return;
    }

    if (data) {
      // Convert event dates to JavaScript Date object
      setEvents(data.map(event => ({
        id: event.id,
        title: event.title,
        date: new Date(event.date)
      })));
    }
    setIsLoading(false);
  };

  // Generate an array of days for the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Function to add a new event to Supabase
  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !user) return;

    const { error } = await supabase
      .from('events')
      .insert([{
        title: newEvent.title,
        date: newEvent.date.toISOString(), // Convert date to a string format for database
        user_id: user.id
      }]);

    if (error) {
      console.error('Error adding event:', error);
      return;
    }

    await fetchEvents(); // Refresh event list after insertion
    setNewEvent({ title: '', date: new Date() }); // Reset input fields
    setShowAddEvent(false); // Hide event modal
  };

  // Function to delete an event from Supabase
  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user?.id);

    if (error) {
      console.error('Error deleting event:', error);
      return;
    }

    await fetchEvents(); // Refresh event list after deletion
  };

  // Navigate to previous or next month
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(current => 
      direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1)
    );
  };

  // Display loading spinner while fetching events
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header - Month selector & Add Event button */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-gray-100 rounded-full">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-2xl font-semibold text-gray-800">{format(currentDate, 'MMMM yyyy')}</h2>
            <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-gray-100 rounded-full">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <button onClick={() => setShowAddEvent(true)} 
          className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
            <Plus className="h-5 w-5 mr-2" />
            Add Event
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Weekday labels */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-medium text-gray-500 py-2">{day}</div>
          ))}
          {/* Render all days in current month */}
          {days.map(day => {
            const dayEvents = events.filter(event => isSameDay(event.date, day));
            return (
              <div key={day.toString()} className={`min-h-[100px] p-2 border rounded ${ isSameMonth(day, currentDate) ? 'bg-white' : 'bg-gray-50 text-gray-400'}`}>
                <div className="text-right text-sm">{format(day, 'd')}</div>
                <div className="mt-2">
                  {/* Render each event for the day */}
                  {dayEvents.map(event => (
                    <div key={event.id} className="text-sm bg-indigo-100 text-indigo-700 p-1 rounded mb-1 group flex justify-between items-center">
                      <span className="truncate flex-1">{event.title}</span>
                      <button onClick={() => handleDeleteEvent(event.id)} className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 transition-opacity ml-2">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Event Modal */}
        {showAddEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-medium mb-4">Add New Event</h3>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Event title"
                className="w-full px-3 py-2 border rounded-md mb-4"
              />
              <input
                type="date"
                value={format(newEvent.date, 'yyyy-MM-dd')}
                onChange={(e) => setNewEvent({ ...newEvent, date: new Date(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md mb-4"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowAddEvent(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEvent}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add Event
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;