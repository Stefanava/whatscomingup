// Deno port of public/js/utils/update-event-details.js.
//
// Two changes from the Node version, both driven by hitting the edge
// runtime's 150s idle timeout on a full backlog run:
//
// 1. Only AI-driven venues (provider = 'ai', or no provider at all) ever
//    have real work to do here — every other provider's getEventDetails()
//    is a no-op because its listing data is already complete — so this
//    skips them at the query level instead of fetching+discarding.
// 2. Only events actually missing details are processed, in a bounded batch
//    (?limit=, default 50, capped at 200) rather than every event every
//    time. Safe to call repeatedly (e.g. on a schedule) until `remaining`
//    hits 0, rather than needing one call to do the whole backlog.

import { supabase } from '../_shared/db.ts';
import { resolveScraper } from '../_shared/resolve-scraper.ts';

Deno.serve(async (req) => {
	try {
		const url = new URL(req.url);
		const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);

		const { data: venues, error: venuesErr } = await supabase.from('venues').select('*');
		if (venuesErr) throw venuesErr;
		const venueBySlug = Object.fromEntries((venues ?? []).map(v => [v.slug, v]));
		const aiSlugs = (venues ?? []).filter(v => !v.provider || v.provider === 'ai').map(v => v.slug);

		if (!aiSlugs.length) {
			return new Response(JSON.stringify({ updated: 0, remaining: 0 }), {
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const needsDetails = (q: any) => q
			.in('venue', aiSlugs)
			.not('link', 'is', null)
			.neq('link', '')
			.or('description.is.null,description.eq.');

		const { data: events, error: eventsErr } = await needsDetails(
			supabase.from('events').select('link, venue')
		).limit(limit);
		if (eventsErr) throw eventsErr;

		const { count: totalRemaining, error: countErr } = await needsDetails(
			supabase.from('events').select('link', { count: 'exact', head: true })
		);
		if (countErr) throw countErr;

		let updated = 0;
		await Promise.all((events ?? []).map(async event => {
			try {
				const venue = venueBySlug[event.venue];
				const scraper = venue ? resolveScraper(venue) : null;
				if (!scraper) return;

				const details = await scraper.getEventDetails(event.link);

				const patch: Record<string, unknown> = {};
				if (details?.image_url) patch.image_url = details.image_url;
				if (details?.cost) patch.cost = details.cost;
				if (details?.description) patch.description = details.description;

				if (Object.keys(patch).length) {
					const { error: updateErr } = await supabase.from('events').update(patch).eq('link', event.link);
					if (updateErr) throw updateErr;
					updated++;
				}
			} catch (err) {
				console.log(`Error updating details for ${event.link}:`, err.message);
			}
		}));

		return new Response(JSON.stringify({ updated, remaining: Math.max((totalRemaining ?? 0) - updated, 0) }), {
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		return new Response(JSON.stringify({ error: err.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
});
