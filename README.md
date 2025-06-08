# An AI Virtual Assistant

A powerful AI-powered virtual assistant designed to help users manage tasks, schedule events, and get intelligent assistance for their daily needs.

## Features

### 1. AI Chat Assistant
- Intelligent chatbot powered by OpenAI's GPT-3.5
- Natural language understanding for task and event management
- Contextual conversations for better assistance
- Command examples:
  - `Add task Buy groceries`
  - `Schedule on 2024-03-20 "Team Meeting"`

### 2. Task Management (Kanban Board)
- Drag-and-drop interface for task management
- Three columns: To Do, In Progress, and Done
- Create, move, and delete tasks
- Real-time updates
- Persistent storage with Supabase

### 3. Calendar
- Monthly view calendar
- Add and manage events
- Navigate between months
- Delete events with a single click
- Integration with chat commands

### 4. Authentication
- Secure email/password authentication
- Protected routes
- User-specific data storage
- Powered by Supabase Auth

## Technology Stack

- **Frontend:**
  - React 18
  - TypeScript
  - Tailwind CSS
  - Vite (Build tool)
  - Lucide React (Icons)

- **Backend & Database:**
  - Supabase (Backend as a Service)
  - PostgreSQL (Database)
  - Row Level Security (RLS)

- **AI Integration:**
  - OpenAI GPT-3.5

## Database Schema

### Tables

1. **tasks**
   - `id`: uuid (Primary Key)
   - `user_id`: uuid (Foreign Key to users)
   - `content`: text
   - `status`: text (todo, inProgress, done)
   - `created_at`: timestamp with time zone

2. **events**
   - `id`: uuid (Primary Key)
   - `user_id`: uuid (Foreign Key to users)
   - `title`: text
   - `date`: timestamp with time zone
   - `created_at`: timestamp with time zone

3. **chat_history**
   - `id`: uuid (Primary Key)
   - `user_id`: uuid (Foreign Key to users)
   - `message`: text
   - `is_user`: boolean
   - `created_at`: timestamp with time zone

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Key Components

### AuthContext
- Manages authentication state
- Provides sign-in, sign-up, and sign-out functionality
- Handles user sessions

### ChatBot
- Processes natural language input
- Maintains conversation history
- Handles task and event commands
- Integrates with OpenAI API

### KanbanBoard
- Manages task states
- Handles drag-and-drop functionality
- Real-time updates with Supabase

### Calendar
- Displays and manages events
- Handles date navigation
- Integrates with chat commands

## Security Features

- Row Level Security (RLS) policies ensure users can only access their own data
- Secure authentication with Supabase
- Environment variables for sensitive keys
- Type-safe database operations

## Best Practices

- TypeScript for type safety
- React hooks for state management
- Responsive design with Tailwind CSS
- Error handling and loading states
- Real-time database updates
- Optimistic UI updates
- Clean and maintainable code structure
