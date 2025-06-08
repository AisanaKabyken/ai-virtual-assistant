import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, User } from '@supabase/supabase-js';

// Create a Supabase client using environment variables
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

// Define the shape of your authentication context
interface AuthContextType {
  user: User | null; // The current logged-in user
  signIn: (email: string, password: string) => Promise<void>; // Sign-in method
  signUp: (email: string, password: string) => Promise<void>; // Sign-up method
  signOut: () => Promise<void>; // Sign-out method
}

// Create the context with an empty default value
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Custom hook to use the AuthContext in other components
export const useAuth = () => useContext(AuthContext);

// AuthProvider wraps around components that need authentication access
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); // Store current user

  useEffect(() => {
    // Check for an active session on page load and set the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null); // If no session, set user to null
    });

    // Listen to authentication state changes (login, logout, etc)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null); // Update user based on session
    });

    // Clean up the subscription listener on component unmount
    return () => subscription.unsubscribe();
  }, []);

  // Sign in using email and password
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  // Sign up using email and password
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  // Sign out the current user
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Provide the authentication state and actions to the component tree
  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};