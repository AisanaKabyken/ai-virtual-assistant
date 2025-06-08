import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { useAuth } from '../context/AuthContext';
import { parse, isValid } from 'date-fns';

// Initialise Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

// Only initialize OpenAI if API key is available
const openai = import.meta.env.VITE_OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    })
  : null;

// Define the structure of a chat message 
interface Message {
  id?: string;
  text: string;
  isUser: boolean;
  role?: 'system' | 'user' | 'assistant';
}

// System message to define the AI's role and behaviour
const systemMessage: Message = {
  text: `You are a helpful, friendly and polite AI virtual assistant. Your role is to:
1. Help users with their questions in any sphere, give broader answers if needed. Do not straightly give users references to another websites. Firstly try to answer by yourself, then if needed give other links.
2. Manage user's to do lists
3. Schedule appointments or events
4. Provide website-specific information if needed
5. Personalize interactions based on user preferences
6. Motivate and encourage productivity
7. Give them plan if they are doing some work
8. If they need powerpoint presentation, write them VBA code according to their preferences
9. Pretty print responses, they should be visually appealing and easy to read, with line breaks and indentation
10. Avoid giving harmful, biased, or offensive responses.
11. If a user asks something inappropriate or out of scope, respond respectfully and redirect to a supported feature.
12. If user have any issues with the website(forgot password, email, etc), they can write this email a question: kabyken04@gmail.com
13. You are not only about productivity, you give answers to any type of questions (it can be about food, movies, books, music, world, completely everything!!!!)

Remember to:
- Your name is ASTRA AI
- You were created by talented girl named Ais
- Keep responses clear
- Pretty print responses, they should be visually appealing and easy to read, with line breaks and indentation
- Use examples when helpful
- Be encouraging and supportive
- Inform users about the available commands for task and event management

Available commands:
- "Add task [description]" - Adds a new task to the todo list
- 'Schedule on YYYY-MM-DD "Event Title"' - Schedules a new event`,
  isUser: false,
  role: 'system'
};

const ChatBot = () => {
  // Get the authericated user
  const { user } = useAuth();

  // State to manage chat messages
  const [messages, setMessages] = useState<Message[]>([
    { 
      text: openai 
        ? "Hi! I'm your AI virtual assistant. I can help you with answering questions, task management and schedulling events. How can I assist you today?"
        : "Hi! I'm your command assistant. I can help you manage tasks and schedule events. Try commands like:\n- Add task Study for exam\n- Schedule on 2025-03-20 \"Team Meeting\"",
      isUser: false,
      role: 'assistant'
    }
  ]);

  // State to manage user input
  const [input, setInput] = useState('');

  // Fetch chat history when user logs in
  useEffect(() => {
    if (user) {
      fetchChatHistory();
    }
  }, [user]);

  // Fetch previous chat history from Supabase
  const fetchChatHistory = async () => {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat history:', error);
      return;
    }

    if (data) {
      // Format and set messages from Supabase
      setMessages(data.map(msg => ({
        id: msg.id,
        text: msg.message,
        isUser: msg.is_user,
        role: msg.is_user ? 'user' : 'assistant'
      })));
    }
  };

  // Handle predefined commands (task creation and event schedulling)
  const handleCommand = async (command: string) => {
    if (!user) return "Please sign in to use commands.";

    // Command: Add task
    if (command.toLowerCase().startsWith('add task ')) {
      const taskContent = command.slice(9);
      const { error } = await supabase
        .from('tasks')
        .insert([{ 
          content: taskContent, 
          status: 'todo',
          user_id: user.id
        }]);

      if (error) {
        return `Failed to add task: ${error.message}`;
      }
      return `Task "${taskContent}" has been added to your to-do list.`;
    }

    // Command: Schedule an event
    if (command.toLowerCase().startsWith('schedule on ')) {
      const parts = command.slice(12).split('"');
      if (parts.length >= 3) {
        const dateStr = parts[0].trim();
        const title = parts[1];
        
        const date = parse(dateStr, 'yyyy-MM-dd', new Date());
        
        if (!isValid(date)) {
          return 'Invalid date format. Please use YYYY-MM-DD format.';
        }

        date.setHours(12, 0, 0, 0);

        const { error } = await supabase
          .from('events')
          .insert([{ 
            title, 
            date: date.toISOString(),
            user_id: user.id
          }]);

        if (error) {
          return `Failed to schedule event: ${error.message}`;
        }
        return `Event "${title}" has been scheduled for ${date.toLocaleDateString()}.`;
      }
      return 'Invalid command format. Please use: schedule on YYYY-MM-DD "Event Title"';
    }

    // If OpenAI is not enabled, return a limited response
    if (!openai) {
      return "I can only understand specific commands. Try:\n- Add task <task description>\n- Schedule on YYYY-MM-DD \"Event Title\"";
    }

    return null;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { text: input, isUser: true, role: 'user' as const };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Save user message to database
    await supabase
      .from('chat_history')
      .insert([{
        message: input, 
        is_user: true, 
        user_id: user?.id
      }]);

    // Check for predefined commands
    const commandResponse = await handleCommand(input);
    if (commandResponse) {
      const assistantMessage = { text: commandResponse, isUser: false, role: 'assistant' as const };
      setMessages(prev => [...prev, assistantMessage]);
      await supabase
        .from('chat_history')
        .insert([{ 
          message: commandResponse, 
          is_user: false,
          user_id: user?.id
        }]);
      return;
    }

    // Use OpenAI for general conversation
    if (openai) {
      try {
        const conversationHistory = [
          systemMessage,
          ...messages.slice(-5),
          userMessage
        ].map(msg => ({
          role: msg.role || (msg.isUser ? 'user' : 'assistant'),
          content: msg.text
        }));

        const completion = await openai.chat.completions.create({
          messages: conversationHistory,
          model: "gpt-3.5-turbo",
          temperature: 0.7,
          max_tokens: 500,
        });

        const response = completion.choices[0]?.message?.content || "I couldn't process that request.";
        const assistantMessage = { text: response, isUser: false, role: 'assistant' as const };
        setMessages(prev => [...prev, assistantMessage]);

        await supabase
          .from('chat_history')
          .insert([{ 
            message: response, 
            is_user: false,
            user_id: user?.id
          }]);
      } catch (error) {
        console.error('Error calling OpenAI:', error);
        const errorMessage = { 
          text: "Sorry, I'm having trouble connecting to my brain right now.", 
          isUser: false,
          role: 'assistant' as const
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Chat Assistant</h2>
          <p className="text-sm text-gray-600 mt-1">
            Try commands like "Add task Study for exam" or 'Schedule on 2025-01-28 "Ais Bday"'
            {!openai && " (Note: AI chat is currently disabled)"}
          </p>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 whitespace-pre-wrap ${
                  message.isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700">
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;