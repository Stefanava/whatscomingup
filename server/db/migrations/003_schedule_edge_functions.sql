-- Requires pg_cron, pg_net, and supabase_vault extensions (already enabled).
-- The service-role key used to authenticate these calls lives in Vault under
-- the name 'edge_functions_service_role_key' — it is NOT stored in this file.

select cron.schedule(
	'refresh-events-daily',
	'0 4 * * *', -- 04:00 UTC daily
	$$
	select net.http_post(
		url := 'https://nayalvzcejiamkrmwgbd.supabase.co/functions/v1/refresh-events',
		headers := jsonb_build_object(
			'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'edge_functions_service_role_key'),
			'Content-Type', 'application/json'
		),
		timeout_milliseconds := 120000
	);
	$$
);

-- Runs every 15 minutes to drain the initial details backlog quickly.
-- Once `remaining` in its response settles near 0, drop this cadence down
-- (see the "unschedule / reschedule" note below) to something like daily —
-- an event that's already been enriched is skipped, so this is safe to
-- leave running, just wasteful once the backlog is gone.
select cron.schedule(
	'update-event-details-15min',
	'*/15 * * * *',
	$$
	select net.http_post(
		url := 'https://nayalvzcejiamkrmwgbd.supabase.co/functions/v1/update-event-details',
		headers := jsonb_build_object(
			'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'edge_functions_service_role_key'),
			'Content-Type', 'application/json'
		),
		timeout_milliseconds := 90000
	);
	$$
);

-- To change cadence later, e.g. dropping update-event-details to daily once
-- the backlog clears:
--   select cron.unschedule('update-event-details-15min');
--   select cron.schedule('update-event-details-daily', '30 4 * * *', $$ ...same body... $$);
