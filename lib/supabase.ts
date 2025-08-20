import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hbnakwxkgljqtjwdylce.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibmFrd3hrZ2xqcXRqd2R5bGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzM5MTEsImV4cCI6MjA2OTQ0OTkxMX0.BnIbaUOR_JHrwbYaxA29V5rjFz0mnTczOYgpTdks3HQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
