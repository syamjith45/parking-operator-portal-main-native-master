import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'auth_token';

const GET_MY_PROFILE = gql`
  query MyProfile {
    myProfile {
      id
      name
      role
      phone
      email
      space_id
      organization_id
      space {
        id
        name
        capacity
      }
      organization {
        id
        name
        pricing_type_id
        pricing_type {
          id
          code
          label
        }
        staff {
          id
          name
          role
          email
          phone
          space_id
          space {
            id
            name
            location
            capacity
          }
          is_active
          created_at
        }
      }
    }
  }
`;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [staffProfile, setStaffProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const client = useApolloClient();

  const fetchProfile = (apolloClient) => {
    return apolloClient
      .query({ query: GET_MY_PROFILE, fetchPolicy: 'network-only' })
      .then(({ data }) => {
        setStaffProfile(data?.myProfile || null);
      })
      .catch((err) => {
        console.warn('Failed to fetch staff profile:', err);
        setStaffProfile(null);
        if (err.networkError?.statusCode === 401) {
          setToken(null);
          AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        }
      });
  };

  useEffect(() => {
    const init = async () => {
      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (storedToken) setToken(storedToken);

      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session) fetchProfile(client);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_OUT') {
          client.clearStore();
          setToken(null);
          await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
          setStaffProfile(null);
        }

        if (session?.access_token && (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN')) {
          setToken(session.access_token);
          await AsyncStorage.setItem(AUTH_TOKEN_KEY, session.access_token);
          if (event === 'SIGNED_IN') fetchProfile(client);
        }
      }
    );

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!session) return;
    const refreshInterval = setInterval(() => {
      fetchProfile(client);
    }, 30 * 60 * 1000);
    return () => clearInterval(refreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (data?.session?.access_token) {
      const accessToken = data.session.access_token;
      
      try {
        // Fetch profile to verify role before fully committing to the session
        const { data: profileData } = await client.query({
          query: GET_MY_PROFILE,
          fetchPolicy: 'network-only',
          context: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        });

        const role = profileData?.myProfile?.role?.toLowerCase();
        const allowedRoles = ['operator', 'manager'];

        if (!role || !allowedRoles.includes(role)) {
          await supabase.auth.signOut();
          throw new Error('Access denied. This app is for Managers and Operators only.');
        }

        // Role is valid, proceed
        setToken(accessToken);
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, accessToken);
        setStaffProfile(profileData.myProfile);
      } catch (profileErr) {
        await supabase.auth.signOut();
        throw profileErr;
      }
    }
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    client.clearStore();
    setToken(null);
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        login,
        logout,
        isAuthenticated: !!session,
        loading,
        staffProfile,
        role: staffProfile?.role ?? null,
        space: staffProfile?.space ?? null,
        organization: staffProfile?.organization ?? null,
        organizationStaff: staffProfile?.organization?.staff ?? [],
        pricingType: staffProfile?.organization?.pricing_type ?? null,
        token,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const useOrganizationStaff = () => {
  const { organizationStaff = [] } = useAuth();
  return {
    allStaff: organizationStaff,
    operators: organizationStaff.filter((s) => s.role === 'operator'),
    managers: organizationStaff.filter((s) => s.role === 'manager'),
    staffById: organizationStaff.reduce((acc, staff) => {
      acc[staff.id] = staff;
      return acc;
    }, {}),
  };
};
