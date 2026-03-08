// Supabase client placeholder
// The user will configure the actual Supabase connection.
// This file provides the structure and exports for the rest of the app.

// import { createClient } from '@supabase/supabase-js';
// import * as SecureStore from 'expo-secure-store';

// Supabase URL and anon key — to be configured
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// When ready, uncomment and configure:
//
// const ExpoSecureStoreAdapter = {
//   getItem: (key: string) => SecureStore.getItemAsync(key),
//   setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
//   removeItem: (key: string) => SecureStore.deleteItemAsync(key),
// };
//
// export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
//   auth: {
//     storage: ExpoSecureStoreAdapter,
//     autoRefreshToken: true,
//     persistSession: true,
//     detectSessionInUrl: false,
//   },
// });

// Placeholder export so stores can import without errors
export const supabase = null;

export { SUPABASE_URL, SUPABASE_ANON_KEY };
