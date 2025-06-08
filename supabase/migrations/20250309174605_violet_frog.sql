/*
  # Initial Schema Setup

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `content` (text)
      - `status` (text) - 'todo', 'inProgress', or 'done'
      - `created_at` (timestamp)
    
    - `events`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text)
      - `date` (timestamp)
      - `created_at` (timestamp)
    
    - `chat_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `message` (text)
      - `is_user` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique task id
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- Link to user
  content text NOT NULL, -- Task description
  status text NOT NULL CHECK (status IN ('todo', 'inProgress', 'done')), -- Task status
  created_at timestamptz DEFAULT now() -- Timestamp of task creation
);

-- Enable Row-level security to restrict access per user
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to perform any operation on their own tasks
CREATE POLICY "Users can manage their own tasks"
  ON tasks
  FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
  TO authenticated -- Applies to logged-in users 
  USING (auth.uid() = user_id) -- Only access rows where user_id matches
  WITH CHECK (auth.uid() = user_id); -- Only allow changes to rows owned by user

-- Events table
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique event id
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- Link to user
  title text NOT NULL, -- Title of the event
  date timestamptz NOT NULL, -- Date and time of event 
  created_at timestamptz DEFAULT now() -- Timestamp of creation
);

-- Enable RLS for secure data access
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own events
CREATE POLICY "Users can manage their own events"
  ON events
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Chat history table
CREATE TABLE chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique message id
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- Link to user
  message text NOT NULL, -- Message content 
  is_user boolean NOT NULL, -- True of user sent it, false if AI
  created_at timestamptz DEFAULT now() -- Timestamp of the message
);

-- Enable RLS to keep chat history private per user
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own chat history
CREATE POLICY "Users can manage their own chat history"
  ON chat_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);