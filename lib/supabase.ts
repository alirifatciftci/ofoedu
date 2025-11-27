import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://awpcbdluifoqarmwihjs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3cGNiZGx1aWZvcWFybXdpaGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNDY5NzgsImV4cCI6MjA3OTgyMjk3OH0.aKf9hLA9KlhFSI9tfbllF8qackULHMpFiqjEj1dz-kk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});
