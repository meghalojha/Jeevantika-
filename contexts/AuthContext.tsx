import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, UserRole } from '@/types/database';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (phone: string) => Promise<void>;
  verifyOTP: (phone: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  createProfile: (role: UserRole, profileData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
      setLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setUser(data);
    }
  };

  const signIn = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });

    if (error) throw error;
  };

  const verifyOTP = async (phone: string, otp: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp,
      type: 'sms',
    });

    if (error) throw error;

    if (data.user) {
      await loadUserProfile(data.user.id);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const createProfile = async (role: UserRole, profileData: any) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('No authenticated user');

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (!existingUser) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          phone: authUser.phone || '',
          role: role,
        });

      if (userError) throw userError;
    }

    let tableName = '';
    if (role === 'patient') tableName = 'patient_profiles';
    else if (role === 'doctor') tableName = 'doctor_profiles';
    else if (role === 'pharmacy') tableName = 'pharmacy_profiles';

    const { error } = await supabase
      .from(tableName)
      .insert({
        user_id: authUser.id,
        ...profileData,
      });

    if (error) throw error;

    await loadUserProfile(authUser.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        verifyOTP,
        signOut,
        createProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
