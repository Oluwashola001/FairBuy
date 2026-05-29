import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rllvgjmyjlcebbcvywql.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsbHZnam15amxjZWJiY3Z5d3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMjYwNjIsImV4cCI6MjA4NzYwMjA2Mn0.BIsVX2Nth4FJ9Z-fhyNKwgJ9K8nFwnZfhbItHOTs7as';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
