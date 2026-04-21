(function initSupabaseConfig() {
  const SUPABASE_URL = "https://cllbdzcrgsoftiywujeu.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbGJkemNyZ3NvZnRpeXd1amV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MjY3NjksImV4cCI6MjA5MjMwMjc2OX0.ivRbY44Gsk4KlvYKcrmNA6bgj9ZS8iE5-Tp_KU_Jea8";

  if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase SDK/config nao carregou.");
    return;
  }

  window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
})();
