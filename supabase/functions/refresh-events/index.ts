// Deno port of server/app.js's /refresh-events + public/js/utils/scrape-venues.js's
// scrapeVenues() — the two were near-duplicates in Node; this merges them into
// one function with an incremental (default) / full-rebuild (?mode=full) switch.
//
// Uses the Supabase JS client with the service-role key instead of raw SQL
// string interpolation, which also removes the SQL-injection risk the old
// Node version had in its hand-built INSERT statements.

import { supabase } from '../_shared/db.ts';
import { resolveScraper } from '../_shared/resolve-scraper.ts';

type Venue = {
	slug: string;
	name: string;
	url: string | null;
	provider?: string;
	provider_config?: any;
};

type ScrapedEvent = {
	date: string | Date | null;
	title: string | null;
	image_url: string | null;
	time: string | null;
	cost: string | null;
	description: string | null;
	link: string | null;
};

async function dedupeEvents() {
	const { data, error } = await supabase.from('events').select('id, title, date').order('id', { ascending: true });
	if (error) throw error;

	const seen = new Set<string>();
	const dupIds: number[] = [];
	for (const row of data ?? []) {
		const key = `${row.title}|${row.date}`;
		if (seen.has(key)) dupIds.push(row.id);
		else seen.add(key);
	}

	if (dupIds.length) {
		const { error: delErr } = await supabase.from('events').delete().in('id', dupIds);
		if (delErr) throw delErr;
	}
}

Deno.serve(async (req) => {
	try {
		const url = new URL(req.url);
		const mode = url.searchParams.get('mode') === 'full' ? 'full' : 'incremental';
		const slugFilter = url.searchParams.get('slug');

		// Single-venue dry run for debugging: fetches and returns raw events
		// for one venue with no DB writes at all, active or not.
		if (slugFilter) {
			const { data: venue, error: venueErr } = await supabase
				.from('venues')
				.select('*')
				.eq('slug', slugFilter)
				.single();
			if (venueErr || !venue) {
				return new Response(JSON.stringify({ error: `Unknown venue: ${slugFilter}` }), {
					status: 404,
					headers: { 'Content-Type': 'application/json' },
				});
			}

			const scraper = resolveScraper(venue as Venue);
			if (!scraper) {
				return new Response(JSON.stringify({ error: 'No URL set' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				});
			}

			const events = await scraper.fetchEvents();
			return new Response(JSON.stringify({ slug: slugFilter, events }), {
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const { data: venues, error: venuesErr } = await supabase
			.from('venues')
			.select('*')
			.eq('active', 'TRUE');
		if (venuesErr) throw venuesErr;

		let existingLinks = new Set<string>();
		if (mode === 'full') {
			const { error: delErr } = await supabase.from('events').delete().gte('id', 0);
			if (delErr) throw delErr;
		} else {
			const { data: existing, error: existingErr } = await supabase
				.from('events')
				.select('link')
				.gt('date', new Date().toISOString());
			if (existingErr) throw existingErr;
			existingLinks = new Set((existing ?? []).map(e => e.link));
		}

		const today = new Date();

		// Venues are independent (bar the RA cache, which memoizes its own
		// in-flight fetch — see ra-client.ts), so run them concurrently rather
		// than one at a time: sequential, this routinely blew past the edge
		// runtime's 150s idle timeout once every venue had a real provider or
		// LLM call to make.
		const results = await Promise.all(((venues ?? []) as Venue[]).map(async venue => {
			const { slug, name } = venue;
			const result = { name, eventsInserted: 0, error: null as string | null };
			const scraper = resolveScraper(venue);

			if (!scraper) {
				result.error = 'No URL set';
				return result;
			}

			try {
				const events: ScrapedEvent[] = await scraper.fetchEvents();

				const rows = (events || [])
					.filter(e => e.date && e.link && new Date(e.date) > today)
					.filter(e => mode === 'full' || !existingLinks.has(e.link!))
					.map(e => ({
						date: new Date(e.date!).toISOString(),
						title: e.title || '',
						image_url: e.image_url || '',
						time: e.time || '',
						cost: e.cost || null,
						description: e.description || '',
						link: e.link!,
						venue: slug,
					}));

				if (rows.length) {
					const { error: insertErr } = await supabase.from('events').insert(rows);
					if (insertErr) throw insertErr;
				}
				result.eventsInserted = rows.length;
			} catch (err) {
				console.log(`Error refreshing ${slug}:`, err.message);
				result.error = err.message;
			}

			return result;
		}));

		await dedupeEvents();

		return new Response(JSON.stringify({ mode, results }), {
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		return new Response(JSON.stringify({ error: err.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
});
