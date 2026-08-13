// Deno port of server/venues/ra-client.js — shared RA GraphQL client.
//
// Queries a promoter's own upcoming events directly via `promoter(id) {
// events(type: LATEST) }` rather than scanning RA's whole-city event
// listing and filtering by promoter client-side. The whole-city endpoint
// returns roughly 100 events/day for London, so the page cap this used to
// carry (needed to keep a single refresh-events run within the edge
// runtime's timeout) only ever covered the next ~9-10 days in practice —
// far short of the ~120-day window each RA-provider venue is configured
// for — and anything further out was silently never scraped. The
// promoter-scoped query returns exactly that promoter's own upcoming
// events, chronologically, with no pagination needed.
export function makeRAScraper(promoterId: number | string) {
	const id = String(promoterId);

	const fetchEvents = async () => {
		const query = `query { promoter(id: "${id}") { events(limit: 50, type: LATEST) { id title date startTime images { filename } } } }`;
		const res = await fetch('https://ra.co/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Referer': `https://ra.co/promoters/${id}`,
				'User-Agent': 'Mozilla/5.0',
			},
			body: JSON.stringify({ query }),
		});
		const { data } = await res.json();
		const events = data?.promoter?.events || [];
		return events.map((e: any) => ({
			title: e.title,
			date: new Date(e.date),
			time: new Date(e.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
			link: `https://ra.co/events/${e.id}`,
			image_url: e.images?.[0]?.filename || '',
		}));
	};

	const getEventDetails = () => ({});
	return { fetchEvents, getEventDetails };
}
