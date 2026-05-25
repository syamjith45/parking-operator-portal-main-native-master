import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'auth_token';

const httpLink = createHttpLink({
  uri: process.env.EXPO_PUBLIC_GRAPHQL_URI || 'https://api.keraai.in/graphql',
});

let authTokenGetter = null;

export const setAuthTokenGetter = (getter) => {
  authTokenGetter = getter;
};

const authLink = setContext(async (_, { headers }) => {
  const { data: { session } } = await supabase.auth.getSession();
  let token = session?.access_token;

  if (!token && authTokenGetter) {
    token = authTokenGetter();
  }

  if (!token) {
    token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  }

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          activeVehicles: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
});
