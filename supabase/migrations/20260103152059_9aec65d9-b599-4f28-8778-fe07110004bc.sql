-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Agendar job para rodar todos os dias às 8h (horário de Brasília = 11h UTC)
SELECT cron.schedule(
  'check-expiring-subscriptions-daily',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zghqhmecbzuaesaspqgr.supabase.co/functions/v1/check-expiring-subscriptions',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnaHFobWVjYnp1YWVzYXNwcWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDU5NzEsImV4cCI6MjA3NDkyMTk3MX0.iUuhtZy55CuNSNpF_wk4qXWmpa_cKAdgTS0zYKcLFpc"}'::jsonb,
    body := '{"time": "scheduled"}'::jsonb
  ) AS request_id;
  $$
);