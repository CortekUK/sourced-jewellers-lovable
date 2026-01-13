import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type UserRole = 'owner' | 'manager' | 'staff';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, role?: UserRole) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  createDemoAccounts: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('staff'); // Default to staff
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Function to fetch user role from database
  const fetchUserRole = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return 'staff'; // Default fallback
      }

      return profile?.role || 'staff';
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'staff';
    }
  };

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    
    // Set up auth state listener - MUST be synchronous only
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthContext: Auth state changed', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Clear role immediately if no session
        if (!session?.user) {
          setUserRole('staff');
          setLoading(false);
        }
      }
    );

    // Get initial session with timeout protection
    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Getting initial session');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext: Error getting session:', error);
          setLoading(false);
          return;
        }
        
        console.log('AuthContext: Initial session', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            console.log('AuthContext: Fetching initial user role');
            const role = await fetchUserRole(session.user.id);
            setUserRole(role as UserRole);
            console.log('AuthContext: Initial user role set to', role);
          } catch (error) {
            console.error('AuthContext: Error fetching initial user role:', error);
            setUserRole('staff'); // Fallback to staff role
          }
        }
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    // Add timeout protection
    const timeoutId = setTimeout(() => {
      console.warn('AuthContext: Timeout reached, setting loading to false');
      setLoading(false);
    }, 5000);

    initializeAuth().then(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Separate effect to fetch user role when user changes
  useEffect(() => {
    if (user?.id) {
      console.log('AuthContext: Fetching user role for', user.id);
      fetchUserRole(user.id).then(role => {
        setUserRole(role as UserRole);
        console.log('AuthContext: User role set to', role);
        setLoading(false);
      }).catch(error => {
        console.error('AuthContext: Error fetching user role:', error);
        setUserRole('staff');
        setLoading(false);
      });
    }
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    }

    return { error };
  };

  const signUp = async (email: string, password: string, role: UserRole = 'staff') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          role: role,
        }
      }
    });

    if (error) {
      toast({
        title: "Sign Up Failed", 
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      // Clear local state first
      setUser(null);
      setSession(null);
      setUserRole('staff');
      
      // Then attempt server-side logout
      const { error } = await supabase.auth.signOut();
      
      // Only show error if it's not a "session not found" error
      if (error && error.message !== 'Session not found') {
        console.error('Sign out error:', error);
        toast({
          title: "Error",
          description: "Failed to sign out completely. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed out",
          description: "You have been successfully signed out.",
        });
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const createDemoAccounts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-demo-accounts');

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create demo accounts. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Demo Accounts Created!",
        description: "You can now sign in with the demo credentials.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create demo accounts. Please try again.",
        variant: "destructive",
      });
    }
  };

  const refreshUserRole = async () => {
    if (user?.id) {
      try {
        const role = await fetchUserRole(user.id);
        setUserRole(role as UserRole);
      } catch (error) {
        console.error('Error refreshing user role:', error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        loading,
        signIn,
        signUp,
        signOut,
        createDemoAccounts,
        refreshUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};